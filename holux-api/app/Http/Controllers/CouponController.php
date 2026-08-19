<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CouponController extends Controller
{
    /**
     * Get predefined coupons list for the authenticated user
     */
    public function index(Request $request)
    {
        $now = time();
        $sevenDaysFromNow = $now + (7 * 24 * 60 * 60);

        // Predefined promo catalog of coupons
        $allCoupons = [
            [
                'id' => 'coup-101',
                'code' => 'HOLUXBIENVENIDA',
                'type' => 'percentage',
                'value' => 20,
                'min_spend' => 30000,
                'origin' => 'Bienvenida 🚀',
                'origin_type' => 'bienvenida',
                'description' => 'Válido en compras mayores a $30.000. No acumulable.',
                'expiry_timestamp' => $sevenDaysFromNow + (10 * 86400),
                'status' => 'disponible',
                'used_date' => null,
                'used_order_id' => null,
            ],
            [
                'id' => 'coup-102',
                'code' => 'CUMPLE2026',
                'type' => 'fixed',
                'value' => 5000,
                'min_spend' => 25000,
                'origin' => 'Por tu cumpleaños 🎂',
                'origin_type' => 'cumpleanos',
                'description' => 'Descuento directo de $5.000 en equipamiento de montaña.',
                'expiry_timestamp' => $now + (3 * 86400), // 3 days (orange warning)
                'status' => 'disponible',
                'used_date' => null,
                'used_order_id' => null,
            ],
            [
                'id' => 'coup-103',
                'code' => 'FRECUENTE5K',
                'type' => 'fixed',
                'value' => 5000,
                'min_spend' => 40000,
                'origin' => 'Cliente Frecuente ⭐',
                'origin_type' => 'frecuente',
                'description' => 'Válido en compras mayores a $40.000 en toda la tienda.',
                'expiry_timestamp' => $sevenDaysFromNow + (15 * 86400),
                'status' => 'disponible',
                'used_date' => null,
                'used_order_id' => null,
            ],
            [
                'id' => 'coup-104',
                'code' => 'OUTDOOR15',
                'type' => 'percentage',
                'value' => 15,
                'min_spend' => 20000,
                'origin' => 'Newsletter 📧',
                'origin_type' => 'newsletter',
                'description' => '15% de descuento adicional en calzado y ropa técnica.',
                'expiry_timestamp' => $now - (2 * 86400), // Expired 2 days ago
                'status' => 'vencido',
                'used_date' => null,
                'used_order_id' => null,
            ],
            [
                'id' => 'coup-105',
                'code' => 'EXPEDICION10',
                'type' => 'percentage',
                'value' => 10,
                'min_spend' => 15000,
                'origin' => 'Compra Anterior 📦',
                'origin_type' => 'manual',
                'description' => 'Aplicado en pedido #DB3B16.',
                'expiry_timestamp' => $now - (30 * 86400),
                'status' => 'usado',
                'used_date' => date('d/m/Y H:i', $now - (15 * 86400)),
                'used_order_id' => 'DB3B16',
            ]
        ];

        return response()->json($allCoupons);
    }

    /**
     * Redeem a promo coupon by code
     */
    public function redeem(Request $request)
    {
        $code = strtoupper(trim($request->input('code', '')));

        if (empty($code)) {
            return response()->json(['message' => 'Por favor ingresá un código de cupón.'], 422);
        }

        $availableCodes = [
            'HOLUXBIENVENIDA' => ['type' => 'percentage', 'value' => 20, 'min_spend' => 30000, 'origin' => 'Bienvenida 🚀'],
            'CUMPLE2026' => ['type' => 'fixed', 'value' => 5000, 'min_spend' => 25000, 'origin' => 'Por tu cumpleaños 🎂'],
            'FRECUENTE5K' => ['type' => 'fixed', 'value' => 5000, 'min_spend' => 40000, 'origin' => 'Cliente Frecuente ⭐'],
            'SUMMER20' => ['type' => 'percentage', 'value' => 20, 'min_spend' => 35000, 'origin' => 'Promo Especial 🏔️'],
            'VIP10K' => ['type' => 'fixed', 'value' => 10000, 'min_spend' => 60000, 'origin' => 'Cliente VIP 🥇'],
        ];

        if (!isset($availableCodes[$code])) {
            return response()->json(['message' => 'El código de cupón ingresado no es válido o ya expiró.'], 404);
        }

        $couponData = $availableCodes[$code];
        $newCoupon = [
            'id' => 'coup-' . time(),
            'code' => $code,
            'type' => $couponData['type'],
            'value' => $couponData['value'],
            'min_spend' => $couponData['min_spend'],
            'origin' => $couponData['origin'],
            'origin_type' => 'manual',
            'description' => 'Descuento canjeado correctamente.',
            'expiry_timestamp' => time() + (14 * 86400), // 14 days valid
            'status' => 'disponible',
            'used_date' => null,
            'used_order_id' => null,
        ];

        return response()->json([
            'message' => "¡Cupón {$code} canjeado con éxito! Se añadió a tus beneficios disponibles.",
            'coupon' => $newCoupon
        ]);
    }

    /**
     * Validate and apply coupon to cart subtotal
     */
    public function apply(Request $request)
    {
        $code = strtoupper(trim($request->input('code', '')));
        $subtotal = floatval($request->input('subtotal', 0));

        if (empty($code)) {
            return response()->json(['message' => 'Código de cupón requerido.'], 422);
        }

        $allCoupons = [
            'HOLUXBIENVENIDA' => ['type' => 'percentage', 'value' => 20, 'min_spend' => 30000],
            'CUMPLE2026' => ['type' => 'fixed', 'value' => 5000, 'min_spend' => 25000],
            'FRECUENTE5K' => ['type' => 'fixed', 'value' => 5000, 'min_spend' => 40000],
            'SUMMER20' => ['type' => 'percentage', 'value' => 20, 'min_spend' => 35000],
            'VIP10K' => ['type' => 'fixed', 'value' => 10000, 'min_spend' => 60000],
        ];

        if (!isset($allCoupons[$code])) {
            return response()->json(['message' => 'El código de cupón no existe o no es válido.'], 404);
        }

        $c = $allCoupons[$code];

        if ($subtotal < $c['min_spend']) {
            return response()->json([
                'message' => "Este cupón requiere una compra mínima de $" . number_format($c['min_spend'], 0, ',', '.') . "."
            ], 400);
        }

        $discountAmount = 0;
        if ($c['type'] === 'percentage') {
            $discountAmount = round(($subtotal * $c['value']) / 100);
        } else {
            $discountAmount = min($subtotal, $c['value']);
        }

        return response()->json([
            'valid' => true,
            'code' => $code,
            'type' => $c['type'],
            'value' => $c['value'],
            'discount_amount' => $discountAmount,
            'message' => '¡Cupón aplicado correctamente!'
        ]);
    }
}
