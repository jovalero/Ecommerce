import React from 'react';
import { X, Package, Printer, Eye, Send, MessageSquare, MapPin, CreditCard, User, Mail, Phone, Calendar } from 'lucide-react';
import { getOrderStatusInfo, parseOrderItems, formatMoney, formatDate } from '../../utils/orderConstants';

export default function AdminOrderDetailModal({
  order,
  onClose,
  onUpdateStatus,
  onOpenReceiptLightbox,
  onPrintInvoice,
  onResendNotification,
  isResendingNotification,
  adminNoteInput,
  setAdminNoteInput,
  onSaveAdminNote,
  isSavingAdminNote,
  onOpenRejectionModal,
  apiBaseUrl,
  token
}) {
  if (!order) return null;

  const statusInfo = getOrderStatusInfo(order.status);
  const items = parseOrderItems(order);
  const total = order.total_amount || order.total || 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-gray-100 text-left relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#3C6E71]" />
              <h3 className="font-display font-black text-xl text-gray-900 uppercase">
                Gestión de Pedido #{String(order.id).slice(-8).toUpperCase()}
              </h3>
            </div>
            <p className="text-xs text-gray-500 font-sans mt-0.5">
              Registrado el {formatDate(order.created_at)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-600">Estado:</label>
            <select
              value={order.status}
              onChange={(e) => {
                const newSt = e.target.value;
                if (newSt === 'rejected') {
                  onOpenRejectionModal(order);
                } else {
                  onUpdateStatus(order.id, newSt);
                }
              }}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold font-display uppercase tracking-wider outline-none focus:border-[#3C6E71] cursor-pointer"
            >
              <option value="created">CREADO</option>
              <option value="pending_review">EN REVISIÓN</option>
              <option value="paid">PAGADO</option>
              <option value="preparing">EN PREPARACIÓN</option>
              <option value="shipped">DESPACHADO</option>
              <option value="delivered">ENTREGADO</option>
              <option value="rejected">RECHAZADO</option>
              <option value="cancelled">CANCELADO</option>
            </select>
          </div>
        </div>

        {/* Rejection notice if rejected */}
        {order.status === 'rejected' && order.rejection_reason && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
            <strong className="block uppercase text-[10px] font-bold">Motivo de Rechazo:</strong>
            {order.rejection_reason}
          </div>
        )}

        {/* Customer & Shipping Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-xl border border-gray-150">
          <div className="space-y-1.5">
            <h4 className="font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#3C6E71]" /> Datos del Cliente
            </h4>
            <p className="text-gray-900 font-bold">{order.customer_name || 'Cliente Particular'}</p>
            <p className="text-gray-600 flex items-center gap-1"><Mail className="w-3 h-3 text-gray-400" /> {order.customer_email || '-'}</p>
            {order.customer_phone && <p className="text-gray-600 flex items-center gap-1"><Phone className="w-3 h-3 text-gray-400" /> {order.customer_phone}</p>}
            {order.customer_dni && <p className="text-gray-600">DNI: {order.customer_dni}</p>}
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#3C6E71]" /> Envío & Pago
            </h4>
            <p className="text-gray-700 font-medium">{order.shipping_address || 'Retiro en sucursal'}</p>
            <p className="text-gray-600">Método: <span className="font-bold">{order.shipping_method || 'Andreani'}</span></p>
            <p className="text-gray-600">Pago: <span className="font-bold uppercase">{order.payment_method === 'transfer' ? 'Transferencia Bancaria' : 'Mercado Pago'}</span></p>
          </div>
        </div>

        {/* Comprobante de Transferencia */}
        {order.receipt_url && (
          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-amber-900 uppercase">Comprobante de Transferencia Adjunto</h4>
              <p className="text-[11px] text-amber-700">Revisa la autenticidad antes de confirmar el pago.</p>
            </div>
            <button
              onClick={() => onOpenReceiptLightbox(order.receipt_url)}
              className="px-4 py-2 bg-[#1C2321] hover:bg-[#3C6E71] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>VER COMPROBANTE</span>
            </button>
          </div>
        )}

        {/* Order Items */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Detalle de Productos:</h4>
          <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
            {items.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div>
                  <h5 className="font-bold text-gray-900">{item.name || `Producto #${item.product_id}`}</h5>
                  <span className="text-[11px] text-gray-500 font-sans block">
                    Talle: {item.size || 'Único'} • Cantidad: {item.quantity} • Unitario: {formatMoney(item.unit_price || item.price || 0)}
                  </span>
                </div>
                <span className="font-bold text-gray-900 font-sans">
                  {formatMoney((item.unit_price || item.price || 0) * (item.quantity || 1))}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Private Notes */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-150 space-y-2">
          <h4 className="text-xs font-bold text-gray-800 uppercase flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-[#3C6E71]" /> Notas Internas de Administración (Privadas)
          </h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={adminNoteInput}
              onChange={(e) => setAdminNoteInput(e.target.value)}
              placeholder="Ej: Cliente llamó para solicitar factura A..."
              className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-[#3C6E71]"
            />
            <button
              onClick={() => onSaveAdminNote(order.id)}
              disabled={isSavingAdminNote}
              className="px-4 py-2 bg-[#3C6E71] text-white text-xs font-bold rounded-lg hover:bg-[#2c5355] transition-colors cursor-pointer"
            >
              {isSavingAdminNote ? 'Guardando...' : 'Guardar Nota'}
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrintInvoice(order)}
              className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>IMPRIMIR FACTURA</span>
            </button>

            <button
              onClick={() => onResendNotification(order.id)}
              disabled={isResendingNotification}
              className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5 text-blue-600" />
              <span>{isResendingNotification ? 'Enviando...' : 'Reenviar Notificación'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-gray-400 block uppercase">Total</span>
              <span className="text-xl font-black text-gray-900">{formatMoney(total)}</span>
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
    </div>
  );
}
