<?php

namespace App\Http\Controllers;

use App\Services\SupabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ReviewController extends Controller
{
    /**
     * List all approved reviews for a product with rating average.
     *
     * @param string $productId
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function index(string $productId, SupabaseService $supabase): JsonResponse
    {
        try {
            $reviews = $supabase->get('reviews', [
                'select' => '*,profiles(full_name)',
                'product_id' => 'eq.' . $productId,
                'approved' => 'eq.true',
                'order' => 'created_at.desc',
            ]);

            $average = count($reviews) > 0 ? collect($reviews)->avg('rating') : 0.0;

            return response()->json([
                'reviews' => $reviews ?: [],
                'rating_average' => round($average, 1),
                'total_reviews' => count($reviews ?: []),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'reviews' => [],
                'rating_average' => 0.0,
                'total_reviews' => 0,
            ]);
        }
    }

    /**
     * Store a new review for a product.
     *
     * @param Request $request
     * @param string $productId
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function store(Request $request, string $productId, SupabaseService $supabase): JsonResponse
    {
        $userId = $request->attributes->get('user_id');

        $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['required', 'string', 'max:1000'],
        ]);

        // Verify product exists
        $product = $supabase->getOne('products', $productId);
        if (empty($product)) {
            return response()->json([
                'message' => 'El producto no existe.'
            ], 404);
        }

        try {
            // Note: Reviews are approved by default as per standard settings, 
            // but can be changed or set to pending if moderation is strict.
            // Let's set approved = true as specified in prompt: default true.
            $data = [
                'product_id' => $productId,
                'customer_id' => $userId,
                'rating' => $request->rating,
                'comment' => $request->comment,
                'approved' => true,
            ];

            $inserted = $supabase->insert('reviews', $data, true);

            return response()->json($inserted[0], 201);
        } catch (\Exception $e) {
            Log::error('Review creation failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al guardar la reseña.'
            ], 500);
        }
    }

    /**
     * Update a user's own review.
     *
     * @param Request $request
     * @param string $id
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function update(Request $request, string $id, SupabaseService $supabase): JsonResponse
    {
        $userId = $request->attributes->get('user_id');

        $review = $supabase->getOne('reviews', $id, true);

        if (empty($review)) {
            return response()->json([
                'message' => 'Reseña no encontrada.'
            ], 404);
        }

        // Security check
        if ($review['customer_id'] !== $userId) {
            return response()->json([
                'message' => 'Acceso denegado. Esta reseña pertenece a otro usuario.'
            ], 403);
        }

        $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['required', 'string', 'max:1000'],
        ]);

        $data = [
            'rating' => $request->rating,
            'comment' => $request->comment,
            // Keep approved state or reset it? The prompt says "moderación por admin sin borrar la reseña",
            // we can reset approved to true or keep it. Let's keep it.
        ];

        try {
            $updated = $supabase->update('reviews', $id, $data, true);
            return response()->json($updated[0]);
        } catch (\Exception $e) {
            Log::error('Review update failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al actualizar la reseña.'
            ], 500);
        }
    }

    /**
     * Delete a user's own review.
     *
     * @param Request $request
     * @param string $id
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function destroy(Request $request, string $id, SupabaseService $supabase): JsonResponse
    {
        $userId = $request->attributes->get('user_id');

        $review = $supabase->getOne('reviews', $id, true);

        if (empty($review)) {
            return response()->json([
                'message' => 'Reseña no encontrada.'
            ], 404);
        }

        // Security check
        if ($review['customer_id'] !== $userId) {
            return response()->json([
                'message' => 'Acceso denegado. Esta reseña pertenece a otro usuario.'
            ], 403);
        }

        try {
            $supabase->delete('reviews', $id, true);
            return response()->json([
                'message' => 'Reseña eliminada correctamente.'
            ]);
        } catch (\Exception $e) {
            Log::error('Review deletion failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al eliminar la reseña.'
            ], 500);
        }
    }
}
