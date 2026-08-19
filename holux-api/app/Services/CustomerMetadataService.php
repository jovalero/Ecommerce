<?php

namespace App\Services;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class CustomerMetadataService
{
    private static function getFilePath(): string
    {
        $path = storage_path('app');
        if (!File::exists($path)) {
            File::makeDirectory($path, 0755, true);
        }
        return storage_path('app/customers_metadata.json');
    }

    public static function all(): array
    {
        $file = self::getFilePath();
        if (!File::exists($file)) {
            return [];
        }

        try {
            $json = json_decode(File::get($file), true);
            return is_array($json) ? $json : [];
        } catch (\Throwable $e) {
            Log::error("Failed to read customers_metadata.json: " . $e->getMessage());
            return [];
        }
    }

    public static function get(string $customerId): array
    {
        $all = self::all();
        return $all[$customerId] ?? [
            'tier' => 'standard',
            'is_vip' => false,
            'is_super_vip' => false,
            'notes' => '',
            'tags' => [],
        ];
    }

    public static function set(string $customerId, array $data): array
    {
        $all = self::all();
        $current = $all[$customerId] ?? [];
        $merged = array_merge($current, $data);

        // Normalize flags according to tier
        if (isset($merged['tier'])) {
            $tier = strtolower(trim($merged['tier']));
            if ($tier === 'super_vip') {
                $merged['is_vip'] = true;
                $merged['is_super_vip'] = true;
            } elseif ($tier === 'vip') {
                $merged['is_vip'] = true;
                $merged['is_super_vip'] = false;
            } else {
                $merged['tier'] = 'standard';
                $merged['is_vip'] = false;
                $merged['is_super_vip'] = false;
            }
        }

        $all[$customerId] = $merged;

        try {
            $file = self::getFilePath();
            File::put($file, json_encode($all, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        } catch (\Throwable $e) {
            Log::error("Failed to save customers_metadata.json: " . $e->getMessage());
        }

        return $merged;
    }

    public static function setTier(string $customerId, string $tier): array
    {
        return self::set($customerId, ['tier' => $tier]);
    }

    public static function getTier(string $customerId): string
    {
        $data = self::get($customerId);
        return $data['tier'] ?? 'standard';
    }

    public static function attach(array $customer): array
    {
        $id = $customer['id'] ?? null;
        if (!$id) return $customer;

        $meta = self::get($id);
        $tier = $meta['tier'] ?? 'standard';
        
        $customer['tier'] = $tier;
        $customer['is_vip'] = ($tier === 'vip' || $tier === 'super_vip');
        $customer['is_super_vip'] = ($tier === 'super_vip');
        $customer['customer_notes'] = $meta['notes'] ?? '';
        $customer['customer_tags'] = $meta['tags'] ?? [];

        // Attach dynamic benefits
        $customer['benefits'] = VipSettingsService::getBenefitsForTier($tier);

        return $customer;
    }

    public static function attachMany(array $customers): array
    {
        return array_map([self::class, 'attach'], $customers);
    }
}
