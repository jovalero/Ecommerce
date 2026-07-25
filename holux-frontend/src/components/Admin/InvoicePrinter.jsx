import React from 'react';
import { Printer, Download, X, FileText, CheckCircle2 } from 'lucide-react';

export default function InvoicePrinter({ order, taxRate = 21.0, currencySymbol = 'ARS $', onClose }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const total = order.total || 0;
  // Calculate dynamic tax breakdown based on configured tax_rate
  const subtotal = total / (1 + (taxRate / 100));
  const taxAmount = total - subtotal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm print:p-0 print:bg-white print:static">
      
      {/* ACTION BAR (Hidden during print) */}
      <div className="fixed top-4 right-4 flex items-center gap-2 print:hidden z-50">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-[#3C6E71] text-white font-display text-xs font-bold tracking-wider rounded shadow-lg hover:bg-[#3C6E71]/90 flex items-center gap-2 cursor-pointer transition-all"
        >
          <Printer className="w-4 h-4" />
          IMPRIMIR / DESCARGAR COMPROBANTE
        </button>
        <button
          onClick={onClose}
          className="p-2 bg-gray-800 text-white rounded shadow hover:bg-gray-700 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* PRINTABLE INVOICE SHEET */}
      <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-2xl border border-gray-200 text-gray-900 font-sans print:shadow-none print:border-none print:w-full print:p-0 text-left">
        
        {/* HEADER */}
        <div className="flex items-start justify-between border-b-2 border-gray-900 pb-6 mb-6">
          <div>
            <h1 className="font-display text-3xl font-black text-[#1C2321] tracking-wider">
              HOLUX GEAR
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Equipamiento Técnico y Alta Montaña
            </p>
            <p className="text-[11px] text-gray-400">
              Av. San Martín 1540, San Carlos de Bariloche, Argentina
            </p>
          </div>

          <div className="text-right">
            <div className="inline-block bg-[#1C2321] text-white px-3 py-1 font-mono-custom text-xs font-bold rounded mb-2">
              COMPROBANTE X - OFICIAL
            </div>
            <p className="text-xs font-mono-custom font-bold text-gray-800">
              PEDIDO #{order.id ? order.id.slice(0, 8).toUpperCase() : '0001'}
            </p>
            <p className="text-[11px] text-gray-500 font-mono-custom">
              FECHA: {new Date(order.created_at || Date.now()).toLocaleDateString('es-AR')}
            </p>
          </div>
        </div>

        {/* CUSTOMER & SHIPPING INFO */}
        <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 text-xs">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-display mb-1">CLIENTE</p>
            <p className="font-bold text-gray-900">{order.customer_name || 'Cliente Registrar'}</p>
            <p className="text-gray-600 font-mono-custom">{order.customer_email || 'Sin correo registrado'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-display mb-1">ESTADO DEL PAGO</p>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
              <CheckCircle2 className="w-3 h-3" />
              PAGO CONFIRMADO ({order.status ? order.status.toUpperCase() : 'PENDIENTE'})
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
            {(order.order_items || []).map((item, idx) => (
              <tr key={idx}>
                <td className="py-3 px-3 font-bold text-gray-800">
                  {item.products?.name || 'Producto Holux'}
                </td>
                <td className="py-3 px-3 text-center font-bold font-mono-custom">{item.quantity}</td>
                <td className="py-3 px-3 text-right font-mono-custom">
                  {currencySymbol} {Number(item.unit_price).toLocaleString('es-AR')}
                </td>
                <td className="py-3 px-3 text-right font-bold font-mono-custom">
                  {currencySymbol} {(item.quantity * item.unit_price).toLocaleString('es-AR')}
                </td>
              </tr>
            ))}
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
          ¡Gracias por confiar en Holux Gear! Este comprobante fue generado desde el panel de control oficial.
        </div>
      </div>
    </div>
  );
}
