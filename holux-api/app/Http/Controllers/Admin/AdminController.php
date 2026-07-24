<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\SupabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AdminController extends Controller
{
    /**
     * Promote an existing user to the admin role.
     *
     * @param Request $request
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function store(Request $request, SupabaseService $supabase): JsonResponse
    {
        $request->validate([
            'user_id' => ['required', 'uuid'],
        ]);

        $userId = $request->user_id;

        $profile = $supabase->getOne('profiles', $userId, true);

        if (empty($profile)) {
            return response()->json([
                'message' => 'El usuario especificado no existe.'
            ], 404);
        }

        if ($profile['role'] === 'admin') {
            return response()->json([
                'message' => 'El usuario ya cuenta con el rol de administrador.'
            ], 422);
        }

        try {
            $updated = $supabase->update('profiles', $userId, [
                'role' => 'admin',
            ], true);

            return response()->json([
                'message' => 'Usuario promovido a administrador exitosamente.',
                'profile' => $updated[0],
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to promote user {$userId} to admin: " . $e->getMessage());
            return response()->json([
                'message' => 'Error al promover al usuario a administrador.'
            ], 500);
        }
    }
}
