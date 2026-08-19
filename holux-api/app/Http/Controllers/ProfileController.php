<?php

namespace App\Http\Controllers;

use App\Mail\OrderStatusUpdatedMail;
use App\Services\SupabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

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
        
        $userEmail = $request->attributes->get('user_email') ?? ($tokenPayload['email'] ?? null);
        $profile = $supabase->getOne('profiles', $userId, true);

        if (!empty($profile)) {
            if (empty($profile['email']) && !empty($userEmail)) {
                $profile['email'] = $userEmail;
            }
            $enriched = \App\Services\CustomerMetadataService::attach($profile);
            return response()->json($enriched);
        }

        $userMeta = (array) ($tokenPayload['user_metadata'] ?? []);
        $fullName = $userMeta['full_name'] ?? ($userEmail ? explode('@', $userEmail)[0] : 'Cliente');
        $role = $tokenPayload['role'] ?? ($tokenPayload['app_metadata']['role'] ?? 'customer');

        $base = [
            'id' => $userId,
            'email' => $userEmail,
            'full_name' => ucwords(str_replace(['.', '_', '-'], ' ', $fullName)),
            'phone' => $userMeta['phone'] ?? '',
            'role' => $role,
            'created_at' => date('Y-m-d H:i:s')
        ];

        return response()->json(\App\Services\CustomerMetadataService::attach($base));
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
    /**
     * Convert DB status to human-readable app status.
     */
    private function formatOrder(array $order): array
    {
        $dbSt = $order['status'] ?? 'pending';
        if ($dbSt === 'processing') {
            $order['status'] = 'pending_review';
        } elseif ($dbSt === 'pending') {
            $order['status'] = 'pending_payment';
        } elseif ($dbSt === 'completed') {
            $order['status'] = 'paid';
        } elseif ($dbSt === 'cancelled') {
            if (!empty($order['rejection_reason'])) {
                $order['status'] = 'rejected';
            } else {
                $order['status'] = 'cancelled';
            }
        }
        return $order;
    }

    /**
     * Get list of orders for the authenticated customer.
     *
     * @param Request $request
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function myOrders(Request $request, SupabaseService $supabase): JsonResponse
    {
        $userId = $request->attributes->get('user_id');
        $tokenPayload = $request->attributes->get('token_payload', []);
        $userEmail = $request->attributes->get('user_email') ?? ($tokenPayload['email'] ?? null);
        $userName = null;

        // Try getting profile from Supabase DB to get email and full_name
        if ($userId) {
            try {
                $prof = $supabase->getOne('profiles', $userId, true);
                if (!empty($prof)) {
                    if (empty($userEmail) && !empty($prof['email'])) {
                        $userEmail = $prof['email'];
                    }
                    if (!empty($prof['full_name'])) {
                        $userName = $prof['full_name'];
                    }
                }
            } catch (\Throwable $e) {}
        }

        $query = ['order' => 'created_at.desc'];
        $orders = $supabase->get('orders', $query, true);

        // Filter orders strictly relevant to this authenticated customer
        if (!empty($orders)) {
            $userEmailLower = strtolower(trim($userEmail ?? ''));
            $userNameLower = strtolower(trim($userName ?? ''));

            $filteredOrders = array_values(array_filter($orders, function ($ord) use ($userId, $userEmailLower, $userNameLower) {
                if (!empty($userId) && !empty($ord['customer_id']) && $ord['customer_id'] === $userId) {
                    return true;
                }
                if (!empty($userEmailLower) && !empty($ord['customer_email']) && strtolower(trim($ord['customer_email'])) === $userEmailLower) {
                    return true;
                }
                return false;
            }));

            $orders = $filteredOrders;
        } else {
            $orders = [];
        }

        $formatted = array_map([$this, 'formatOrder'], $orders ?: []);
        return response()->json($formatted);
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

        if ($order['customer_id'] !== $userId) {
            return response()->json([
                'message' => 'Acceso denegado. Este pedido pertenece a otro usuario.'
            ], 403);
        }

        return response()->json($this->formatOrder($order));
    }

    /**
     * Allow customer to upload or re-upload a transfer receipt for an order.
     *
     * @param Request $request
     * @param string $id
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function uploadReceipt(Request $request, string $id, SupabaseService $supabase): JsonResponse
    {
        $userId = $request->attributes->get('user_id');

        $request->validate([
            'receipt_url' => ['required', 'string'],
        ]);

        $orders = $supabase->get('orders', [
            'id' => 'eq.' . $id,
        ], true);

        if (empty($orders)) {
            return response()->json(['message' => 'Pedido no encontrado.'], 404);
        }

        $order = $orders[0];
        if ($order['customer_id'] && $order['customer_id'] !== $userId) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        try {
            $oldStatus = $order['status'] ?? 'pending_payment';
            $newStatus = 'pending_review';

            $updated = $supabase->update('orders', $id, [
                'receipt_url' => $request->receipt_url,
                'status' => 'processing',
                'rejection_reason' => null
            ], true);

            $resOrder = array_merge($order, $updated[0] ?? []);
            $resOrder['status'] = $newStatus;

            try {
                $supabase->insert('order_status_logs', [
                    'order_id' => $id,
                    'old_status' => $oldStatus,
                    'new_status' => $newStatus,
                    'changed_by' => $order['customer_email'] ?: 'cliente',
                    'comment' => 'Comprobante adjuntado por el cliente'
                ], true);
            } catch (\Throwable $e) {
                Log::warning("Order log failed: " . $e->getMessage());
            }

            if (!empty($order['customer_email'])) {
                try {
                    Mail::to($order['customer_email'])
                        ->send(new OrderStatusUpdatedMail($resOrder, 'pending_review'));
                } catch (\Throwable $mErr) {
                    Log::warning("Receipt email send failed: " . $mErr->getMessage());
                }
            }

            return response()->json($resOrder);
        } catch (\Exception $e) {
            Log::error("Failed to upload receipt for order {$id}: " . $e->getMessage());
            return response()->json(['message' => 'Error al subir comprobante.'], 500);
        }
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

        if ($order['customer_id'] !== $userId) {
            return response()->json([
                'message' => 'Acceso denegado. Este pedido pertenece a otro usuario.'
            ], 403);
        }

        if ($order['status'] !== 'pending' && $order['status'] !== 'pending_payment') {
            return response()->json([
                'message' => 'El pedido no se puede cancelar porque su estado actual es ' . $order['status'] . '.'
            ], 422);
        }

        try {
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
