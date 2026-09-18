<?php

namespace App\Http\Controllers;

use App\Services\ProductMetadataService;
use App\Services\SupabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class FavoriteController extends Controller
{
    private static function getFilePath(): string
    {
        $path = storage_path('app');
        if (!File::exists($path)) {
            File::makeDirectory($path, 0755, true);
        }
        return storage_path('app/user_favorites.json');
    }

    private static function loadAll(): array
    {
        $file = self::getFilePath();

        // 1. Fetch from Supabase Storage CDN (Universal Persistent Source of Truth)
        try {
            $supabaseUrl = config('services.supabase.url', 'https://fmbhcfsrsfkglmvgbnlm.supabase.co');
            $client = new \GuzzleHttp\Client(['timeout' => 3.0]);
            $res = $client->get(rtrim($supabaseUrl, '/') . '/storage/v1/object/public/product-images/config/user_favorites.json?v=' . time());
            if ($res->getStatusCode() === 200) {
                $remote = json_decode($res->getBody()->getContents(), true);
                if (is_array($remote)) {
                    File::put($file, json_encode($remote, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                    return $remote;
                }
            }
        } catch (\Throwable $e) {
            // Fallback to local cache if offline
        }

        // 2. Fallback to local cache
        if (File::exists($file)) {
            try {
                $json = json_decode(File::get($file), true);
                return is_array($json) ? $json : [];
            } catch (\Throwable $e) {
                Log::error("Failed to read user_favorites.json: " . $e->getMessage());
                return [];
            }
        }

        return [];
    }

    private static function saveAll(array $data): void
    {
        $file = self::getFilePath();
        try {
            $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            File::put($file, $json);

            // Upload to Supabase Storage CDN
            try {
                $supabase = app(\App\Services\SupabaseService::class);
                $supabase->uploadStorageFile('product-images', 'config/user_favorites.json', $json, 'application/json');
            } catch (\Throwable $se) {
                Log::warning("Failed to sync user_favorites to Supabase Storage: " . $se->getMessage());
            }
        } catch (\Throwable $e) {
            Log::error("Failed to save user_favorites.json: " . $e->getMessage());
        }
    }

    private function getUserId(Request $request): ?string
    {
        return $request->attributes->get('user_id') ?: ($request->user() ? $request->user()->id : null);
    }

    /**
     * Get list of favorite product IDs for the logged-in user.
     */
    public function index(Request $request, SupabaseService $supabase): JsonResponse
    {
        $userId = $this->getUserId($request);
        if (!$userId) {
            return response()->json(['data' => [], 'product_ids' => []]);
        }

        $all = self::loadAll();
        $productIds = (array) ($all[$userId] ?? []);

        return response()->json([
            'success' => true,
            'product_ids' => array_values(array_unique($productIds)),
        ]);
    }

    /**
     * Toggle a product favorite state for the logged-in user.
     */
    public function toggle(Request $request): JsonResponse
    {
        $request->validate([
            'product_id' => ['required', 'string'],
        ]);

        $userId = $this->getUserId($request);
        if (!$userId) {
            return response()->json(['message' => 'Usuario no autenticado.'], 401);
        }

        $productId = $request->input('product_id');
        $all = self::loadAll();
        $userFavorites = (array) ($all[$userId] ?? []);

        $exists = in_array($productId, $userFavorites, true);
        if ($exists) {
            $userFavorites = array_values(array_filter($userFavorites, fn($id) => $id !== $productId));
            $isFavorite = false;
        } else {
            $userFavorites[] = $productId;
            $userFavorites = array_values(array_unique($userFavorites));
            $isFavorite = true;
        }

        $all[$userId] = $userFavorites;
        self::saveAll($all);

        return response()->json([
            'success' => true,
            'is_favorite' => $isFavorite,
            'product_ids' => $userFavorites,
            'message' => $isFavorite ? 'Producto añadido a favoritos.' : 'Producto eliminado de favoritos.',
        ]);
    }

    /**
     * Merge guest favorites from localStorage with account favorites upon login/register.
     */
    public function sync(Request $request): JsonResponse
    {
        $request->validate([
            'product_ids' => ['required', 'array'],
            'product_ids.*' => ['string'],
        ]);

        $userId = $this->getUserId($request);
        if (!$userId) {
            return response()->json(['message' => 'Usuario no autenticado.'], 401);
        }

        $incomingIds = (array) $request->input('product_ids', []);
        $all = self::loadAll();
        $currentFavorites = (array) ($all[$userId] ?? []);

        $merged = array_values(array_unique(array_merge($currentFavorites, $incomingIds)));
        $all[$userId] = $merged;
        self::saveAll($all);

        return response()->json([
            'success' => true,
            'product_ids' => $merged,
            'message' => 'Favoritos sincronizados correctamente.',
        ]);
    }
}