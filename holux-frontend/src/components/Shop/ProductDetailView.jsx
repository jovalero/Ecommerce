import React from 'react';
import { ShoppingBag, Star, Ruler, ChevronLeft, Check, AlertCircle } from 'lucide-react';
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
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-4/3 sm:aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-150">
              {discount > 0 && (
                <span className="absolute top-4 left-4 bg-[#B85C38] text-white text-xs font-display font-bold tracking-widest px-3 py-1.5 rounded shadow z-10">
                  {discount}% OFF
                </span>
              )}
              <img
                src={product.image_url || getProductImage(product.name)}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
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
                {product.installments > 0 && (
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

            {/* Add to Cart Button */}
            <div className="pt-6">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`w-full py-4 rounded-xl font-display text-xs sm:text-sm font-bold tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                  product.stock > 0
                    ? 'bg-[#1C2321] text-white hover:bg-[#3C6E71]'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <ShoppingBag className="w-5 h-5" />
                <span>{product.stock > 0 ? 'AGREGAR AL CARRITO' : 'PRODUCTO AGOTADO'}</span>
              </button>
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
