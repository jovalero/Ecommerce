<?php

namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class SupportTicketService
{
    private static function getFilePath(): string
    {
        $path = storage_path('app');
        if (!File::exists($path)) {
            File::makeDirectory($path, 0755, true);
        }
        return storage_path('app/support_tickets.json');
    }

    /**
     * Get all tickets from persistent storage (Supabase Storage CDN first, then local fallback)
     */
    public static function all(): array
    {
        $file = self::getFilePath();

        // 1. Fetch from Supabase Storage CDN (Universal Persistent Source of Truth)
        try {
            $supabaseUrl = config('services.supabase.url', 'https://fmbhcfsrsfkglmvgbnlm.supabase.co');
            $client = new Client(['timeout' => 3.0]);
            $res = $client->get(rtrim($supabaseUrl, '/') . '/storage/v1/object/public/product-images/config/support_tickets.json?v=' . time());
            if ($res->getStatusCode() === 200) {
                $remote = json_decode($res->getBody()->getContents(), true);
                if (is_array($remote)) {
                    File::put($file, json_encode($remote, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                    return self::sortTickets($remote);
                }
            }
        } catch (\Throwable $e) {
            // Fallback to local cache if offline or file doesn't exist yet in Supabase
        }

        // 2. Fallback to local cached file
        if (File::exists($file)) {
            try {
                $json = json_decode(File::get($file), true);
                return is_array($json) ? self::sortTickets($json) : [];
            } catch (\Throwable $e) {
                Log::error("Failed to read support_tickets.json: " . $e->getMessage());
                return [];
            }
        }

        return [];
    }

    /**
     * Sort tickets by most recently updated/created first
     */
    private static function sortTickets(array $tickets): array
    {
        usort($tickets, function ($a, $b) {
            $timeA = strtotime($a['updated_at'] ?? $a['created_at'] ?? '2000-01-01');
            $timeB = strtotime($b['updated_at'] ?? $b['created_at'] ?? '2000-01-01');
            return $timeB <=> $timeA;
        });
        return $tickets;
    }

    /**
     * Save all tickets to local cache and sync to Supabase Storage CDN
     */
    public static function saveAll(array $tickets): bool
    {
        try {
            $file = self::getFilePath();
            $json = json_encode(array_values($tickets), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            File::put($file, $json);

            // Upload to Supabase Storage CDN so tickets are NEVER lost on Render restart/redeploy
            try {
                $supabase = app(SupabaseService::class);
                $supabase->uploadStorageFile('product-images', 'config/support_tickets.json', $json, 'application/json');
            } catch (\Throwable $se) {
                Log::warning("Failed to sync support_tickets to Supabase Storage: " . $se->getMessage());
            }

            return true;
        } catch (\Throwable $e) {
            Log::error("Failed to save support_tickets.json: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Create a new support ticket
     */
    public static function create(array $data): array
    {
        $tickets = self::all();

        // Generate clean unique ticket ID, e.g. HLX-TK-4821
        $randCode = strtoupper(substr(md5(uniqid((string)mt_rand(), true)), 0, 4));
        $ticketId = 'HLX-TK-' . $randCode;

        $now = now();
        $dateStr = $now->format('Y-m-d H:i');
        $timeStr = $now->format('H:i');

        $senderName = !empty($data['customer_name']) ? trim($data['customer_name']) : 'Cliente Holux';
        $messageText = trim($data['message'] ?? '');

        $initialMessage = [
            'id' => 'msg-' . uniqid(),
            'sender' => 'customer',
            'sender_name' => $senderName,
            'text' => $messageText,
            'time' => $timeStr,
            'created_at' => $dateStr,
        ];

        $subject = !empty($data['subject']) 
            ? trim($data['subject']) 
            : (mb_strlen($messageText) > 40 ? mb_substr($messageText, 0, 40) . '...' : $messageText);

        $newTicket = [
            'id' => $ticketId,
            'customer_name' => $senderName,
            'customer_email' => strtolower(trim($data['customer_email'] ?? '')),
            'customer_phone' => !empty($data['customer_phone']) ? trim($data['customer_phone']) : null,
            'user_id' => $data['user_id'] ?? null,
            'category' => !empty($data['category']) ? strtoupper(trim($data['category'])) : 'CONSULTA GENERAL',
            'subject' => $subject,
            'status' => 'ABIERTO', // ABIERTO | EN PROCESO | RESUELTO
            'source' => $data['source'] ?? 'widget',
            'created_at' => $dateStr,
            'updated_at' => $dateStr,
            'messages' => [$initialMessage],
        ];

        // Insert at beginning
        array_unshift($tickets, $newTicket);
        self::saveAll($tickets);

        return $newTicket;
    }

    /**
     * Find a ticket by ID
     */
    public static function find(string $id): ?array
    {
        $tickets = self::all();
        foreach ($tickets as $t) {
            if ($t['id'] === $id) {
                return $t;
            }
        }
        return null;
    }

    /**
     * Filter tickets for a specific customer by email or user_id
     */
    public static function forCustomer(string $email, ?string $userId = null): array
    {
        $tickets = self::all();
        $email = strtolower(trim($email));

        return array_values(array_filter($tickets, function ($t) use ($email, $userId) {
            $matchEmail = strtolower(trim($t['customer_email'] ?? '')) === $email;
            $matchUser = $userId && !empty($t['user_id']) && $t['user_id'] === $userId;
            return $matchEmail || $matchUser;
        }));
    }

    /**
     * Add a message reply to an existing ticket
     */
    public static function addReply(string $ticketId, string $replyText, string $sender = 'admin', ?string $senderName = null): ?array
    {
        $tickets = self::all();
        $foundIndex = null;

        foreach ($tickets as $idx => $t) {
            if ($t['id'] === $ticketId) {
                $foundIndex = $idx;
                break;
            }
        }

        if ($foundIndex === null) {
            return null;
        }

        $now = now();
        $dateStr = $now->format('Y-m-d H:i');
        $timeStr = $now->format('H:i');

        $newMsg = [
            'id' => 'msg-' . uniqid(),
            'sender' => $sender,
            'sender_name' => $senderName ?: ($sender === 'admin' ? 'Soporte Holux' : 'Cliente'),
            'text' => trim($replyText),
            'time' => $timeStr,
            'created_at' => $dateStr,
        ];

        $tickets[$foundIndex]['messages'][] = $newMsg;
        $tickets[$foundIndex]['updated_at'] = $dateStr;

        // Auto update status if appropriate
        if ($sender === 'admin' && $tickets[$foundIndex]['status'] === 'ABIERTO') {
            $tickets[$foundIndex]['status'] = 'EN PROCESO';
        } elseif ($sender === 'customer' && $tickets[$foundIndex]['status'] === 'RESUELTO') {
            $tickets[$foundIndex]['status'] = 'EN PROCESO';
        }

        self::saveAll($tickets);
        return $tickets[$foundIndex];
    }

    /**
     * Update the status of a ticket
     */
    public static function updateStatus(string $ticketId, string $newStatus): ?array
    {
        $validStatuses = ['ABIERTO', 'EN PROCESO', 'RESUELTO'];
        $newStatus = strtoupper(trim($newStatus));
        if (!in_array($newStatus, $validStatuses, true)) {
            $newStatus = 'EN PROCESO';
        }

        $tickets = self::all();
        $foundIndex = null;

        foreach ($tickets as $idx => $t) {
            if ($t['id'] === $ticketId) {
                $foundIndex = $idx;
                break;
            }
        }

        if ($foundIndex === null) {
            return null;
        }

        $tickets[$foundIndex]['status'] = $newStatus;
        $tickets[$foundIndex]['updated_at'] = now()->format('Y-m-d H:i');

        self::saveAll($tickets);
        return $tickets[$foundIndex];
    }

    /**
     * Delete a ticket
     */
    public static function delete(string $ticketId): bool
    {
        $tickets = self::all();
        $initialCount = count($tickets);

        $filtered = array_values(array_filter($tickets, fn($t) => $t['id'] !== $ticketId));

        if (count($filtered) !== $initialCount) {
            self::saveAll($filtered);
            return true;
        }

        return false;
    }
}
