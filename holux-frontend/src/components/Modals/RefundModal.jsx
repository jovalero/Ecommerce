import React from 'react';
import { X, RotateCcw } from 'lucide-react';

export default function RefundModal({
  isOpen,
  onClose,
  orders = [],
  refundOrderSelect,
  setRefundOrderSelect,
  refundReasonSelect,
  setRefundReasonSelect,
  refundCommentInput,
  setRefundCommentInput,
  onSubmit
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-gray-100 text-left relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="p-2 bg-orange-50 text-[#B85C38] rounded-lg">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-black text-lg text-gray-900 uppercase">
              Botón de Arrepentimiento
            </h3>
            <p className="text-xs text-gray-500">Solicitud de cambio o devolución (Ley 24.240)</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs font-sans">
          <div>
            <label className="block text-gray-700 font-bold mb-1">Seleccionar Pedido</label>
            <select
              value={typeof refundOrderSelect === 'object' && refundOrderSelect ? refundOrderSelect.id : (refundOrderSelect || '')}
              onChange={(e) => setRefundOrderSelect(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#3C6E71] cursor-pointer"
            >
              {orders.length > 0 ? (
                orders.map(o => (
                  <option key={o.id} value={o.id}>
                    Pedido #{String(o.id).slice(-6)} - ${(o.total_amount || o.total || 0).toLocaleString('es-AR')}
                  </option>
                ))
              ) : (
                <option value="">Sin pedidos recientes disponibles</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Motivo de la solicitud</label>
            <select
              value={refundReasonSelect}
              onChange={(e) => setRefundReasonSelect(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#3C6E71] cursor-pointer"
            >
              <option value="Talle incorrecto">Talle incorrecto</option>
              <option value="Producto no esperado">Producto no es lo esperado</option>
              <option value="Falla de fabricación">Falla o defecto de fabricación</option>
              <option value="Arrepentimiento de compra">Arrepentimiento de compra</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Observaciones</label>
            <textarea
              rows={3}
              value={refundCommentInput}
              onChange={(e) => setRefundCommentInput(e.target.value)}
              placeholder="Indica cualquier detalle adicional relevante..."
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#3C6E71]"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 border border-gray-300 text-gray-700 font-display text-xs font-bold rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              className="w-1/2 py-2.5 bg-black hover:bg-neutral-800 text-white font-display text-xs font-bold rounded-lg shadow transition-colors cursor-pointer"
            >
              SOLICITAR DEVOLUCIÓN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
