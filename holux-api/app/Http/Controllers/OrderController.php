<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrderRequest;
use App\Services\SupabaseService;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
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
            $customerId = null;
            $token = $request->bearerToken();
            if (!empty($token)) {
                try {
                    $jwtSecret = config('services.supabase.jwt_secret');
                    if ($jwtSecret) {
                        $decoded = JWT::decode($token, new Key($jwtSecret, 'HS256'));
                        $customerId = $decoded->sub;
                    }
                } catch (\Exception $e) {
                    Log::warning('Guest order token decode failed: ' . $e->getMessage());
                }
            }

            // 5b. Insert order (Requires service_key to bypass RLS write restrictions)
            $orderData = [
                'customer_id' => $customerId,
                'customer_name' => $request->customer_name,
                'customer_email' => $request->customer_email,
                'total' => $total,
                'status' => 'pending',
            ];

            $insertedOrders = $supabase->insert('orders', $orderData, true);

            if (empty($insertedOrders)) {
                throw new \Exception("No se recibió respuesta al insertar el pedido en Supabase.");
            }

            $order = $insertedOrders[0];
            $orderId = $order['id'];

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

        return response()->json($orders[0]);
    }
}
