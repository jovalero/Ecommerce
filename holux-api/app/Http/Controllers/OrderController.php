<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrderRequest;
use App\Services\SupabaseService;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    /**
     * Convert DB status to human-readable app status.
     */
    private function formatOrder(array $order): array
    {
        $order = \App\Services\OrderMetadataService::attach($order);
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
     * Store a newly created order.
     *
     * @param StoreOrderRequest $request
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function store(StoreOrderRequest $request, SupabaseService $supabase): JsonResponse
    {
        try {
            // 1. Extract unique product IDs from request
            $productIds = collect($request->items)->pluck('product_id')->unique()->toArray();
            
            // 2. Fetch current prices and stock from Supabase to prevent manipulation
            $idsFilter = 'in.(' . implode(',', $productIds) . ')';
            $products = $supabase->get('products', [
                'select' => 'id,name,price,stock',
                'id' => $idsFilter,
            ]);

            $dbProducts = collect($products)->keyBy('id');

            // 3. Validate existence and stock
            foreach ($request->items as $item) {
                $prodId = $item['product_id'];
                
                if (!$dbProducts->has($prodId)) {
                    return response()->json([
                        'message' => "El producto con ID {$prodId} no existe."
                    ], 422);
                }

                $dbProduct = $dbProducts->get($prodId);
                if ($dbProduct['stock'] < $item['quantity']) {
                    return response()->json([
                        'message' => "Stock insuficiente para '{$dbProduct['name']}'. Disponible: {$dbProduct['stock']}."
                    ], 422);
                }
            }

            // 4. Calculate total and format order items
            $total = 0;
            $orderItemsData = [];

            foreach ($request->items as $item) {
                $dbProduct = $dbProducts->get($item['product_id']);
                $unitPrice = $dbProduct['price'];
                $quantity = $item['quantity'];
                
                $total += $unitPrice * $quantity;

                $orderItemsData[] = [
                    'product_id' => $item['product_id'],
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                ];
            }

            // 5. Check if user is logged in (optional check for guest checkout)
            $customerId = $request->attributes->get('user_id');
            $token = $request->bearerToken();
            if (!empty($token)) {
                try {
                    $parts = explode('.', $token);
                    if (count($parts) >= 2) {
                        $b64 = strtr($parts[1], '-_', '+/');
                        $padded = str_pad($b64, strlen($b64) + (4 - strlen($b64) % 4) % 4, '=', STR_PAD_RIGHT);
                        $payload = json_decode(base64_decode($padded), true);
                        if (is_array($payload)) {
                            if (!empty($payload['sub'])) {
                                $customerId = $payload['sub'];
                            }
                        }
                    }
                } catch (\Throwable $e) {
                    Log::warning('Guest order token decode failed: ' . $e->getMessage());
                }
            }

            // 5b. Insert order with strict status enum (pending_payment by default or pending_review if transfer receipt is attached)
            $paymentMethod = $request->input('payment_method', 'card');
            $receiptUrl = $request->input('receipt_url', null);
            $rejectionReason = null;

            $initialStatus = 'pending_payment';
            if ($paymentMethod === 'transfer' && !empty($receiptUrl)) {
                $initialStatus = 'pending_review';
            }

            // Map custom application status to valid Supabase check constraint value ('pending', 'processing', 'completed', 'cancelled')
            $dbStatus = 'pending';
            if ($initialStatus === 'pending_review') $dbStatus = 'processing';
            if ($initialStatus === 'paid') $dbStatus = 'completed';
            if ($initialStatus === 'cancelled' || $initialStatus === 'rejected') $dbStatus = 'cancelled';

            $shippingAddress = $request->input('shipping_address') ?: 'Retiro en Sucursal Bariloche (Av. Bustillo Km 4.5)';
            $shippingMethod = $request->input('shipping_method') ?: ($request->input('shipping_address') ? 'Entrega a Domicilio' : 'Retiro en Sucursal');

            $coreData = [
                'customer_id' => $customerId,
                'customer_name' => $request->customer_name,
                'customer_email' => $request->customer_email,
                'total' => $total,
                'status' => $dbStatus,
            ];

            $insertedOrders = [];
            try {
                $insertedOrders = $supabase->insert('orders', $coreData, true);
            } catch (\Throwable $e1) {
                Log::warning("Order insert attempt 1 failed: " . $e1->getMessage());
                $insertedOrders = $supabase->insert('orders', [
                    'customer_name' => $request->customer_name,
                    'customer_email' => $request->customer_email,
                    'total' => $total,
                    'status' => $dbStatus,
                ], true);
            }

            if (empty($insertedOrders)) {
                throw new \Exception("No se recibió respuesta al insertar el pedido en Supabase.");
            }

            $order = $insertedOrders[0];
            $order['total'] = (float) ($order['total'] ?? $total);
            $order['total_amount'] = (float) ($order['total'] ?? $total);
            $order['status'] = $initialStatus;
            $order['payment_method'] = $paymentMethod;
            $order['shipping_address'] = $shippingAddress;
            $order['shipping_method'] = $shippingMethod;
            $order['receipt_url'] = $receiptUrl;
            $order['rejection_reason'] = $rejectionReason;
            $orderId = $order['id'];

            // Persist extended metadata
            \App\Services\OrderMetadataService::set($orderId, [
                'payment_method' => $paymentMethod,
                'shipping_address' => $shippingAddress,
                'shipping_method' => $shippingMethod,
                'receipt_url' => $receiptUrl,
                'rejection_reason' => $rejectionReason,
            ]);

            // 6. Map order_id and insert order items in bulk
            $itemsToInsert = array_map(function ($item) use ($orderId) {
                $item['order_id'] = $orderId;
                return $item;
            }, $orderItemsData);

            $insertedItems = $supabase->insert('order_items', $itemsToInsert, true);

            // 7. Update stock for each product
            foreach ($request->items as $item) {
                $dbProduct = $dbProducts->get($item['product_id']);
                $newStock = $dbProduct['stock'] - $item['quantity'];
                
                $supabase->update('products', $dbProduct['id'], [
                    'stock' => $newStock
                ], true);
            }

            // 8. Return response
            $order['items'] = $insertedItems;

            return response()->json($order, 201);

        } catch (\Exception $e) {
            Log::error("Failed to store order in database: " . $e->getMessage(), [
                'request' => $request->all(),
                'exception' => $e,
            ]);

            return response()->json([
                'message' => 'Error al procesar el pedido. Intente nuevamente más tarde.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Display the specified order with items and product details.
     *
     * @param string $id
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function show(string $id, SupabaseService $supabase): JsonResponse
    {
        // Read order details with items and related products (service key bypasses RLS)
        $orders = $supabase->get('orders', [
            'select' => '*,order_items(*,products(*))',
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
     * Process Mercado Pago Card Payment Brick payload via Mercado Pago Orders API v1.
     * Endpoint: POST https://api.mercadopago.com/v1/orders
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function processOrder(Request $request): JsonResponse
    {
        $payload = $request->all();
        Log::info('Mercado Pago Brick Submission Payload: ', $payload);

        $accessToken = env('MERCADOPAGO_ACCESS_TOKEN', '');
        $idempotencyKey = (string) \Illuminate\Support\Str::uuid();

        $totalAmount = number_format((float) ($request->input('total_amount', 100)), 2, '.', '');
        $externalRef = $request->input('external_reference', 'HLX-REF-' . time());
        $payerEmail = $request->input('payer.email') ?: ($request->attributes->get('user_email') ?: '');

        $transactions = $request->input('transactions', [
            'payments' => [
                [
                    'amount' => $totalAmount,
                    'payment_method' => [
                        'id' => 'master',
                        'type' => 'credit_card',
                        'token' => '1223123',
                        'installments' => 1
                    ]
                ]
            ]
        ]);

        $orderBody = [
            'type' => 'online',
            'processing_mode' => 'automatic',
            'total_amount' => $totalAmount,
            'external_reference' => $externalRef,
            'payer' => [
                'email' => $payerEmail
            ],
            'transactions' => $transactions
        ];

        // Call Mercado Pago API if ACCESS_TOKEN is configured in environment
        if (!empty($accessToken)) {
            try {
                $client = new \GuzzleHttp\Client();
                $mpResponse = $client->post('https://api.mercadopago.com/v1/orders', [
                    'headers' => [
                        'Authorization' => 'Bearer ' . $accessToken,
                        'X-Idempotency-Key' => $idempotencyKey,
                        'Content-Type' => 'application/json'
                    ],
                    'json' => $orderBody
                ]);

                $data = json_decode($mpResponse->getBody()->getContents(), true);
                Log::info('Mercado Pago API Orders v1 Response: ', $data);

                $paymentStatus = $data['transactions']['payments'][0]['status'] ?? ($data['status'] ?? 'processed');
                $statusDetail = $data['transactions']['payments'][0]['status_detail'] ?? ($data['status_detail'] ?? 'accredited');

                return response()->json([
                    'id' => $data['id'] ?? ('ORD' . strtoupper(\Illuminate\Support\Str::random(24))),
                    'type' => $data['type'] ?? 'online',
                    'processing_mode' => $data['processing_mode'] ?? 'automatic',
                    'external_reference' => $externalRef,
                    'total_amount' => $totalAmount,
                    'status' => ($paymentStatus === 'processed' || $paymentStatus === 'approved') ? 'approved' : 'rejected',
                    'status_detail' => $statusDetail,
                    'transactions' => $data['transactions'] ?? $transactions,
                    'message' => '¡Orden procesada correctamente en Mercado Pago!'
                ], 200);

            } catch (\GuzzleHttp\Exception\ClientException $e) {
                $res = $e->getResponse();
                $statusCode = $res ? $res->getStatusCode() : 400;

                // Handle 429 Too Many Requests
                if ($statusCode === 429) {
                    $retryAfter = $res->getHeaderLine('Retry-After') ?: '5';
                    return response()->json([
                        'message' => 'Demasiadas solicitudes enviadas a Mercado Pago. Por favor intente nuevamente.',
                        'retry_after' => $retryAfter
                    ], 429, ['Retry-After' => $retryAfter]);
                }

                $errBody = json_decode($res->getBody()->getContents(), true);
                Log::warning('Mercado Pago Payment API Error: ', $errBody ?: []);

                return response()->json([
                    'message' => $errBody['message'] ?? 'El pago fue rechazado por la pasarela de pagos.',
                    'status' => 'rejected',
                    'status_detail' => $errBody['cause'][0]['description'] ?? 'payment_rejected'
                ], 422);
            } catch (\Throwable $err) {
                Log::error('Mercado Pago API Exception: ' . $err->getMessage());
                return response()->json([
                    'message' => 'Error de comunicación con la pasarela de pagos.',
                    'status' => 'rejected',
                    'status_detail' => 'gateway_error'
                ], 500);
            }
        }

        // Fallback for development without configured token
        if (config('app.env') === 'production') {
            return response()->json([
                'message' => 'La pasarela de pagos no está configurada para recibir cobros.',
                'status' => 'rejected',
                'status_detail' => 'gateway_unconfigured'
            ], 503);
        }

        return response()->json([
            'id' => 'DEV_SANDBOX_' . strtoupper(\Illuminate\Support\Str::random(16)),
            'type' => 'online',
            'processing_mode' => 'sandbox_dev',
            'external_reference' => $externalRef,
            'total_amount' => $totalAmount,
            'status' => 'approved',
            'status_detail' => 'accredited',
            'idempotency_key' => $idempotencyKey,
            'transactions' => $transactions,
            'message' => 'Simulación de desarrollo completada.'
        ], 200);
    }

    /**
     * Handle IPN / Webhook notifications from Mercado Pago.
     * Endpoint: POST /api/webhooks/mercadopago
     *
     * @param Request $request
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function handleMercadoPagoWebhook(Request $request, SupabaseService $supabase): JsonResponse
    {
        Log::info('Mercado Pago Webhook Received:', $request->all());

        $type = $request->input('type') ?: $request->input('topic');
        $dataId = $request->input('data.id') ?: $request->input('id');

        if (empty($dataId)) {
            return response()->json(['message' => 'Ignored notification without ID.'], 200);
        }

        $accessToken = env('MERCADOPAGO_ACCESS_TOKEN', '');
        if (empty($accessToken)) {
            Log::warning('Mercado Pago Webhook: ACCESS_TOKEN not configured.');
            return response()->json(['message' => 'Webhook received but MP ACCESS_TOKEN unconfigured.'], 200);
        }

        try {
            // Query Mercado Pago API for payment details
            $client = new \GuzzleHttp\Client();
            $url = "https://api.mercadopago.com/v1/payments/{$dataId}";
            
            $mpRes = $client->get($url, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                ]
            ]);

            $paymentData = json_decode($mpRes->getBody()->getContents(), true);
            Log::info('Mercado Pago Webhook Payment Detail:', $paymentData);

            $externalRef = $paymentData['external_reference'] ?? null;
            $mpStatus = $paymentData['status'] ?? 'pending';
            $paidAmount = (float) ($paymentData['transaction_amount'] ?? 0);

            if (!$externalRef) {
                return response()->json(['message' => 'Notification missing external_reference.'], 200);
            }

            // Find matching order in Supabase
            $orders = $supabase->get('orders', [
                'id' => 'eq.' . $externalRef,
            ], true);

            if (empty($orders)) {
                return response()->json(['message' => 'Order not found for reference ' . $externalRef], 200);
            }

            $order = $orders[0];
            $oldStatus = $order['status'] ?? 'pending_payment';
            $newStatus = ($mpStatus === 'approved') ? 'paid' : (($mpStatus === 'rejected' || $mpStatus === 'cancelled') ? 'rejected' : 'pending_payment');

            // Save transaction ID and status to order
            $updateData = [
                'status' => $newStatus,
                'payment_id' => (string) $dataId,
                'payment_status' => $mpStatus
            ];

            $updated = $supabase->update('orders', $order['id'], $updateData, true);
            $resOrder = array_merge($order, $updated[0] ?? []);

            // Log status change
            if ($oldStatus !== $newStatus) {
                try {
                    $supabase->insert('order_status_logs', [
                        'order_id' => $order['id'],
                        'old_status' => $oldStatus,
                        'new_status' => $newStatus,
                        'changed_by' => 'mercadopago_webhook',
                        'comment' => "Mercado Pago Webhook: status {$mpStatus}, amount $" . $paidAmount
                    ], true);
                } catch (\Throwable $e) {
                    Log::warning("Order log error: " . $e->getMessage());
                }

                // Send email to customer
                if (!empty($resOrder['customer_email'])) {
                    try {
                        \Illuminate\Support\Facades\Mail::to($resOrder['customer_email'])
                            ->send(new \App\Mail\OrderStatusUpdatedMail($resOrder, $newStatus));
                    } catch (\Throwable $mErr) {
                        Log::warning("Webhook email send error: " . $mErr->getMessage());
                    }
                }
            }

            return response()->json(['message' => 'Webhook processed successfully.']);

        } catch (\Throwable $e) {
            Log::error("Mercado Pago Webhook Exception: " . $e->getMessage());
            return response()->json(['message' => 'Webhook error processed.'], 200);
        }
    }
}
