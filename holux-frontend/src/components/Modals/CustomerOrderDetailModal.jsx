import React from 'react';
import { X, Package, MapPin, CreditCard, Clock, Truck, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { getOrderStatusInfo, parseOrderItems, formatMoney, formatDate } from '../../utils/orderConstants';

export default function CustomerOrderDetailModal({
  order,
  onClose,
  getProductImage
}) {
  if (!order) return null;

  const statusInfo = getOrderStatusInfo(order.status);
  const items = parseOrderItems(order);
  const total = order.total_amount || order.total || 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-gray-100 text-left relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#3C6E71]" />
              <h3 className="font-display font-black text-xl text-gray-900 uppercase">
                Pedido #{String(order.id).slice(-8).toUpperCase()}
              </h3>
            </div>
            <p className="text-xs text-gray-500 font-sans mt-0.5">
              Realizado el {formatDate(order.created_at || order.date)}
            </p>
          </div>

          <div>
            <span className={`px-3 py-1 text-xs font-bold font-display rounded-full uppercase tracking-wider border ${statusInfo.badgeClass}`}>
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Timeline */}
        <div className="p-4 bg-gray-50 border border-gray-150 rounded-xl space-y-3">
          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Estado del Envío:</h4>
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 gap-1">
            <div className={`flex flex-col items-center gap-1 ${statusInfo.stepIndex >= 0 ? 'text-[#3C6E71]' : ''}`}>
              <CheckCircle2 className="w-4 h-4" />
              <span>Creado</span>
            </div>
            <div className="h-0.5 flex-1 bg-gray-200" />
            <div className={`flex flex-col items-center gap-1 ${statusInfo.stepIndex >= 1 ? 'text-[#3C6E71]' : ''}`}>
              <ShieldCheck className="w-4 h-4" />
              <span>Pago Aprobado</span>
            </div>
            <div className="h-0.5 flex-1 bg-gray-200" />
            <div className={`flex flex-col items-center gap-1 ${statusInfo.stepIndex >= 2 ? 'text-[#3C6E71]' : ''}`}>
              <Clock className="w-4 h-4" />
              <span>Preparando</span>
            </div>
            <div className="h-0.5 flex-1 bg-gray-200" />
            <div className={`flex flex-col items-center gap-1 ${statusInfo.stepIndex >= 3 ? 'text-[#3C6E71]' : ''}`}>
              <Truck className="w-4 h-4" />
              <span>Despachado</span>
            </div>
            <div className="h-0.5 flex-1 bg-gray-200" />
            <div className={`flex flex-col items-center gap-1 ${statusInfo.stepIndex >= 4 ? 'text-emerald-600' : ''}`}>
              <Package className="w-4 h-4" />
              <span>Entregado</span>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Productos en este pedido:</h4>
          <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto pr-1">
            {items.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={item.image_url || getProductImage?.(item.name) || "https://images.unsplash.com/photo-1551632811-561732d1e306?w=100"}
                    alt={item.name}
                    className="w-12 h-12 rounded object-cover border border-gray-200 bg-gray-50 shrink-0"
                  />
                  <div>
                    <h5 className="font-bold text-gray-900">{item.name || `Producto #${item.product_id}`}</h5>
                    <span className="text-[11px] text-gray-500 font-sans block">
                      Talle: {item.size || 'Único'} • Cantidad: {item.quantity}
                    </span>
                  </div>
                </div>
                <span className="font-bold text-gray-900 font-sans">
                  {formatMoney((item.unit_price || item.price || 0) * (item.quantity || 1))}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping & Payment Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-xl border border-gray-150">
          <div className="space-y-1">
            <span className="font-bold text-gray-800 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#3C6E71]" /> Destino de Entrega:
            </span>
            <p className="text-gray-600 leading-relaxed font-sans">
              {order.shipping_address || 'Retiro en Sucursal Central Bariloche'}
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-bold text-gray-800 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-[#3C6E71]" /> Medio de Pago:
            </span>
            <p className="text-gray-600 uppercase font-sans">
              {order.payment_method === 'transfer' ? 'Transferencia Bancaria' : 'Mercado Pago'}
            </p>
          </div>
        </div>

        {/* Total and close */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div>
            <span className="text-xs text-gray-500 font-sans block">Total abonado:</span>
            <span className="text-2xl font-black text-gray-900 font-sans">{formatMoney(total)}</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#1C2321] hover:bg-[#3C6E71] text-white font-display text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            CERRAR
          </button>
        </div>
      </div>
    </div>
  );
}
