import React, { useState } from 'react';
import { Image, Link, Calendar, CheckCircle2, Eye, Save, Trash2, Plus, MoveUp, MoveDown, ShieldCheck, Sparkles, CreditCard, Megaphone } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

export default function BannerEditor({ heroSlides = [], setHeroSlides, promoBanner, setPromoBanner, tickerPhrases = [], setTickerPhrases, categoriesList = [], productsList = [] }) {
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
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const [linkType, setLinkType] = useState('category'); // 'category' | 'product' | 'external'
  const [selectedLinkVal, setSelectedLinkVal] = useState('');
  const [isActive, setIsActive] = useState(true);

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
    setHighlight(slide.highlight || '');
    setCta(slide.cta || '');
    setDesktopImage(slide.image || '');
    setMobileImage(slide.mobileImage || slide.image || '');
    setOverlayOpacity(slide.overlayOpacity !== undefined ? Number(slide.overlayOpacity) : ((slide.title || slide.desc) ? 45 : 0));
    setIsActive(slide.isActive !== false);
  };

  const handleSaveBannerForm = (e) => {
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
      overlayOpacity: Number(overlayOpacity),
      link: constructedLink,
      isActive
    };

    if (editingIndex !== null) {
      updated[editingIndex] = bannerObj;
    } else {
      updated.push(bannerObj);
    }

    setHeroSlides(updated);
    try {
      localStorage.setItem('holux_hero_slides', JSON.stringify(updated));
    } catch (err) {}
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
    try {
      localStorage.setItem('holux_hero_slides', JSON.stringify(updated));
    } catch (err) {}
  };

  const handleDelete = (idx) => {
    setConfirmMeta({
      title: '¿ELIMINAR BANNER?',
      message: `¿Estás seguro de que deseas eliminar permanentemente el banner #${idx + 1}? Esta acción no se puede deshacer.`
    });
    setConfirmAction(() => () => {
      const updated = heroSlides.filter((_, i) => i !== idx);
      setHeroSlides(updated);
      try {
        localStorage.setItem('holux_hero_slides', JSON.stringify(updated));
      } catch (err) {}
      if (editingIndex === idx) {
        setEditingIndex(null);
        setTitle('');
      }
    });
    setIsConfirmOpen(true);
  };

  const handleSaveAllGlobal = () => {
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
  };

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Top Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-base font-display font-bold text-gray-900 uppercase tracking-wider">
              EDITOR VISUAL DE BANNERS Y SLIDERS PRINCIPALES
            </h2>
            <span className="text-xs font-mono-custom font-bold bg-[#3C6E71]/10 text-[#3C6E71] px-2.5 py-0.5 rounded-full border border-[#3C6E71]/20">
              {heroSlides.length} banners activos
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Administrá imágenes de portada, promociones de cuotas y los avisos del cintillo superior.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setEditingIndex(null);
              setTitle('');
              setSpan('');
              setDesc('');
              setHighlight('');
              setCta('');
              setDesktopImage('');
              setMobileImage('');
            }}
            className="px-4 py-2 bg-[#3C6E71] hover:bg-[#2c5355] text-white font-display text-xs font-bold tracking-wider rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>NUEVO BANNER</span>
          </button>
        </div>
      </div>

      {savedMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>¡Todos los banners, ofertas de cuotas y cintillos se publicaron exitosamente en la tienda!</span>
        </div>
      )}

      {/* SECTION 1: PROMO BANNER DE CUOTAS (AHORA EN DISEÑO BLANCO ELEGANTE) */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#3C6E71]" />
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-gray-900">
              BANNER DESTACADO DE CUOTAS Y FINANCIACIÓN
            </h3>
          </div>
          <span className="text-[10px] font-bold font-mono-custom bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
            SECCIÓN HOME
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">ETIQUETA SUPERIOR (PILL)</label>
            <input
              type="text"
              value={promoTag}
              onChange={(e) => setPromoTag(e.target.value)}
              placeholder="Ej: PROMOCIÓN DE TEMPORADA"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-[#3C6E71] focus:bg-white transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">TÍTULO PRINCIPAL DE ANUNCIO</label>
            <input
              type="text"
              value={promoTitle}
              onChange={(e) => setPromoTitle(e.target.value)}
              placeholder="Ej: 6 CUOTAS SIN INTERÉS EN TODO EL CATÁLOGO"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-[#3C6E71] focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">DESCRIPCIÓN DE LA PROMOCIÓN</label>
          <textarea
            rows={2}
            value={promoDesc}
            onChange={(e) => setPromoDesc(e.target.value)}
            placeholder="Equípate hoy mismo y paga en cómodas cuotas fijas sin interés..."
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#3C6E71] focus:bg-white transition-all"
          />
        </div>

        <div className="pt-2 border-t border-gray-100 flex items-center">
          <label className="flex items-center gap-2.5 cursor-pointer font-bold text-xs text-gray-700 select-none">
            <input
              type="checkbox"
              checked={promoIsVisible}
              onChange={(e) => setPromoIsVisible(e.target.checked)}
              className="w-4 h-4 text-[#3C6E71] rounded border-gray-300 focus:ring-[#3C6E71] cursor-pointer"
            />
            <span>Mostrar este bloque de financiación en la portada principal</span>
          </label>
        </div>
      </div>

      {/* SECTION 2: PROMO TICKER PHRASES */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Megaphone className="w-4 h-4 text-[#3C6E71]" />
          <h3 className="font-display text-xs font-bold text-gray-900 uppercase tracking-wider">
            CINTILLO PROMOCIONAL SUPERIOR (ANUNCIOS & MARQUEE)
          </h3>
        </div>

        <div className="space-y-2">
          {tickerPhrases.map((phrase, idx) => (
            <div key={idx} className="flex items-center justify-between bg-gray-50 border border-gray-200 px-3.5 py-2 rounded-xl text-xs font-bold font-mono-custom text-gray-800">
              <span>{phrase}</span>
              <button
                type="button"
                onClick={() => handleRemoveTickerPhrase(idx)}
                className="text-gray-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                title="Eliminar anuncio"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-1">
          <input
            type="text"
            value={newTickerText}
            onChange={(e) => setNewTickerText(e.target.value)}
            placeholder="Ej: | ¡HASTA 12 CUOTAS SIN INTERÉS EN PRODUCTOS SELECCIONADOS!"
            className="flex-grow px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#3C6E71] focus:bg-white font-mono-custom transition-all"
          />
          <button
            type="button"
            onClick={handleAddTickerPhrase}
            className="px-4 py-2 bg-[#1C2321] hover:bg-black text-white text-xs font-display font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>AGREGAR</span>
          </button>
        </div>
      </div>

      {/* SECTION 3: BANNERS LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-display text-xs font-bold text-gray-700 uppercase tracking-wider">
            SLIDERS Y BANNERS PRINCIPALES DE PORTADA ({heroSlides.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {heroSlides.map((slide, idx) => (
            <div key={idx} className={`p-4 border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${slide.isActive === false ? 'bg-gray-100 opacity-60 border-gray-200' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'}`}>
              <div className="flex items-center gap-4">
                <div className="w-28 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 relative flex-shrink-0">
                  <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-1 bg-black/75 text-white font-mono-custom text-[9px] font-bold px-1.5 py-0.5 rounded">
                    #{idx + 1}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-gray-900 font-display line-clamp-1">{slide.title}</h4>
                  <p className="text-[10px] text-gray-500 font-mono-custom line-clamp-1">{slide.span}</p>
                  <span className="text-[9px] font-mono-custom text-[#3C6E71] block">LINK: {slide.link || 'Catálogo'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMove(idx, -1)}
                  disabled={idx === 0}
                  className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-xl disabled:opacity-30 cursor-pointer transition-colors"
                  title="Mover arriba"
                >
                  <MoveUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(idx, 1)}
                  disabled={idx === heroSlides.length - 1}
                  className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-xl disabled:opacity-30 cursor-pointer transition-colors"
                  title="Mover abajo"
                >
                  <MoveDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleEditBanner(idx)}
                  className="px-3.5 py-1.5 bg-[#1C2321] text-white rounded-xl text-xs font-bold font-display tracking-wider hover:bg-[#3C6E71] cursor-pointer transition-colors"
                >
                  EDITAR
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(idx)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl cursor-pointer transition-colors"
                  title="Eliminar banner"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EDIT MODAL / FORM */}
      {(editingIndex !== null || title === 'NUEVA COLECCIÓN') && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-display text-sm font-bold tracking-wider text-gray-900 uppercase">
              {editingIndex !== null ? `EDITANDO BANNER #${editingIndex + 1}` : 'NUEVO BANNER PROMOCIONAL'}
            </h3>
            <button
              type="button"
              onClick={() => { setEditingIndex(null); setTitle(''); }}
              className="text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
            >
              ✕ Cerrar
            </button>
          </div>

          <form onSubmit={handleSaveBannerForm} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  TÍTULO PRINCIPAL <span className="text-gray-400 font-normal lowercase">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: NUEVA COLECCIÓN (o dejar vacío)"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:border-[#3C6E71] focus:bg-white outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  SUBTÍTULO / TAG <span className="text-gray-400 font-normal lowercase">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={span}
                  onChange={(e) => setSpan(e.target.value)}
                  placeholder="Ej: EXCLUSIVO (o dejar vacío)"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:border-[#3C6E71] focus:bg-white outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  PALABRA DESTACADA <span className="text-gray-400 font-normal lowercase">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={highlight}
                  onChange={(e) => setHighlight(e.target.value)}
                  placeholder="Ej: TEMPORADA 2026 (o dejar vacío)"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:border-[#3C6E71] focus:bg-white outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  TEXTO DEL BOTÓN / CTA <span className="text-gray-400 font-normal lowercase">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  placeholder="Ej: EXPLORAR PERFUMES (o dejar vacío para banner limpio)"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:border-[#3C6E71] focus:bg-white outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                DESCRIPCIÓN <span className="text-gray-400 font-normal lowercase">(opcional)</span>
              </label>
              <textarea
                rows={2}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Texto explicativo adicional (o dejar vacío)"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-[#3C6E71] focus:bg-white outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* DESKTOP IMAGE PICKER */}
              <div className="space-y-2 bg-gray-50 p-4 border border-gray-200 rounded-xl">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">IMAGEN DESKTOP</label>
                
                {desktopImage && (
                  <div className="w-full h-24 rounded-lg overflow-hidden bg-white border border-gray-200 mb-2">
                    <img src={desktopImage} alt="Desktop Preview" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={desktopImage}
                    onChange={(e) => setDesktopImage(e.target.value)}
                    placeholder="URL de la imagen..."
                    className="flex-grow px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-mono-custom outline-none"
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
                    className="px-3 py-1.5 bg-[#1C2321] hover:bg-black text-white rounded-xl text-xs font-bold font-display cursor-pointer flex items-center gap-1 shrink-0 transition-colors"
                  >
                    <Image className="w-3.5 h-3.5" />
                    <span>SUBIR</span>
                  </label>
                </div>
              </div>

              {/* MOBILE IMAGE PICKER */}
              <div className="space-y-2 bg-gray-50 p-4 border border-gray-200 rounded-xl">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">IMAGEN MOBILE</label>
                
                {mobileImage && (
                  <div className="w-full h-24 rounded-lg overflow-hidden bg-white border border-gray-200 mb-2">
                    <img src={mobileImage} alt="Mobile Preview" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={mobileImage}
                    onChange={(e) => setMobileImage(e.target.value)}
                    placeholder="URL de la imagen mobile..."
                    className="flex-grow px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-mono-custom outline-none"
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
                    className="px-3 py-1.5 bg-[#1C2321] hover:bg-black text-white rounded-xl text-xs font-bold font-display cursor-pointer flex items-center gap-1 shrink-0 transition-colors"
                  >
                    <Image className="w-3.5 h-3.5" />
                    <span>SUBIR</span>
                  </label>
                </div>
              </div>
            </div>

            {/* OVERLAY OPACITY / TRANSPARENCY SLIDER */}
            <div className="space-y-2 bg-gray-50 p-4 border border-gray-200 rounded-xl">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block">
                  CAPA OSCURA / TRANSPARENCIA DEL BANNER: <span className="text-[#3C6E71] font-mono-custom font-bold">{overlayOpacity}%</span>
                </label>
                <span className="text-[10px] text-gray-500 font-sans font-medium">
                  {overlayOpacity === 0 ? '✨ 100% Nítido / Sin filtro oscuro' : `Filtro oscuro al ${overlayOpacity}%`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#3C6E71]"
              />
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {[
                  { label: '0% (100% Nítido / Solo Imagen)', val: 0 },
                  { label: '20% (Filtro Suave)', val: 20 },
                  { label: '40% (Equilibrado)', val: 40 },
                  { label: '60% (Contraste Alto)', val: 60 }
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => setOverlayOpacity(preset.val)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                      overlayOpacity === preset.val
                        ? 'bg-[#3C6E71] text-white border-[#3C6E71] shadow-xs'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* INTERNAL LINK SELECTOR */}
            <div className="bg-gray-50 p-4 border border-gray-200 rounded-xl space-y-3">
              <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block">
                REDIRECCIÓN DEL BOTÓN (LINK INTERNO O EXTERNO)
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setLinkType('category')}
                  className={`py-2 text-xs font-bold rounded-xl border cursor-pointer transition-all ${linkType === 'category' ? 'bg-[#3C6E71] text-white border-[#3C6E71] shadow-xs' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                >
                  CATEGORÍA
                </button>
                <button
                  type="button"
                  onClick={() => setLinkType('product')}
                  className={`py-2 text-xs font-bold rounded-xl border cursor-pointer transition-all ${linkType === 'product' ? 'bg-[#3C6E71] text-white border-[#3C6E71] shadow-xs' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                >
                  PRODUCTO
                </button>
                <button
                  type="button"
                  onClick={() => setLinkType('external')}
                  className={`py-2 text-xs font-bold rounded-xl border cursor-pointer transition-all ${linkType === 'external' ? 'bg-[#3C6E71] text-white border-[#3C6E71] shadow-xs' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                >
                  URL LIBRE
                </button>
              </div>

              {linkType === 'category' && (
                <select
                  value={selectedLinkVal}
                  onChange={(e) => setSelectedLinkVal(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none bg-white font-bold text-gray-800 cursor-pointer"
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
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none bg-white font-bold text-gray-800 cursor-pointer"
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
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none bg-white font-mono-custom"
                />
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#3C6E71] hover:bg-[#2c5355] text-white font-display text-xs font-bold tracking-wider rounded-xl shadow-xs cursor-pointer flex items-center gap-2 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>APLICAR AL CARRUSEL</span>
              </button>
              <button
                type="button"
                onClick={() => { setEditingIndex(null); setTitle(''); }}
                className="px-4 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                CANCELAR
              </button>
            </div>
          </form>
        </div>
      )}

      {/* UNIFIED GLOBAL SAVE BAR (LIMPIA Y PROFESIONAL) */}
      <div className="sticky bottom-4 bg-white/95 backdrop-blur-md border border-gray-200 p-4 rounded-2xl shadow-xl flex items-center justify-between z-20">
        <div>
          <h4 className="font-display text-xs font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#3C6E71]" />
            <span>CONTROL GLOBAL DE PUBLICACIÓN</span>
          </h4>
          <p className="text-[11px] text-gray-500">
            Aplica todos los cambios en portada, cuotas y cintillos con un solo clic.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setConfirmMeta({
              title: '¿PUBLICAR CAMBIOS EN LA TIENDA?',
              message: '¿Estás seguro de que deseas guardar y publicar todos los banners, promociones de cuotas y cintillos en la portada?'
            });
            setConfirmAction(() => () => handleSaveAllGlobal());
            setIsConfirmOpen(true);
          }}
          className="px-6 py-2.5 bg-[#3C6E71] hover:bg-[#2c5355] text-white font-display font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-all"
        >
          <Save className="w-4 h-4" />
          <span>GUARDAR TODOS LOS CAMBIOS</span>
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
