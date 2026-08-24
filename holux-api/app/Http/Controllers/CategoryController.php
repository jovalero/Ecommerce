<?php

namespace App\Http\Controllers;

use App\Services\SupabaseService;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    /**
     * Display a listing of the categories.
     *
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function index(SupabaseService $supabase): JsonResponse
    {
        try {
            $categories = $supabase->get('categories') ?: [];
            return response()->json($categories);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error loading categories: ' . $e->getMessage());
            return response()->json([]);
        }
    }
}
