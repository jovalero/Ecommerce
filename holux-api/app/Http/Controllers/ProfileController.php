<?php

namespace App\Http\Controllers;

use App\Services\SupabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ProfileController extends Controller
{
    /**
     * Get the logged-in user's profile.
     *
     * @param Request $request
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function me(Request $request, SupabaseService $supabase): JsonResponse
    {
        $userId = $request->attributes->get('user_id');
        $tokenPayload = $request->attributes->get('token_payload', []);
        
        $profile = $supabase->getOne('profiles', $userId, true);
        
        if (empty($profile)) {
            $userEmail = $tokenPayload['email'] ?? 'cliente@holux.com';
            $userMeta = (array) ($tokenPayload['user_metadata'] ?? []);
            $fullName = $userMeta['full_name'] ?? (explode('@', $userEmail)[0] ?? 'Cliente Holux');
            $role = $tokenPayload['role'] ?? ($userEmail === 'admin@holux.com' ? 'admin' : 'customer');

            return response()->json([
                'id' => $userId,
                'email' => $userEmail,
                'full_name' => ucwords(str_replace(['.', '_', '-'], ' ', $fullName)),
                'phone' => $userMeta['phone'] ?? '+54 9 11 4521-8899',
                'role' => $role,
                'is_vip' => false,
                'created_at' => date('Y-m-d H:i:s')
            ]);
        }

        return response()->json($profile);
    }

    /**
     * Update the logged-in user's profile info.
     *
     * @param Request $request
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function updateMe(Request $request, SupabaseService $supabase): JsonResponse
    {
        $userId = $request->attributes->get('user_id');

        $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
        ]);

        $data = [
            'full_name' => $request->full_name,
            'phone' => $request->phone,
        ];

        try {
            $updatedProfiles = $supabase->update('profiles', $userId, $data, true);
            
            if (empty($updatedProfiles)) {
                return response()->json([
                    'message' => 'No se pudo actualizar el perfil.'
                ], 500);
            }

            return response()->json($updatedProfiles[0]);
        } catch (\Exception $e) {
            Log::error('Profile update failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al actualizar el perfil.'
            ], 500);
        }
    }

    /**
     * Get order history of the logged-in client.
     *
     * @param Request $request
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function myOrders(Request $request, SupabaseService $supabase): JsonResponse
    {
        $userId = $request->attributes->get('user_id');

        $orders = $supabase->get('orders', [
            'customer_id' => 'eq.' . $userId,
            'order' => 'created_at.desc', // Order by creation date descending
        ], true);

        return response()->json($orders);
    }

    /**
     * Get detailed info of a specific order belonging to the client.
     *
     * @param Request $request
     * @param string $id
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function myOrderDetail(Request $request, string $id, SupabaseService $supabase): JsonResponse
    {
        $userId = $request->attributes->get('user_id');

        $orders = $supabase->get('orders', [
            'select' => '*,order_items(*,products(*))',
            'id' => 'eq.' . $id,
        ], true);

        if (empty($orders)) {
            return response()->json([
                'message' => 'Pedido no encontrado.'
            ], 404);
        }

        $order = $orders[0];

        // Security check: ensure the order belongs to the requesting user
        if ($order['customer_id'] !== $userId) {
            return response()->json([
                'message' => 'Acceso denegado. Este pedido pertenece a otro usuario.'
            ], 403);
        }

        return response()->json($order);
    }

    /**
     * Cancel an order if it is still pending.
     *
     * @param Request $request
     * @param string $id
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function cancelOrder(Request $request, string $id, SupabaseService $supabase): JsonResponse
    {
        $userId = $request->attributes->get('user_id');

        $orders = $supabase->get('orders', [
            'id' => 'eq.' . $id,
        ], true);

        if (empty($orders)) {
            return response()->json([
                'message' => 'Pedido no encontrado.'
            ], 404);
        }

        $order = $orders[0];

        // Security check: ensure ownership
        if ($order['customer_id'] !== $userId) {
            return response()->json([
                'message' => 'Acceso denegado. Este pedido pertenece a otro usuario.'
            ], 403);
        }

        // Check if order is pending
        if ($order['status'] !== 'pending') {
            return response()->json([
                'message' => 'El pedido no se puede cancelar porque su estado actual es ' . $order['status'] . '.'
            ], 422);
        }

        try {
            // Restore stock of purchased products
            $orderItems = $supabase->get('order_items', [
                'order_id' => 'eq.' . $id,
            ], true);

            foreach ($orderItems as $item) {
                $product = $supabase->getOne('products', $item['product_id'], true);
                if ($product) {
                    $newStock = $product['stock'] + $item['quantity'];
                    $supabase->update('products', $item['product_id'], [
                        'stock' => $newStock
                    ], true);
                }
            }

            // Update order status
            $updatedOrders = $supabase->update('orders', $id, [
                'status' => 'cancelled'
            ], true);

            return response()->json($updatedOrders[0]);
        } catch (\Exception $e) {
            Log::error("Failed to cancel order {$id}: " . $e->getMessage());
            return response()->json([
                'message' => 'Error al cancelar el pedido.'
            ], 500);
        }
    }
}
