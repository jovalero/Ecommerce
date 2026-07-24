<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\SupabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    /**
     * List all orders in the system.
     *
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function index(SupabaseService $supabase): JsonResponse
    {
        $orders = $supabase->get('orders', [
            'select' => '*,profiles(full_name,phone)',
            'order' => 'created_at.desc',
        ], true);

        return response()->json($orders);
    }

    /**
     * Show any specific order details.
     *
     * @param string $id
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function show(string $id, SupabaseService $supabase): JsonResponse
    {
        $orders = $supabase->get('orders', [
            'select' => '*,profiles(full_name,phone),order_items(*,products(*))',
            'id' => 'eq.' . $id,
        ], true);

        if (empty($orders)) {
            return response()->json([
                'message' => 'Pedido no encontrado.'
            ], 404);
        }

        return response()->json($orders[0]);
    }

    /**
     * Update an order status.
     *
     * @param Request $request
     * @param string $id
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function update(Request $request, string $id, SupabaseService $supabase): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'string', 'in:pending,processing,completed,cancelled'],
        ]);

        try {
            $orders = $supabase->get('orders', [
                'id' => 'eq.' . $id,
            ], true);

            if (empty($orders)) {
                return response()->json([
                    'message' => 'Pedido no encontrado.'
                ], 404);
            }

            $order = $orders[0];

            // If state changes from non-cancelled to cancelled, restore stock
            if ($order['status'] !== 'cancelled' && $request->status === 'cancelled') {
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
            }

            $updated = $supabase->update('orders', $id, [
                'status' => $request->status,
            ], true);

            return response()->json($updated[0]);
        } catch (\Exception $e) {
            Log::error("Failed to update order status for {$id}: " . $e->getMessage());
            return response()->json([
                'message' => 'Error al actualizar el estado del pedido.'
            ], 500);
        }
    }
}
