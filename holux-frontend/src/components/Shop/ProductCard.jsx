import React from 'react';
import { Heart, Star, Zap } from 'lucide-react';

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
    <div className="group bg-white border border-gray-200/90 rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-xl hover:border-gray-300 transition-all duration-300 relative text-left h-full">
      
      {/* 1. Imagen del producto (Uniforme aspect-[4/5] con fondo neutro) */}
      <div 
        onClick={() => onProductClick && onProductClick(product)}
        className="relative bg-[#F8F7F5] aspect-[4/5] w-full overflow-hidden border-b border-gray-150 group-hover:bg-[#F2EFE9]/60 transition-colors cursor-pointer"
      >
        {/* Discount Badge */}
        {discount > 0 && (
          <span className="absolute top-3 left-3 bg-[#B85C38] text-white text-[10px] font-display font-extrabold tracking-widest px-2.5 py-1 rounded-md shadow-xs z-10">
            {discount}% OFF
          </span>
        )}

        {/* Stock Status Badge */}
        {stock > 0 && stock <= 3 && (
          <span className="absolute top-3 left-3 bg-amber-600 text-white text-[9px] font-display font-bold tracking-widest px-2 py-0.5 rounded shadow-xs z-10">
            ÚLTIMAS {stock}
          </span>
        )}

        {isOutOfStock && (
          <span className="absolute top-3 left-3 bg-red-600 text-white text-[9px] font-display font-bold tracking-widest px-2.5 py-1 rounded shadow-xs z-10">
            AGOTADO
          </span>
        )}

        {/* Botón de Favoritos (Corazón en esquina superior derecha) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleFavorite) onToggleFavorite(product.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-200 z-20 cursor-pointer shadow-xs ${
            isFavorite
              ? 'bg-rose-50 text-rose-600 border border-rose-200 scale-105'
              : 'bg-white/90 text-gray-400 hover:text-rose-500 hover:bg-white border border-gray-200/90 hover:scale-105'
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

        {/* Badge de Reseñas */}
        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs border border-gray-200/90 shadow-2xs px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px] text-gray-700 font-sans font-bold select-none">
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          <span>Reseñas</span>
        </div>
      </div>

      {/* 2. Información del producto organizada */}
      <div className="p-4 sm:p-5 flex-grow flex flex-col justify-between space-y-3.5">
        
        <div className="space-y-1.5">
          {/* Categoría */}
          <div className="text-[10px] text-[#3C6E71] font-bold uppercase tracking-wider font-sans truncate">
            {(product.brand || 'HOLUX').toUpperCase()} • {(product.categories?.name || 'AVENTURA').toUpperCase()}
          </div>
          
          {/* Nombre del producto */}
          <h3
            onClick={() => onProductClick && onProductClick(product)}
            className="font-sans font-bold text-gray-900 text-sm sm:text-base leading-snug line-clamp-1 hover:text-[#3C6E71] transition-colors cursor-pointer"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Descripción */}
          <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed font-sans">
            {product.description || "Equipo de alta montaña Holux, confeccionado con costuras reforzadas y materiales impermeables."}
          </p>
        </div>

        {/* 3. Precio e Información de Cuotas */}
        <div className="space-y-2 pt-1 border-t border-gray-100">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xl sm:text-2xl font-black text-gray-950 font-sans tracking-tight">
              ${Math.round(effectivePrice).toLocaleString('es-AR')}
            </span>
            {discount > 0 && originalPrice > 0 && (
              <span className="text-xs text-gray-400 line-through font-sans">
                ${Math.round(originalPrice).toLocaleString('es-AR')}
              </span>
            )}
          </div>

          {/* Información de cuotas */}
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

        {/* 4. Botón "COMPRAR" */}
        <div className="pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onBuyNow) onBuyNow(product);
              else if (onProductClick) onProductClick(product);
            }}
            disabled={isOutOfStock}
            className={`w-full py-2.5 sm:py-3 rounded-xl font-sans text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
              !isOutOfStock
                ? 'bg-black text-white hover:bg-neutral-800 hover:shadow-md active:scale-[0.99]'
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