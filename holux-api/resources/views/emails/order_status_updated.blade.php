<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Actualización de Pedido - Holux Gear</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f4f5f7;
            margin: 0;
            padding: 0;
            color: #1c2321;
        }
        .container {
            max-width: 600px;
            margin: 30px auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        .header {
            background-color: #1c2321;
            padding: 30px;
            text-align: center;
            color: #ffffff;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            letter-spacing: 2px;
            text-transform: uppercase;
        }
        .header p {
            margin: 5px 0 0 0;
            color: #3c6e71;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .content {
            padding: 30px;
        }
        .status-box {
            padding: 16px;
            border-radius: 12px;
            margin-bottom: 24px;
            text-align: center;
        }
        .status-paid {
            background-color: #d1fae5;
            color: #065f46;
            border: 1px solid #a7f3d0;
        }
        .status-pending_review {
            background-color: #fef3c7;
            color: #92400e;
            border: 1px solid #fde68a;
        }
        .status-pending_payment {
            background-color: #fef9c3;
            color: #854d0e;
            border: 1px solid #fef08a;
        }
        .status-rejected {
            background-color: #fee2e2;
            color: #991b1b;
            border: 1px solid #fca5a5;
        }
        .status-title {
            font-size: 16px;
            font-weight: bold;
            text-transform: uppercase;
            margin: 0;
        }
        .status-desc {
            font-size: 13px;
            margin-top: 4px;
        }
        .order-info {
            background: #f9fafb;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 24px;
            border: 1px solid #e5e7eb;
        }
        .order-info table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }
        .order-info td {
            padding: 6px 0;
        }
        .order-info td.label {
            color: #6b7280;
            width: 40%;
        }
        .order-info td.value {
            font-weight: bold;
            text-align: right;
        }
        .rejection-box {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 14px;
            margin-bottom: 24px;
            color: #991b1b;
            font-size: 13px;
        }
        .footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            font-size: 11px;
            color: #9ca3af;
            border-t: 1px solid #e5e7eb;
        }
        .btn {
            display: inline-block;
            background-color: #3c6e71;
            color: #ffffff !important;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>HOLUX GEAR</h1>
            <p>EQUIPAMIENTO TÉCNICO & ALTA MONTAÑA</p>
        </div>

        <div class="content">
            <p>Hola <strong>{{ $order['customer_name'] ?? 'Cliente' }}</strong>,</p>

            <div class="status-box status-{{ $statusKey }}">
                <div class="status-title">{{ $statusTitle }}</div>
                <div class="status-desc">{{ $statusMessage }}</div>
            </div>

            @if(!empty($rejectionReason))
                <div class="rejection-box">
                    <strong>Motivo indicado:</strong> {{ $rejectionReason }}
                </div>
            @endif

            @if(!empty($order['tracking_number']))
                <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
                    <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: bold; color: #1e40af; text-transform: uppercase; letter-spacing: 1px;">🚚 CÓDIGO DE SEGUIMIENTO DE ENVÍO</p>
                    <p style="margin: 0; font-size: 18px; font-weight: 800; color: #1e3a8a; font-family: monospace;">{{ $order['tracking_number'] }}</p>
                    @if(!empty($order['shipping_courier']))
                        <p style="margin: 4px 0 0 0; font-size: 12px; color: #3b82f6;">Empresa: <strong>{{ $order['shipping_courier'] }}</strong></p>
                    @endif
                    @if(!empty($order['tracking_url']))
                        <div style="margin-top: 12px;">
                            <a href="{{ $order['tracking_url'] }}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: bold;">SEGUIR PAQUETE ONLINE ➔</a>
                        </div>
                    @endif
                </div>
            @endif

            <div class="order-info">
                <table>
                    <tr>
                        <td class="label">Número de Pedido:</td>
                        <td class="value">#HLX-{{ strtoupper(substr($order['id'] ?? '000000', -6)) }}</td>
                    </tr>
                    <tr>
                        <td class="label">Fecha:</td>
                        <td class="value">{{ date('d/m/Y H:i', strtotime($order['created_at'] ?? 'now')) }}</td>
                    </tr>
                    <tr>
                        <td class="label">Método de Pago:</td>
                        <td class="value">{{ strtoupper($order['payment_method'] ?? 'TRANSFERENCIA') }}</td>
                    </tr>
                    <tr>
                        <td class="label">Total:</td>
                        <td class="value">ARS ${{ number_format($order['total'] ?? 0, 0, ',', '.') }}</td>
                    </tr>
                </table>
            </div>

            <p style="font-size: 13px; color: #4b5563; text-align: center;">
                Podés ingresar a tu cuenta en Holux Gear para ver el detalle actualizado de tu compra.
            </p>

            <div style="text-align: center; margin-top: 20px;">
                <a href="{{ env('FRONTEND_URL', 'http://localhost:5173') }}" class="btn">IR A MI CUENTA</a>
            </div>
        </div>

        <div class="footer">
            Holux Gear Argentina • San Carlos de Bariloche • Este es un correo automático.
        </div>
    </div>
</body>
</html>
