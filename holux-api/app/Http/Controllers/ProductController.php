<?php

namespace App\Http\Controllers;

use App\Services\ProductMetadataService;
use App\Services\SupabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * Display a listing of the products.
     *
     * @param Request $request
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function index(Request $request, SupabaseService $supabase): JsonResponse
    {
        $categorySlug = $request->query('category');
        
        if ($categorySlug) {
            // Filter by category slug using PostgREST inner join syntax
            $query = [
                'select' => '*,categories!inner(name,slug)',
                'categories.slug' => 'eq.' . $categorySlug,
            ];
        } else {
            // Fetch all products with their associated category info
            $query = [
                'select' => '*,categories(name,slug)',
            ];
        }

        $products = $supabase->get('products', $query) ?: [];
        $enriched = ProductMetadataService::attachMany($products);
        return response()->json($enriched);
    }

    /**
     * Display the specified product.
     *
     * @param string $id
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function show(string $id, SupabaseService $supabase): JsonResponse
    {
        $products = $supabase->get('products', [
            'select' => '*,categories(name,slug)',
            'id' => 'eq.' . $id,
        ]);

        if (empty($products)) {
            return response()->json([
                'message' => 'Producto no encontrado.'
            ], 404);
        }

        $enriched = ProductMetadataService::attach($products[0]);
        return response()->json($enriched);
    }
}
