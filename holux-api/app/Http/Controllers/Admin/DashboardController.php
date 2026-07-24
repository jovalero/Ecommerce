<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\SupabaseService;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * Get aggregate shop metrics for the Admin Dashboard.
     *
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function index(SupabaseService $supabase): JsonResponse
    {
        // 1. Fetch orders not cancelled to calculate sales
        $validOrders = $supabase->get('orders', [
            'status' => 'not.eq.cancelled',
        ], true);
        
        $totalRevenue = collect($validOrders)->sum('total');

        // 2. Count orders by status
        $allOrders = $supabase->get('orders', [], true);
        $orderCount = count($allOrders);

        $ordersByStatus = collect($allOrders)->groupBy('status')->map(function ($group) {
            return $group->count();
        })->toArray();

        // Ensure all possible statuses are present in the response
        $statuses = ['pending', 'processing', 'completed', 'cancelled'];
        foreach ($statuses as $status) {
            if (!isset($ordersByStatus[$status])) {
                $ordersByStatus[$status] = 0;
            }
        }

        // 3. Best selling products (Group order_items and sum quantities)
        $orderItems = $supabase->get('order_items', [
            'select' => 'product_id,quantity,unit_price,products(name,brand)',
        ], true);

        $bestSellers = collect($orderItems)->groupBy('product_id')->map(function ($items, $productId) {
            $firstItem = $items->first();
            $productName = $firstItem['products']['name'] ?? 'Producto Eliminado';
            $productBrand = $firstItem['products']['brand'] ?? 'HOLUX';

            return [
                'product_id' => $productId,
                'name' => $productName,
                'brand' => $productBrand,
                'quantity_sold' => $items->sum('quantity'),
                'total_revenue' => $items->sum(function ($item) {
                    return $item['quantity'] * $item['unit_price'];
                }),
            ];
        })->sortByDesc('quantity_sold')->values()->take(5)->toArray();

        // 4. General platform totals
        $products = $supabase->get('products', ['select' => 'id'], true);
        $categories = $supabase->get('categories', ['select' => 'id'], true);
        $customers = $supabase->get('profiles', ['role' => 'eq.customer'], true);

        return response()->json([
            'metrics' => [
                'total_revenue' => round($totalRevenue, 2),
                'total_orders' => $orderCount,
                'total_products' => count($products),
                'total_categories' => count($categories),
                'total_customers' => count($customers),
            ],
            'orders_by_status' => $ordersByStatus,
            'best_sellers' => $bestSellers,
        ]);
    }
}
