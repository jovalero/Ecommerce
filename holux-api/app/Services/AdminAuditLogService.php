<?php

namespace App\Services;

use Illuminate\Support\Facades\File;

class AdminAuditLogService
{
    private static function getStoragePath(): string
    {
        $dir = storage_path('app');
        if (!File::exists($dir)) {
            File::makeDirectory($dir, 0755, true);
        }
        return storage_path('app/admin_audit_logs.json');
    }

    public static function all(): array
    {
        $file = self::getStoragePath();

        // 1. Fetch from Supabase Storage CDN (Universal Persistent Source of Truth)
        try {
            $supabaseUrl = config('services.supabase.url', 'https://fmbhcfsrsfkglmvgbnlm.supabase.co');
            $client = new \GuzzleHttp\Client(['timeout' => 3.0]);
            $res = $client->get(rtrim($supabaseUrl, '/') . '/storage/v1/object/public/product-images/config/admin_audit_logs.json?v=' . time());
            if ($res->getStatusCode() === 200) {
                $remote = json_decode($res->getBody()->getContents(), true);
                if (is_array($remote)) {
                    File::put($file, json_encode($remote, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
                    return $remote;
                }
            }
        } catch (\Throwable $e) {
            // Fallback to local cache if offline
        }

        // 2. Fallback to local cache
        if (!File::exists($file)) {
            return [];
        }
        $content = File::get($file);
        return json_decode($content, true) ?: [];
    }

    public static function log(string $action, string $section, array $details, ?array $admin = null, ?string $ip = null): void
    {
        $logs = self::all();

        $entry = [
            'id' => 'log_' . uniqid() . '_' . time(),
            'action' => $action,
            'section' => $section,
            'details' => $details,
            'admin_id' => $admin['id'] ?? 'admin',
            'admin_name' => $admin['name'] ?? $admin['full_name'] ?? 'Administrador',
            'admin_email' => $admin['email'] ?? 'admin@holux.com',
            'ip_address' => $ip ?? request()->ip() ?? '127.0.0.1',
            'created_at' => now()->toIso8601String(),
            'timestamp' => time()
        ];

        // Keep last 200 logs
        array_unshift($logs, $entry);
        $logs = array_slice($logs, 0, 200);

        try {
            $json = json_encode($logs, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            File::put(self::getStoragePath(), $json);

            // Upload to Supabase Storage CDN
            try {
                $supabase = app(\App\Services\SupabaseService::class);
                $supabase->uploadStorageFile('product-images', 'config/admin_audit_logs.json', $json, 'application/json');
            } catch (\Throwable $se) {
                \Illuminate\Support\Facades\Log::warning("Failed to sync admin_audit_logs to Supabase Storage: " . $se->getMessage());
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Failed to save admin_audit_logs.json: " . $e->getMessage());
        }
    }

    public static function getRecent(int $limit = 30): array
    {
        $logs = self::all();
        return array_slice($logs, 0, $limit);
    }
}
