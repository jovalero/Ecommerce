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

        // 1. Try cryptographic verification via JWT Secret (HS256)
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
                return response()->json([
                    'message' => 'Sesión expirada. Por favor vuelva a iniciar sesión.'
                ], 401);
            } catch (SignatureInvalidException $e) {
                Log::warning('Intento de acceso con firma JWT inválida detectado.');
                return response()->json([
                    'message' => 'Token de autenticación inválido (firma rechazada).'
                ], 401);
            } catch (\Throwable $e) {
                Log::info('JWT secret decode fallback to Supabase API: ' . $e->getMessage());
            }
        }

        // 2. Authoritative verification via Supabase Auth API
        if (!empty($supabaseUrl) && !empty($anonKey)) {
            try {
                $client = new \GuzzleHttp\Client(['timeout' => 5]);
                $authResponse = $client->get(rtrim($supabaseUrl, '/') . '/auth/v1/user', [
                    'headers' => [
                        'Authorization' => 'Bearer ' . $token,
                        'apikey' => $anonKey,
                        'Accept' => 'application/json',
                    ],
                    'http_errors' => false
                ]);

                if ($authResponse->getStatusCode() === 200) {
                    $userData = json_decode($authResponse->getBody()->getContents(), true);
                    if (is_array($userData) && !empty($userData['id'])) {
                        $request->attributes->set('user_id', $userData['id']);
                        $request->attributes->set('user_email', $userData['email'] ?? null);
                        $request->attributes->set('token_payload', $userData);
                        return $next($request);
                    }
                }
            } catch (\Throwable $ex) {
                Log::error('Supabase Auth API connection failure: ' . $ex->getMessage());
            }
        }

        // 3. Reject all unverified tokens strictly
        return response()->json([
            'message' => 'Token de autenticación no válido o revocado.'
        ], 401);
    }
}
