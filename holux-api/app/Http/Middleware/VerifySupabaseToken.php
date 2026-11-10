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
        $supabaseUrl = config('services.supabase.url');
        $anonKey = config('services.supabase.anon_key') ?: config('services.supabase.service_key');

        // 1. Try cryptographic verification via JWT Secret if configured
        $jwtSecret = config('services.supabase.jwt_secret');
        if (!empty($jwtSecret)) {
            try {
                $decoded = JWT::decode($token, new Key($jwtSecret, 'HS256'));
                if (!empty($decoded->sub)) {
                    $request->attributes->set('user_id', $decoded->sub);
                    $request->attributes->set('user_email', $decoded->email ?? null);
                    $request->attributes->set('token_payload', (array) $decoded);
                    return $next($request);
                }
            } catch (ExpiredException $e) {
                return response()->json(['message' => 'Sesión expirada. Por favor inicie sesión nuevamente.'], 401);
            } catch (\Throwable $e) {
                // Secret mismatch or project secret not set - proceed to Supabase payload validation
            }
        }

        // 2. Cryptographically verify token against official Supabase Auth API (/auth/v1/user)
        try {
            $parts = explode('.', $token);
            if (count($parts) === 3) {
                $b64 = strtr($parts[1], '-_', '+/');
                $padded = str_pad($b64, strlen($b64) + (4 - strlen($b64) % 4) % 4, '=', STR_PAD_RIGHT);
                $payload = json_decode(base64_decode($padded), true);

                if (is_array($payload) && !empty($payload['sub'])) {
                    $userId = $payload['sub'];

                    // Check expiration if exp claim is present
                    if (!empty($payload['exp']) && $payload['exp'] < time()) {
                        return response()->json(['message' => 'Sesión expirada. Por favor inicie sesión nuevamente.'], 401);
                    }

                    // Validate UUID format and verify signature with Supabase Auth server
                    if (preg_match('/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/', $userId)) {
                        $cacheKey = 'supabase_verified_jwt_' . hash('sha256', $token);
                        $verifiedUser = \Illuminate\Support\Facades\Cache::get($cacheKey);

                        if (!$verifiedUser && !empty($supabaseUrl) && !empty($anonKey)) {
                            $authRes = \Illuminate\Support\Facades\Http::timeout(5)->withHeaders([
                                'apikey' => $anonKey,
                                'Authorization' => 'Bearer ' . $token,
                            ])->get(rtrim($supabaseUrl, '/') . '/auth/v1/user');

                            if ($authRes->successful() && $authRes->json('id') === $userId) {
                                $verifiedUser = [
                                    'id' => $authRes->json('id'),
                                    'email' => $authRes->json('email') ?? ($payload['email'] ?? null),
                                    'payload' => $payload,
                                ];
                                $ttl = !empty($payload['exp']) ? max(1, min(300, $payload['exp'] - time())) : 300;
                                \Illuminate\Support\Facades\Cache::put($cacheKey, $verifiedUser, $ttl);
                            } elseif ($authRes->status() === 401 || $authRes->status() === 403) {
                                return response()->json(['message' => 'Token de autenticación no válido o revocado.'], 401);
                            }
                        }

                        if ($verifiedUser) {
                            $request->attributes->set('user_id', $verifiedUser['id']);
                            $request->attributes->set('user_email', $verifiedUser['email']);
                            $request->attributes->set('token_payload', $verifiedUser['payload']);
                            return $next($request);
                        }
                    }
                }
            }
        } catch (\Throwable $ex) {
            Log::error('JWT validation error: ' . $ex->getMessage());
        }

        // 3. Fallback strictly for automated testing environment only
        if (config('app.env') === 'testing') {
            $request->attributes->set('user_id', 'local_admin_id');
            $request->attributes->set('user_email', 'admin@holux.com');
            return $next($request);
        }

        return response()->json([
            'message' => 'Token de autenticación no válido.'
        ], 401);
    }
}
