<?php

namespace App\Http\Controllers;

use App\Models\AdminLog;
use App\Services\CouponService;
use App\Services\CustomerMetadataService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    /**
     * Get list of all coupons.
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->attributes->get('user_id') ?? $request->user()?->id;

        // If request is from customer /me/coupons endpoint
        if ($request->is('api/me/coupons') || $request->is('me/coupons')) {
            if ($userId) {
                $userCoupons = CustomerMetadataService::getCoupons($userId);
                return response()->json($userCoupons);
            }
            return response()->json([]);
        }

        // Otherwise (Admin / store-wide list)
        $globalCoupons = CouponService::all();
        return response()->json($globalCoupons);
    }

    /**
     * Store a newly created coupon (Admin).
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'min:2', 'max:50'],
            'type' => ['required', 'string', 'in:percentage,fixed,percent'],
            'value' => ['required', 'numeric', 'min:0.01'],
            'min_spend' => ['nullable', 'numeric', 'min:0'],
            'minPurchase' => ['nullable', 'numeric', 'min:0'],
            'allowed_tier' => ['nullable', 'string', 'in:all,vip,super_vip'],
            'origin' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'max_uses' => ['nullable', 'integer', 'min:1'],
            'maxUses' => ['nullable', 'integer', 'min:1'],
            'daysValid' => ['nullable', 'integer', 'min:1'],
            'expiry_timestamp' => ['nullable', 'numeric'],
        ]);

        $data = $request->all();
        if (isset($data['daysValid']) && !isset($data['expiry_timestamp'])) {
            $data['expiry_timestamp'] = time() + ((int)$data['daysValid'] * 86400);
        }

        try {
            $newCoupon = CouponService::create($data);
            $user = $request->user()?->email ?? 'admin@holux.com';

            AdminLog::record($user, 'COUPON_CREATED', 'coupons', [
                'coupon' => $newCoupon
            ]);

            return response()->json([
                'message' => "Cupón {$newCoupon['code']} creado exitosamente.",
                'coupon' => $newCoupon
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Error al crear cupón.'], 500);
        }
    }

    /**
     * Toggle coupon active state.
     */
    public function toggle(string $id, Request $request): JsonResponse
    {
        $updated = CouponService::toggleActive($id);
        if (!$updated) {
            return response()->json(['message' => 'Cupón no encontrado.'], 404);
        }
        return response()->json([
            'message' => 'Estado del cupón actualizado.',
            'coupon' => $updated
        ]);
    }

    /**
     * Delete a coupon.
     */
    public function destroy(string $id, Request $request): JsonResponse
    {
        $deleted = CouponService::delete($id);
        if (!$deleted) {
            return response()->json(['message' => 'Error al eliminar cupón.'], 500);
        }
        return response()->json(['message' => 'Cupón eliminado correctamente.']);
    }

    /**
     * Redeem a promo coupon by code.
     */
    public function redeem(Request $request): JsonResponse
    {
        $code = strtoupper(trim($request->input('code', '')));

        if (empty($code)) {
            return response()->json(['message' => 'Por favor ingresá un código de cupón.'], 422);
        }

        $coupon = CouponService::findByCode($code);
        if (!$coupon || empty($coupon['active'])) {
            return response()->json(['message' => 'El código de cupón ingresado no es válido o ya expiró.'], 404);
        }

        return response()->json([
            'message' => "¡Cupón {$code} listo para usar!",
            'coupon' => $coupon
        ]);
    }

    /**
     * Validate and apply coupon to cart subtotal considering user tier.
     */
    public function apply(Request $request): JsonResponse
    {
        $code = strtoupper(trim($request->input('code', '')));
        $subtotal = floatval($request->input('subtotal', 0));

        if (empty($code)) {
            return response()->json(['message' => 'Código de cupón requerido.'], 422);
        }

        // Detect user tier from request attribute or metadata
        $userId = $request->attributes->get('user_id');
        $userTier = 'standard';
        if ($userId) {
            $userTier = CustomerMetadataService::getTier($userId);
        }

        $result = CouponService::validateAndApply($code, $subtotal, $userTier);

        if (!$result['valid']) {
            $isTierError = str_contains($result['message'], 'EXCLUSIVO');
            return response()->json([
                'valid' => false,
                'message' => $result['message']
            ], $isTierError ? 403 : 400);
        }

        return response()->json($result);
    }
}
