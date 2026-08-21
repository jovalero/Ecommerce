import React, { useState } from 'react';
import { ShoppingBag, Star, Ruler, ChevronLeft, ChevronRight, Check, AlertCircle } from 'lucide-react';
import { formatMoney } from '../../utils/orderConstants';

export default function ProductDetailView({
  product,
  getProductDiscount,
  getProductImage,
  reviewsAverage,
  reviewsTotal,
  productReviews,
  selectedSize,
  setSelectedSize,
  sizeError,
  setSizeError,
  detailQuantity,
  setDetailQuantity,
  setSizeGuideCategory,
  setIsSizeGuideOpen,
  setCart,
  reviewError,
  reviewSuccess,
  newRating,
  setNewRating,
  newComment,
  setNewComment,
  handlePostReview,
  products,
  handleProductClick
}) {
  if (!product) return null;

  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const discount = product.offer_price > 0 && product.price > product.offer_price
    ? Math.round(((product.price - product.offer_price) / product.price) * 100)
    : 0;
  const effectivePrice = discount > 0 ? product.offer_price : product.price;
  const originalPrice = discount > 0 ? product.price : null;
  const rawVariants = product.variants;
  const hasExplicitVariants = Array.isArray(rawVariants) && rawVariants.length > 0;
  
  let variantsList = [];
  if (hasExplicitVariants) {
    variantsList = rawVariants.map((v, i) => {
      if (typeof v === 'string') {
        return { id: i, label: v, name: v, stock: typeof product.stock === 'number' ? product.stock : 10, isAvailable: (product.stock ?? 10) > 0 };
      }
      const label = v.name || v.label || v.size || `Opción ${i + 1}`;
      const stock = typeof v.stock === 'number' ? v.stock : (typeof product.stock === 'number' ? product.stock : 10);
      return {
        id: v.id || i,
        label,
        name: label,
        stock,
        isAvailable: stock > 0
      };
    });
  }

  const selectedVariantObj = variantsList.find(v => v.label === selectedSize);
  const effectiveStock = selectedVariantObj ? selectedVariantObj.stock : (product.stock || 0);

  const handleAddToCart = () => {
    if (effectiveStock <= 0) return;
    if (variantsList.length > 0 && !selectedSize) {
      setSizeError(true);
      return;
    }
    if (selectedVariantObj && selectedVariantObj.stock <= 0) {
      setSizeError(true);
      return;
    }
    setSizeError(false);

    setCart(prev => {
      const targetSize = variantsList.length > 0 ? selectedSize : 'Talla Única';
      const existing = prev.find(item => item.id === product.id && item.sizeLabel === targetSize);
      const maxStock = selectedVariantObj ? selectedVariantObj.stock : product.stock;
      if (existing) {
        const newQty = Math.min(maxStock, existing.quantity + detailQuantity);
        return prev.map(item =>
          item.id === product.id && item.sizeLabel === targetSize
            ? { ...item, quantity: newQty }
            : item
        );
      }
      return [
        ...prev,
        {
          ...product,
          sizeLabel: targetSize,
          quantity: detailQuantity
        }
      ];
    });
  };

  return (
    <main className="flex-grow bg-[#F2EFE9] py-10">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Back Link */}
        <button
          onClick={() => { window.location.hash = '#/catalogo'; }}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#3C6E71] hover:underline uppercase tracking-wider cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver al catálogo
        </button>

        {/* Main Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 bg-white border border-gray-200 rounded-xl p-6 sm:p-10 shadow-sm">
          
          {/* Image Gallery */}
          <div className="lg:col-span-7 space-y-3">
            {(() => {
              let imgList = [];
              if (Array.isArray(product.images) && product.images.length > 0) {
                imgList = product.images.filter(Boolean);
              } else if (product.image_url) {
                imgList = [product.image_url];
              } else {
                imgList = [getProductImage(product.name)];
              }
              if (imgList.length === 0) imgList = [getProductImage(product.name)];
              
              const activeImgUrl = imgList[activeImageIdx] || imgList[0];

              return (
                <div className="w-full flex flex-col items-center space-y-3">
                  <div className="relative w-full aspect-4/3 sm:aspect-square bg-gray-50 rounded-xl overflow-hidden border border-gray-150 group shadow-2xs">
                    {discount > 0 && (
                      <span className="absolute top-4 left-4 bg-[#3C6E71] text-white text-xs sm:text-sm font-sans font-semibold tracking-wider px-3 py-1 rounded-full shadow-sm z-10 select-none border border-white/15">
                        {discount}%
                      </span>
                    )}

                    {imgList.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageIdx((prev) => (prev > 0 ? prev - 1 : imgList.length - 1));
                          }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white text-gray-800 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer z-10 hover:scale-105"
                          title="Imagen anterior"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageIdx((prev) => (prev < imgList.length - 1 ? prev + 1 : 0));
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white text-gray-800 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer z-10 hover:scale-105"
                          title="Siguiente imagen"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}

                    <img
                      src={activeImgUrl}
                      alt={product.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = getProductImage(product.name);
                      }}
                      className="w-full h-full object-cover transition-opacity duration-300"
                    />
                  </div>

                  {/* Thumbnails Gallery under image */}
                  {imgList.length > 1 && (
                    <div className="w-full flex items-center justify-center gap-2.5 overflow-x-auto py-1 px-2 no-scrollbar">
                      {imgList.map((thumbUrl, idx) => {
                        const isSelected = activeImageIdx === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveImageIdx(idx)}
                            className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all duration-150 cursor-pointer bg-white shrink-0 ${
                              isSelected 
                                ? 'border-[#3C6E71] ring-2 ring-[#3C6E71]/20 shadow-xs scale-105 opacity-100' 
                                : 'border-gray-200 hover:border-gray-400 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={thumbUrl}
                              alt={`${product.name} - Miniatura ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Product Details & Actions */}
          <div className="lg:col-span-5 space-y-6 text-left flex flex-col justify-between">
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs text-[#3C6E71] font-bold uppercase tracking-wider font-sans">
                  {(product.brand || 'HOLUX').toUpperCase()} • {product.categories?.name?.toUpperCase() || 'AVENTURA'}
                </span>
                <h1 className="text-2xl sm:text-3xl font-display font-black text-gray-900 uppercase">
                  {product.name}
                </h1>
              </div>

              {/* Reviews Summary */}
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div className="flex text-amber-400">
                  {[1, 2, 3, 4, 5].map(st => (
                    <Star
                      key={st}
                      className={`w-4 h-4 ${st <= Math.round(reviewsAverage) ? 'fill-amber-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="font-bold text-gray-800">{Number(reviewsAverage).toFixed(1)}</span>
                <span className="text-gray-400">({reviewsTotal} opiniones)</span>
              </div>

              {/* Price & Installments */}
              <div className="space-y-1 pt-2 border-t border-gray-100">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-gray-900 font-sans">
                    {formatMoney(effectivePrice)}
                  </span>
                  {discount > 0 && originalPrice > 0 && (
                    <span className="text-base text-gray-400 line-through font-sans">
                      {formatMoney(originalPrice)}
                    </span>
                  )}
                </div>
                {Number(product.installments) > 1 && (
                  <div>
                    <span className="bg-[#EBDCF0] text-[#7E3793] text-xs font-bold px-2.5 py-1 rounded tracking-wide uppercase inline-block font-sans">
                      {product.installments} cuotas fijas de {formatMoney(product.price / product.installments)}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-sans pt-2">
                {product.description || 'Diseñado y testeado en la Patagonia argentina. Fabricado con tejidos resistentes a la abrasión, impermeabilidad certificada y costuras termoselladas.'}
              </p>

              {/* Size Selector */}
              {variantsList.length > 0 ? (
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                        Seleccionar Talle / Variante:
                      </label>
                      {selectedVariantObj && (
                        <span className={`text-[11px] font-bold ${selectedVariantObj.stock > 0 ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded' : 'text-red-600 bg-red-50 px-2 py-0.5 rounded'}`}>
                          {selectedVariantObj.stock > 0 ? `✓ ${selectedVariantObj.stock} disponibles` : '✕ Agotado'}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        const isFootwear = product.categories?.slug === 'calzado' || (product.name || '').toLowerCase().includes('bota');
                        setSizeGuideCategory(isFootwear ? 'footwear' : 'tops');
                        setIsSizeGuideOpen(true);
                      }}
                      className="text-xs text-[#3C6E71] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      Guía de talles
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {variantsList.map(v => {
                      const isSelected = selectedSize === v.label;
                      const isAvail = v.isAvailable;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          disabled={!isAvail}
                          onClick={() => {
                            if (!isAvail) return;
                            setSelectedSize(v.label);
                            setSizeError(false);
                          }}
                          className={`px-4 py-2.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 ${
                            !isAvail
                              ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed line-through opacity-60'
                              : isSelected
                                ? 'bg-[#1C2321] text-white border-[#1C2321] shadow-sm'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 cursor-pointer'
                          }`}
                        >
                          <span>{v.label}</span>
                          {isAvail && v.stock > 0 && v.stock <= 5 && (
                            <span className={`text-[9px] font-mono-custom ${isSelected ? 'text-amber-300' : 'text-amber-600'}`}>
                              (Últimas {v.stock})
                            </span>
                          )}
                          {!isAvail && (
                            <span className="text-[9px] text-gray-400 font-normal">
                              (Agotado)
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {sizeError && (
                    <p className="text-xs text-red-600 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Por favor, selecciona un talle disponible antes de agregar al carrito.
                    </p>
                  )}
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-100 flex items-center gap-2">
                  {product.stock > 0 ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                      ✓ En stock disponible
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
                      ✕ Sin stock disponible (Agotado)
                    </span>
                  )}
                </div>
              )}

              {/* Quantity */}
              <div className="flex items-center gap-4 pt-2">
                <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Cantidad:
                </label>
                <div className="flex items-center border border-gray-200 rounded-lg bg-white">
                  <button
                    onClick={() => setDetailQuantity(Math.max(1, detailQuantity - 1))}
                    className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-l cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 text-xs font-bold text-gray-900">{detailQuantity}</span>
                  <button
                    onClick={() => setDetailQuantity(detailQuantity + 1)}
                    className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-r cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons: Comprar Ahora (Directo) + Agregar al Carrito */}
            <div className="pt-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    handleAddToCart();
                    window.location.hash = '#/checkout';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={product.stock === 0}
                  className={`w-full sm:flex-grow h-12 rounded-xl font-display text-xs sm:text-sm font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer ${
                    product.stock > 0
                      ? 'bg-black hover:bg-neutral-800 text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <span>⚡</span>
                  <span>{product.stock > 0 ? 'COMPRAR AHORA' : 'PRODUCTO AGOTADO'}</span>
                </button>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className={`w-full h-11 rounded-xl font-sans text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                    product.stock > 0
                      ? 'bg-black hover:bg-neutral-800 text-white border-black hover:shadow-sm'
                      : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{product.stock > 0 ? 'AGREGAR AL CARRITO' : 'SIN STOCK'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-10 space-y-6 text-left">
          <h3 className="font-display font-bold text-lg text-gray-900 uppercase">
            Opiniones de clientes ({reviewsTotal})
          </h3>

          {/* Form */}
          <form onSubmit={handlePostReview} className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
            <h4 className="text-xs font-bold text-gray-800 uppercase">Deja tu valoración:</h4>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(st => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setNewRating(st)}
                  className="p-1 cursor-pointer text-amber-400"
                >
                  <Star className={`w-5 h-5 ${st <= newRating ? 'fill-amber-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
            <textarea
              required
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escribe tu experiencia con este producto..."
              className="w-full p-3 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-[#3C6E71]"
              rows={3}
            />
            {reviewError && <p className="text-xs text-red-600 font-bold">{reviewError}</p>}
            {reviewSuccess && <p className="text-xs text-emerald-600 font-bold">{reviewSuccess}</p>}
            <button
              type="submit"
              className="px-6 py-2 bg-[#1C2321] text-white text-xs font-bold font-display rounded-lg hover:bg-[#3C6E71] transition-colors cursor-pointer"
            >
              PUBLICAR RESEÑA
            </button>
          </form>

          {/* Reviews List */}
          <div className="space-y-4 pt-4">
            {productReviews.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Aún no hay reseñas para este producto.</p>
            ) : (
              productReviews.map((rev, idx) => (
                <div key={idx} className="p-4 border-b border-gray-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800">{rev.user_name || 'Cliente Verificado'}</span>
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map(st => (
                        <Star
                          key={st}
                          className={`w-3.5 h-3.5 ${st <= (rev.rating || 5) ? 'fill-amber-400' : 'text-gray-200'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{rev.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
