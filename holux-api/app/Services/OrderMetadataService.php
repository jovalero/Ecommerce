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

        // 1. Fetch from Supabase Storage CDN (Universal Persistent Source of Truth)
        try {
            $supabaseUrl = config('services.supabase.url', 'https://fmbhcfsrsfkglmvgbnlm.supabase.co');
            $client = new \GuzzleHttp\Client(['timeout' => 3.0]);
            $res = $client->get(rtrim($supabaseUrl, '/') . '/storage/v1/object/public/product-images/config/orders_metadata.json?v=' . time());
            if ($res->getStatusCode() === 200) {
                $remote = json_decode($res->getBody()->getContents(), true);
                if (is_array($remote)) {
                    File::put($file, json_encode($remote, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
                    return $remote;
                }
            }
        } catch (\Throwable $e) {
            // Fallback to local cache if offline
        }

        // 2. Fallback to local cache
        if (File::exists($file)) {
            $content = File::get($file);
            return json_decode($content, true) ?: [];
        }

        return [];
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

        try {
            $json = json_encode($all, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
            File::put(self::getStoragePath(), $json);

            // Upload to Supabase Storage CDN
            try {
                $supabase = app(\App\Services\SupabaseService::class);
                $supabase->uploadStorageFile('product-images', 'config/orders_metadata.json', $json, 'application/json');
            } catch (\Throwable $se) {
                \Illuminate\Support\Facades\Log::warning("Failed to sync orders_metadata to Supabase Storage: " . $se->getMessage());
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Failed to save orders_metadata.json: " . $e->getMessage());
        }
    }

    public static function attach(array $order): array
    {
        $id = $order['id'] ?? null;
        if ($id) {
            $meta = self::get($id);
            if ($meta) {
                foreach ($meta as $k => $v) {
                    if ($v !== null && $v !== '') {
                        $order[$k] = $v;
                    }
                }
            }
        }

        // Dynamically resolve customer tier & VIP status
        $customerId = $order['customer_id'] ?? null;
        if ($customerId) {
            $tier = \App\Services\CustomerMetadataService::getTier($customerId);
            $order['customer_tier'] = $tier;
            $order['is_vip'] = ($tier === 'vip' || $tier === 'super_vip');
            $order['is_super_vip'] = ($tier === 'super_vip');
            $order['priority_dispatch'] = ($tier === 'super_vip' || $tier === 'vip');
        } else {
            $order['customer_tier'] = 'standard';
            $order['is_vip'] = false;
            $order['is_super_vip'] = false;
            $order['priority_dispatch'] = false;
        }

        return $order;
    }
}
