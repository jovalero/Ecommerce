<?php

namespace App\Services;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class VipSettingsService
{
    private static function getFilePath(): string
    {
        $path = storage_path('app');
        if (!File::exists($path)) {
            File::makeDirectory($path, 0755, true);
        }
        return storage_path('app/vip_settings.json');
    }

    /**
     * Default VIP & Super VIP benefits configuration
     */
    public static function getDefaultSettings(): array
    {
        return [
            'vip' => [
                'name' => 'Cliente VIP',
                'badge' => '⭐ VIP',
                'auto_discount_percent' => 5, // 5% discount
                'shipping_benefit' => 'free_above_amount', // 'standard', 'percent_discount', 'free_above_amount', 'always_free'
                'shipping_discount_percent' => 50,
                'shipping_free_min_amount' => 40000,
                'priority_dispatch' => true,
                'priority_support' => true,
                'exclusive_coupons' => true,
            ],
            'super_vip' => [
                'name' => 'Cliente SUPER VIP',
                'badge' => '👑 SUPER VIP',
                'auto_discount_percent' => 10, // 10% discount
                'shipping_benefit' => 'always_free', // 'always_free'
                'shipping_discount_percent' => 100,
                'shipping_free_min_amount' => 0,
                'priority_dispatch' => true,
                'priority_support' => true,
                'whatsapp_direct' => true,
                'whatsapp_number' => '+5491112345678',
                'exclusive_coupons' => true,
            ]
        ];
    }

    /**
     * Get active VIP settings
     */
    public static function get(): array
    {
        $file = self::getFilePath();
        if (!File::exists($file)) {
            $defaults = self::getDefaultSettings();
            self::save($defaults);
            return $defaults;
        }

        try {
            $json = json_decode(File::get($file), true);
            if (!is_array($json) || empty($json)) {
                return self::getDefaultSettings();
            }
            return array_merge(self::getDefaultSettings(), $json);
        } catch (\Throwable $e) {
            Log::error("Failed to read vip_settings.json: " . $e->getMessage());
            return self::getDefaultSettings();
        }
    }

    /**
     * Save active VIP settings
     */
    public static function save(array $settings): bool
    {
        try {
            $file = self::getFilePath();
            File::put($file, json_encode($settings, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            return true;
        } catch (\Throwable $e) {
            Log::error("Failed to save vip_settings.json: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Calculate benefits for a given membership tier and subtotal
     */
    public static function getBenefitsForTier(string $tier, float $subtotal = 0, float $standardShippingCost = 5000): array
    {
        $tier = strtolower(trim($tier));
        if ($tier !== 'vip' && $tier !== 'super_vip') {
            return [
                'tier' => 'standard',
                'badge' => 'CLIENTE ESTÁNDAR',
                'auto_discount_percent' => 0,
                'discount_amount' => 0,
                'shipping_cost' => $standardShippingCost,
                'shipping_benefit_label' => 'Tarifa Estándar',
                'priority_dispatch' => false,
                'whatsapp_direct' => false,
                'whatsapp_number' => '',
            ];
        }

        $allSettings = self::get();
        $config = $allSettings[$tier] ?? self::getDefaultSettings()[$tier];

        // 1. Auto Discount
        $discountPercent = max(0, (float) ($config['auto_discount_percent'] ?? 0));
        $discountAmount = $discountPercent > 0 ? round(($subtotal * $discountPercent) / 100) : 0;

        // 2. Shipping Rule
        $shippingBenefit = $config['shipping_benefit'] ?? 'standard';
        $finalShippingCost = $standardShippingCost;
        $shippingLabel = 'Tarifa Estándar';

        if ($shippingBenefit === 'always_free') {
            $finalShippingCost = 0;
            $shippingLabel = 'Envío Gratis 100% Bonificado';
        } elseif ($shippingBenefit === 'free_above_amount') {
            $minAmount = (float) ($config['shipping_free_min_amount'] ?? 0);
            if ($subtotal >= $minAmount) {
                $finalShippingCost = 0;
                $shippingLabel = "Envío Gratis por compra mayor a $" . number_format($minAmount, 0, ',', '.');
            }
        } elseif ($shippingBenefit === 'percent_discount') {
            $pct = max(0, min(100, (float) ($config['shipping_discount_percent'] ?? 50)));
            $finalShippingCost = round($standardShippingCost * (1 - ($pct / 100)));
            $shippingLabel = "Envío con {$pct}% de Descuento";
        }

        return [
            'tier' => $tier,
            'badge' => $config['badge'] ?? ($tier === 'super_vip' ? '👑 SUPER VIP' : '⭐ VIP'),
            'auto_discount_percent' => $discountPercent,
            'discount_amount' => $discountAmount,
            'shipping_cost' => $finalShippingCost,
            'shipping_benefit_label' => $shippingLabel,
            'priority_dispatch' => (bool) ($config['priority_dispatch'] ?? false),
            'priority_support' => (bool) ($config['priority_support'] ?? false),
            'whatsapp_direct' => (bool) ($config['whatsapp_direct'] ?? false),
            'whatsapp_number' => $config['whatsapp_number'] ?? '',
        ];
    }
}
