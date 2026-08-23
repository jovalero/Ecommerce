<?php

namespace App\Services;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class StoreSettingService
{
    private static function getStoragePath(): string
    {
        $dir = storage_path('app');
        if (!File::exists($dir)) {
            File::makeDirectory($dir, 0755, true);
        }
        return storage_path('app/store_settings.json');
    }

    public static function defaults(): array
    {
        return [
            // 1. Tax & Fiscal Settings
            'tax_rate' => 21.0,
            'currency_symbol' => 'ARS $',

            // 2. Payment Gateway Settings (Mercado Pago & Transfer)
            'payment_gateway' => 'mercadopago', // mercadopago | stripe
            'payment_gateway_mode' => 'sandbox', // sandbox | production
            'sandbox_public_key' => 'TEST-7516850233643919-072715-fb9344d34c21c1f309ce30b659545c0a-496551012',
            'sandbox_secret_key_encrypted' => null,
            'production_public_key' => '',
            'production_secret_key_encrypted' => null,
            'transfer_discount_percent' => 10.0,
            'bank_cbu' => '0720000000000000000000',
            'bank_alias' => 'HOLUX.OUTDOOR.OFICIAL',
            'bank_holder' => 'HOLUX OUTDOOR S.R.L.',
            'bank_cuit' => '30-71829304-9',

            // 3. Shipping Rates & Postal Code Ranges
            'caba_cost' => 5000.0,
            'caba_cp_min' => 1000,
            'caba_cp_max' => 1499,

            'gba_cost' => 8000.0,
            'gba_cp_min' => 1500,
            'gba_cp_max' => 1999,

            'interior_cost' => 15000.0,
            'interior_cp_min' => 2000,
            'interior_cp_max' => 7999,

            'patagonia_cost' => 20000.0,
            'patagonia_cp_min' => 8000,
            'patagonia_cp_max' => 9999,

            'free_shipping_threshold' => 150000.0,
        ];
    }

    public static function getRaw(): array
    {
        $file = self::getStoragePath();
        if (!File::exists($file)) {
            $defaults = self::defaults();
            self::saveRaw($defaults);
            return $defaults;
        }

        $content = File::get($file);
        $saved = json_decode($content, true) ?: [];
        return array_merge(self::defaults(), $saved);
    }

    public static function saveRaw(array $data): void
    {
        File::put(self::getStoragePath(), json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    }

    /**
     * Return safe public settings without exposing real Secret Keys in JSON response.
     */
    public static function getPublicSafe(): array
    {
        $raw = self::getRaw();
        $baseUrl = config('app.url', url('/'));

        $isSandboxSecretConfigured = !empty($raw['sandbox_secret_key_encrypted']);
        $isProdSecretConfigured = !empty($raw['production_secret_key_encrypted']);

        return [
            // 1. Tax
            'tax_rate' => (float) ($raw['tax_rate'] ?? 21.0),
            'currency_symbol' => $raw['currency_symbol'] ?? 'ARS $',

            // 2. Payments
            'payment_gateway' => $raw['payment_gateway'] ?? 'mercadopago',
            'payment_gateway_name' => 'Mercado Pago Argentina (Checkout Pro & API)',
            'payment_gateway_mode' => $raw['payment_gateway_mode'] ?? 'sandbox',
            'sandbox_public_key' => $raw['sandbox_public_key'] ?? '',
            'sandbox_secret_key_configured' => $isSandboxSecretConfigured,
            'sandbox_secret_key_masked' => $isSandboxSecretConfigured ? '••••••••••••••••••••••••' : '',
            
            'production_public_key' => $raw['production_public_key'] ?? '',
            'production_secret_key_configured' => $isProdSecretConfigured,
            'production_secret_key_masked' => $isProdSecretConfigured ? '••••••••••••••••••••••••' : '',

            'transfer_discount_percent' => (float) ($raw['transfer_discount_percent'] ?? 10.0),
            'max_installments' => (int) ($raw['max_installments'] ?? 6),
            'bank_cbu' => $raw['bank_cbu'] ?? '',
            'bank_alias' => $raw['bank_alias'] ?? '',
            'bank_holder' => $raw['bank_holder'] ?? '',
            'bank_cuit' => $raw['bank_cuit'] ?? '',
            'payment_methods_config' => $raw['payment_methods_config'] ?? null,

            'webhook_url' => rtrim($baseUrl, '/') . '/api/webhooks/mercadopago',

            // 3. Shipping & Postal Ranges
            'all_free' => (bool) ($raw['all_free'] ?? false),
            'free_shipping_enabled' => (bool) ($raw['free_shipping_enabled'] ?? true),
            'free_shipping_threshold' => (float) ($raw['free_shipping_threshold'] ?? 150000),

            'caba_cost' => (float) ($raw['caba_cost'] ?? 5000),
            'caba_free' => (bool) ($raw['caba_free'] ?? false),
            'caba_enabled' => (bool) ($raw['caba_enabled'] ?? true),
            'caba_cp_min' => (int) ($raw['caba_cp_min'] ?? 1000),
            'caba_cp_max' => (int) ($raw['caba_cp_max'] ?? 1499),

            'gba_cost' => (float) ($raw['gba_cost'] ?? 8000),
            'gba_free' => (bool) ($raw['gba_free'] ?? false),
            'gba_enabled' => (bool) ($raw['gba_enabled'] ?? true),
            'gba_cp_min' => (int) ($raw['gba_cp_min'] ?? 1500),
            'gba_cp_max' => (int) ($raw['gba_cp_max'] ?? 1999),

            'interior_cost' => (float) ($raw['interior_cost'] ?? 15000),
            'interior_free' => (bool) ($raw['interior_free'] ?? false),
            'interior_enabled' => (bool) ($raw['interior_enabled'] ?? true),
            'interior_cp_min' => (int) ($raw['interior_cp_min'] ?? 2000),
            'interior_cp_max' => (int) ($raw['interior_cp_max'] ?? 7999),

            'patagonia_cost' => (float) ($raw['patagonia_cost'] ?? 20000),
            'patagonia_free' => (bool) ($raw['patagonia_free'] ?? false),
            'patagonia_enabled' => (bool) ($raw['patagonia_enabled'] ?? true),
            'patagonia_cp_min' => (int) ($raw['patagonia_cp_min'] ?? 8000),
            'patagonia_cp_max' => (int) ($raw['patagonia_cp_max'] ?? 9999),

            'pickup_enabled' => (bool) ($raw['pickup_enabled'] ?? true),
            'pickup_address' => $raw['pickup_address'] ?? 'Av. Corrientes 1234, CABA',
            'pickup_schedule' => $raw['pickup_schedule'] ?? 'Lunes a Viernes de 10:00 a 18:00 hs',
        ];
    }

    /**
     * Get decrypted secret key for server-side processing only
     */
    public static function getSecretKey(string $mode = 'sandbox'): ?string
    {
        $raw = self::getRaw();
        $keyField = ($mode === 'production') ? 'production_secret_key_encrypted' : 'sandbox_secret_key_encrypted';
        $encrypted = $raw[$keyField] ?? null;

        if (empty($encrypted)) {
            // Fallback to env variable if set
            return env('MERCADOPAGO_ACCESS_TOKEN');
        }

        try {
            return Crypt::decryptString($encrypted);
        } catch (\Throwable $e) {
            Log::error("Failed to decrypt store secret key for {$mode}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Update Tax Block
     */
    public static function updateTax(array $data, ?array $admin = null): array
    {
        $raw = self::getRaw();
        $oldTax = $raw['tax_rate'] ?? 21.0;
        $oldCurr = $raw['currency_symbol'] ?? 'ARS $';

        $raw['tax_rate'] = (float) $data['tax_rate'];
        $raw['currency_symbol'] = trim($data['currency_symbol'] ?? 'ARS $');

        self::saveRaw($raw);

        AdminAuditLogService::log(
            'UPDATE_TAX_SETTINGS',
            'Configuración Fiscal e IVA',
            [
                'tax_rate_before' => $oldTax,
                'tax_rate_after' => $raw['tax_rate'],
                'currency_before' => $oldCurr,
                'currency_after' => $raw['currency_symbol'],
            ],
            $admin
        );

        return self::getPublicSafe();
    }

    /**
     * Update Payment Gateway Block
     */
    public static function updatePayment(array $data, ?array $admin = null): array
    {
        $raw = self::getRaw();
        $oldMode = $raw['payment_gateway_mode'] ?? 'sandbox';

        $raw['payment_gateway'] = $data['payment_gateway'] ?? 'mercadopago';
        $raw['payment_gateway_mode'] = $data['payment_gateway_mode'] ?? 'sandbox';
        
        if (isset($data['sandbox_public_key'])) {
            $raw['sandbox_public_key'] = trim($data['sandbox_public_key']);
        }
        if (isset($data['production_public_key'])) {
            $raw['production_public_key'] = trim($data['production_public_key']);
        }

        // Only update Secret Keys if a non-masked, non-empty value was supplied
        $secretUpdated = false;
        if (!empty($data['sandbox_secret_key']) && !str_starts_with($data['sandbox_secret_key'], '••••')) {
            $raw['sandbox_secret_key_encrypted'] = Crypt::encryptString(trim($data['sandbox_secret_key']));
            $secretUpdated = true;
        }

        if (!empty($data['production_secret_key']) && !str_starts_with($data['production_secret_key'], '••••')) {
            $raw['production_secret_key_encrypted'] = Crypt::encryptString(trim($data['production_secret_key']));
            $secretUpdated = true;
        }

        // Bank & Financing info
        if (isset($data['transfer_discount_percent'])) {
            $raw['transfer_discount_percent'] = (float) $data['transfer_discount_percent'];
        }
        if (isset($data['max_installments'])) {
            $raw['max_installments'] = max(1, (int) $data['max_installments']);
        }
        if (isset($data['bank_cbu'])) $raw['bank_cbu'] = trim($data['bank_cbu']);
        if (isset($data['bank_alias'])) $raw['bank_alias'] = trim($data['bank_alias']);
        if (isset($data['bank_holder'])) $raw['bank_holder'] = trim($data['bank_holder']);
        if (isset($data['bank_cuit'])) $raw['bank_cuit'] = trim($data['bank_cuit']);
        if (isset($data['payment_methods_config'])) {
            $raw['payment_methods_config'] = is_array($data['payment_methods_config']) 
                ? $data['payment_methods_config'] 
                : json_decode($data['payment_methods_config'], true);
        }

        self::saveRaw($raw);

        AdminAuditLogService::log(
            'UPDATE_PAYMENT_GATEWAY',
            'Pasarela de Pagos',
            [
                'mode_before' => $oldMode,
                'mode_after' => $raw['payment_gateway_mode'],
                'secret_keys_updated' => $secretUpdated,
                'transfer_discount' => $raw['transfer_discount_percent'] ?? 10
            ],
            $admin
        );

        return self::getPublicSafe();
    }

    /**
     * Update Shipping Block
     */
    public static function updateShipping(array $data, ?array $admin = null): array
    {
        $raw = self::getRaw();

        if (isset($data['all_free'])) $raw['all_free'] = (bool) $data['all_free'];
        if (isset($data['free_shipping_enabled'])) $raw['free_shipping_enabled'] = (bool) $data['free_shipping_enabled'];
        if (isset($data['free_shipping_threshold'])) $raw['free_shipping_threshold'] = (float) $data['free_shipping_threshold'];

        if (isset($data['caba_cost'])) $raw['caba_cost'] = (float) $data['caba_cost'];
        if (isset($data['caba_free'])) $raw['caba_free'] = (bool) $data['caba_free'];
        if (isset($data['caba_enabled'])) $raw['caba_enabled'] = (bool) $data['caba_enabled'];
        if (isset($data['caba_cp_min'])) $raw['caba_cp_min'] = (int) $data['caba_cp_min'];
        if (isset($data['caba_cp_max'])) $raw['caba_cp_max'] = (int) $data['caba_cp_max'];

        if (isset($data['gba_cost'])) $raw['gba_cost'] = (float) $data['gba_cost'];
        if (isset($data['gba_free'])) $raw['gba_free'] = (bool) $data['gba_free'];
        if (isset($data['gba_enabled'])) $raw['gba_enabled'] = (bool) $data['gba_enabled'];
        if (isset($data['gba_cp_min'])) $raw['gba_cp_min'] = (int) $data['gba_cp_min'];
        if (isset($data['gba_cp_max'])) $raw['gba_cp_max'] = (int) $data['gba_cp_max'];

        if (isset($data['interior_cost'])) $raw['interior_cost'] = (float) $data['interior_cost'];
        if (isset($data['interior_free'])) $raw['interior_free'] = (bool) $data['interior_free'];
        if (isset($data['interior_enabled'])) $raw['interior_enabled'] = (bool) $data['interior_enabled'];
        if (isset($data['interior_cp_min'])) $raw['interior_cp_min'] = (int) $data['interior_cp_min'];
        if (isset($data['interior_cp_max'])) $raw['interior_cp_max'] = (int) $data['interior_cp_max'];

        if (isset($data['patagonia_cost'])) $raw['patagonia_cost'] = (float) $data['patagonia_cost'];
        if (isset($data['patagonia_free'])) $raw['patagonia_free'] = (bool) $data['patagonia_free'];
        if (isset($data['patagonia_enabled'])) $raw['patagonia_enabled'] = (bool) $data['patagonia_enabled'];
        if (isset($data['patagonia_cp_min'])) $raw['patagonia_cp_min'] = (int) $data['patagonia_cp_min'];
        if (isset($data['patagonia_cp_max'])) $raw['patagonia_cp_max'] = (int) $data['patagonia_cp_max'];

        if (isset($data['pickup_enabled'])) $raw['pickup_enabled'] = (bool) $data['pickup_enabled'];
        if (isset($data['pickup_address'])) $raw['pickup_address'] = trim($data['pickup_address']);
        if (isset($data['pickup_schedule'])) $raw['pickup_schedule'] = trim($data['pickup_schedule']);

        self::saveRaw($raw);

        AdminAuditLogService::log(
            'UPDATE_SHIPPING_RATES',
            'Tarifas y Rangos de Envío',
            [
                'caba_cost' => $raw['caba_cost'],
                'gba_cost' => $raw['gba_cost'],
                'interior_cost' => $raw['interior_cost'],
                'patagonia_cost' => $raw['patagonia_cost'],
                'free_shipping_threshold' => $raw['free_shipping_threshold']
            ],
            $admin
        );

        return self::getPublicSafe();
    }
}
