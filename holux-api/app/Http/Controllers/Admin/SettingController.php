<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminAuditLogService;
use App\Services\StoreSettingService;
use App\Services\SupabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    private function getAdminContext(Request $request): array
    {
        $user = $request->attributes->get('user') ?? [];
        return [
            'id' => $request->attributes->get('user_id') ?? ($user['id'] ?? 'admin'),
            'name' => $user['name'] ?? $user['full_name'] ?? 'Administrador',
            'email' => $user['email'] ?? 'admin@holux.com',
        ];
    }

    /**
     * Get store general settings (Safe Public format without exposing raw Secret Keys)
     */
    public function index(): JsonResponse
    {
        $settings = StoreSettingService::getPublicSafe();
        $logs = AdminAuditLogService::getRecent(20);

        return response()->json([
            'settings' => $settings,
            'recent_logs' => $logs
        ]);
    }

    /**
     * Update Tax & Currency Block
     */
    public function updateTax(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tax_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'currency_symbol' => ['required', 'string', 'max:15'],
        ], [
            'tax_rate.required' => 'El porcentaje de IVA es obligatorio.',
            'tax_rate.min' => 'La alícuota de IVA no puede ser negativa.',
            'tax_rate.max' => 'La alícuota de IVA no puede superar el 100%.',
            'currency_symbol.required' => 'El símbolo de moneda es obligatorio.'
        ]);

        $admin = $this->getAdminContext($request);
        $updated = StoreSettingService::updateTax($validated, $admin);

        return response()->json([
            'message' => 'Configuración fiscal e IVA actualizada con éxito.',
            'settings' => $updated
        ]);
    }

    /**
     * Update Payment Gateway Block
     */
    public function updatePayment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'payment_gateway' => ['nullable', 'string'],
            'payment_gateway_mode' => ['required', 'in:sandbox,production'],
            'sandbox_public_key' => ['nullable', 'string'],
            'sandbox_secret_key' => ['nullable', 'string'],
            'production_public_key' => ['nullable', 'string'],
            'production_secret_key' => ['nullable', 'string'],
            'transfer_discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'bank_cbu' => ['nullable', 'string'],
            'bank_alias' => ['nullable', 'string'],
            'bank_holder' => ['nullable', 'string'],
            'bank_cuit' => ['nullable', 'string'],
        ], [
            'payment_gateway_mode.required' => 'El modo de operación (Sandbox / Producción) es obligatorio.',
            'payment_gateway_mode.in' => 'El modo debe ser sandbox o production.',
            'transfer_discount_percent.max' => 'El descuento por transferencia no puede superar el 100%.'
        ]);

        $admin = $this->getAdminContext($request);
        $updated = StoreSettingService::updatePayment($validated, $admin);

        return response()->json([
            'message' => 'Configuración de pasarela de pagos actualizada con éxito.',
            'settings' => $updated
        ]);
    }

    /**
     * Update Shipping Rates & Postal Code Ranges Block
     */
    public function updateShipping(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'caba_cost' => ['required', 'numeric', 'min:0'],
            'caba_cp_min' => ['required', 'integer', 'min:1'],
            'caba_cp_max' => ['required', 'integer', 'gte:caba_cp_min'],

            'gba_cost' => ['required', 'numeric', 'min:0'],
            'gba_cp_min' => ['required', 'integer', 'min:1'],
            'gba_cp_max' => ['required', 'integer', 'gte:gba_cp_min'],

            'interior_cost' => ['required', 'numeric', 'min:0'],
            'interior_cp_min' => ['required', 'integer', 'min:1'],
            'interior_cp_max' => ['required', 'integer', 'gte:interior_cp_min'],

            'patagonia_cost' => ['required', 'numeric', 'min:0'],
            'patagonia_cp_min' => ['required', 'integer', 'min:1'],
            'patagonia_cp_max' => ['required', 'integer', 'gte:patagonia_cp_min'],

            'free_shipping_threshold' => ['required', 'numeric', 'min:0'],
        ], [
            'caba_cost.min' => 'La tarifa de CABA no puede ser negativa.',
            'caba_cp_max.gte' => 'El CP máximo de CABA debe ser mayor o igual al mínimo.',
            'gba_cost.min' => 'La tarifa de GBA no puede ser negativa.',
            'gba_cp_max.gte' => 'El CP máximo de GBA debe ser mayor o igual al mínimo.',
            'interior_cost.min' => 'La tarifa del Interior no puede ser negativa.',
            'interior_cp_max.gte' => 'El CP máximo de Interior debe ser mayor o igual al mínimo.',
            'patagonia_cost.min' => 'La tarifa de Patagonia no puede ser negativa.',
            'patagonia_cp_max.gte' => 'El CP máximo de Patagonia debe ser mayor o igual al mínimo.',
            'free_shipping_threshold.min' => 'El monto mínimo de envío gratis no puede ser negativo.'
        ]);

        $admin = $this->getAdminContext($request);
        $updated = StoreSettingService::updateShipping($validated, $admin);

        return response()->json([
            'message' => 'Tarifas y rangos de código postal guardados con éxito.',
            'settings' => $updated
        ]);
    }

    /**
     * Unified / Retrocompatible Update
     */
    public function update(Request $request): JsonResponse
    {
        $admin = $this->getAdminContext($request);
        $data = $request->all();

        if (isset($data['tax_rate'])) {
            StoreSettingService::updateTax($data, $admin);
        }
        if (isset($data['payment_gateway_mode'])) {
            StoreSettingService::updatePayment($data, $admin);
        }
        if (isset($data['caba_cost']) || isset($data['free_shipping_threshold'])) {
            StoreSettingService::updateShipping($data, $admin);
        }

        return response()->json([
            'message' => 'Configuración de tienda actualizada exitosamente.',
            'settings' => StoreSettingService::getPublicSafe()
        ]);
    }

    /**
     * Get Audit Logs
     */
    public function getLogs(): JsonResponse
    {
        return response()->json(AdminAuditLogService::getRecent(50));
    }
}
