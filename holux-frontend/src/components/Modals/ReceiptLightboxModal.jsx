import React from 'react';
import { X } from 'lucide-react';

export default function ReceiptLightboxModal({
  receiptUrl,
  onClose
}) {
  if (!receiptUrl) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="relative max-w-3xl max-h-[90vh] bg-white rounded-xl overflow-hidden shadow-2xl p-2 cursor-default"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>
        <img
          src={receiptUrl}
          alt="Comprobante de Transferencia"
          className="max-h-[85vh] w-auto object-contain rounded-lg mx-auto"
        />
      </div>
    </div>
  );
}
