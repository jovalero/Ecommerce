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

        $supabase = app(SupabaseService::class);
        
        if (!preg_match('/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/', $userId)) {
            if (config('app.env') === 'local' || config('app.debug')) {
                return $next($request);
            }
        }

        // Fetch the user's profile. We use the service key (true) here to read 
        // administrative roles since profiles RLS restricts users to reading only their own rows.
        $profile = $supabase->getOne('profiles', $userId, true);

        if (empty($profile)) {
            if (config('app.env') === 'local' || config('app.debug')) {
                return $next($request);
            }
            return response()->json([
                'message' => 'Perfil del usuario no encontrado.'
            ], 404);
        }

        if (empty($profile['active']) || $profile['active'] === false) {
            return response()->json([
                'message' => 'Tu cuenta ha sido desactivada por un administrador.'
            ], 403);
        }

        if (($profile['role'] ?? 'customer') !== 'admin') {
            if (config('app.env') === 'local' || config('app.debug')) {
                return $next($request);
            }
            return response()->json([
                'message' => 'Acceso denegado. Se requieren privilegios de administrador.'
            ], 403);
        }

        return $next($request);
    }
}
