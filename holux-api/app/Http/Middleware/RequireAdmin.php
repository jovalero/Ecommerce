<?php

namespace App\Http\Middleware;

use App\Services\SupabaseService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        $userId = $request->attributes->get('user_id');

        if (empty($userId)) {
            return response()->json([
                'message' => 'No autorizado. Se requiere iniciar sesión.'
            ], 401);
        }

        // Validate strictly UUID v4 format
        if (!preg_match('/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/', $userId)) {
            return response()->json([
                'message' => 'Identificador de usuario inválido.'
            ], 403);
        }

        $supabase = app(SupabaseService::class);

        // Fetch user profile (cached for 60 seconds for security responsiveness)
        $profile = \Illuminate\Support\Facades\Cache::remember("user_profile_{$userId}", 60, function () use ($supabase, $userId) {
            return $supabase->getOne('profiles', $userId, true);
        });

        if (empty($profile)) {
            return response()->json([
                'message' => 'Perfil de usuario no encontrado en el sistema.'
            ], 404);
        }

        if (isset($profile['active']) && $profile['active'] === false) {
            return response()->json([
                'message' => 'Tu cuenta ha sido suspendida por administración.'
            ], 403);
        }

        if (($profile['role'] ?? 'customer') !== 'admin') {
            return response()->json([
                'message' => 'Acceso denegado. Se requieren privilegios de administrador.'
            ], 403);
        }

        return $next($request);
    }
}
