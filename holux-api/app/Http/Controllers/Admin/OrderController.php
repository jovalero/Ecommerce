<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\OrderStatusUpdatedMail;
use App\Services\SupabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class OrderController extends Controller
{
    /**
     * Convert DB status to human-readable app status.
     */
    private function formatOrder(array $order): array
    {
        $order = \App\Services\OrderMetadataService::attach($order);
        $dbSt = $order['status'] ?? 'pending';
        $appSt = $order['app_status'] ?? null;

        if ($appSt && in_array($appSt, ['preparing', 'shipped', 'delivered', 'pending_review', 'paid', 'rejected', 'cancelled', 'pending_payment'])) {
            $order['status'] = $appSt;
        } elseif ($dbSt === 'processing') {
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
     * Map app status to valid DB constraint value ('pending', 'processing', 'completed', 'cancelled').
     */
    private function mapAppStatusToDb(string $appStatus): string
    {
        switch ($appStatus) {
            case 'pending_review':
                return 'processing';
            case 'paid':
            case 'completed':
            case 'preparing':
            case 'shipped':
            case 'delivered':
                return 'completed';
            case 'rejected':
            case 'cancelled':
                return 'cancelled';
            case 'pending_payment':
            case 'pending':
            default:
                return 'pending';
        }
    }

    /**
     * List all orders in the system.
     *
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function index(SupabaseService $supabase): JsonResponse
    {
        $orders = $supabase->get('orders', [
            'select' => '*,profiles(full_name,phone),order_items(*,products(*))',
            'order' => 'created_at.desc',
        ], true);

        $formatted = array_map([$this, 'formatOrder'], $orders ?: []);
        return response()->json($formatted);
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

        return response()->json($this->formatOrder($orders[0]));
    }

    /**
     * Fetch status history logs for an order.
     *
     * @param string $id
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function getLogs(string $id, SupabaseService $supabase): JsonResponse
    {
        try {
            $logs = $supabase->get('order_status_logs', [
                'order_id' => 'eq.' . $id,
                'order' => 'created_at.desc'
            ], true);

            return response()->json($logs ?: []);
        } catch (\Throwable $e) {
            Log::error("Error fetching order logs {$id}: " . $e->getMessage());
            return response()->json([]);
        }
    }

    /**
     * Update order status or admin notes.
     *
     * @param Request $request
     * @param string $id
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function update(Request $request, string $id, SupabaseService $supabase): JsonResponse
    {
        $request->validate([
            'status' => ['nullable', 'string', 'in:pending_payment,pending_review,paid,preparing,shipped,delivered,rejected,cancelled,pending,processing,completed'],
            'rejection_reason' => ['nullable', 'string', 'max:255'],
            'admin_notes' => ['nullable', 'string', 'max:1000'],
            'tracking_number' => ['nullable', 'string', 'max:100'],
            'shipping_courier' => ['nullable', 'string', 'max:100'],
            'tracking_url' => ['nullable', 'string', 'max:500'],
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
            $formattedOld = $this->formatOrder($order);
            $oldStatus = $formattedOld['status'];
            $newStatus = $request->status ?: $oldStatus;

            // If state changes from non-cancelled to cancelled/rejected, restore stock
            if ($oldStatus !== 'cancelled' && $oldStatus !== 'rejected' && ($newStatus === 'cancelled' || $newStatus === 'rejected')) {
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
                } catch (\Throwable $stockErr) {
                    Log::error("Stock restoration failed for order {$id}: " . $stockErr->getMessage());
                }
            }

            $dbStatus = $this->mapAppStatusToDb($newStatus);

            $updateData = [];
            if ($request->has('status')) {
                $updateData['status'] = $dbStatus;
            }
            if ($request->has('rejection_reason')) {
                $updateData['rejection_reason'] = $request->rejection_reason;
            } elseif ($newStatus === 'rejected') {
                $updateData['rejection_reason'] = 'El pago fue rechazado. Por favor verifica el comprobante.';
            }
            if ($request->has('admin_notes')) {
                $updateData['admin_notes'] = $request->admin_notes;
            }
            if ($request->has('tracking_number')) {
                $updateData['tracking_number'] = $request->tracking_number;
            }
            if ($request->has('shipping_courier')) {
                $updateData['shipping_courier'] = $request->shipping_courier;
            }
            if ($request->has('tracking_url')) {
                $updateData['tracking_url'] = $request->tracking_url;
            }

            $updated = [];
            if (!empty($updateData) || $request->has('status')) {
                \App\Services\OrderMetadataService::set($id, array_merge($updateData, ['app_status' => $newStatus]));
                try {
                    $updated = $supabase->update('orders', $id, $updateData, true);
                } catch (\Throwable $e) {
                    Log::warning("Full update failed for order {$id}, retrying with status only: " . $e->getMessage());
                    if (isset($updateData['status'])) {
                        $updated = $supabase->update('orders', $id, ['status' => $updateData['status']], true);
                    }
                }
            }

            $resOrder = array_merge($order, $updateData, $updated[0] ?? []);
            $resOrder['status'] = $newStatus;
            $resOrder['rejection_reason'] = $request->rejection_reason ?: ($updateData['rejection_reason'] ?? $order['rejection_reason'] ?? null);
            $resOrder['tracking_number'] = $request->tracking_number ?: ($updateData['tracking_number'] ?? $order['tracking_number'] ?? null);
            $resOrder['shipping_courier'] = $request->shipping_courier ?: ($updateData['shipping_courier'] ?? $order['shipping_courier'] ?? null);
            $resOrder['tracking_url'] = $request->tracking_url ?: ($updateData['tracking_url'] ?? $order['tracking_url'] ?? null);

            // Log status change if status actually changed
            if ($request->has('status') && $oldStatus !== $newStatus) {
                try {
                    $supabase->insert('order_status_logs', [
                        'order_id' => $id,
                        'old_status' => $oldStatus,
                        'new_status' => $newStatus,
                        'changed_by' => $request->attributes->get('user_email', 'Admin'),
                        'comment' => $request->rejection_reason ?: 'Actualización de estado por Admin'
                    ], true);
                } catch (\Throwable $logErr) {
                    Log::warning("Order log insert ignored: " . $logErr->getMessage());
                }

                // Send email notification to customer
                if (!empty($resOrder['customer_email'])) {
                    try {
                        Mail::to($resOrder['customer_email'])
                            ->send(new OrderStatusUpdatedMail($resOrder, $newStatus, $request->rejection_reason));
                    } catch (\Throwable $mailErr) {
                        Log::warning("Order status email send failed: " . $mailErr->getMessage());
                    }
                }
            }

            return response()->json($resOrder);
        } catch (\Throwable $e) {
            Log::error("Error updating order {$id}: " . $e->getMessage());
            return response()->json([
                'id' => $id,
                'status' => $request->status,
                'rejection_reason' => $request->rejection_reason,
                'admin_notes' => $request->admin_notes,
                'message' => 'Estado del pedido actualizado.'
            ]);
        }
    }

    /**
     * Resend status email notification to customer.
     *
     * @param Request $request
     * @param string $id
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function notify(Request $request, string $id, SupabaseService $supabase): JsonResponse
    {
        try {
            $orders = $supabase->get('orders', ['id' => 'eq.' . $id], true);
            if (empty($orders)) {
                return response()->json(['message' => 'Pedido no encontrado.'], 404);
            }
            $order = $this->formatOrder($orders[0]);
            if (empty($order['customer_email'])) {
                return response()->json(['message' => 'El pedido no tiene un email registrado.'], 422);
            }

            Mail::to($order['customer_email'])
                ->send(new OrderStatusUpdatedMail($order, $order['status'], $order['rejection_reason'] ?? null));

            return response()->json(['message' => 'Notificación enviada con éxito al cliente.']);
        } catch (\Throwable $e) {
            Log::error("Failed to resend email for order {$id}: " . $e->getMessage());
            return response()->json(['message' => 'No se pudo enviar la notificación: ' . $e->getMessage()], 500);
        }
    }
}
