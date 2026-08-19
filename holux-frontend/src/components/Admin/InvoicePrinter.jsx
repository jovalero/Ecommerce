import React from 'react';
import { Printer, X, CheckCircle2 } from 'lucide-react';

export default function InvoicePrinter({ order, taxRate = 21.0, currencySymbol = 'ARS $', onClose }) {
  if (!order) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) {
      window.print();
      return;
    }

    const itemsHtml = items.length > 0 ? items.map(it => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1e293b;">${it.name}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-family: monospace; font-weight: bold;">${it.quantity}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${currencySymbol} ${it.unit_price.toLocaleString('es-AR')}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; font-weight: bold; color: #0f172a;">${currencySymbol} ${(it.quantity * it.unit_price).toLocaleString('es-AR')}</td>
      </tr>
    `).join('') : `
      <tr>
        <td colspan="4" style="padding: 16px; text-align: center; color: #94a3b8; font-style: italic;">Sin artículos detallados</td>
      </tr>
    `;

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <title>Factura Pedido #${order.id ? (order.id.length > 15 ? order.id.slice(-6).toUpperCase() : order.id) : '0001'} - Holux</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&family=Oswald:wght@600;700&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Inter', -apple-system, sans-serif; background: #ffffff; color: #1e293b; padding: 35px; line-height: 1.4; }
            .font-display { font-family: 'Oswald', sans-serif; text-transform: uppercase; letter-spacing: 0.05em; }
            .font-mono { font-family: 'JetBrains Mono', monospace; }
            .header-container { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #0f172a; padding-bottom: 20px; margin-bottom: 24px; }
            .logo-title { font-size: 28px; font-weight: 900; color: #1C2321; }
            .sub-text { font-size: 11px; color: #64748b; margin-top: 2px; }
            .badge-doc { background: #1C2321; color: #ffffff; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 4px; display: inline-block; margin-bottom: 6px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 24px; font-size: 12px; }
            .info-title { font-size: 9.5px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
            th { background: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left; padding: 10px 12px; font-size: 10.5px; font-weight: 700; color: #475569; text-transform: uppercase; }
            .totals-wrapper { display: flex; justify-content: flex-end; border-top: 2px solid #0f172a; padding-top: 16px; margin-bottom: 30px; }
            .totals-box { width: 270px; font-size: 12px; }
            .total-line { display: flex; justify-content: space-between; margin-bottom: 6px; color: #475569; }
            .grand-total { display: flex; justify-content: space-between; font-size: 15px; font-weight: 800; color: #0f172a; border-top: 1px solid #cbd5e1; padding-top: 8px; margin-top: 8px; }
            .footer-note { text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 20px; }
            @media print {
              body { padding: 15mm; }
              @page { size: A4 portrait; margin: 10mm; }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div>
              <div class="font-display logo-title">HOLUX GEAR</div>
              <div class="sub-text">Equipamiento Técnico & Alta Montaña</div>
              <div class="sub-text">Av. San Martín 1540, San Carlos de Bariloche, Río Negro, Argentina</div>
            </div>
            <div style="text-align: right;">
              <div class="badge-doc font-mono">COMPROBANTE X - OFICIAL</div>
              <div class="font-mono" style="font-size: 13px; font-weight: 800;">PEDIDO #${order.id ? (order.id.length > 15 ? order.id.slice(-6).toUpperCase() : order.id) : '0001'}</div>
              <div class="font-mono" style="font-size: 11px; color: #64748b; margin-top: 2px;">FECHA: ${new Date(order.created_at || Date.now()).toLocaleDateString('es-AR')}</div>
            </div>
          </div>

          <div class="info-grid">
            <div>
              <div class="info-title font-display">CLIENTE Y CONTACTO</div>
              <div style="font-weight: bold; font-size: 13px;">${order.customer_name || 'Cliente Holux'}</div>
              <div class="font-mono" style="color: #64748b; margin-top: 2px;">${order.customer_email || 'Sin correo registrado'}</div>
              ${order.shipping_address ? `<div style="color: #64748b; margin-top: 4px;">📍 ${order.shipping_address}</div>` : ''}
            </div>
            <div>
              <div class="info-title font-display">FORMA Y ESTADO DE PAGO</div>
              <div style="font-weight: bold; text-transform: uppercase;">${order.payment_method === 'transfer' || !order.payment_id ? 'TRANSFERENCIA BANCARIA' : (order.payment_method || 'MERCADO PAGO')}</div>
              <div style="margin-top: 4px; font-weight: bold; color: #047857; font-size: 11px; text-transform: uppercase;">
                ESTADO: ${order.status === 'pending_review' ? 'EN REVISIÓN' : (order.status || 'PROCESADO')}
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>PRODUCTO</th>
                <th style="text-align: center;">CANT.</th>
                <th style="text-align: right;">PRECIO UNIT.</th>
                <th style="text-align: right;">SUBTOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals-wrapper">
            <div class="totals-box">
              <div class="total-line">
                <span>Subtotal Neto:</span>
                <span class="font-mono">${currencySymbol} ${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div class="total-line">
                <span>IVA / Impuestos (${taxRate}%):</span>
                <span class="font-mono">${currencySymbol} ${taxAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div class="grand-total font-display">
                <span>TOTAL FACTURADO:</span>
                <span class="font-mono" style="color: #3C6E71;">${currencySymbol} ${total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div class="footer-note font-mono">
            ¡Gracias por confiar en Holux Gear! Comprobante emitido desde el panel oficial de administración.
          </div>

          <script>
            window.onload = function() {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const total = Number(order.total || order.total_amount || 0);
  const subtotal = total / (1 + (taxRate / 100));
  const taxAmount = total - subtotal;

  const rawItems = order.order_items || order.items || [];
  const items = Array.isArray(rawItems) ? rawItems.map(item => ({
    name: item.products?.name || item.product_name || item.name || 'Producto Holux',
    quantity: item.quantity || 1,
    unit_price: Number(item.products?.price || item.unit_price || item.price || 0)
  })) : [];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:p-0 print:bg-white print:static overflow-y-auto">
      
      {/* ACTION BAR (Hidden during print) */}
      <div className="fixed top-4 right-4 flex items-center gap-2 print:hidden z-[10000]">
        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2 bg-[#3C6E71] hover:bg-[#2c5355] text-white font-display text-xs font-bold tracking-wider rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>IMPRIMIR FACTURA / PDF</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-2 bg-gray-900 hover:bg-black text-white rounded-xl shadow-lg cursor-pointer transition-all"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* PRINTABLE INVOICE SHEET */}
      <div id="invoice-print-area" className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-2xl border border-gray-200 text-gray-900 font-sans print:shadow-none print:border-none print:w-full print:p-0 text-left my-8">
        
        {/* HEADER */}
        <div className="flex items-start justify-between border-b-2 border-gray-900 pb-6 mb-6">
          <div>
            <h1 className="font-display text-3xl font-black text-[#1C2321] tracking-wider">
              HOLUX GEAR
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Equipamiento Técnico & Alta Montaña
            </p>
            <p className="text-[11px] text-gray-400">
              Av. San Martín 1540, San Carlos de Bariloche, Río Negro, Argentina
            </p>
          </div>

          <div className="text-right">
            <div className="inline-block bg-[#1C2321] text-white px-3 py-1 font-mono-custom text-xs font-bold rounded mb-2">
              COMPROBANTE X - OFICIAL
            </div>
            <p className="text-xs font-mono-custom font-bold text-gray-800">
              PEDIDO #{order.id ? (order.id.length > 15 ? order.id.slice(-6).toUpperCase() : order.id) : '0001'}
            </p>
            <p className="text-[11px] text-gray-500 font-mono-custom">
              FECHA: {new Date(order.created_at || Date.now()).toLocaleDateString('es-AR')}
            </p>
          </div>
        </div>

        {/* CUSTOMER & SHIPPING INFO */}
        <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 text-xs">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-display mb-1">CLIENTE Y CONTACTO</p>
            <p className="font-bold text-gray-900">{order.customer_name || 'Cliente Holux'}</p>
            <p className="text-gray-600 font-mono-custom">{order.customer_email || 'Sin correo registrado'}</p>
            {order.shipping_address && (
              <p className="text-gray-500 mt-1 text-[11px]">📍 {order.shipping_address}</p>
            )}
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-display mb-1">FORMA Y ESTADO DE PAGO</p>
            <p className="font-bold text-gray-900 uppercase">
              {order.payment_method === 'transfer' || !order.payment_id ? 'Transferencia Bancaria' : (order.payment_method || 'Mercado Pago')}
            </p>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 mt-1.5 uppercase text-[10px]">
              <CheckCircle2 className="w-3 h-3" />
              ESTADO: {order.status === 'pending_review' ? 'EN REVISIÓN' : (order.status || 'PROCESADO')}
            </span>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <table className="w-full text-xs border-collapse mb-6">
          <thead>
            <tr className="border-b-2 border-gray-300 bg-gray-100 text-left font-display font-bold text-gray-700 uppercase tracking-wider">
              <th className="py-2.5 px-3">PRODUCTO</th>
              <th className="py-2.5 px-3 text-center">CANT.</th>
              <th className="py-2.5 px-3 text-right">PRECIO UNIT.</th>
              <th className="py-2.5 px-3 text-right">SUBTOTAL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.length > 0 ? (
              items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3 px-3 font-bold text-gray-800">
                    {item.name}
                  </td>
                  <td className="py-3 px-3 text-center font-bold font-mono-custom">{item.quantity}</td>
                  <td className="py-3 px-3 text-right font-mono-custom">
                    {currencySymbol} {item.unit_price.toLocaleString('es-AR')}
                  </td>
                  <td className="py-3 px-3 text-right font-bold font-mono-custom">
                    {currencySymbol} {(item.quantity * item.unit_price).toLocaleString('es-AR')}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-4 text-center text-gray-400 italic">
                  Artículos del pedido
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* DYNAMIC TAX & TOTAL BREAKDOWN */}
        <div className="flex justify-end border-t-2 border-gray-900 pt-4 mb-8">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal Neto:</span>
              <span className="font-mono-custom">{currencySymbol} {subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>IVA / Impuesto ({taxRate}%):</span>
              <span className="font-mono-custom">{currencySymbol} {taxAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-gray-900 border-t border-gray-300 pt-2 font-display">
              <span>TOTAL FACTURADO:</span>
              <span className="font-mono-custom text-base text-[#3C6E71]">
                {currencySymbol} {total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* FOOTER NOTE */}
        <div className="text-center border-t border-gray-200 pt-4 text-[10px] text-gray-400 font-mono-custom">
          ¡Gracias por confiar en Holux Gear! Este comprobante fue generado desde el panel de control oficial de Holux.
        </div>
      </div>
    </div>
  );
}
