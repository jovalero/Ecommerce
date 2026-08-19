import React from 'react';
import { Heart, ShoppingBag, Star, Zap } from 'lucide-react';

export default function ProductCard({
  product,
  isFavorite = false,
  onToggleFavorite,
  onProductClick,
  onAddToCart,
  onBuyNow
}) {
  const price = Number(product.price) || 0;
  const offerPrice = Number(product.offer_price) || 0;
  const effectivePrice = offerPrice > 0 && offerPrice < price ? offerPrice : price;
  const originalPrice = offerPrice > 0 && offerPrice < price ? price : (Number(product.original_price) || 0);
  const discount = originalPrice > effectivePrice 
    ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100) 
    : 0;

  const stock = Number(product.stock) || 0;
  const isOutOfStock = stock <= 0;
  const installments = Number(product.installments) || 0;

  const imageUrl = product.image_url || (Array.isArray(product.images) && product.images[0]) || 'https://images.unsplash.com/photo-1544923246-77307dd654cb?w=800&auto=format&fit=crop&q=80';

  return (
    <div className="group bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-xl hover:border-gray-300 transition-all duration-300 relative text-left">
      
      {/* Top Image Container with Fixed Aspect Ratio (Uniform) */}
      <div 
        onClick={() => onProductClick && onProductClick(product)}
        className="relative bg-gray-50 aspect-[4/5] w-full overflow-hidden border-b border-gray-100 group-hover:bg-gray-100/40 transition-colors cursor-pointer"
      >
        {/* Discount Badge */}
        {discount > 0 && (
          <span className="absolute top-3 left-3 bg-[#B85C38] text-white text-[10px] font-display font-bold tracking-widest px-2.5 py-1 rounded-md shadow-sm z-10">
            {discount}% OFF
          </span>
        )}

        {/* Stock Badge */}
        {stock > 0 && stock <= 3 && (
          <span className="absolute top-3 left-3 bg-amber-600 text-white text-[9px] font-display font-bold tracking-widest px-2 py-0.5 rounded shadow z-10">
            ÚLTIMAS {stock}
          </span>
        )}

        {isOutOfStock && (
          <span className="absolute top-3 left-3 bg-red-600 text-white text-[9px] font-display font-bold tracking-widest px-2.5 py-1 rounded shadow z-10">
            AGOTADO
          </span>
        )}

        {/* Favorite Heart Button (Top Right) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleFavorite) onToggleFavorite(product.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-200 z-20 cursor-pointer shadow-sm ${
            isFavorite
              ? 'bg-rose-50 text-rose-600 border border-rose-200 scale-110'
              : 'bg-white/85 text-gray-400 hover:text-rose-500 hover:bg-white border border-gray-200/80 hover:scale-105'
          }`}
          title={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
          <Heart 
            className={`w-4 h-4 transition-colors ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-gray-500'}`} 
          />
        </button>

        {/* Product Image */}
        <img
          src={imageUrl}
          alt={product.name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1544923246-77307dd654cb?w=800&auto=format&fit=crop&q=80';
          }}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
        />

        {/* Floating Reviews Tag */}
        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs border border-gray-200 shadow-xs px-2 py-1 rounded-full flex items-center gap-1 text-[10px] text-gray-700 font-sans font-bold">
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          <span>Reseñas</span>
        </div>
      </div>

      {/* Details & Info Section */}
      <div className="p-4 sm:p-5 flex-grow flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          <div className="text-[10px] text-[#3C6E71] font-bold uppercase tracking-widest font-sans truncate">
            {(product.brand || 'HOLUX').toUpperCase()} • {(product.categories?.name || 'AVENTURA').toUpperCase()}
          </div>
          
          <h3
            onClick={() => onProductClick && onProductClick(product)}
            className="font-sans font-bold text-gray-900 text-sm sm:text-base tracking-wide line-clamp-1 hover:text-[#3C6E71] transition-colors cursor-pointer"
            title={product.name}
          >
            {product.name}
          </h3>

          <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed font-sans">
            {product.description || "Equipo de alta montaña Holux, confeccionado con costuras reforzadas y materiales impermeables."}
          </p>
        </div>

        {/* Price & Installments */}
        <div className="space-y-2 pt-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-lg sm:text-xl font-black text-gray-950 font-sans">
              ${Math.round(effectivePrice).toLocaleString('es-AR')}
            </span>
            {discount > 0 && originalPrice > 0 && (
              <span className="text-xs text-gray-400 line-through font-sans">
                ${Math.round(originalPrice).toLocaleString('es-AR')}
              </span>
            )}
          </div>

          {/* Purple Installments Badge only if > 1 */}
          {installments > 1 && (
            <div>
              <span className="bg-[#EBDCF0] text-[#7E3793] text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase inline-block font-sans">
                {installments} cuotas fijas de ${Math.round(effectivePrice / installments).toLocaleString('es-AR')}
              </span>
            </div>
          )}

          <span className="text-[9px] text-gray-400 font-sans block leading-tight">
            CFT: 0% | Precio sin imp.: ${Math.round(effectivePrice * 0.79).toLocaleString('es-AR')}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onBuyNow) onBuyNow(product);
              else if (onProductClick) onProductClick(product);
            }}
            disabled={isOutOfStock}
            className={`w-full py-2.5 rounded-xl font-sans text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
              !isOutOfStock
                ? 'bg-[#1C2321] text-white hover:bg-black hover:shadow-md'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>{!isOutOfStock ? 'COMPRAR' : 'AGOTADO'}</span>
          </button>
        </div>
      </div>

    </div>
  );
}