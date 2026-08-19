<?php

namespace App\Services;

use Illuminate\Support\Facades\File;

class OrderMetadataService
{
    private static function getStoragePath(): string
    {
        $dir = storage_path('app');
        if (!File::exists($dir)) {
            File::makeDirectory($dir, 0755, true);
        }
        return storage_path('app/orders_metadata.json');
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

    public static function get(string $orderId): ?array
    {
        $all = self::all();
        return $all[$orderId] ?? null;
    }

    public static function set(string $orderId, array $metadata): void
    {
        $all = self::all();
        $existing = $all[$orderId] ?? [];
        $all[$orderId] = array_merge($existing, $metadata);
        File::put(self::getStoragePath(), json_encode($all, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }

    public static function attach(array $order): array
    {
        $id = $order['id'] ?? null;
        if (!$id) return $order;
        $meta = self::get($id);
        if ($meta) {
            foreach ($meta as $k => $v) {
                if ($v !== null && $v !== '') {
                    $order[$k] = $v;
                }
            }
        }
        return $order;
    }
}
