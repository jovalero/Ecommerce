import React from 'react';
import { AlertCircle, CheckCircle2, ShieldAlert, X } from 'lucide-react';

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = "SÍ, GUARDAR CAMBIOS", cancelText = "CANCELAR", type = "save" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans text-gray-900">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />

      {/* Dialog Box */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 z-10 animate-in zoom-in-95 duration-200 text-xs">
        
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between border-b ${type === 'danger' ? 'bg-red-950 text-white border-red-800' : 'bg-[#1C2321] text-white border-[#3C6E71]/30'}`}>
          <div className="flex items-center gap-3">
            <span className={`p-2 rounded-lg text-white font-bold ${type === 'danger' ? 'bg-red-600' : 'bg-[#3C6E71]'}`}>
              {type === 'danger' ? <ShieldAlert className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </span>
            <div>
              <h3 className="font-display text-xs font-bold uppercase tracking-wider">
                {title || 'CONFIRMAR ACCIÓN'}
              </h3>
              <p className="text-[10px] text-gray-400">Verificación de seguridad de administración</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded cursor-pointer text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 bg-gray-50 text-gray-700">
          <p className="text-xs leading-relaxed font-medium">
            {message || '¿Estás seguro de que deseas aplicar y guardar estos cambios en la tienda?'}
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>Los cambios impactarán inmediatamente en la vista pública de los clientes.</span>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-display font-bold hover:bg-gray-100 cursor-pointer transition-all"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-5 py-2 text-white rounded-lg font-display font-bold shadow-md flex items-center gap-1.5 cursor-pointer transition-all ${type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#3C6E71] hover:bg-[#3C6E71]/90'}`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {confirmText}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
