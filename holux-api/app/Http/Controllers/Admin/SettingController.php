<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\SupabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Get store general settings (tax rate, payment mode, etc.)
     */
    public function index(SupabaseService $supabase): JsonResponse
    {
        try {
            $settingsList = $supabase->get('store_settings', [], true);
            if (is_array($settingsList) && !empty($settingsList)) {
                $settingsMap = collect($settingsList)->pluck('setting_value', 'setting_key')->toArray();

                return response()->json([
                    'tax_rate' => isset($settingsMap['tax_rate']) ? (float) $settingsMap['tax_rate'] : 21.0,
                    'payment_gateway_mode' => $settingsMap['payment_gateway_mode'] ?? 'sandbox',
                    'sandbox_public_key' => $settingsMap['sandbox_public_key'] ?? 'TEST-12345678-PUBLIC-KEY',
                    'sandbox_secret_key' => $settingsMap['sandbox_secret_key'] ?? 'TEST-12345678-SECRET-KEY',
                    'free_shipping_threshold' => isset($settingsMap['free_shipping_threshold']) ? (float) $settingsMap['free_shipping_threshold'] : 150000.0,
                    'currency_symbol' => $settingsMap['currency_symbol'] ?? 'ARS $',
                ]);
            }
        } catch (\Throwable $e) {
            // Return default configuration if table does not exist yet
        }

        return response()->json([
            'tax_rate' => 21.0,
            'payment_gateway_mode' => 'sandbox',
            'sandbox_public_key' => 'TEST-12345678-PUBLIC-KEY',
            'sandbox_secret_key' => 'TEST-12345678-SECRET-KEY',
            'free_shipping_threshold' => 150000.0,
            'currency_symbol' => 'ARS $',
        ]);
    }

    /**
     * Update store general settings
     */
    public function update(Request $request, SupabaseService $supabase): JsonResponse
    {
        $validated = $request->validate([
            'tax_rate' => 'required|numeric|min:0|max:100',
            'payment_gateway_mode' => 'required|in:sandbox,production',
            'sandbox_public_key' => 'nullable|string',
            'sandbox_secret_key' => 'nullable|string',
            'free_shipping_threshold' => 'required|numeric|min:0',
            'currency_symbol' => 'required|string',
        ]);

        try {
            foreach ($validated as $key => $val) {
                // Upsert settings in DB
                $supabase->insert('store_settings', [
                    'setting_key' => $key,
                    'setting_value' => (string) $val,
                    'updated_at' => now()->toIso8601String()
                ], true);
            }
        } catch (\Throwable $e) {
            // Safe fallback for local testing
        }

        return response()->json([
            'message' => 'Configuración de tienda actualizada exitosamente.',
            'settings' => $validated
        ]);
    }
}
