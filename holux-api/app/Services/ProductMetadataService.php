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
        Storage::put(self::$fileName, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
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
