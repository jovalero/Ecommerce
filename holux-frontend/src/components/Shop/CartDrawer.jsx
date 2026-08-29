import React from 'react';
import { ShoppingBag, X, Trash2, Tag, ChevronRight } from 'lucide-react';
import { formatMoney } from '../../utils/orderConstants';
import { resolveProductImage } from '../../utils/bannerStorage';

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  updateCartQty,
  removeFromCart,
  appliedCoupon,
  setAppliedCoupon,
  onOpenCheckout,
  getProductImage
}) {
  if (!isOpen) return null;

  const rawSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let discountAmount = 0;
  if (appliedCoupon) {
    discountAmount = appliedCoupon.type === 'percentage'
      ? Math.round((rawSubtotal * appliedCoupon.value) / 100)
      : Math.min(rawSubtotal, appliedCoupon.value);
  }
  const finalTotal = Math.max(0, rawSubtotal - discountAmount);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300" 
      />
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white text-left">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#3C6E71]" />
              <h2 className="font-display font-bold text-lg text-gray-900 tracking-wide">
                TU CARRITO
              </h2>
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-bold">
                {cart.reduce((qty, item) => qty + item.quantity, 0)}
              </span>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-left">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-gray-400">
                <ShoppingBag className="w-16 h-16 stroke-[1]" />
                <p className="font-display font-bold text-sm uppercase">Tu carrito está vacío</p>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-[#1C2321] text-white text-xs font-bold font-display rounded-lg hover:bg-[#3C6E71] transition-colors cursor-pointer"
                >
                  EXPLORAR CATÁLOGO
                </button>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div 
                  key={`${item.id}-${item.sizeLabel || 'u'}-${idx}`}
                  className="flex gap-4 p-3 bg-gray-50/70 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors"
                >
                  <img
                    src={resolveProductImage(item.image_url) || (Array.isArray(item.images) && resolveProductImage(item.images[0])) || resolveProductImage(item.image) || getProductImage?.(item.name)}
                    alt={item.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      if (getProductImage) e.target.src = getProductImage(item.name);
                    }}
                    className="w-16 h-16 object-cover rounded-md bg-white border border-gray-150 shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{item.name}</h4>
                        <span className="text-[11px] text-[#3C6E71] font-semibold block">
                          Talle: {item.sizeLabel || 'Único'}
                        </span>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id, item.sizeLabel)}
                        className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer p-1"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center border border-gray-200 rounded bg-white shadow-xs">
                        <button
                          onClick={() => updateCartQty(item.id, item.sizeLabel, -1)}
                          className="px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100 rounded-l cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2.5 py-0.5 text-xs font-bold text-gray-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQty(item.id, item.sizeLabel, 1, item.stock)}
                          className="px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100 rounded-r cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-bold text-gray-900 font-sans">
                        {formatMoney(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Calculations & CTA */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 space-y-4 text-left">
              {appliedCoupon && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold uppercase tracking-wider">{appliedCoupon.code}</span>
                      <span className="text-[11px] block text-emerald-700">
                        Descuento aplicado: -{formatMoney(discountAmount)}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setAppliedCoupon(null)}
                    className="text-xs text-red-600 font-bold hover:underline cursor-pointer"
                  >
                    Quitar
                  </button>
                </div>
              )}

              <div className="space-y-2 text-xs text-gray-600 border-b border-gray-200 pb-3 font-medium">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatMoney(rawSubtotal)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Descuento Cupón</span>
                    <span>-{formatMoney(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-400 text-[11px]">
                  <span>IVA Incluido (21%)</span>
                  <span>{formatMoney(finalTotal * 0.21)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-lg font-black">{formatMoney(finalTotal)}</span>
                </div>
              </div>

              <button
                onClick={onOpenCheckout}
                className="w-full py-3.5 bg-[#1C2321] hover:bg-[#3C6E71] text-white font-display text-xs font-bold tracking-widest rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>INICIAR COMPRA</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
