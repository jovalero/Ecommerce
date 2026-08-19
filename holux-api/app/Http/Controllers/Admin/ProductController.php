<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\SupabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ProductController extends Controller
{
    /**
     * List all products (Admin View).
     *
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function index(SupabaseService $supabase): JsonResponse
    {
        $products = $supabase->get('products', [
            'select' => '*,categories(name,slug)',
            'order' => 'created_at.desc',
        ], true) ?: [];

        $enriched = \App\Services\ProductMetadataService::attachMany($products);
        return response()->json($enriched);
    }

    /**
     * Create a new product.
     *
     * @param Request $request
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function store(Request $request, SupabaseService $supabase): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'brand' => ['required', 'string', 'max:100'],
            'category_id' => ['required', 'uuid'],
            'price' => ['required', 'numeric', 'min:0'],
            'installments' => ['required', 'integer', 'min:1'],
            'icon' => ['nullable', 'string', 'max:50'],
            'stock' => ['required', 'integer', 'min:0'],
        ]);

        $data = [
            'name' => $request->name,
            'brand' => $request->brand,
            'category_id' => $request->category_id,
            'price' => $request->price,
            'installments' => $request->installments,
            'icon' => $request->icon ?: 'Shield',
            'stock' => $request->stock,
        ];

        try {
            $inserted = $supabase->insert('products', $data, true);
            $newProduct = $inserted[0];

            // Persist extended metadata (variants, images, description, etc.)
            $metadata = $request->only([
                'variants', 'images', 'image_url', 'description', 'tags',
                'offer_price', 'cost_price', 'slug', 'meta_title', 'meta_description',
                'is_featured', 'is_new', 'video_url'
            ]);
            if (!empty($metadata)) {
                \App\Services\ProductMetadataService::set($newProduct['id'], $metadata);
                $newProduct = \App\Services\ProductMetadataService::attach($newProduct);
            }

            return response()->json($newProduct, 201);
        } catch (\Exception $e) {
            Log::error('Admin Product store failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al crear el producto.'
            ], 500);
        }
    }

    /**
     * Update an existing product.
     *
     * @param Request $request
     * @param string $id
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function update(Request $request, string $id, SupabaseService $supabase): JsonResponse
    {
        $product = $supabase->getOne('products', $id, true);

        if (empty($product)) {
            return response()->json([
                'message' => 'Producto no encontrado.'
            ], 404);
        }

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'brand' => ['required', 'string', 'max:100'],
            'category_id' => ['required', 'uuid'],
            'price' => ['required', 'numeric', 'min:0'],
            'installments' => ['nullable', 'integer', 'min:0'],
            'icon' => ['nullable', 'string', 'max:50'],
            'stock' => ['required', 'integer', 'min:0'],
        ]);

        $data = [
            'name' => $request->name,
            'brand' => $request->brand,
            'category_id' => $request->category_id,
            'price' => $request->price,
            'installments' => max(1, (int) ($request->installments ?? 1)),
            'icon' => $request->icon ?: ($product['icon'] ?? 'Shield'),
            'stock' => $request->stock,
        ];

        try {
            $updated = $supabase->update('products', $id, $data, true);
            $updatedProduct = $updated[0];

            // Persist extended metadata (variants, images, description, etc.)
            $metadata = $request->only([
                'variants', 'images', 'image_url', 'description', 'tags',
                'offer_price', 'cost_price', 'slug', 'meta_title', 'meta_description',
                'is_featured', 'is_new', 'video_url'
            ]);
            if (!empty($metadata)) {
                \App\Services\ProductMetadataService::set($id, $metadata);
                $updatedProduct = \App\Services\ProductMetadataService::attach($updatedProduct);
            }

            return response()->json($updatedProduct);
        } catch (\Exception $e) {
            Log::error("Admin Product update failed for {$id}: " . $e->getMessage());
            return response()->json([
                'message' => 'Error al actualizar el producto.'
            ], 500);
        }
    }

    /**
     * Delete a product.
     *
     * @param string $id
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function destroy(string $id, SupabaseService $supabase): JsonResponse
    {
        $product = $supabase->getOne('products', $id, true);

        if (empty($product)) {
            return response()->json([
                'message' => 'Producto no encontrado.'
            ], 404);
        }

        try {
            // PostgREST RESTRICT delete rule prevents deletion if order_items exist.
            // Catching any foreign key constraint exception gracefully:
            $supabase->delete('products', $id, true);
            return response()->json([
                'message' => 'Producto eliminado correctamente.'
            ]);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            if ($e->getStatusCode() === 409) {
                return response()->json([
                    'message' => 'No se puede eliminar el producto porque tiene compras/pedidos asociados.'
                ], 409);
            }
            throw $e;
        } catch (\Exception $e) {
            Log::error("Admin Product delete failed for {$id}: " . $e->getMessage());
            return response()->json([
                'message' => 'Error al eliminar el producto.'
            ], 500);
        }
    }
}
