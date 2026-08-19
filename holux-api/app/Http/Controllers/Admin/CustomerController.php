<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminLog;
use App\Services\CustomerMetadataService;
use App\Services\SupabaseService;
use App\Services\VipSettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CustomerController extends Controller
{
    /**
     * List all registered customers with persistent tiers and metrics.
     */
    public function index(SupabaseService $supabase): JsonResponse
    {
        $customers = $supabase->get('profiles', [
            'role' => 'eq.customer',
            'order' => 'created_at.desc',
        ], true) ?: [];

        // Fetch all orders to compute total spent, orders count, and emails
        $orders = $supabase->get('orders', [], true) ?: [];
        $ordersByCustomer = collect($orders)->groupBy('customer_id');

        $enriched = array_map(function ($c) use ($ordersByCustomer) {
            $cOrders = $ordersByCustomer->get($c['id'], collect([]));
            $totalSpent = $cOrders->sum(function ($o) {
                return (float) ($o['total'] ?? $o['total_amount'] ?? 0);
            });
            $lastOrder = $cOrders->first();
            $email = $c['email'] ?? ($lastOrder['customer_email'] ?? 'usuario@tienda.com');
            
            $base = [
                'id' => $c['id'],
                'name' => $c['full_name'] ?? 'Cliente Holux',
                'full_name' => $c['full_name'] ?? 'Cliente Holux',
                'email' => $email,
                'phone' => $c['phone'] ?? 'Sin teléfono',
                'orders_count' => $cOrders->count(),
                'orders' => $cOrders->count(),
                'total_spent' => $totalSpent,
                'spent' => $totalSpent,
                'active' => $c['active'] !== false,
                'status' => ($c['active'] !== false) ? 'active' : 'suspended',
                'created_at' => $c['created_at'] ?? now()->toISOString(),
            ];

            return CustomerMetadataService::attach($base);
        }, $customers);

        return response()->json($enriched);
    }

    /**
     * View detailed customer profile and their order history.
     */
    public function show(string $id, SupabaseService $supabase): JsonResponse
    {
        $profile = $supabase->getOne('profiles', $id, true);

        if (empty($profile)) {
            return response()->json([
                'message' => 'Cliente no encontrado.'
            ], 404);
        }

        $orders = $supabase->get('orders', [
            'customer_id' => 'eq.' . $id,
            'order' => 'created_at.desc',
        ], true) ?: [];

        $profile['orders'] = $orders;
        $profile = CustomerMetadataService::attach($profile);

        return response()->json($profile);
    }

    /**
     * Toggle client active status (enable/disable account).
     */
    public function update(Request $request, string $id, SupabaseService $supabase): JsonResponse
    {
        $request->validate([
            'active' => ['required', 'boolean'],
        ]);

        $profile = $supabase->getOne('profiles', $id, true);

        if (empty($profile)) {
            return response()->json([
                'message' => 'Cliente no encontrado.'
            ], 404);
        }

        try {
            $updated = $supabase->update('profiles', $id, [
                'active' => $request->boolean('active'),
            ], true);

            $cust = $updated[0] ?? $profile;
            return response()->json(CustomerMetadataService::attach($cust));
        } catch (\Exception $e) {
            Log::error("Failed to toggle customer active state for {$id}: " . $e->getMessage());
            return response()->json([
                'message' => 'Error al actualizar el estado de la cuenta.'
            ], 500);
        }
    }

    /**
     * Update customer membership tier (standard, vip, super_vip).
     */
    public function updateTier(Request $request, string $id, SupabaseService $supabase): JsonResponse
    {
        $request->validate([
            'tier' => ['required', 'string', 'in:standard,vip,super_vip'],
            'notes' => ['nullable', 'string'],
        ]);

        $tier = $request->input('tier');
        $user = $request->user()?->email ?? 'admin@holux.com';

        $profile = $supabase->getOne('profiles', $id, true) ?: ['id' => $id];

        $updatedMeta = CustomerMetadataService::setTier($id, $tier);
        if ($request->has('notes')) {
            CustomerMetadataService::set($id, ['notes' => $request->input('notes')]);
        }

        AdminLog::record($user, 'CUSTOMER_TIER_UPDATED', 'profiles', [
            'customer_id' => $id,
            'new_tier' => $tier,
            'meta' => $updatedMeta,
        ]);

        return response()->json([
            'message' => "Nivel de membresía actualizado a {$tier} exitosamente.",
            'customer' => CustomerMetadataService::attach($profile),
        ]);
    }

    /**
     * Toggle VIP status (retrocompatible).
     */
    public function toggleVip(Request $request, string $id, SupabaseService $supabase): JsonResponse
    {
        $currentTier = CustomerMetadataService::getTier($id);
        $nextTier = ($currentTier === 'vip' || $currentTier === 'super_vip') ? 'standard' : 'vip';
        
        return $this->updateTier(new Request(['tier' => $nextTier]), $id, $supabase);
    }

    /**
     * Get active VIP & Super VIP benefits settings.
     */
    public function getVipSettings(): JsonResponse
    {
        return response()->json(VipSettingsService::get());
    }

    /**
     * Save active VIP & Super VIP benefits settings.
     */
    public function saveVipSettings(Request $request): JsonResponse
    {
        $data = $request->all();
        $user = $request->user()?->email ?? 'admin@holux.com';

        if (empty($data)) {
            return response()->json(['message' => 'Configuración requerida.'], 422);
        }

        VipSettingsService::save($data);

        AdminLog::record($user, 'VIP_SETTINGS_UPDATED', 'settings', [
            'settings' => $data,
        ]);

        return response()->json([
            'message' => 'Configuración de beneficios VIP & Super VIP guardada con éxito.',
            'settings' => VipSettingsService::get(),
        ]);
    }
}
