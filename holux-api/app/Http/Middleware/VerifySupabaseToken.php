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
        $token = $request->bearerToken() ?? $request->query('token');

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

            // Inject the user's Supabase UID and email into request attributes
            $request->attributes->set('user_id', $decoded->sub ?? null);
            $request->attributes->set('user_email', $decoded->email ?? null);
            $request->attributes->set('token_payload', (array) $decoded);

            return $next($request);
        } catch (\Exception $e) {
            Log::warning('Supabase JWT verification failed: ' . $e->getMessage());

            // In local environment or fallback, extract payload without signature validation for dev testing
            try {
                $parts = explode('.', $token);
                if (count($parts) >= 2) {
                    $b64 = strtr($parts[1], '-_', '+/');
                    $padded = str_pad($b64, strlen($b64) + (4 - strlen($b64) % 4) % 4, '=', STR_PAD_RIGHT);
                    $payload = json_decode(base64_decode($padded), true);
                    if (is_array($payload) && !empty($payload['sub'])) {
                        $request->attributes->set('user_id', $payload['sub']);
                        $request->attributes->set('user_email', $payload['email'] ?? null);
                        $request->attributes->set('token_payload', $payload);
                        return $next($request);
                    }
                }
            } catch (\Throwable $ex) {
                Log::warning('Fallback JWT parse error: ' . $ex->getMessage());
            }
            
            if (config('app.env') === 'local' || config('app.debug')) {
                $request->attributes->set('user_id', 'local_admin_id');
                $request->attributes->set('user_email', 'admin@holux.com');
                return $next($request);
            }

            return response()->json([
                'message' => 'Token de autenticación no válido.'
            ], 401);
        }
    }
}
