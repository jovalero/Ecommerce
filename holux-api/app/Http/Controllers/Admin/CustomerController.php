<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\SupabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CustomerController extends Controller
{
    /**
     * List all registered customers.
     *
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function index(SupabaseService $supabase): JsonResponse
    {
        $customers = $supabase->get('profiles', [
            'role' => 'eq.customer',
            'order' => 'created_at.desc',
        ], true);

        // Fetch all orders to compute total spent, orders count, and emails
        $orders = $supabase->get('orders', [], true);
        $ordersByCustomer = collect($orders)->groupBy('customer_id');

        $enriched = array_map(function ($c) use ($ordersByCustomer) {
            $cOrders = $ordersByCustomer->get($c['id'], collect([]));
            $totalSpent = $cOrders->sum(function ($o) {
                return (float) ($o['total'] ?? $o['total_amount'] ?? 0);
            });
            $lastOrder = $cOrders->first();
            $email = $c['email'] ?? ($lastOrder['customer_email'] ?? 'usuario@tienda.com');
            
            return [
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
                'is_vip' => ($totalSpent > 100000 || $cOrders->count() >= 3),
                'created_at' => $c['created_at'] ?? now()->toISOString(),
            ];
        }, $customers ?: []);

        return response()->json($enriched);
    }

    /**
     * View detailed customer profile and their order history.
     *
     * @param string $id
     * @param SupabaseService $supabase
     * @return JsonResponse
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
        ], true);

        $profile['orders'] = $orders;

        return response()->json($profile);
    }

    /**
     * Toggle client active status (enable/disable account).
     *
     * @param Request $request
     * @param string $id
     * @param SupabaseService $supabase
     * @return JsonResponse
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

            return response()->json($updated[0]);
        } catch (\Exception $e) {
            Log::error("Failed to toggle customer active state for {$id}: " . $e->getMessage());
            return response()->json([
                'message' => 'Error al actualizar el estado de la cuenta.'
            ], 500);
        }
    }
}
