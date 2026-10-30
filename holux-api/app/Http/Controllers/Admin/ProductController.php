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
                'variants', 'images', 'image_url', 'description', 'tags', 'specs', 'specifications',
                'category_ids', 'offer_price', 'cost_price', 'slug', 'meta_title', 'meta_description',
                'is_featured', 'is_new', 'video_url', 'currency', 'price_usd'
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
                'variants', 'images', 'image_url', 'description', 'tags', 'specs', 'specifications',
                'category_ids', 'offer_price', 'cost_price', 'slug', 'meta_title', 'meta_description',
                'is_featured', 'is_new', 'video_url', 'currency', 'price_usd'
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

    /**
     * Recalculate all USD-denominated products using new exchange rate.
     * Fixed ARS products are preserved untouched.
     *
     * @param Request $request
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function recalculateUsd(Request $request, SupabaseService $supabase): JsonResponse
    {
        $dolarRate = (float) ($request->input('dolar_rate') ?? \App\Services\StoreSettingService::getRaw()['dolar_rate'] ?? 1625.0);
        if ($dolarRate <= 0) {
            return response()->json(['message' => 'Cotización del dólar inválida.'], 422);
        }

        // Persist dollar rate to store settings
        $settings = \App\Services\StoreSettingService::getRaw();
        $settings['dolar_rate'] = $dolarRate;
        \App\Services\StoreSettingService::saveRaw($settings);

        $allMeta = \App\Services\ProductMetadataService::load();
        $updatedCount = 0;
        $updatedProducts = [];

        foreach ($allMeta as $productId => $meta) {
            $currency = $meta['currency'] ?? (!empty($meta['price_usd']) ? 'USD' : 'ARS');
            $priceUsd = isset($meta['price_usd']) ? (float)$meta['price_usd'] : 0;

            // Only update products marked as USD with valid USD price
            if ($currency === 'USD' && $priceUsd > 0) {
                $newPriceArs = (int) round($priceUsd * $dolarRate);
                try {
                    $supabase->update('products', $productId, ['price' => $newPriceArs], true);
                    $updatedCount++;
                    $updatedProducts[] = [
                        'id' => $productId,
                        'price_usd' => $priceUsd,
                        'new_price_ars' => $newPriceArs
                    ];
                } catch (\Throwable $e) {
                    Log::warning("Failed to recalculate price for product {$productId}: " . $e->getMessage());
                }
            }
        }

        return response()->json([
            'message' => "Se actualizaron exitosamente {$updatedCount} productos en dólares a la cotización de $" . number_format($dolarRate, 0, ',', '.') . " ARS.",
            'updated_count' => $updatedCount,
            'dolar_rate' => $dolarRate,
            'products' => $updatedProducts
        ]);
    }
}
