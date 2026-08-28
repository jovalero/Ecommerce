<?php

namespace App\Services;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class CouponService
{
    private static function getFilePath(): string
    {
        $path = storage_path('app');
        if (!File::exists($path)) {
            File::makeDirectory($path, 0755, true);
        }
        return storage_path('app/coupons.json');
    }

    public static function getDefaultCoupons(): array
    {
        $now = time();
        return [
            [
                'id' => 'coup-101',
                'code' => 'HOLUXBIENVENIDA',
                'type' => 'percentage',
                'value' => 20,
                'min_spend' => 30000,
                'allowed_tier' => 'all', // 'all', 'vip', 'super_vip'
                'origin' => 'Bienvenida 🚀',
                'description' => 'Válido en compras mayores a $30.000. Para todos los clientes.',
                'max_uses' => 100,
                'used_count' => 14,
                'active' => true,
                'expiry_timestamp' => $now + (30 * 86400),
            ],
            [
                'id' => 'coup-102',
                'code' => 'VIPPROMO15',
                'type' => 'percentage',
                'value' => 15,
                'min_spend' => 40000,
                'allowed_tier' => 'vip', // VIP & Super VIP
                'origin' => 'Exclusivo VIP ⭐',
                'description' => '15% de descuento exclusivo para miembros VIP y Super VIP.',
                'max_uses' => 50,
                'used_count' => 6,
                'active' => true,
                'expiry_timestamp' => $now + (20 * 86400),
            ],
            [
                'id' => 'coup-103',
                'code' => 'SUPERVIP25K',
                'type' => 'fixed',
                'value' => 25000,
                'min_spend' => 80000,
                'allowed_tier' => 'super_vip', // Solo Super VIP
                'origin' => 'Exclusivo Super VIP 👑',
                'description' => 'Descuento directo de $25.000 para miembros de categoría Super VIP.',
                'max_uses' => 20,
                'used_count' => 2,
                'active' => true,
                'expiry_timestamp' => $now + (15 * 86400),
            ]
        ];
    }

    public static function all(): array
    {
        $defaults = self::getDefaultCoupons();
        $file = self::getFilePath();

        // 1. Try fetching from Supabase Storage CDN first (Universal Source of Truth)
        try {
            $supabaseUrl = config('services.supabase.url', 'https://fmbhcfsrsfkglmvgbnlm.supabase.co');
            $client = new \GuzzleHttp\Client(['timeout' => 3.0]);
            $res = $client->get(rtrim($supabaseUrl, '/') . '/storage/v1/object/public/product-images/config/coupons.json');
            if ($res->getStatusCode() === 200) {
                $supabaseCoupons = json_decode($res->getBody()->getContents(), true);
                if (is_array($supabaseCoupons) && !empty($supabaseCoupons)) {
                    File::put($file, json_encode($supabaseCoupons, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                    return $supabaseCoupons;
                }
            }
        } catch (\Throwable $e) {
            // Fallback to local cache if offline
        }

        if (File::exists($file)) {
            $content = File::get($file);
            $saved = json_decode($content, true) ?: [];
            return is_array($saved) && !empty($saved) ? $saved : $defaults;
        }

        return $defaults;
    }

    public static function saveAll(array $coupons): bool
    {
        try {
            $file = self::getFilePath();
            $json = json_encode(array_values($coupons), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            File::put($file, $json);

            // Upload to Supabase Storage CDN so all servers, devices and clients share the exact same state
            try {
                $supabase = app(\App\Services\SupabaseService::class);
                $supabase->uploadStorageFile('product-images', 'config/coupons.json', $json, 'application/json');
            } catch (\Throwable $e) {
                Log::warning("Failed to sync coupons to Supabase Storage: " . $e->getMessage());
            }

            return true;
        } catch (\Throwable $e) {
            Log::error("Failed to save coupons.json: " . $e->getMessage());
            return false;
        }
    }

    public static function findByCode(string $code): ?array
    {
        $clean = strtoupper(trim($code));
        $all = self::all();
        foreach ($all as $c) {
            if (strtoupper($c['code']) === $clean) {
                return $c;
            }
        }
        return null;
    }

    public static function create(array $data): array
    {
        $all = self::all();
        $code = strtoupper(trim($data['code']));

        // Check duplicate
        foreach ($all as $c) {
            if (strtoupper($c['code']) === $code) {
                throw new \InvalidArgumentException("El código de cupón '{$code}' ya existe.");
            }
        }

        $allowedTier = $data['allowed_tier'] ?? 'all';
        if (!in_array($allowedTier, ['all', 'vip', 'super_vip'])) {
            $allowedTier = 'all';
        }

        $newCoupon = [
            'id' => 'coup-' . time() . '-' . rand(100, 999),
            'code' => $code,
            'type' => in_array($data['type'] ?? '', ['fixed', 'percentage', 'percent']) ? ($data['type'] === 'percent' ? 'percentage' : $data['type']) : 'percentage',
            'value' => (float) ($data['value'] ?? 10),
            'min_spend' => (float) ($data['min_spend'] ?? ($data['minPurchase'] ?? 0)),
            'allowed_tier' => $allowedTier,
            'origin' => $data['origin'] ?? 'Promoción Admin 🏷️',
            'description' => $data['description'] ?? 'Descuento especial.',
            'max_uses' => (int) ($data['max_uses'] ?? ($data['maxUses'] ?? 100)),
            'used_count' => 0,
            'active' => true,
            'expiry_timestamp' => isset($data['expiry_timestamp']) ? (int) $data['expiry_timestamp'] : (time() + (30 * 86400)),
        ];

        array_unshift($all, $newCoupon);
        self::saveAll($all);

        return $newCoupon;
    }

    public static function delete(string $id): bool
    {
        $all = self::all();
        $filtered = array_filter($all, fn($c) => $c['id'] !== $id);
        return self::saveAll($filtered);
    }

    public static function toggleActive(string $id): ?array
    {
        $all = self::all();
        $updated = null;
        foreach ($all as &$c) {
            if ($c['id'] === $id) {
                $c['active'] = !($c['active'] ?? true);
                $updated = $c;
                break;
            }
        }
        if ($updated) {
            self::saveAll($all);
        }
        return $updated;
    }

    /**
     * Validate and apply coupon according to user tier and cart subtotal
     */
    public static function validateAndApply(string $code, float $subtotal, ?string $userTier = 'standard'): array
    {
        $coupon = self::findByCode($code);

        if (!$coupon) {
            return [
                'valid' => false,
                'message' => 'El código de cupón no existe o no es válido.'
            ];
        }

        if (empty($coupon['active'])) {
            return [
                'valid' => false,
                'message' => 'Este cupón se encuentra inactivo actualmente.'
            ];
        }

        if (isset($coupon['expiry_timestamp']) && time() > $coupon['expiry_timestamp']) {
            return [
                'valid' => false,
                'message' => 'Este cupón ha expirado.'
            ];
        }

        if ($subtotal < (float) $coupon['min_spend']) {
            return [
                'valid' => false,
                'message' => "Este cupón requiere una compra mínima de $" . number_format($coupon['min_spend'], 0, ',', '.') . "."
            ];
        }

        // Tier restriction validation
        $allowedTier = $coupon['allowed_tier'] ?? 'all';
        $userTier = strtolower(trim($userTier ?? 'standard'));

        if ($allowedTier === 'super_vip' && $userTier !== 'super_vip') {
            return [
                'valid' => false,
                'message' => '⛔ Este cupón es un beneficio EXCLUSIVO para miembros de categoría SUPER VIP 👑.'
            ];
        }

        if ($allowedTier === 'vip' && $userTier !== 'vip' && $userTier !== 'super_vip') {
            return [
                'valid' => false,
                'message' => '⛔ Este cupón es un beneficio EXCLUSIVO para miembros VIP ⭐ y Super VIP.'
            ];
        }

        $discountAmount = 0;
        if ($coupon['type'] === 'percentage') {
            $discountAmount = round(($subtotal * $coupon['value']) / 100);
        } else {
            $discountAmount = min($subtotal, (float) $coupon['value']);
        }

        return [
            'valid' => true,
            'code' => $coupon['code'],
            'type' => $coupon['type'],
            'value' => $coupon['value'],
            'discount_amount' => $discountAmount,
            'allowed_tier' => $allowedTier,
            'message' => '¡Cupón aplicado con éxito!'
        ];
    }
}
