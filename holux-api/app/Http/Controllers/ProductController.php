<?php

namespace App\Http\Controllers;

use App\Services\ProductMetadataService;
use App\Services\SupabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * Display a listing of products with server-side filtering, sorting, and pagination.
     *
     * @param Request $request
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function index(Request $request, SupabaseService $supabase): JsonResponse
    {
        // 1. Fetch all products with their associated categories
        $rawProducts = $supabase->get('products', [
            'select' => '*,categories(id,name,slug)',
        ]) ?: [];

        $allProducts = ProductMetadataService::attachMany($rawProducts);

        // 2. Extract global metadata metrics (price range, unique available sizes)
        $globalMinPrice = null;
        $globalMaxPrice = null;
        $allSizesSet = [];

        foreach ($allProducts as $p) {
            $effectivePrice = (float) (!empty($p['offer_price']) && $p['offer_price'] > 0 ? $p['offer_price'] : $p['price']);
            if ($globalMinPrice === null || $effectivePrice < $globalMinPrice) {
                $globalMinPrice = $effectivePrice;
            }
            if ($globalMaxPrice === null || $effectivePrice > $globalMaxPrice) {
                $globalMaxPrice = $effectivePrice;
            }

            if (!empty($p['variants']) && is_array($p['variants'])) {
                foreach ($p['variants'] as $v) {
                    $label = trim((string) ($v['label'] ?? $v['name'] ?? ''));
                    if ($label !== '') {
                        $allSizesSet[$label] = true;
                    }
                }
            }
        }

        // 3. Parse query filters
        $categoryParam = $request->query('category');
        $categoriesParam = $request->query('categories');
        $collectionsParam = $request->query('collections') ?: $request->query('collection') ?: $request->query('gender') ?: $request->query('genders');
        $sizesParam = $request->query('sizes') ?: $request->query('size');
        $minPrice = $request->has('min_price') && is_numeric($request->query('min_price')) ? (float) $request->query('min_price') : null;
        $maxPrice = $request->has('max_price') && is_numeric($request->query('max_price')) ? (float) $request->query('max_price') : null;
        $inStockOnly = $request->boolean('in_stock') || $request->query('in_stock') === '1';
        $searchQuery = trim((string) ($request->query('search') ?: $request->query('q') ?: ''));
        $sortBy = $request->query('sort_by') ?: $request->query('sort') ?: 'relevant';

        // Parse multiple categories
        $categorySlugs = [];
        if (!empty($categoriesParam)) {
            $categorySlugs = is_array($categoriesParam) ? $categoriesParam : explode(',', $categoriesParam);
        } elseif (!empty($categoryParam)) {
            $categorySlugs = [$categoryParam];
        }
        $categorySlugs = array_filter(array_map('trim', array_map('strtolower', $categorySlugs)));

        // Parse collections
        $collections = [];
        if (!empty($collectionsParam)) {
            $collections = is_array($collectionsParam) ? $collectionsParam : explode(',', $collectionsParam);
        }
        $collections = array_filter(array_map('trim', array_map('strtolower', $collections)));

        // Parse sizes
        $selectedSizes = [];
        if (!empty($sizesParam)) {
            $selectedSizes = is_array($sizesParam) ? $sizesParam : explode(',', $sizesParam);
        }
        // Parse brands
        $brandsParam = $request->query('brands') ?: $request->query('brand');
        $selectedBrands = [];
        if (!empty($brandsParam)) {
            $selectedBrands = is_array($brandsParam) ? $brandsParam : explode(',', $brandsParam);
        }
        $selectedBrands = array_filter(array_map('trim', array_map('strtolower', $selectedBrands)));

        // 4. Combined Filtering (AND)
        $filtered = array_filter($allProducts, function ($p) use (
            $categorySlugs,
            $collections,
            $selectedBrands,
            $selectedSizes,
            $minPrice,
            $maxPrice,
            $inStockOnly,
            $searchQuery
        ) {
            $pCatSlug = strtolower((string) ($p['categories']['slug'] ?? ''));
            $pName = (string) ($p['name'] ?? '');
            $pNameLower = strtolower($pName);
            $pBrand = strtolower((string) ($p['brand'] ?? ''));
            $pStock = (int) ($p['stock'] ?? 0);
            $pPrice = (float) ($p['price'] ?? 0);
            $pEffectivePrice = (float) (!empty($p['offer_price']) && $p['offer_price'] > 0 ? $p['offer_price'] : $pPrice);
            $pTags = array_map('strtolower', (array) ($p['tags'] ?? []));

            // A) Category filter
            if (!empty($categorySlugs)) {
                $isUnisex = str_contains($pNameLower, 'unissex') || str_contains($pNameLower, 'unisex');
                $matchedCat = in_array($pCatSlug, $categorySlugs, true) || in_array(strtolower((string)($p['category_id'] ?? '')), $categorySlugs, true);
                
                if (!$matchedCat && !empty($p['category_ids']) && is_array($p['category_ids'])) {
                    foreach ($p['category_ids'] as $cid) {
                        if (in_array(strtolower((string)$cid), $categorySlugs, true)) {
                            $matchedCat = true;
                            break;
                        }
                    }
                }

                if (!$matchedCat && $isUnisex && (in_array('perfumes-hombre', $categorySlugs, true) || in_array('perfumes-mujer', $categorySlugs, true))) {
                    $matchedCat = true;
                }
                if (!$matchedCat) {
                    return false;
                }
            }

            // B) Collections filter (mujer, hombre, outlet)
            if (!empty($collections)) {
                $isUnisex = str_contains($pNameLower, 'unissex') || str_contains($pNameLower, 'unisex');
                $collectionMatch = false;
                foreach ($collections as $col) {
                    if ($col === 'outlet') {
                        if ((!empty($p['offer_price']) && $p['offer_price'] < $pPrice) || in_array('outlet', $pTags, true)) {
                            $collectionMatch = true;
                            break;
                        }
                    } elseif ($col === 'mujer') {
                        if (
                            $pCatSlug === 'perfumes-mujer' ||
                            $isUnisex ||
                            in_array('mujer', $pTags, true) ||
                            in_array('femenino', $pTags, true) ||
                            str_contains($pNameLower, 'feminino') ||
                            str_contains($pNameLower, 'pour femme') ||
                            str_contains($pNameLower, 'for her')
                        ) {
                            $collectionMatch = true;
                            break;
                        }
                    } elseif ($col === 'hombre') {
                        if (
                            $pCatSlug === 'perfumes-hombre' ||
                            $isUnisex ||
                            in_array('hombre', $pTags, true) ||
                            in_array('masculino', $pTags, true) ||
                            str_contains($pNameLower, 'masculino') ||
                            str_contains($pNameLower, 'pour homme') ||
                            str_contains($pNameLower, 'for men')
                        ) {
                            $collectionMatch = true;
                            break;
                        }
                    }
                }
                if (!$collectionMatch) {
                    return false;
                }
            }

            // B.2) Brands filter
            if (!empty($selectedBrands)) {
                $brandMatched = false;
                foreach ($selectedBrands as $b) {
                    if (str_contains($pBrand, $b) || str_contains($pNameLower, $b)) {
                        $brandMatched = true;
                        break;
                    }
                }
                if (!$brandMatched) {
                    return false;
                }
            }

            // C) Sizes filter (chips)
            if (!empty($selectedSizes)) {
                $hasMatchingSize = false;
                $variants = (array) ($p['variants'] ?? []);
                if (!empty($variants)) {
                    foreach ($variants as $v) {
                        $vLabel = strtoupper(trim((string) ($v['label'] ?? $v['name'] ?? '')));
                        $vStock = (int) ($v['stock'] ?? 0);
                        if (in_array($vLabel, $selectedSizes, true) && (!$inStockOnly || $vStock > 0)) {
                            $hasMatchingSize = true;
                            break;
                        }
                    }
                }
                if (!$hasMatchingSize) {
                    return false;
                }
            }

            // D) Price Range filter
            if ($minPrice !== null && $pEffectivePrice < $minPrice) {
                return false;
            }
            if ($maxPrice !== null && $pEffectivePrice > $maxPrice) {
                return false;
            }

            // E) In Stock Availability filter
            if ($inStockOnly && $pStock <= 0) {
                return false;
            }

            // F) Search query
            if ($searchQuery !== '') {
                $q = strtolower($searchQuery);
                $match = str_contains($pNameLower, $q) ||
                    str_contains($pBrand, $q) ||
                    str_contains($pCatSlug, $q) ||
                    str_contains(strtolower((string) ($p['categories']['name'] ?? '')), $q) ||
                    str_contains(strtolower((string) ($p['description'] ?? '')), $q);

                if (!$match) {
                    foreach ($pTags as $t) {
                        if (str_contains($t, $q)) {
                            $match = true;
                            break;
                        }
                    }
                }

                if (!$match) {
                    return false;
                }
            }

            return true;
        });

        // 5. Server-Side Sorting
        $filtered = array_values($filtered);
        usort($filtered, function ($a, $b) use ($sortBy) {
            $priceA = (float) (!empty($a['offer_price']) && $a['offer_price'] > 0 ? $a['offer_price'] : $a['price']);
            $priceB = (float) (!empty($b['offer_price']) && $b['offer_price'] > 0 ? $b['offer_price'] : $b['price']);

            if ($sortBy === 'price_asc' || $sortBy === 'price-asc') {
                return $priceA <=> $priceB;
            }
            if ($sortBy === 'price_desc' || $sortBy === 'price-desc') {
                return $priceB <=> $priceA;
            }
            if ($sortBy === 'newest') {
                return strcmp($b['created_at'] ?? '', $a['created_at'] ?? '');
            }
            return 0; // 'relevant' maintains default order
        });

        // 6. Pagination
        $total = count($filtered);
        $perPage = max(1, min(100, (int) ($request->query('per_page', 12))));
        $page = max(1, (int) ($request->query('page', 1)));
        $lastPage = max(1, (int) ceil($total / $perPage));

        $offset = ($page - 1) * $perPage;
        $paginatedData = array_slice($filtered, $offset, $perPage);

        // Natural sort available sizes: letters first (XS, S, M, L, XL, XXL) then numeric
        $sizeOrderMap = ['XS' => 1, 'S' => 2, 'M' => 3, 'L' => 4, 'XL' => 5, 'XXL' => 6];
        $allSizes = array_keys($allSizesSet);
        usort($allSizes, function ($a, $b) use ($sizeOrderMap) {
            $orderA = $sizeOrderMap[$a] ?? (is_numeric($a) ? 100 + (float) $a : 50);
            $orderB = $sizeOrderMap[$b] ?? (is_numeric($b) ? 100 + (float) $b : 50);
            return $orderA <=> $orderB;
        });

        return response()->json([
            'data' => $paginatedData,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'last_page' => $lastPage,
            'from' => $total > 0 ? $offset + 1 : 0,
            'to' => min($offset + $perPage, $total),
            'price_range' => [
                'min' => (int) ($globalMinPrice ?? 0),
                'max' => (int) ($globalMaxPrice ?? 150000),
            ],
            'available_sizes' => $allSizes,
            'available_collections' => ['mujer', 'hombre', 'niños', 'outlet'],
        ]);
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
            'select' => '*,categories(id,name,slug)',
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
