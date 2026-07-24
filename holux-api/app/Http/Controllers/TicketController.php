<?php

namespace App\Http\Controllers;

use App\Services\SupabaseService;
use Barryvdh\DomPDF\Facade\Pdf;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class TicketController extends Controller
{
    /**
     * Generate and download a virtual PDF ticket for a specific order.
     *
     * @param Request $request
     * @param string $id
     * @param SupabaseService $supabase
     * @return mixed
     */
    public function show(Request $request, string $id, SupabaseService $supabase)
    {
        $userId = $request->attributes->get('user_id');

        // Fetch order along with items and related products
        $orders = $supabase->get('orders', [
            'select' => '*,order_items(*,products(*))',
            'id' => 'eq.' . $id,
        ], true);

        if (empty($orders)) {
            return response()->json([
                'message' => 'Pedido no encontrado.'
            ], 404);
        }

        $order = $orders[0];

        // Security Check: 
        // 1. Fetch user profile to see if they are an admin
        $isUserAdmin = false;
        $profile = $supabase->getOne('profiles', $userId, true);
        if ($profile && ($profile['role'] ?? 'customer') === 'admin' && $profile['active'] === true) {
            $isUserAdmin = true;
        }

        // 2. If user is not an admin, check that the order belongs to them
        if (!$isUserAdmin && $order['customer_id'] !== $userId) {
            return response()->json([
                'message' => 'Acceso denegado. Este comprobante pertenece a otro usuario.'
            ], 403);
        }

        try {
            // Build verification URL that QR code will encode
            $verificationUrl = config('app.url') . "/verificar-ticket/" . $order['id'];

            // Generate QR Code as SVG
            $qrCodeSvg = QrCode::format('svg')
                ->size(150)
                ->margin(1)
                ->generate($verificationUrl);

            // Render PDF via DomPDF
            $pdf = Pdf::loadView('tickets.order', [
                'order' => $order,
                'qr_svg' => $qrCodeSvg,
                'verification_url' => $verificationUrl,
            ]);

            // Return download file response
            return $pdf->download("ticket-holux-{$order['id']}.pdf");

        } catch (\Exception $e) {
            Log::error("Failed to generate PDF ticket for order {$id}: " . $e->getMessage(), [
                'exception' => $e
            ]);

            return response()->json([
                'message' => 'Error al generar el ticket en PDF.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
