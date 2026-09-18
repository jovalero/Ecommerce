<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;

class ProductMetadataService
{
    protected static string $fileName = 'products_metadata.json';

    /**
     * Load all products metadata.
     */
    protected static function load(): array
    {
        // 1. Fetch from Supabase Storage CDN (Universal Persistent Source of Truth)
        try {
            $supabaseUrl = config('services.supabase.url', 'https://fmbhcfsrsfkglmvgbnlm.supabase.co');
            $client = new \GuzzleHttp\Client(['timeout' => 3.0]);
            $res = $client->get(rtrim($supabaseUrl, '/') . '/storage/v1/object/public/product-images/config/' . self::$fileName . '?v=' . time());
            if ($res->getStatusCode() === 200) {
                $remote = json_decode($res->getBody()->getContents(), true);
                if (is_array($remote)) {
                    Storage::put(self::$fileName, json_encode($remote, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                    return $remote;
                }
            }
        } catch (\Throwable $e) {
            // Fallback to local cache if offline
        }

        // 2. Fallback to local cache
        if (!Storage::exists(self::$fileName)) {
            return [];
        }

        try {
            $json = Storage::get(self::$fileName);
            return json_decode($json, true) ?: [];
        } catch (\Throwable $e) {
            return [];
        }
    }

    /**
     * Save all products metadata.
     */
    protected static function save(array $data): void
    {
        try {
            $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            Storage::put(self::$fileName, $json);

            // Upload to Supabase Storage CDN
            try {
                $supabase = app(\App\Services\SupabaseService::class);
                $supabase->uploadStorageFile('product-images', 'config/' . self::$fileName, $json, 'application/json');
            } catch (\Throwable $se) {
                \Illuminate\Support\Facades\Log::warning("Failed to sync products_metadata to Supabase Storage: " . $se->getMessage());
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Failed to save products_metadata.json: " . $e->getMessage());
        }
    }

    /**
     * Get metadata for a specific product.
     */
    public static function get(string $productId): array
    {
        $all = self::load();
        return $all[$productId] ?? [];
    }

    /**
     * Set/update metadata for a product.
     */
    public static function set(string $productId, array $metadata): void
    {
        $all = self::load();
        $current = $all[$productId] ?? [];
        $all[$productId] = array_merge($current, $metadata);
        self::save($all);
    }

    /**
     * Attach metadata to a product object/array.
     */
    public static function attach(array $product): array
    {
        $id = $product['id'] ?? null;
        if (!$id) {
            return $product;
        }

        $meta = self::get($id);
        if (!empty($meta)) {
            foreach ($meta as $key => $val) {
                if ($val !== null) {
                    $product[$key] = $val;
                }
            }
        }

        return $product;
    }

    /**
     * Attach metadata to a list of products.
     */
    public static function attachMany(array $products): array
    {
        return array_map([self::class, 'attach'], $products);
    }
}
