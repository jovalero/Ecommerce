import React from 'react';
import { X, AlertCircle } from 'lucide-react';

export default function AdminRejectionModal({
  order,
  onClose,
  reasonInput,
  setReasonInput,
  onSubmit
}) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-gray-100 text-left relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="p-2 bg-red-50 text-red-600 rounded-lg">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-black text-lg text-gray-900 uppercase">
              Rechazar Comprobante / Pago
            </h3>
            <p className="text-xs text-gray-500">Pedido #{String(order.id).slice(-8).toUpperCase()}</p>
          </div>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed font-sans">
          Especifica el motivo del rechazo. Esta explicación le aparecerá al cliente en su panel para que pueda corregir el pago.
        </p>

        <div className="space-y-3 text-xs font-sans">
          <div>
            <label className="block text-gray-700 font-bold mb-1">Motivo del rechazo:</label>
            <textarea
              required
              rows={3}
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              placeholder="Ej: El importe transferido no coincide con el total del pedido..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-red-500"
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
              type="button"
              onClick={onSubmit}
              className="w-1/2 py-2.5 bg-red-600 hover:bg-red-700 text-white font-display text-xs font-bold rounded-lg shadow transition-colors cursor-pointer"
            >
              CONFIRMAR RECHAZO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
