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
        $supabaseUrl = config('services.supabase.url') ?: env('SUPABASE_URL', 'https://fmbhcfsrsfkglmvgbnlm.supabase.co');
        $serviceKey = config('services.supabase.service_key') ?: env('SUPABASE_SERVICE_KEY');

        // 1. Fetch all real registered users from Supabase Auth
        $authUsersMap = [];
        try {
            $authRes = \Illuminate\Support\Facades\Http::withHeaders([
                'apikey' => $serviceKey,
                'Authorization' => 'Bearer ' . $serviceKey,
            ])->get("{$supabaseUrl}/auth/v1/admin/users");

            if ($authRes->successful()) {
                $usersData = $authRes->json('users') ?: [];
                foreach ($usersData as $u) {
                    if (($u['email'] ?? '') === 'admin@holux.com') {
                        continue;
                    }
                    $authUsersMap[$u['id']] = $u;
                }
            }
        } catch (\Exception $e) {
            Log::warning('Could not fetch auth users for customer index: ' . $e->getMessage());
        }

        // 2. Fetch profiles & orders
        $profiles = $supabase->get('profiles', [], true) ?: [];
        $profilesMap = collect($profiles)->keyBy('id');

        $orders = $supabase->get('orders', [], true) ?: [];
        $ordersByCustomer = collect($orders)->groupBy('customer_id');

        // 3. Build unified customer list from all real auth users
        $customerList = [];

        foreach ($authUsersMap as $userId => $u) {
            $p = $profilesMap->get($userId, []);
            $cOrders = $ordersByCustomer->get($userId, collect([]));
            $totalSpent = $cOrders->sum(function ($o) {
                return (float) ($o['total'] ?? $o['total_amount'] ?? 0);
            });
            $lastOrder = $cOrders->first();

            $email = $u['email'] 
                ?? ($p['email'] ?? ($lastOrder['customer_email'] ?? ''));

            $fullName = $p['full_name'] 
                ?? ($u['user_metadata']['full_name'] ?? ($lastOrder['customer_name'] ?? ($u['email'] ? explode('@', $u['email'])[0] : 'Cliente Holux')));

            $phone = $p['phone'] 
                ?? ($u['user_metadata']['phone'] ?? ($u['phone'] ?? ($lastOrder['customer_phone'] ?? 'Sin teléfono')));

            $base = [
                'id' => $userId,
                'name' => $fullName,
                'full_name' => $fullName,
                'email' => $email,
                'phone' => $phone,
                'orders_count' => $cOrders->count(),
                'orders' => $cOrders->count(),
                'total_spent' => $totalSpent,
                'spent' => $totalSpent,
                'active' => ($p['active'] ?? true) !== false,
                'status' => (($p['active'] ?? true) !== false) ? 'active' : 'suspended',
                'created_at' => $u['created_at'] ?? ($p['created_at'] ?? now()->toISOString()),
            ];

            $customerList[] = CustomerMetadataService::attach($base);
        }

        foreach ($profiles as $p) {
            if (isset($authUsersMap[$p['id']]) || ($p['role'] ?? '') === 'admin') {
                continue;
            }
            $cOrders = $ordersByCustomer->get($p['id'], collect([]));
            $totalSpent = $cOrders->sum(function ($o) {
                return (float) ($o['total'] ?? $o['total_amount'] ?? 0);
            });
            $lastOrder = $cOrders->first();

            $base = [
                'id' => $p['id'],
                'name' => $p['full_name'] ?? 'Cliente Holux',
                'full_name' => $p['full_name'] ?? 'Cliente Holux',
                'email' => $p['email'] ?? ($lastOrder['customer_email'] ?? 'usuario@tienda.com'),
                'phone' => $p['phone'] ?? 'Sin teléfono',
                'orders_count' => $cOrders->count(),
                'orders' => $cOrders->count(),
                'total_spent' => $totalSpent,
                'spent' => $totalSpent,
                'active' => ($p['active'] ?? true) !== false,
                'status' => (($p['active'] ?? true) !== false) ? 'active' : 'suspended',
                'created_at' => $p['created_at'] ?? now()->toISOString(),
            ];

            $customerList[] = CustomerMetadataService::attach($base);
        }

        return response()->json($customerList);
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
