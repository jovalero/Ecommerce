<?php

namespace App\Models;

use App\Services\SupabaseService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AdminLog
{
    /**
     * Record an administrative audit action.
     *
     * @param string|null $user
     * @param string $action (e.g. 'BULK_PRICE_UPDATE', 'BULK_CATEGORY_UPDATE', 'BULK_DELETE', 'CSV_IMPORT')
     * @param string $table (e.g. 'products')
     * @param array $details
     * @return array
     */
    public static function record(?string $user, string $action, string $table, array $details): array
    {
        $entry = [
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'user' => $user ?: 'admin@holux.com',
            'action' => $action,
            'affected_table' => $table,
            'details' => $details,
            'created_at' => now()->toIso8601String(),
        ];

        // 1. Try to record in Supabase table if exists
        try {
            $supabase = app(SupabaseService::class);
            $supabase->insert('admin_logs', [
                'id' => $entry['id'],
                'user_email' => $entry['user'],
                'action' => $entry['action'],
                'affected_table' => $entry['affected_table'],
                'details' => json_encode($entry['details']),
                'created_at' => $entry['created_at'],
            ], true);
        } catch (\Throwable $e) {
            // Supabase table may not exist yet; fallback to local storage
            Log::info("AdminLog fallback to local storage: " . $e->getMessage());
        }

        // 2. Persist in local storage log file for reliability
        try {
            $logs = [];
            if (Storage::exists('admin_logs.json')) {
                $logs = json_decode(Storage::get('admin_logs.json'), true) ?: [];
            }
            array_unshift($logs, $entry);
            // Keep latest 500 logs
            $logs = array_slice($logs, 0, 500);
            Storage::put('admin_logs.json', json_encode($logs, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        } catch (\Throwable $e) {
            Log::error("AdminLog storage error: " . $e->getMessage());
        }

        Log::info("Admin Action Audit: [{$entry['action']}] on [{$entry['affected_table']}] by [{$entry['user']}]", $details);
        return $entry;
    }

    /**
     * Retrieve recent logs.
     */
    public static function recent(int $limit = 50): array
    {
        if (Storage::exists('admin_logs.json')) {
            $logs = json_decode(Storage::get('admin_logs.json'), true) ?: [];
            return array_slice($logs, 0, $limit);
        }
        return [];
    }
}
