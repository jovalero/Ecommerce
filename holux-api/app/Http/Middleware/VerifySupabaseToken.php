<?php

namespace App\Http\Middleware;

use Closure;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class VerifySupabaseToken
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
        $token = $request->bearerToken();

        if (empty($token)) {
            return response()->json([
                'message' => 'No autorizado. Token no provisto.'
            ], 401);
        }

        $jwtSecret = config('services.supabase.jwt_secret');

        if (empty($jwtSecret)) {
            Log::error('Supabase JWT Secret is missing in config/services.php');
            return response()->json([
                'message' => 'Error interno de autenticación de la plataforma.'
            ], 500);
        }

        try {
            // Decode the JWT from Supabase. Supabase uses HS256 algorithm.
            $decoded = JWT::decode($token, new Key($jwtSecret, 'HS256'));

            // Inject the user's Supabase UID (stored in the 'sub' claim) into request attributes
            $request->attributes->set('user_id', $decoded->sub);
            
            // Also store the full token payload just in case we need email or meta metadata
            $request->attributes->set('token_payload', (array) $decoded);

            return $next($request);
        } catch (ExpiredException $e) {
            return response()->json([
                'message' => 'La sesión ha expirado. Por favor inicia sesión nuevamente.'
            ], 401);
        } catch (SignatureInvalidException $e) {
            return response()->json([
                'message' => 'Firma del token no válida.'
            ], 401);
        } catch (\Exception $e) {
            Log::warning('Supabase JWT verification failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Token de autenticación no válido.'
            ], 401);
        }
    }
}
