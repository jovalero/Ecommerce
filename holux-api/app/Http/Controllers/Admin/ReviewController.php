<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\SupabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ReviewController extends Controller
{
    /**
     * List all reviews in the system (both approved and pending).
     *
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function index(SupabaseService $supabase): JsonResponse
    {
        $reviews = $supabase->get('reviews', [
            'select' => '*,profiles(full_name),products(name,brand)',
            'order' => 'created_at.desc',
        ], true);

        return response()->json($reviews);
    }

    /**
     * Approve or reject a review.
     *
     * @param Request $request
     * @param string $id
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function update(Request $request, string $id, SupabaseService $supabase): JsonResponse
    {
        $request->validate([
            'approved' => ['required', 'boolean'],
        ]);

        $review = $supabase->getOne('reviews', $id, true);

        if (empty($review)) {
            return response()->json([
                'message' => 'Reseña no encontrada.'
            ], 404);
        }

        try {
            $updated = $supabase->update('reviews', $id, [
                'approved' => $request->boolean('approved'),
            ], true);

            return response()->json($updated[0]);
        } catch (\Exception $e) {
            Log::error("Failed to moderate review {$id}: " . $e->getMessage());
            return response()->json([
                'message' => 'Error al moderar la reseña.'
            ], 500);
        }
    }

    /**
     * Delete a review from the database.
     *
     * @param string $id
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function destroy(string $id, SupabaseService $supabase): JsonResponse
    {
        $review = $supabase->getOne('reviews', $id, true);

        if (empty($review)) {
            return response()->json([
                'message' => 'Reseña no encontrada.'
            ], 404);
        }

        try {
            $supabase->delete('reviews', $id, true);
            return response()->json([
                'message' => 'Reseña eliminada correctamente.'
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to delete review {$id} as admin: " . $e->getMessage());
            return response()->json([
                'message' => 'Error al eliminar la reseña.'
            ], 500);
        }
    }
}
