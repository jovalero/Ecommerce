<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ImportProductsRequest;
use App\Models\AdminLog;
use App\Services\ProductMetadataService;
use App\Services\SupabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProductCatalogController extends Controller
{
    /**
     * List products with server-side search, multi-filters, sorting and pagination.
     */
    public function index(Request $request, SupabaseService $supabase): JsonResponse
    {
        $search = trim($request->query('search', ''));
        $category = trim($request->query('categoria', ''));
        $stockFilter = trim($request->query('stock', ''));
        $sort = $request->query('sort', 'created_at');
        $order = strtolower($request->query('order', 'desc')) === 'asc' ? 'asc' : 'desc';
        $perPageParam = $request->query('per_page', '10');
        $page = max(1, (int) $request->query('page', 1));

        // 1. Fetch raw products from Supabase with categories relation
        $query = [
            'select' => '*,categories(id,name,slug)',
        ];

        // Apply category filter in PostgREST if given
        if (!empty($category) && $category !== 'all') {
            if (\Illuminate\Support\Str::isUuid($category)) {
                $query['category_id'] = 'eq.' . $category;
            } else {
                $query['select'] = '*,categories!inner(id,name,slug)';
                $query['categories.slug'] = 'eq.' . $category;
            }
        }

        $allProducts = $supabase->get('products', $query, true) ?: [];

        // 2. Attach extended metadata (variants, images, extra tags, cost, etc.)
        $enriched = ProductMetadataService::attachMany($allProducts);

        // 3. Server-side in-memory filtering for composite fields (search by name, brand, tags)
        if (!empty($search)) {
            $s = mb_strtolower($search);
            $enriched = array_filter($enriched, function ($p) use ($s) {
                $name = mb_strtolower($p['name'] ?? '');
                $brand = mb_strtolower($p['brand'] ?? '');
                $catName = mb_strtolower($p['categories']['name'] ?? '');
                $tags = is_array($p['tags'] ?? null) ? implode(' ', $p['tags']) : ($p['tags'] ?? '');
                $tags = mb_strtolower($tags);
                return str_contains($name, $s) || str_contains($brand, $s) || str_contains($catName, $s) || str_contains($tags, $s);
            });
        }

        // Stock status filter
        if (!empty($stockFilter) && $stockFilter !== 'all') {
            $enriched = array_filter($enriched, function ($p) use ($stockFilter) {
                $st = (int) ($p['stock'] ?? 0);
                if ($stockFilter === 'saludable') {
                    return $st > 5;
                }
                if ($stockFilter === 'critico') {
                    return $st >= 1 && $st <= 5;
                }
                if ($stockFilter === 'agotado') {
                    return $st <= 0;
                }
                return true;
            });
        }

        // 4. Sorting
        $enriched = array_values($enriched);
        usort($enriched, function ($a, $b) use ($sort, $order) {
            $valA = $a[$sort] ?? null;
            $valB = $b[$sort] ?? null;

            if ($sort === 'category') {
                $valA = $a['categories']['name'] ?? '';
                $valB = $b['categories']['name'] ?? '';
            }

            if (is_numeric($valA) && is_numeric($valB)) {
                $cmp = $valA <=> $valB;
            } else {
                $cmp = strcasecmp((string)$valA, (string)$valB);
            }

            return $order === 'asc' ? $cmp : -$cmp;
        });

        // 5. Pagination calculation
        $total = count($enriched);
        $perPage = ($perPageParam === 'all' || (int)$perPageParam <= 0) ? max(1, $total) : (int)$perPageParam;
        $lastPage = max(1, (int) ceil($total / $perPage));
        $currentPage = min($page, $lastPage);
        $offset = ($currentPage - 1) * $perPage;

        $items = array_slice($enriched, $offset, $perPage);
        $from = $total > 0 ? $offset + 1 : 0;
        $to = min($offset + $perPage, $total);

        return response()->json([
            'data' => $items,
            'current_page' => $currentPage,
            'per_page' => $perPage,
            'total' => $total,
            'last_page' => $lastPage,
            'from' => $from,
            'to' => $to,
            'filters' => [
                'search' => $search,
                'categoria' => $category,
                'stock' => $stockFilter,
                'sort' => $sort,
                'order' => $order,
            ]
        ]);
    }

    /**
     * Categories list for filter dropdowns.
     */
    public function categories(SupabaseService $supabase): JsonResponse
    {
        $categories = $supabase->get('categories', [
            'select' => 'id,name,slug',
            'order' => 'name.asc',
        ], true) ?: [];

        return response()->json($categories);
    }

    /**
     * Bulk price update (Percentage or Fixed amount).
     */
    public function bulkPrice(Request $request, SupabaseService $supabase): JsonResponse
    {
        $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'string'],
            'type' => ['required', 'string', 'in:percentage,fixed'],
            'value' => ['required', 'numeric'], // e.g. 10 for +10%, -15 for -15%, or 5000 fixed
        ]);

        $ids = $request->ids;
        $type = $request->type;
        $value = (float) $request->value;
        $user = $request->user()?->email ?? 'admin@holux.com';

        $updatedCount = 0;
        $details = [];

        foreach ($ids as $id) {
            $product = $supabase->getOne('products', $id, true);
            if (!$product) continue;

            $currentPrice = (float) ($product['price'] ?? 0);
            if ($type === 'percentage') {
                $newPrice = round($currentPrice * (1 + ($value / 100)));
            } else {
                $newPrice = round($currentPrice + $value);
            }
            $newPrice = max(0, $newPrice);

            try {
                $supabase->update('products', $id, ['price' => $newPrice], true);
                $updatedCount++;
                $details[] = [
                    'id' => $id,
                    'name' => $product['name'],
                    'old_price' => $currentPrice,
                    'new_price' => $newPrice
                ];
            } catch (\Throwable $e) {
                Log::error("Bulk price update failed for product {$id}: " . $e->getMessage());
            }
        }

        AdminLog::record($user, 'BULK_PRICE_UPDATE', 'products', [
            'type' => $type,
            'value' => $value,
            'products_count' => $updatedCount,
            'modified_items' => $details,
        ]);

        return response()->json([
            'message' => "Se actualizaron los precios de {$updatedCount} productos correctamente.",
            'updated_count' => $updatedCount,
            'items' => $details,
        ]);
    }

    /**
     * Bulk category assignment.
     */
    public function bulkCategory(Request $request, SupabaseService $supabase): JsonResponse
    {
        $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'string'],
            'category_id' => ['required', 'uuid'],
        ]);

        $ids = $request->ids;
        $categoryId = $request->category_id;
        $user = $request->user()?->email ?? 'admin@holux.com';

        $category = $supabase->getOne('categories', $categoryId, true);
        $categoryName = $category['name'] ?? 'Nueva Categoría';

        $updatedCount = 0;
        foreach ($ids as $id) {
            try {
                $supabase->update('products', $id, ['category_id' => $categoryId], true);
                $updatedCount++;
            } catch (\Throwable $e) {
                Log::error("Bulk category update failed for product {$id}: " . $e->getMessage());
            }
        }

        AdminLog::record($user, 'BULK_CATEGORY_UPDATE', 'products', [
            'category_id' => $categoryId,
            'category_name' => $categoryName,
            'products_count' => $updatedCount,
            'product_ids' => $ids,
        ]);

        return response()->json([
            'message' => "Se cambió la categoría de {$updatedCount} productos a '{$categoryName}'.",
            'updated_count' => $updatedCount,
        ]);
    }

    /**
     * Bulk product deletion.
     */
    public function bulkDelete(Request $request, SupabaseService $supabase): JsonResponse
    {
        $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'string'],
        ]);

        $ids = $request->ids;
        $user = $request->user()?->email ?? 'admin@holux.com';

        $deletedCount = 0;
        $skippedItems = [];

        foreach ($ids as $id) {
            $product = $supabase->getOne('products', $id, true);
            $name = $product['name'] ?? $id;

            try {
                $supabase->delete('products', $id, true);
                $deletedCount++;
            } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
                if ($e->getStatusCode() === 409) {
                    $skippedItems[] = [
                        'id' => $id,
                        'name' => $name,
                        'reason' => 'Tiene compras/pedidos asociados en el historial.'
                    ];
                }
            } catch (\Throwable $e) {
                $skippedItems[] = [
                    'id' => $id,
                    'name' => $name,
                    'reason' => $e->getMessage()
                ];
            }
        }

        AdminLog::record($user, 'BULK_DELETE', 'products', [
            'requested_count' => count($ids),
            'deleted_count' => $deletedCount,
            'skipped_count' => count($skippedItems),
            'skipped_items' => $skippedItems,
        ]);

        return response()->json([
            'message' => "Se eliminaron {$deletedCount} productos.",
            'deleted_count' => $deletedCount,
            'skipped_items' => $skippedItems,
        ]);
    }

    /**
     * Export complete catalog as CSV.
     */
    public function export(Request $request, SupabaseService $supabase): StreamedResponse
    {
        $products = $supabase->get('products', [
            'select' => '*,categories(name,slug)',
            'order' => 'name.asc',
        ], true) ?: [];

        $enriched = ProductMetadataService::attachMany($products);
        $fileName = 'catalogo_holux_' . date('Y-m-d_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($enriched) {
            $handle = fopen('php://output', 'w');
            // BOM UTF-8 for Excel compatibility
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            // CSV Header
            fputcsv($handle, [
                'ID',
                'Nombre',
                'Marca',
                'Categoria',
                'Precio',
                'Precio_Oferta',
                'Costo',
                'Stock',
                'Cuotas',
                'Imagen_URL',
                'Variantes_JSON'
            ], ';');

            foreach ($enriched as $p) {
                $variantsJson = !empty($p['variants']) ? json_encode($p['variants'], JSON_UNESCAPED_UNICODE) : '';
                fputcsv($handle, [
                    $p['id'] ?? '',
                    $p['name'] ?? '',
                    $p['brand'] ?? 'HOLUX',
                    $p['categories']['name'] ?? 'Trekking',
                    $p['price'] ?? 0,
                    $p['offer_price'] ?? 0,
                    $p['cost_price'] ?? 0,
                    $p['stock'] ?? 0,
                    $p['installments'] ?? 6,
                    $p['image_url'] ?? '',
                    $variantsJson
                ], ';');
            }

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Import/Upsert products from CSV with preview and validation.
     */
    public function import(ImportProductsRequest $request, SupabaseService $supabase): JsonResponse
    {
        $file = $request->file('file');
        $isPreview = filter_var($request->input('preview_only', false), FILTER_VALIDATE_BOOLEAN);
        $user = $request->user()?->email ?? 'admin@holux.com';

        $categories = $supabase->get('categories', ['select' => 'id,name,slug'], true) ?: [];
        $categoryMap = [];
        foreach ($categories as $c) {
            $categoryMap[mb_strtolower($c['name'])] = $c['id'];
            $categoryMap[mb_strtolower($c['slug'])] = $c['id'];
        }
        $defaultCategoryId = $categories[0]['id'] ?? null;

        $handle = fopen($file->getRealPath(), 'r');
        if (!$handle) {
            return response()->json(['message' => 'No se pudo leer el archivo CSV.'], 400);
        }

        // Auto-detect delimiter (, or ;)
        $firstLine = fgets($handle);
        $delimiter = strpos($firstLine, ';') !== false ? ';' : ',';
        rewind($handle);

        $header = fgetcsv($handle, 0, $delimiter);
        if (!$header) {
            fclose($handle);
            return response()->json(['message' => 'El archivo CSV está vacío.'], 400);
        }

        // Normalize header columns
        $headerMap = [];
        foreach ($header as $idx => $colName) {
            $colClean = mb_strtolower(trim(preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $colName)));
            $headerMap[$colClean] = $idx;
        }

        $rowNumber = 1;
        $createdRows = [];
        $updatedRows = [];
        $errorRows = [];

        while (($row = fgetcsv($handle, 0, $delimiter)) !== false) {
            $rowNumber++;
            if (empty(array_filter($row))) continue; // skip empty line

            $getVal = function ($keys, $default = null) use ($row, $headerMap) {
                foreach ((array) $keys as $k) {
                    if (isset($headerMap[$k]) && isset($row[$headerMap[$k]])) {
                        $val = trim($row[$headerMap[$k]]);
                        if ($val !== '') return $val;
                    }
                }
                return $default;
            };

            $id = $getVal(['id', 'uuid']);
            $name = $getVal(['nombre', 'name', 'producto']);
            $brand = $getVal(['marca', 'brand'], 'HOLUX');
            $categoryVal = $getVal(['categoria', 'category', 'category_id']);
            $price = $getVal(['precio', 'price']);
            $offerPrice = $getVal(['precio_oferta', 'offer_price', 'oferta'], 0);
            $costPrice = $getVal(['costo', 'cost_price', 'cost'], 0);
            $stock = $getVal(['stock', 'cantidad'], 10);
            $installments = $getVal(['cuotas', 'installments'], 6);
            $imageUrl = $getVal(['imagen_url', 'image_url', 'imagen']);
            $variantsRaw = $getVal(['variantes_json', 'variants_json', 'variantes', 'variants']);

            // Validation
            if (empty($name)) {
                $errorRows[] = ['row' => $rowNumber, 'error' => 'El campo Nombre es obligatorio.'];
                continue;
            }

            if (!is_numeric($price) || (float)$price < 0) {
                $errorRows[] = ['row' => $rowNumber, 'product' => $name, 'error' => 'El Precio debe ser un número mayor o igual a 0.'];
                continue;
            }

            if (!is_numeric($stock) || (int)$stock < 0) {
                $errorRows[] = ['row' => $rowNumber, 'product' => $name, 'error' => 'El Stock debe ser un número entero mayor o igual a 0.'];
                continue;
            }

            // Resolve Category ID
            $catId = $defaultCategoryId;
            if (!empty($categoryVal)) {
                if (\Illuminate\Support\Str::isUuid($categoryVal)) {
                    $catId = $categoryVal;
                } else {
                    $lookup = mb_strtolower($categoryVal);
                    if (isset($categoryMap[$lookup])) {
                        $catId = $categoryMap[$lookup];
                    }
                }
            }

            // Parse variants
            $variants = [];
            if (!empty($variantsRaw)) {
                $decoded = json_decode($variantsRaw, true);
                if (is_array($decoded)) {
                    $variants = $decoded;
                }
            }

            $itemData = [
                'id' => $id,
                'name' => $name,
                'brand' => $brand,
                'category_id' => $catId,
                'price' => (float) $price,
                'offer_price' => (float) $offerPrice,
                'cost_price' => (float) $costPrice,
                'stock' => (int) $stock,
                'installments' => (int) $installments,
                'icon' => 'Shield',
                'image_url' => $imageUrl,
                'variants' => $variants,
            ];

            if (!empty($id)) {
                $updatedRows[] = $itemData;
            } else {
                $createdRows[] = $itemData;
            }
        }
        fclose($handle);

        // If preview only, return validation summary
        if ($isPreview) {
            return response()->json([
                'preview' => true,
                'total_rows' => count($createdRows) + count($updatedRows) + count($errorRows),
                'to_create_count' => count($createdRows),
                'to_update_count' => count($updatedRows),
                'error_count' => count($errorRows),
                'errors' => $errorRows,
                'sample_created' => array_slice($createdRows, 0, 5),
                'sample_updated' => array_slice($updatedRows, 0, 5),
            ]);
        }

        // Execution Phase (Upsert)
        $savedCount = 0;

        // 1. Process Updates
        foreach ($updatedRows as $item) {
            $id = $item['id'];
            $dbData = [
                'name' => $item['name'],
                'brand' => $item['brand'],
                'category_id' => $item['category_id'],
                'price' => $item['price'],
                'stock' => $item['stock'],
                'installments' => $item['installments'],
            ];
            try {
                $supabase->update('products', $id, $dbData, true);
                ProductMetadataService::set($id, [
                    'image_url' => $item['image_url'],
                    'images' => $item['image_url'] ? [$item['image_url']] : [],
                    'variants' => $item['variants'],
                    'offer_price' => $item['offer_price'],
                    'cost_price' => $item['cost_price'],
                ]);
                $savedCount++;
            } catch (\Throwable $e) {
                Log::error("CSV import update error on {$id}: " . $e->getMessage());
            }
        }

        // 2. Process Creations
        foreach ($createdRows as $item) {
            $dbData = [
                'name' => $item['name'],
                'brand' => $item['brand'],
                'category_id' => $item['category_id'],
                'price' => $item['price'],
                'stock' => $item['stock'],
                'installments' => $item['installments'],
                'icon' => 'Shield',
            ];
            try {
                $inserted = $supabase->insert('products', $dbData, true);
                if (!empty($inserted[0]['id'])) {
                    $newId = $inserted[0]['id'];
                    ProductMetadataService::set($newId, [
                        'image_url' => $item['image_url'],
                        'images' => $item['image_url'] ? [$item['image_url']] : [],
                        'variants' => $item['variants'],
                        'offer_price' => $item['offer_price'],
                        'cost_price' => $item['cost_price'],
                    ]);
                    $savedCount++;
                }
            } catch (\Throwable $e) {
                Log::error("CSV import create error: " . $e->getMessage());
            }
        }

        AdminLog::record($user, 'CSV_IMPORT', 'products', [
            'created_count' => count($createdRows),
            'updated_count' => count($updatedRows),
            'total_saved' => $savedCount,
            'errors_count' => count($errorRows),
        ]);

        return response()->json([
            'message' => "Importación completada con éxito. Se procesaron {$savedCount} productos.",
            'created_count' => count($createdRows),
            'updated_count' => count($updatedRows),
            'saved_count' => $savedCount,
            'error_count' => count($errorRows),
            'errors' => $errorRows,
        ]);
    }
}
