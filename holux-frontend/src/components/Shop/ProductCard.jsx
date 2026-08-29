import React, { memo } from 'react';
import { Heart, Star, Zap } from 'lucide-react';
import { productsMetadata } from '../../config/productsMetadata';
import { resolveProductImage } from '../../utils/bannerStorage';

export const ProductCard = memo(function ProductCard({
  product,
  isFavorite = false,
  onToggleFavorite,
  onProductClick,
  onAddToCart,
  onBuyNow
}) {
  const price = Number(product.price) || 0;
  const offerPrice = Number(product.offer_price) || 0;
  const explicitDiscount = Number(product.discount_percent || product.discount) || 0;

  let effectivePrice = price;
  let originalPrice = Number(product.original_price) || 0;
  let discount = 0;

  if (offerPrice > 0 && offerPrice < price) {
    effectivePrice = offerPrice;
    originalPrice = price;
    discount = Math.round(((price - offerPrice) / price) * 100);
  } else if (explicitDiscount > 0 && explicitDiscount < 100) {
    effectivePrice = Math.round(price * (1 - explicitDiscount / 100));
    originalPrice = price;
    discount = explicitDiscount;
  } else if (originalPrice > price) {
    effectivePrice = price;
    discount = Math.round(((originalPrice - price) / originalPrice) * 100);
  }

  const getProductImageFallback = (name = '') => {
    const cleanName = String(name).toLowerCase();
    if (cleanName.includes('dior') || cleanName.includes('sauvage') || cleanName.includes('fahrenheit')) {
      return 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&auto=format&fit=crop&q=80';
    }
    if (cleanName.includes('chanel') || cleanName.includes('bleu') || cleanName.includes('coco')) {
      return 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&auto=format&fit=crop&q=80';
    }
    if (cleanName.includes('baccarat') || cleanName.includes('rouge') || cleanName.includes('kurkdjian') || cleanName.includes('xerjoff')) {
      return 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=600&auto=format&fit=crop&q=80';
    }
    if (cleanName.includes('lattafa') || cleanName.includes('alhambra') || cleanName.includes('afnan') || cleanName.includes('wataniah') || cleanName.includes('asad')) {
      return 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&auto=format&fit=crop&q=80';
    }
    if (cleanName.includes('mujer') || cleanName.includes('chloe') || cleanName.includes('marina') || cleanName.includes('bourbon') || cleanName.includes('jadore')) {
      return 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=600&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&auto=format&fit=crop&q=80';
  };

  const resolveImg = resolveProductImage;

  const meta = productsMetadata[product.id] || {};
  const imageUrl = resolveImg(product.image_url)
    || (Array.isArray(product.images) && resolveImg(product.images[0]))
    || resolveImg(meta.image_url)
    || (Array.isArray(meta.images) && resolveImg(meta.images[0]))
    || product.image
    || getProductImageFallback(product.name);

  const netPrice = Math.round(effectivePrice * 0.79);
  const stock = Number(product.stock) || 0;
  const isOutOfStock = stock <= 0;

  return (
    <div className="group bg-white border border-gray-200/90 rounded-xl sm:rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-xl hover:border-gray-300 transition-all duration-300 relative text-left h-full">
      
      {/* 1. Imagen del producto (Uniforme aspect-[4/5] con fondo neutro) */}
      <div 
        onClick={() => onProductClick && onProductClick(product)}
        className="relative bg-[#F8F7F5] aspect-[4/5] w-full overflow-hidden border-b border-gray-150 group-hover:bg-[#F2EFE9]/60 transition-colors cursor-pointer"
      >
        {/* Discount Badge */}
        {discount > 0 && (
          <span className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 bg-[#3C6E71] text-white text-[10px] sm:text-[11px] font-sans font-semibold tracking-wider px-2.5 py-0.5 sm:px-3 sm:py-0.5 rounded-full shadow-2xs z-10 select-none border border-white/10">
            {discount}%
          </span>
        )}

        {/* Stock Status Badge */}
        {stock > 0 && stock <= 3 && (
          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-amber-600 text-white text-[8px] sm:text-[9px] font-display font-bold tracking-widest px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded shadow-xs z-10">
            ÚLTIMAS {stock}
          </span>
        )}

        {isOutOfStock && (
          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-red-600 text-white text-[8px] sm:text-[9px] font-display font-bold tracking-widest px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded shadow-xs z-10">
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
          className={`absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 rounded-full backdrop-blur-md transition-all duration-200 z-20 cursor-pointer shadow-xs ${
            isFavorite
              ? 'bg-rose-50 text-rose-600 border border-rose-200 scale-105'
              : 'bg-white/90 text-gray-400 hover:text-rose-500 hover:bg-white border border-gray-200/90 hover:scale-105'
          }`}
          title={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
          <Heart 
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-gray-500'}`} 
          />
        </button>

        {/* Product Image */}
        <img
          src={imageUrl}
          alt={product.name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = getProductImageFallback(product.name);
          }}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
        />

        {/* Badge de Reseñas */}
        <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 bg-white/95 backdrop-blur-xs border border-gray-200/90 shadow-2xs px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-1 text-[8px] sm:text-[10px] text-gray-700 font-sans font-bold select-none">
          <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-yellow-400 text-yellow-400" />
          <span className="hidden xs:inline">Reseñas</span>
        </div>
      </div>

      {/* 2. Información del producto organizada */}
      <div className="p-2.5 sm:p-4 md:p-5 flex-grow flex flex-col justify-between space-y-2 sm:space-y-3.5">
        
        <div className="space-y-1 sm:space-y-1.5">
          {/* Categoría */}
          <div className="text-[8px] sm:text-[10px] text-[#3C6E71] font-bold uppercase tracking-wider font-sans truncate">
            {(product.brand || 'HOLUX').toUpperCase()} • {(product.categories?.name || 'PERFUMERÍA').toUpperCase()}
          </div>
          
          {/* Nombre del producto */}
          <h3
            onClick={() => onProductClick && onProductClick(product)}
            className="font-sans font-bold text-gray-900 text-xs sm:text-sm md:text-base leading-snug line-clamp-1 hover:text-[#3C6E71] transition-colors cursor-pointer"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Descripción */}
          {product.description && (
            <p className="text-[9px] sm:text-[11px] text-gray-500 line-clamp-1 sm:line-clamp-2 leading-tight sm:leading-relaxed font-sans">
              {product.description}
            </p>
          )}
        </div>

        {/* 3. Precio e Información Fiscal */}
        <div className="space-y-1.5 pt-1 border-t border-gray-100">
          <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-sm sm:text-lg md:text-xl font-bold sm:font-black text-gray-950 font-sans tracking-tight">
              ${Math.round(effectivePrice).toLocaleString('es-AR')}
            </span>
            {discount > 0 && originalPrice > 0 && (
              <span className="text-[10px] sm:text-xs text-gray-400 line-through font-sans">
                ${Math.round(originalPrice).toLocaleString('es-AR')}
              </span>
            )}
          </div>

          {/* Cartel Morado de Cuotas Fijas */}
          {Number(product.installments) > 1 && (
            <div>
              <span className="bg-[#EBDCF0] text-[#7E3793] text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded tracking-tight uppercase inline-block font-sans">
                {product.installments} cuotas fijas de ${Math.round(effectivePrice / Number(product.installments)).toLocaleString('es-AR')}
              </span>
            </div>
          )}

          <div className="space-y-0.5 text-gray-400 font-sans text-[8.5px] sm:text-[9.5px] leading-tight">
            <div>CFTA: 0%</div>
            <div>Precio sin impuestos nacionales: ${netPrice.toLocaleString('es-AR')}</div>
          </div>
        </div>

        {/* 4. Botón "COMPRAR" */}
        <div className="pt-0.5 sm:pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onBuyNow) onBuyNow(product);
              else if (onProductClick) onProductClick(product);
            }}
            disabled={isOutOfStock}
            className={`w-full py-1.5 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl font-sans text-[10px] sm:text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shadow-xs ${
              !isOutOfStock
                ? 'bg-black text-white hover:bg-neutral-800 hover:shadow-md active:scale-[0.99]'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
            <span>{!isOutOfStock ? 'COMPRAR' : 'AGOTADO'}</span>
          </button>
        </div>

      </div>

    </div>
  );
});

export default ProductCard;