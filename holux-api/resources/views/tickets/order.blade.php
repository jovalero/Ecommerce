<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Ticket Virtual HOLUX - {{ $order['id'] }}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1c2321;
            margin: 0;
            padding: 20px;
            font-size: 14px;
            line-height: 1.5;
            background-color: #ffffff;
        }
        .header {
            border-bottom: 2px solid #3c6e71;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #3c6e71;
            letter-spacing: 2px;
            text-transform: uppercase;
        }
        .ticket-title {
            font-size: 16px;
            font-weight: bold;
            color: #b85c38;
            text-align: right;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .info-table {
            width: 100%;
            margin-bottom: 30px;
            border-collapse: collapse;
        }
        .info-table td {
            vertical-align: top;
            padding: 5px 0;
        }
        .info-label {
            font-weight: bold;
            color: #3c6e71;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .items-table th {
            background-color: #3c6e71;
            color: #ffffff;
            font-weight: bold;
            text-align: left;
            padding: 10px;
            font-size: 12px;
            text-transform: uppercase;
        }
        .items-table td {
            padding: 10px;
            border-bottom: 1px solid #e2efe9;
        }
        .price-col {
            text-align: right;
        }
        .total-row {
            font-size: 16px;
            font-weight: bold;
            color: #b85c38;
            background-color: #f2efe9;
        }
        .footer {
            margin-top: 40px;
            border-top: 1px solid #3c6e71;
            padding-top: 20px;
        }
        .qr-section {
            text-align: center;
            margin-bottom: 20px;
        }
        .qr-image {
            display: inline-block;
            padding: 10px;
            border: 1px solid #3c6e71;
            background-color: #ffffff;
        }
        .instructions {
            font-size: 12px;
            color: #666666;
            text-align: center;
            margin-top: 10px;
        }
    </style>
</head>
<body>

    <table style="width: 100%;" class="header">
        <tr>
            <td>
                <div class="logo">HOLUX</div>
                <div style="font-size: 11px; color: #666;">EQUIPO & INDUMENTARIA OUTDOOR</div>
            </td>
            <td style="text-align: right; vertical-align: middle;">
                <div class="ticket-title">Comprobante de Compra</div>
                <div style="font-size: 11px; color: #666;">ID: {{ $order['id'] }}</div>
            </td>
        </tr>
    </table>

    <table class="info-table">
        <tr>
            <td style="width: 50%;">
                <div class="info-label">Datos del Cliente</div>
                <div><strong>Nombre:</strong> {{ $order['customer_name'] }}</div>
                <div><strong>Email:</strong> {{ $order['customer_email'] }}</div>
            </td>
            <td style="width: 50%; text-align: right;">
                <div class="info-label">Detalles del Pedido</div>
                <div><strong>Fecha:</strong> {{ \Carbon\Carbon::parse($order['created_at'])->format('d/m/Y H:i') }}</div>
                <div><strong>Estado:</strong> {{ strtoupper($order['status']) }}</div>
            </td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <th>Producto / Marca</th>
                <th style="width: 15%; text-align: center;">Cant.</th>
                <th style="width: 20%;" class="price-col">Precio Unit.</th>
                <th style="width: 25%;" class="price-col">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order['order_items'] as $item)
                <tr>
                    <td>
                        <strong>{{ $item['products']['name'] ?? 'Producto' }}</strong><br>
                        <span style="font-size: 11px; color: #666;">{{ $item['products']['brand'] ?? 'HOLUX' }}</span>
                    </td>
                    <td style="text-align: center;">{{ $item['quantity'] }}</td>
                    <td class="price-col">ARS {{ number_format($item['unit_price'], 2, ',', '.') }}</td>
                    <td class="price-col">ARS {{ number_format($item['unit_price'] * $item['quantity'], 2, ',', '.') }}</td>
                </tr>
            @endforeach
            <tr class="total-row">
                <td colspan="2">TOTAL</td>
                <td colspan="2" class="price-col">ARS {{ number_format($order['total'], 2, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    <div class="qr-section">
        <div class="qr-image">
            <!-- Embedding SVG QR code directly inline -->
            {!! $qr_svg !!}
        </div>
        <div class="instructions">
            Presentá este código QR en sucursal para verificar tu compra o retirar tu pedido.<br>
            <span style="font-size: 9px; color: #999;">Verificación de Ticket: {{ $verification_url }}</span>
        </div>
    </div>

    <div class="footer" style="text-align: center; font-size: 11px; color: #888;">
        Gracias por equiparte con HOLUX para tus aventuras en la cordillera.<br>
        <strong>HOLUX - Hacia Lo Alto.</strong>
    </div>

</body>
</html>
