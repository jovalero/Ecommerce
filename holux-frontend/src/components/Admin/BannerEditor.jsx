import React, { useState } from 'react';
import { Image, Link, Calendar, CheckCircle2, Eye, Save, Trash2, Plus, MoveUp, MoveDown, ShieldCheck } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

export default function BannerEditor({ heroSlides, setHeroSlides, promoBanner, setPromoBanner, tickerPhrases = [], setTickerPhrases, categoriesList, productsList }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [savedMsg, setSavedMsg] = useState(false);
  const [newTickerText, setNewTickerText] = useState('');

  // Confirmation Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMeta, setConfirmMeta] = useState({ title: '', message: '' });

  // Form states for middle promo banner (6 cuotas)
  const [promoTag, setPromoTag] = useState(promoBanner?.tag || 'PROMOCIÓN DE TEMPORADA');
  const [promoTitle, setPromoTitle] = useState(promoBanner?.title || '6 CUOTAS SIN INTERÉS EN TODO EL CATÁLOGO');
  const [promoDesc, setPromoDesc] = useState(promoBanner?.description || 'Equípate hoy mismo y paga en cómodas cuotas fijas sin interés. Realizamos envíos de forma rápida a todo el territorio nacional.');
  const [promoIsVisible, setPromoIsVisible] = useState(promoBanner?.isVisible !== false);

  // Form states for selected banner
  const [title, setTitle] = useState('');
  const [span, setSpan] = useState('');
  const [desc, setDesc] = useState('');
  const [highlight, setHighlight] = useState('');
  const [cta, setCta] = useState('');
  const [desktopImage, setDesktopImage] = useState('');
  const [mobileImage, setMobileImage] = useState('');
  const [linkType, setLinkType] = useState('category'); // 'category' | 'product' | 'external'
  const [selectedLinkVal, setSelectedLinkVal] = useState('');
  const [isActive, setIsActive] = useState(true);

  const handleSavePromoBanner = (e) => {
    e.preventDefault();
    if (!setPromoBanner) return;
    setPromoBanner({
      tag: promoTag,
      title: promoTitle,
      description: promoDesc,
      isVisible: promoIsVisible
    });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const handleAddTickerPhrase = () => {
    if (!newTickerText.trim() || !setTickerPhrases) return;
    const phrase = newTickerText.startsWith('|') ? newTickerText.trim() : `| ${newTickerText.trim()}`;
    setTickerPhrases([...tickerPhrases, phrase]);
    setNewTickerText('');
  };

  const handleRemoveTickerPhrase = (idx) => {
    if (!setTickerPhrases) return;
    setTickerPhrases(tickerPhrases.filter((_, i) => i !== idx));
  };

  const handleEditBanner = (idx) => {
    const slide = heroSlides[idx];
    setEditingIndex(idx);
    setTitle(slide.title || '');
    setSpan(slide.span || '');
    setDesc(slide.desc || '');
    setHighlight(slide.highlight || 'NUEVA TEMPORADA');
    setCta(slide.cta || 'EXPLORAR CATÁLOGO');
    setDesktopImage(slide.image || '');
    setMobileImage(slide.mobileImage || slide.image || '');
    setIsActive(slide.isActive !== false);
  };

  const handleSaveBanner = (e) => {
    e.preventDefault();
    const updated = [...heroSlides];
    
    let constructedLink = '#/catalogo';
    if (linkType === 'category' && selectedLinkVal) {
      constructedLink = `#/catalogo?categoria=${selectedLinkVal}`;
    } else if (linkType === 'product' && selectedLinkVal) {
      constructedLink = `#/producto/${selectedLinkVal}`;
    } else if (linkType === 'external' && selectedLinkVal) {
      constructedLink = selectedLinkVal;
    }

    const bannerObj = {
      title,
      span,
      desc,
      highlight,
      cta,
      image: desktopImage,
      mobileImage,
      link: constructedLink,
      isActive
    };

    if (editingIndex !== null) {
      updated[editingIndex] = bannerObj;
    } else {
      updated.push(bannerObj);
    }

    setHeroSlides(updated);
    setEditingIndex(null);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const handleMove = (idx, direction) => {
    const updated = [...heroSlides];
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= updated.length) return;
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setHeroSlides(updated);
  };

  const handleDelete = (idx) => {
    if (!confirm('¿Seguro de eliminar este banner?')) return;
    const updated = heroSlides.filter((_, i) => i !== idx);
    setHeroSlides(updated);
  };

  return (
    <div className="space-y-6 text-left font-sans">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-display font-black text-gray-900 uppercase tracking-wide">
            EDITOR VISUAL DE BANNERS Y SLIDERS PRINCIPALES
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Administra imágenes para Desktop/Mobile, enlaces internos, y frases del cintillo superior (cuotas/promos).
          </p>
        </div>
        <button
          onClick={() => {
            setEditingIndex(null);
            setTitle('NUEVO BANNER');
            setSpan('COLECCIÓN 2026');
            setDesc('Descripción promocional...');
            setDesktopImage('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600');
            setMobileImage('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800');
          }}
          className="px-4 py-2 bg-[#3C6E71] text-white font-display text-xs font-bold tracking-wider rounded-lg shadow hover:bg-[#3C6E71]/90 flex items-center gap-2 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          NUEVO BANNER
        </button>
      </div>

      {/* MIDDLE PROMO BANNER EDITOR (6 CUOTAS SIN INTERÉS) */}
      <div className="bg-black text-white border border-gray-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <h3 className="font-display text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            💳 BANNER DESTACADO DE CUOTAS Y FINANCIACIÓN (PORTADA NEGRA)
          </h3>
          <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded">
            DESPLIEGUE EN HOME
          </span>
        </div>

        <form onSubmit={handleSavePromoBanner} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">ETIQUETA SUPERIOR (PILL)</label>
              <input
                type="text"
                required
                value={promoTag}
                onChange={(e) => setPromoTag(e.target.value)}
                placeholder="Ej: PROMOCIÓN DE TEMPORADA"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-xs font-bold text-white outline-none focus:border-[#3C6E71]"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">TÍTULO PRINCIPAL DE ANUNCIO</label>
              <input
                type="text"
                required
                value={promoTitle}
                onChange={(e) => setPromoTitle(e.target.value)}
                placeholder="Ej: 6 CUOTAS SIN INTERÉS EN TODO EL CATÁLOGO"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-xs font-bold text-white outline-none focus:border-[#3C6E71]"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">DESCRIPCIÓN DE LA PROMOCIÓN</label>
            <textarea
              rows={2}
              value={promoDesc}
              onChange={(e) => setPromoDesc(e.target.value)}
              placeholder="Equípate hoy mismo y paga en cómodas cuotas fijas sin interés..."
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-xs text-gray-300 outline-none focus:border-[#3C6E71]"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-800">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
              <input
                type="checkbox"
                checked={promoIsVisible}
                onChange={(e) => setPromoIsVisible(e.target.checked)}
                className="w-4 h-4 text-[#3C6E71] rounded border-gray-700 focus:ring-[#3C6E71]"
              />
              <span>Mostrar este banner de cuotas en la portada</span>
            </label>

            <button
              type="submit"
              className="px-5 py-2 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white font-display font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Save className="w-4 h-4" />
              GUARDAR BANNER DE CUOTAS
            </button>
          </div>
        </form>
      </div>

      {/* PROMO TICKER BANNER PHRASES EDITOR */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="font-display text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
          📢 EDITAR CINTILLO PROMOCIONAL SUPERIOR / INFERIOR (ANUNCIOS & CUOTAS)
        </h3>

        <div className="space-y-2">
          {tickerPhrases.map((phrase, idx) => (
            <div key={idx} className="flex items-center justify-between bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold font-mono-custom text-gray-800">
              <span>{phrase}</span>
              <button
                type="button"
                onClick={() => handleRemoveTickerPhrase(idx)}
                className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                title="Eliminar anuncio"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newTickerText}
            onChange={(e) => setNewTickerText(e.target.value)}
            placeholder="Ej: | ¡HASTA 12 CUOTAS SIN INTERÉS EN PRODUCTOS SELECCIONADOS!"
            className="flex-grow px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#3C6E71] font-mono-custom"
          />
          <button
            type="button"
            onClick={handleAddTickerPhrase}
            className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-display font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            AGREGAR ANUNCIO
          </button>
        </div>
      </div>

      {savedMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Banners de la tienda guardados exitosamente.
        </div>
      )}

      {/* BANNERS LIST TABLE / CARDS */}
      <div className="grid grid-cols-1 gap-4">
        {heroSlides.map((slide, idx) => (
          <div key={idx} className={`p-4 border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${slide.isActive === false ? 'bg-gray-100 opacity-60 border-gray-300' : 'bg-white border-gray-200 shadow-sm hover:shadow'}`}>
            <div className="flex items-center gap-4">
              <div className="w-24 h-14 rounded overflow-hidden bg-gray-900 relative flex-shrink-0">
                <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                <span className="absolute bottom-1 right-1 bg-black/70 text-white font-mono-custom text-[9px] px-1 rounded">
                  #{idx + 1}
                </span>
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-gray-900 font-display line-clamp-1">{slide.title}</h3>
                <p className="text-[10px] text-gray-500 font-mono-custom line-clamp-1">{slide.span}</p>
                <span className="text-[9px] font-mono-custom text-[#3C6E71] block">LINK: {slide.link || 'Catálogo'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleMove(idx, -1)}
                disabled={idx === 0}
                className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded disabled:opacity-30 cursor-pointer"
                title="Mover arriba"
              >
                <MoveUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleMove(idx, 1)}
                disabled={idx === heroSlides.length - 1}
                className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded disabled:opacity-30 cursor-pointer"
                title="Mover abajo"
              >
                <MoveDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleEditBanner(idx)}
                className="px-3 py-1.5 bg-[#3C6E71] text-white rounded text-xs font-bold font-display tracking-wider hover:bg-[#3C6E71]/90 cursor-pointer"
              >
                EDITAR
              </button>
              <button
                onClick={() => handleDelete(idx)}
                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* EDIT MODAL / FORM */}
      {(editingIndex !== null || title === 'NUEVO BANNER') && (
        <div className="bg-gray-50 border border-gray-300 rounded-xl p-6 space-y-4">
          <h3 className="font-display text-sm font-bold tracking-wider text-gray-900 uppercase border-b border-gray-200 pb-3">
            {editingIndex !== null ? `EDITANDO BANNER #${editingIndex + 1}` : 'NUEVO BANNER PROMOCIONAL'}
          </h3>

          <form onSubmit={handleSaveBanner} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">TÍTULO PRINCIPAL</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs font-bold text-gray-900 focus:border-[#3C6E71] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">SUBTÍTULO / TAG</label>
                <input
                  type="text"
                  required
                  value={span}
                  onChange={(e) => setSpan(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs font-bold text-gray-900 focus:border-[#3C6E71] outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">DESCRIPCIÓN</label>
              <textarea
                rows={2}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs text-gray-800 focus:border-[#3C6E71] outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* DESKTOP IMAGE PICKER */}
              <div className="space-y-2 bg-white p-4 border border-gray-200 rounded-lg">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">IMAGEN DESKTOP</label>
                
                {desktopImage && (
                  <div className="w-full h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 mb-2">
                    <img src={desktopImage} alt="Desktop Preview" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={desktopImage}
                    onChange={(e) => setDesktopImage(e.target.value)}
                    placeholder="URL de la foto o subir archivo ->"
                    className="flex-grow px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-mono-custom outline-none"
                  />
                  <input
                    type="file"
                    id="desktop-banner-file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) setDesktopImage(ev.target.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="desktop-banner-file"
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded text-xs font-bold font-display cursor-pointer flex items-center gap-1"
                  >
                    <Image className="w-3.5 h-3.5" />
                    SUBIR PC
                  </label>
                </div>
              </div>

              {/* MOBILE IMAGE PICKER */}
              <div className="space-y-2 bg-white p-4 border border-gray-200 rounded-lg">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">IMAGEN MOBILE</label>
                
                {mobileImage && (
                  <div className="w-full h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 mb-2">
                    <img src={mobileImage} alt="Mobile Preview" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={mobileImage}
                    onChange={(e) => setMobileImage(e.target.value)}
                    placeholder="URL de la foto o subir archivo ->"
                    className="flex-grow px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-mono-custom outline-none"
                  />
                  <input
                    type="file"
                    id="mobile-banner-file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) setMobileImage(ev.target.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="mobile-banner-file"
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded text-xs font-bold font-display cursor-pointer flex items-center gap-1"
                  >
                    <Image className="w-3.5 h-3.5" />
                    SUBIR PC
                  </label>
                </div>
              </div>
            </div>

            {/* INTERNAL LINK SELECTOR */}
            <div className="bg-white p-4 border border-gray-200 rounded-lg space-y-3">
              <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block">
                REDIRECCIÓN DEL BOTÓN (LINK INTERNO O EXTERNO)
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setLinkType('category')}
                  className={`py-2 text-xs font-bold rounded border cursor-pointer ${linkType === 'category' ? 'bg-[#3C6E71] text-white border-[#3C6E71]' : 'bg-gray-50 text-gray-700'}`}
                >
                  CATEGORÍA
                </button>
                <button
                  type="button"
                  onClick={() => setLinkType('product')}
                  className={`py-2 text-xs font-bold rounded border cursor-pointer ${linkType === 'product' ? 'bg-[#3C6E71] text-white border-[#3C6E71]' : 'bg-gray-50 text-gray-700'}`}
                >
                  PRODUCTO
                </button>
                <button
                  type="button"
                  onClick={() => setLinkType('external')}
                  className={`py-2 text-xs font-bold rounded border cursor-pointer ${linkType === 'external' ? 'bg-[#3C6E71] text-white border-[#3C6E71]' : 'bg-gray-50 text-gray-700'}`}
                >
                  URL LIBRE
                </button>
              </div>

              {linkType === 'category' && (
                <select
                  value={selectedLinkVal}
                  onChange={(e) => setSelectedLinkVal(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-xs outline-none bg-white font-bold"
                >
                  <option value="">Todas las categorías</option>
                  {(categoriesList || []).map(cat => (
                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
              )}

              {linkType === 'product' && (
                <select
                  value={selectedLinkVal}
                  onChange={(e) => setSelectedLinkVal(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-xs outline-none bg-white font-bold"
                >
                  <option value="">Seleccionar producto...</option>
                  {(productsList || []).map(prod => (
                    <option key={prod.id} value={prod.id}>{prod.name}</option>
                  ))}
                </select>
              )}

              {linkType === 'external' && (
                <input
                  type="text"
                  placeholder="https://..."
                  value={selectedLinkVal}
                  onChange={(e) => setSelectedLinkVal(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-xs outline-none font-mono-custom"
                />
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#3C6E71] hover:bg-[#3C6E71]/95 text-white font-display text-xs font-bold tracking-wider rounded shadow cursor-pointer flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                GUARDAR BANNER
              </button>
              <button
                type="button"
                onClick={() => setEditingIndex(null)}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded text-xs font-bold cursor-pointer"
              >
                CANCELAR
              </button>
            </div>
          </form>
        </div>
      )}

      {/* GLOBAL BOTTOM STICKY SAVE BAR */}
      <div className="sticky bottom-0 bg-[#1C2321] text-white p-4 rounded-xl border border-[#3C6E71]/30 shadow-2xl flex items-center justify-between z-20">
        <div>
          <h4 className="font-display text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            CONTROL GLOBAL DE GUARDADO Y PUBLICACIÓN
          </h4>
          <p className="text-[10px] text-gray-300">
            Aplica todos los cambios realizados en banners principales, cintillo promocional y banner de cuotas.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setConfirmMeta({
              title: '¿GUARDAR CAMBIOS EN LA TIENDA?',
              message: '¿Estás seguro de que deseas publicar todos los banners, cintillos promocionales y ofertas de cuotas modificadas en la portada de la tienda?'
            });
            setConfirmAction(() => () => {
              if (setPromoBanner) {
                setPromoBanner({
                  tag: promoTag,
                  title: promoTitle,
                  description: promoDesc,
                  isVisible: promoIsVisible
                });
              }
              setSavedMsg(true);
              setTimeout(() => setSavedMsg(false), 3500);
            });
            setIsConfirmOpen(true);
          }}
          className="px-6 py-2.5 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white font-display font-bold text-xs rounded-lg flex items-center gap-2 cursor-pointer shadow-lg transition-all"
        >
          <Save className="w-4 h-4" />
          GUARDAR TODOS LOS CAMBIOS
        </button>
      </div>

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          if (confirmAction) confirmAction();
        }}
        title={confirmMeta.title}
        message={confirmMeta.message}
      />
    </div>
  );
}
