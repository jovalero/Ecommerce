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

        File::put(self::getStoragePath(), json_encode($logs, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    }

    public static function getRecent(int $limit = 30): array
    {
        $logs = self::all();
        return array_slice($logs, 0, $limit);
    }
}
