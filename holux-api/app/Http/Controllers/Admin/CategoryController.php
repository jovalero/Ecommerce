<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\SupabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CategoryController extends Controller
{
    /**
     * List all categories (Admin View).
     *
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function index(SupabaseService $supabase): JsonResponse
    {
        $categories = $supabase->get('categories', [
            'order' => 'name.asc',
        ], true);

        return response()->json($categories);
    }

    /**
     * Create a new category.
     *
     * @param Request $request
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function store(Request $request, SupabaseService $supabase): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255'],
        ]);

        $data = [
            'name' => $request->name,
            'slug' => \Illuminate\Support\Str::slug($request->slug),
        ];

        try {
            // Check for uniqueness of slug
            $existing = $supabase->get('categories', ['slug' => 'eq.' . $data['slug']], true);
            if (!empty($existing)) {
                return response()->json([
                    'message' => 'El slug de la categoría ya está en uso.'
                ], 422);
            }

            $inserted = $supabase->insert('categories', $data, true);
            return response()->json($inserted[0], 201);
        } catch (\Exception $e) {
            Log::error('Admin Category store failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al crear la categoría.'
            ], 500);
        }
    }

    /**
     * Update a category.
     *
     * @param Request $request
     * @param string $id
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function update(Request $request, string $id, SupabaseService $supabase): JsonResponse
    {
        $category = $supabase->getOne('categories', $id, true);

        if (empty($category)) {
            return response()->json([
                'message' => 'Categoría no encontrada.'
            ], 404);
        }

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255'],
        ]);

        $data = [
            'name' => $request->name,
            'slug' => \Illuminate\Support\Str::slug($request->slug),
        ];

        try {
            // Check for uniqueness of slug (excluding itself)
            $existing = $supabase->get('categories', ['slug' => 'eq.' . $data['slug']], true);
            if (!empty($existing) && $existing[0]['id'] !== $id) {
                return response()->json([
                    'message' => 'El slug de la categoría ya está en uso.'
                ], 422);
            }

            $updated = $supabase->update('categories', $id, $data, true);
            return response()->json($updated[0]);
        } catch (\Exception $e) {
            Log::error("Admin Category update failed for {$id}: " . $e->getMessage());
            return response()->json([
                'message' => 'Error al actualizar la categoría.'
            ], 500);
        }
    }

    /**
     * Delete a category.
     *
     * @param string $id
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function destroy(string $id, SupabaseService $supabase): JsonResponse
    {
        $category = $supabase->getOne('categories', $id, true);

        if (empty($category)) {
            return response()->json([
                'message' => 'Categoría no encontrada.'
            ], 404);
        }

        try {
            $supabase->delete('categories', $id, true);
            return response()->json([
                'message' => 'Categoría eliminada correctamente.'
            ]);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            if ($e->getStatusCode() === 409) {
                return response()->json([
                    'message' => 'No se puede eliminar la categoría porque tiene productos asociados.'
                ], 409);
            }
            throw $e;
        } catch (\Exception $e) {
            Log::error("Admin Category delete failed for {$id}: " . $e->getMessage());
            return response()->json([
                'message' => 'Error al eliminar la categoría.'
            ], 500);
        }
    }
}
