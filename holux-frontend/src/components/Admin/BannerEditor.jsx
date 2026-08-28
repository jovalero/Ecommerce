import React, { useState, useEffect, useRef } from 'react';
import { Image, Link, Calendar, CheckCircle2, Eye, Save, Trash2, Plus, MoveUp, MoveDown, ShieldCheck, Sparkles, CreditCard, Megaphone, LayoutTemplate, Layers, Compass, Monitor, Smartphone, Tablet, ChevronRight, Grid, User } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { persistBannerData, uploadOrCompressBanner } from '../../utils/bannerStorage';

export default function BannerEditor({
  heroSlides = [],
  setHeroSlides,
  promoBanner,
  setPromoBanner,
  tickerPhrases = [],
  setTickerPhrases,
  categoriesList = [],
  productsList = [],
  homeSectionTitles,
  setHomeSectionTitles,
  gridPromoCards,
  setGridPromoCards,
  headerNavItems,
  setHeaderNavItems,
  API_BASE_URL,
  token
}) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const formRef = useRef(null);
  const [savedMsg, setSavedMsg] = useState(false);
  const [newTickerText, setNewTickerText] = useState('');

  const [previewDevice, setPreviewDevice] = useState('desktop');

  // Default Navigation Items
  const defaultNavItems = [
    { id: 'cat_dropdown', type: 'dropdown', label: 'CATEGORÍAS', isVisible: true, isDropdown: true, link: '#/catalogo', device: 'all' },
    { id: 'cat_perfumes-hombre', type: 'category', label: 'PERFUMES HOMBRE', slug: 'perfumes-hombre', link: '#/catalogo?categoria=perfumes-hombre', isVisible: true, device: 'all' },
    { id: 'cat_perfumes-mujer', type: 'category', label: 'PERFUMES MUJER', slug: 'perfumes-mujer', link: '#/catalogo?categoria=perfumes-mujer', isVisible: true, device: 'all' },
    { id: 'outlet', type: 'special', label: 'OUTLET', link: '#/catalogo?genero=outlet', isVisible: true, isButton: true, device: 'all' }
  ];

  // Navigation Items State (Header Navbar Customizer)
  const [navigationItems, setNavigationItems] = useState(() => {
    if (headerNavItems && headerNavItems.length > 0) return headerNavItems;
    try {
      const saved = localStorage.getItem('holux_header_nav_items');
      return saved ? JSON.parse(saved) : defaultNavItems;
    } catch (e) {
      return defaultNavItems;
    }
  });

  const updateNavItems = (newItems) => {
    setNavigationItems(newItems);
    if (setHeaderNavItems) setHeaderNavItems(newItems);
    persistBannerData('holux_header_nav_items', newItems);
  };

  const handleMoveNavItem = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= navigationItems.length) return;
    const copy = [...navigationItems];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;
    updateNavItems(copy);
  };

  const handleToggleNavItemVisibility = (index) => {
    const copy = [...navigationItems];
    copy[index] = { ...copy[index], isVisible: !copy[index].isVisible };
    updateNavItems(copy);
  };

  const handleUpdateNavItemField = (index, field, value) => {
    const copy = [...navigationItems];
    copy[index] = { ...copy[index], [field]: value };
    updateNavItems(copy);
  };

  const handleDeleteNavItem = (index) => {
    const copy = navigationItems.filter((_, i) => i !== index);
    updateNavItems(copy);
  };

  const handleAddCustomNavItem = () => {
    const newItem = {
      id: 'custom_' + Date.now(),
      type: 'custom',
      label: 'NUEVO ENLACE',
      link: '#/catalogo',
      isVisible: true,
      isButton: false
    };
    updateNavItems([...navigationItems, newItem]);
  };

  const handleSyncMissingCategories = () => {
    const existingSlugs = navigationItems.map(i => i.slug || (i.link?.includes('categoria=') ? i.link.split('categoria=')[1] : null)).filter(Boolean);
    const missing = (categoriesList || []).filter(c => !existingSlugs.includes(c.slug));
    if (missing.length === 0) return;
    const newItems = missing.map(c => ({
      id: 'cat_' + c.slug,
      type: 'category',
      label: c.name.toUpperCase(),
      slug: c.slug,
      link: `#/catalogo?categoria=${c.slug}`,
      isVisible: true
    }));
    updateNavItems([...navigationItems, ...newItems]);
  };

  // 3 Promotional Grid Cards State
  const [promoCards, setPromoCards] = useState(() => {
    if (gridPromoCards && gridPromoCards.length > 0) return gridPromoCards;
    try {
      const saved = localStorage.getItem('holux_grid_promo_cards');
      return saved ? JSON.parse(saved) : [
        {
          title: "FRAGANCIAS HOMBRE",
          span: "ELEGANCIA Y CARÁCTER",
          image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&auto=format&fit=crop&q=80",
          link: "#/catalogo?categoria=perfumes-hombre"
        },
        {
          title: "FRAGANCIAS MUJER",
          span: "SOFISTICACIÓN Y FRESCURA",
          image: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800&auto=format&fit=crop&q=80",
          link: "#/catalogo?categoria=perfumes-mujer"
        },
        {
          title: "EXCLUSIVIDAD Y TENDENCIA",
          span: "JOYAS DE LA PERFUMERÍA ORIENTAL",
          image: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=800&auto=format&fit=crop&q=80",
          link: "#/catalogo"
        }
      ];
    } catch (e) {
      return [
        {
          title: "FRAGANCIAS HOMBRE",
          span: "ELEGANCIA Y CARÁCTER",
          image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&auto=format&fit=crop&q=80",
          link: "#/catalogo?categoria=perfumes-hombre"
        },
        {
          title: "FRAGANCIAS MUJER",
          span: "SOFISTICACIÓN Y FRESCURA",
          image: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800&auto=format&fit=crop&q=80",
          link: "#/catalogo?categoria=perfumes-mujer"
        },
        {
          title: "EXCLUSIVIDAD Y TENDENCIA",
          span: "JOYAS DE LA PERFUMERÍA ORIENTAL",
          image: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=800&auto=format&fit=crop&q=80",
          link: "#/catalogo"
        }
      ];
    }
  });

  const handleUpdatePromoCard = (index, field, value) => {
    const updated = promoCards.map((card, i) => {
      if (i === index) {
        return { ...card, [field]: value };
      }
      return card;
    });
    setPromoCards(updated);
    if (setGridPromoCards) setGridPromoCards(updated);
    persistBannerData('holux_grid_promo_cards', updated);
  };

  // Section Headers State (Novedades & Destacados)
  const [novedadesTitle, setNovedadesTitle] = useState(() => {
    return homeSectionTitles?.novedadesTitle || 'NOVEDADES DE HOLUX';
  });
  const [novedadesSubtitle, setNovedadesSubtitle] = useState(() => {
    return homeSectionTitles?.novedadesSubtitle || 'Descubrí los últimos lanzamientos de nuestra colección';
  });
  const [destacadosTitle, setDestacadosTitle] = useState(() => {
    return homeSectionTitles?.destacadosTitle || 'PRODUCTOS DESTACADOS';
  });
  const [destacadosSubtitle, setDestacadosSubtitle] = useState(() => {
    return homeSectionTitles?.destacadosSubtitle || 'Una selección especial recomendada por nuestros expertos';
  });

  // Confirmation Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMeta, setConfirmMeta] = useState({ title: '', message: '' });

  // Form states for middle promo banner (6 cuotas)
  const [promoTag, setPromoTag] = useState(promoBanner?.tag || 'PROMOCIÓN DE TEMPORADA');
  const [promoTitle, setPromoTitle] = useState(promoBanner?.title || '6 CUOTAS SIN INTERÉS EN TODO EL CATÁLOGO');
  const [promoDesc, setPromoDesc] = useState(promoBanner?.description || 'Equípate hoy mismo y paga en cómodas cuotas fijas sin interés. Realizamos envíos de forma rápida a todo el territorio nacional.');
  const [promoIsVisible, setPromoIsVisible] = useState(promoBanner?.isVisible !== false);

  useEffect(() => {
    if (promoBanner) {
      if (promoBanner.tag !== undefined) setPromoTag(promoBanner.tag);
      if (promoBanner.title !== undefined) setPromoTitle(promoBanner.title);
      if (promoBanner.description !== undefined) setPromoDesc(promoBanner.description);
      if (promoBanner.isVisible !== undefined) setPromoIsVisible(promoBanner.isVisible);
    }
  }, [promoBanner]);

  const handleUpdatePromoBanner = (field, value) => {
    const updated = {
      tag: field === 'tag' ? value : promoTag,
      title: field === 'title' ? value : promoTitle,
      description: field === 'description' ? value : promoDesc,
      isVisible: field === 'isVisible' ? value : promoIsVisible
    };
    if (field === 'tag') setPromoTag(value);
    if (field === 'title') setPromoTitle(value);
    if (field === 'description') setPromoDesc(value);
    if (field === 'isVisible') setPromoIsVisible(value);

    if (setPromoBanner) setPromoBanner(updated);
    try {
      localStorage.setItem('holux_promo_banner', JSON.stringify(updated));
    } catch (e) {}
    persistBannerData('holux_promo_banner', updated);
  };

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
    const updated = [...tickerPhrases, phrase];
    setTickerPhrases(updated);
    try {
      localStorage.setItem('holux_ticker_phrases', JSON.stringify(updated));
    } catch (e) {}
    persistBannerData('holux_ticker_phrases', updated);
    setNewTickerText('');
  };

  const handleRemoveTickerPhrase = (idx) => {
    if (!setTickerPhrases) return;
    const updated = tickerPhrases.filter((_, i) => i !== idx);
    setTickerPhrases(updated);
    try {
      localStorage.setItem('holux_ticker_phrases', JSON.stringify(updated));
    } catch (e) {}
    persistBannerData('holux_ticker_phrases', updated);
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
    setIsFormOpen(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
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
    persistBannerData('holux_hero_slides', updated);
    setEditingIndex(null);
    setIsFormOpen(false);
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
    persistBannerData('holux_hero_slides', updated);
  };

  const handleDelete = (idx) => {
    setConfirmMeta({
      title: '¿ELIMINAR BANNER?',
      message: `¿Estás seguro de que deseas eliminar permanentemente el banner #${idx + 1}? Esta acción no se puede deshacer.`
    });
    setConfirmAction(() => () => {
      const updated = heroSlides.filter((_, i) => i !== idx);
      setHeroSlides(updated);
      persistBannerData('holux_hero_slides', updated);
      if (editingIndex === idx) {
        setEditingIndex(null);
        setTitle('');
      }
    });
    setIsConfirmOpen(true);
  };

  const handleSaveAllGlobal = () => {
    if (setPromoBanner) {
      const promoObj = {
        tag: promoTag,
        title: promoTitle,
        description: promoDesc,
        isVisible: promoIsVisible
      };
      setPromoBanner(promoObj);
      persistBannerData('holux_promo_banner', promoObj);
    }
    const updatedTitles = {
      novedadesTitle,
      novedadesSubtitle,
      destacadosTitle,
      destacadosSubtitle
    };
    if (setHomeSectionTitles) setHomeSectionTitles(updatedTitles);
    persistBannerData('holux_home_section_titles', updatedTitles);

    if (setGridPromoCards) setGridPromoCards(promoCards);
    persistBannerData('holux_grid_promo_cards', promoCards);

    persistBannerData('holux_hero_slides', heroSlides);
    persistBannerData('holux_ticker_phrases', tickerPhrases);
    persistBannerData('holux_header_nav_items', navigationItems);

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
              EDITOR VISUAL DE BANNERS Y MENÚ DE NAVEGACIÓN
            </h2>
            <span className="text-xs font-mono-custom font-bold bg-[#3C6E71]/10 text-[#3C6E71] px-2.5 py-0.5 rounded-full border border-[#3C6E71]/20">
              {heroSlides.length} banners activos
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Administrá el menú superior, imágenes de portada, promociones de cuotas y avisos de la tienda.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={async () => {
              const compressDataUrl = (dataUrl, maxWidth = 1200, maxHeight = 500, quality = 0.55) => {
                return new Promise((resolve) => {
                  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) return resolve(dataUrl);
                  const img = new window.Image();
                  img.onload = () => {
                    let width = img.width;
                    let height = img.height;
                    if (width > maxWidth) {
                      height = Math.round((height * maxWidth) / width);
                      width = maxWidth;
                    }
                    if (height > maxHeight) {
                      width = Math.round((width * maxHeight) / height);
                      height = maxHeight;
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                  };
                  img.onerror = () => resolve(dataUrl);
                  img.src = dataUrl;
                });
              };

              let rawHero = JSON.parse(localStorage.getItem('holux_hero_slides') || '[]');
              let rawGrid = JSON.parse(localStorage.getItem('holux_grid_promo_cards') || '[]');

              for (let i = 0; i < rawHero.length; i++) {
                if (rawHero[i].image) rawHero[i].image = await compressDataUrl(rawHero[i].image, 1200, 500, 0.55);
                if (rawHero[i].mobileImage) rawHero[i].mobileImage = await compressDataUrl(rawHero[i].mobileImage, 600, 600, 0.55);
              }

              for (let i = 0; i < rawGrid.length; i++) {
                if (rawGrid[i].image) rawGrid[i].image = await compressDataUrl(rawGrid[i].image, 600, 600, 0.55);
              }

              const payload = JSON.stringify({
                hero_slides: rawHero,
                grid_cards: rawGrid,
                promo_banner: JSON.parse(localStorage.getItem('holux_promo_banner') || '{}'),
                section_titles: JSON.parse(localStorage.getItem('holux_home_section_titles') || '{}'),
                ticker: JSON.parse(localStorage.getItem('holux_ticker_phrases') || '[]'),
                header_nav: JSON.parse(localStorage.getItem('holux_header_nav_items') || '[]')
              });

              navigator.clipboard.writeText(payload);
              alert('¡Diseño optimizado y copiado con éxito! Pegalo en el chat de Antigravity.');
            }}
            className="px-4 py-2 bg-[#3C6E71] hover:bg-[#284B63] text-white font-display text-xs font-bold tracking-wider rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all"
            title="Copia la configuración exacta de tus banners locales para subirla a Vercel"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>COPIAR DISEÑO PARA VERCEL</span>
          </button>

          <button
            onClick={handleSaveAllGlobal}
            className="px-4 py-2 bg-[#1C2321] hover:bg-black text-white font-display text-xs font-bold tracking-wider rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>GUARDAR TODOS LOS CAMBIOS</span>
          </button>

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
              setOverlayOpacity(0);
              setIsFormOpen(true);
              setTimeout(() => {
                formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 50);
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
          <span>¡Todos los cambios de menú, banners, ofertas y textos se publicaron exitosamente en la tienda!</span>
        </div>
      )}

      {/* SECTION 0: GESTOR Y ORDENADOR DE LA BARRA DE NAVEGACIÓN (HEADER NAVBAR) */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#3C6E71]" />
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-gray-900">
              BARRA DE NAVEGACIÓN SUPERIOR (ORDEN Y ENLACES DEL MENÚ)
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSyncMissingCategories}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-[10px] font-bold font-display cursor-pointer transition-colors"
            >
              🔄 SINCRONIZAR CATEGORÍAS
            </button>
            <button
              type="button"
              onClick={handleAddCustomNavItem}
              className="px-3 py-1.5 bg-[#3C6E71] hover:bg-[#2b5153] text-white rounded-xl text-[10px] font-bold font-display cursor-pointer transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ AGREGAR ENLACE</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            Personalizá los botones del menú superior y del menú móvil. Podés cambiar el orden con las flechas, ocultar o mostrar enlaces, y previsualizar cómo se ve en cada pantalla.
          </p>

          {/* Device Preview Switcher Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl shrink-0 border border-gray-200">
            <button
              type="button"
              onClick={() => setPreviewDevice('desktop')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-display flex items-center gap-1.5 transition-all cursor-pointer ${
                previewDevice === 'desktop' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5 text-[#3C6E71]" />
              <span>Computadora</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('tablet')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-display flex items-center gap-1.5 transition-all cursor-pointer ${
                previewDevice === 'tablet' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Tablet className="w-3.5 h-3.5 text-[#3C6E71]" />
              <span>Tablet</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('mobile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-display flex items-center gap-1.5 transition-all cursor-pointer ${
                previewDevice === 'mobile' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-[#3C6E71]" />
              <span>Móvil (Drawer)</span>
            </button>
          </div>
        </div>

        {/* Live Device Previews */}
        {previewDevice === 'desktop' && (
          <div className="bg-[#1C2321] p-3.5 rounded-2xl flex items-center justify-between overflow-x-auto shadow-inner border border-white/10 transition-all">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-[9px] text-white font-bold">H</div>
              <span className="font-display text-xs font-bold text-white tracking-widest">HOLUX</span>
            </div>
            <div className="flex items-center gap-4 shrink-0 px-4">
              {navigationItems.filter(i => i.isVisible !== false && i.device !== 'mobile').map((item, idx) => (
                <span
                  key={idx}
                  className={`font-display text-[11px] font-bold tracking-wider ${
                    item.isButton || item.type === 'special'
                      ? 'px-2.5 py-0.5 border border-[#3C6E71] text-[#3C6E71] rounded'
                      : item.isDropdown || item.type === 'dropdown'
                      ? 'text-[#F2EFE9] flex items-center gap-0.5'
                      : 'text-gray-300'
                  }`}
                >
                  {item.label}
                  {(item.isDropdown || item.type === 'dropdown') && ' ▾'}
                </span>
              ))}
            </div>
            <div className="text-[10px] text-emerald-400 font-mono-custom shrink-0 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              DESKTOP
            </div>
          </div>
        )}

        {previewDevice === 'tablet' && (
          <div className="max-w-2xl mx-auto bg-[#1C2321] p-3 rounded-2xl flex items-center justify-between shadow-inner border border-white/10 transition-all">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-[9px] text-white font-bold">H</div>
              <span className="font-display text-xs font-bold text-white tracking-widest">HOLUX</span>
            </div>
            <div className="flex items-center gap-3 shrink-0 px-2">
              {navigationItems.filter(i => i.isVisible !== false && i.device !== 'mobile').slice(0, 4).map((item, idx) => (
                <span
                  key={idx}
                  className={`font-display text-[10px] font-bold tracking-wider ${
                    item.isButton || item.type === 'special'
                      ? 'px-2 py-0.5 border border-[#3C6E71] text-[#3C6E71] rounded'
                      : item.isDropdown || item.type === 'dropdown'
                      ? 'text-[#F2EFE9] flex items-center gap-0.5'
                      : 'text-gray-300'
                  }`}
                >
                  {item.label}
                </span>
              ))}
            </div>
            <div className="text-[10px] text-amber-400 font-mono-custom shrink-0 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              TABLET
            </div>
          </div>
        )}

        {previewDevice === 'mobile' && (
          <div className="flex flex-col items-center justify-center py-2">
            {/* Smartphone Mockup Frame */}
            <div className="w-full max-w-[320px] bg-[#1C2321] text-white rounded-3xl p-4 shadow-2xl border-4 border-gray-800 space-y-3 font-sans transition-all">
              {/* Phone Top Notch */}
              <div className="w-24 h-4 bg-gray-800 rounded-full mx-auto -mt-2 mb-2" />
              
              {/* Header Drawer in Phone */}
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-[9px] text-white font-bold">H</div>
                  <span className="font-display text-xs font-bold tracking-wider">HOLUX</span>
                </div>
                <div className="text-[10px] bg-[#3C6E71]/20 text-[#3C6E71] px-2 py-0.5 rounded font-bold">
                  MÓVIL
                </div>
              </div>

              {/* Catalogo general link */}
              <div className="py-2 px-3 rounded-xl bg-white/10 text-white flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <Grid className="w-3.5 h-3.5 text-[#3C6E71]" />
                  <span>TODO EL CATÁLOGO</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[#3C6E71]" />
              </div>

              {/* Dynamic Items list */}
              <div className="space-y-1 pt-1">
                <span className="text-[9px] font-bold text-[#3C6E71] uppercase tracking-widest block px-1">
                  MENÚ Y CATEGORÍAS
                </span>
                <div className="space-y-1">
                  {navigationItems.filter(i => i.isVisible !== false && i.device !== 'desktop' && !i.isButton && i.type !== 'special').map((item, idx) => (
                    <div
                      key={idx}
                      className="py-1.5 px-3 rounded-lg bg-white/5 text-gray-200 flex items-center justify-between text-xs font-bold"
                    >
                      <span>{item.label}</span>
                      <ChevronRight className="w-3 h-3 text-gray-500" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Outlet button if visible */}
              {navigationItems.some(i => (i.isButton || i.type === 'special') && i.isVisible !== false && i.device !== 'desktop') && (
                <div className="pt-1">
                  <div className="py-2 px-3 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center justify-between text-xs font-bold">
                    <span>{navigationItems.find(i => (i.isButton || i.type === 'special'))?.label || 'OUTLET'}</span>
                    <span className="text-[9px] bg-[#B85C38] text-white px-1.5 py-0.5 rounded font-bold">HOT 🔥</span>
                  </div>
                </div>
              )}
            </div>
            <span className="text-[10px] text-gray-400 font-mono-custom mt-2">
              (VISTA PREVIA DEL MENÚ LATERAL MÓVIL)
            </span>
          </div>
        )}

        {/* List of Navigation Items to Reorder & Edit */}
        <div className="space-y-2.5">
          {navigationItems.map((item, idx) => (
            <div
              key={item.id || idx}
              className={`p-3.5 rounded-xl border flex flex-col xl:flex-row xl:items-center justify-between gap-3 transition-all ${
                item.isVisible === false ? 'bg-gray-100 border-gray-200 opacity-60' : 'bg-gray-50 border-gray-200'
              }`}
            >
              {/* Left Order & Visibility Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-mono-custom font-bold bg-white text-gray-700 px-2 py-1 rounded border border-gray-200">
                  #{idx + 1}
                </span>
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMoveNavItem(idx, -1)}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    idx === 0 ? 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed' : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200 cursor-pointer shadow-xs'
                  }`}
                  title="Mover hacia la izquierda / arriba"
                >
                  <MoveUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === navigationItems.length - 1}
                  onClick={() => handleMoveNavItem(idx, 1)}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    idx === navigationItems.length - 1 ? 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed' : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200 cursor-pointer shadow-xs'
                  }`}
                  title="Mover hacia la derecha / abajo"
                >
                  <MoveDown className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleNavItemVisibility(idx)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-display transition-colors cursor-pointer border flex items-center gap-1 ${
                    item.isVisible !== false
                      ? 'bg-[#3C6E71]/10 border-[#3C6E71]/30 text-[#3C6E71]'
                      : 'bg-gray-200 border-gray-300 text-gray-600'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>{item.isVisible !== false ? 'VISIBLE' : 'OCULTO'}</span>
                </button>
              </div>

              {/* Middle Inputs: Label, Link, Type, Device */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 flex-grow">
                <div>
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">ETIQUETA / TEXTO</label>
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => handleUpdateNavItemField(idx, 'label', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-900 outline-none focus:border-[#3C6E71]"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">DESTINO / LINK</label>
                  <input
                    type="text"
                    value={item.link || ''}
                    disabled={item.isDropdown || item.type === 'dropdown'}
                    onChange={(e) => handleUpdateNavItemField(idx, 'link', e.target.value)}
                    placeholder={item.isDropdown ? '(Desplegable de categorías)' : '#/catalogo...'}
                    className={`w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono-custom outline-none focus:border-[#3C6E71] ${
                      item.isDropdown ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'text-gray-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">ESTILO VISUAL</label>
                  <select
                    value={item.isDropdown ? 'dropdown' : item.isButton || item.type === 'special' ? 'button' : 'link'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'dropdown') {
                        handleUpdateNavItemField(idx, 'isDropdown', true);
                        handleUpdateNavItemField(idx, 'isButton', false);
                        handleUpdateNavItemField(idx, 'type', 'dropdown');
                      } else if (val === 'button') {
                        handleUpdateNavItemField(idx, 'isButton', true);
                        handleUpdateNavItemField(idx, 'isDropdown', false);
                        handleUpdateNavItemField(idx, 'type', 'special');
                      } else {
                        handleUpdateNavItemField(idx, 'isButton', false);
                        handleUpdateNavItemField(idx, 'isDropdown', false);
                        handleUpdateNavItemField(idx, 'type', 'category');
                      }
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800 outline-none focus:border-[#3C6E71] cursor-pointer"
                  >
                    <option value="link">Enlace Normal</option>
                    <option value="dropdown">Desplegable (Categorías ▾)</option>
                    <option value="button">Botón Destacado (Estilo Outlet)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">DISPOSITIVOS</label>
                  <select
                    value={item.device || 'all'}
                    onChange={(e) => handleUpdateNavItemField(idx, 'device', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800 outline-none focus:border-[#3C6E71] cursor-pointer"
                  >
                    <option value="all">📱 💻 Todos los dispositivos</option>
                    <option value="desktop">💻 Solo Computadora</option>
                    <option value="mobile">📱 Solo Móvil / Tablet</option>
                  </select>
                </div>
              </div>

              {/* Right Delete action */}
              <div className="flex items-center justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => handleDeleteNavItem(idx)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Eliminar enlace del menú"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

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
              onChange={(e) => handleUpdatePromoBanner('tag', e.target.value)}
              placeholder="Ej: PROMOCIÓN DE TEMPORADA"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-[#3C6E71] focus:bg-white transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">TÍTULO PRINCIPAL DE ANUNCIO</label>
            <input
              type="text"
              value={promoTitle}
              onChange={(e) => handleUpdatePromoBanner('title', e.target.value)}
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
            onChange={(e) => handleUpdatePromoBanner('description', e.target.value)}
            placeholder="Equípate hoy mismo y paga en cómodas cuotas fijas sin interés..."
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#3C6E71] focus:bg-white transition-all"
          />
        </div>

        <div className="pt-2 border-t border-gray-100 flex items-center">
          <label className="flex items-center gap-2.5 cursor-pointer font-bold text-xs text-gray-700 select-none">
            <input
              type="checkbox"
              checked={promoIsVisible}
              onChange={(e) => handleUpdatePromoBanner('isVisible', e.target.checked)}
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

      {/* SECTION 3: TÍTULOS Y SUBTÍTULOS DE SECCIONES DE PORTADA */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-[#3C6E71]" />
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-gray-900">
              TÍTULOS Y SUBTÍTULOS DE SECCIONES DE PORTADA
            </h3>
          </div>
          <span className="text-[10px] font-bold font-mono-custom bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
            SECCIONES HOME
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* BLOQUE NOVEDADES */}
          <div className="bg-gray-50 p-4 border border-gray-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#3C6E71]" />
              <h4 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider">
                1. Carrusel de Novedades / Lanzamientos
              </h4>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                TÍTULO PRINCIPAL
              </label>
              <input
                type="text"
                value={novedadesTitle}
                onChange={(e) => {
                  setNovedadesTitle(e.target.value);
                  const updated = { novedadesTitle: e.target.value, novedadesSubtitle, destacadosTitle, destacadosSubtitle };
                  if (setHomeSectionTitles) setHomeSectionTitles(updated);
                  localStorage.setItem('holux_home_section_titles', JSON.stringify(updated));
                }}
                placeholder="Ej: NOVEDADES DE HOLUX"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:border-[#3C6E71] outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                SUBTÍTULO / DESCRIPCIÓN
              </label>
              <input
                type="text"
                value={novedadesSubtitle}
                onChange={(e) => {
                  setNovedadesSubtitle(e.target.value);
                  const updated = { novedadesTitle, novedadesSubtitle: e.target.value, destacadosTitle, destacadosSubtitle };
                  if (setHomeSectionTitles) setHomeSectionTitles(updated);
                  localStorage.setItem('holux_home_section_titles', JSON.stringify(updated));
                }}
                placeholder="Ej: DESCUBRÍ LOS ÚLTIMOS LANZAMIENTOS DE NUESTRA COLECCIÓN"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 focus:border-[#3C6E71] outline-none"
              />
            </div>
          </div>

          {/* BLOQUE DESTACADOS */}
          <div className="bg-gray-50 p-4 border border-gray-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
              <Eye className="w-3.5 h-3.5 text-[#3C6E71]" />
              <h4 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider">
                2. Carrusel de Productos Destacados
              </h4>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                TÍTULO PRINCIPAL
              </label>
              <input
                type="text"
                value={destacadosTitle}
                onChange={(e) => {
                  setDestacadosTitle(e.target.value);
                  const updated = { novedadesTitle, novedadesSubtitle, destacadosTitle: e.target.value, destacadosSubtitle };
                  if (setHomeSectionTitles) setHomeSectionTitles(updated);
                  localStorage.setItem('holux_home_section_titles', JSON.stringify(updated));
                }}
                placeholder="Ej: PRODUCTOS DESTACADOS"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:border-[#3C6E71] outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                SUBTÍTULO / DESCRIPCIÓN
              </label>
              <input
                type="text"
                value={destacadosSubtitle}
                onChange={(e) => {
                  setDestacadosSubtitle(e.target.value);
                  const updated = { novedadesTitle, novedadesSubtitle, destacadosTitle, destacadosSubtitle: e.target.value };
                  if (setHomeSectionTitles) setHomeSectionTitles(updated);
                  localStorage.setItem('holux_home_section_titles', JSON.stringify(updated));
                }}
                placeholder="Ej: UNA SELECCIÓN ESPECIAL RECOMENDADA POR NUESTROS EXPERTOS"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 focus:border-[#3C6E71] outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: 3 TARJETAS PROMOCIONALES DESTACADAS (GRID DE PORTADA) */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#3C6E71]" />
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-gray-900">
              3 TARJETAS PROMOCIONALES DESTACADAS (GRID DE PORTADA)
            </h3>
          </div>
          <span className="text-[10px] font-bold font-mono-custom bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
            3 COLUMNAS HOME
          </span>
        </div>

        <p className="text-xs text-gray-500">
          Modificá las imágenes, títulos y enlaces de las 3 tarjetas de colecciones o categorías en la página de inicio.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {promoCards.map((card, idx) => (
            <div key={idx} className="bg-gray-50 p-4 border border-gray-200 rounded-2xl space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <span className="font-display text-xs font-bold text-gray-800 uppercase tracking-wider">
                    TARJETA #{idx + 1}
                  </span>
                  <span className="text-[10px] font-mono-custom font-bold bg-[#3C6E71]/10 text-[#3C6E71] px-2 py-0.5 rounded">
                    Columna {idx + 1}
                  </span>
                </div>

                {/* Card Preview */}
                <div className="relative w-full h-36 rounded-xl overflow-hidden bg-black border border-gray-200 shadow-inner group">
                  <img src={card.image} alt={card.title} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-all" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 text-left space-y-0.5">
                    <span className="text-[9px] text-orange-200 font-bold uppercase tracking-widest block">
                      {card.span || 'ETIQUETA'}
                    </span>
                    <h4 className="text-sm font-display font-bold text-white uppercase">
                      {card.title || 'TÍTULO'}
                    </h4>
                  </div>
                </div>

                {/* Inputs */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    TÍTULO PRINCIPAL
                  </label>
                  <input
                    type="text"
                    value={card.title}
                    onChange={(e) => handleUpdatePromoCard(idx, 'title', e.target.value)}
                    placeholder="Ej: PERFUMES HOMBRE"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:border-[#3C6E71] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    SUBTÍTULO / ETIQUETA
                  </label>
                  <input
                    type="text"
                    value={card.span}
                    onChange={(e) => handleUpdatePromoCard(idx, 'span', e.target.value)}
                    placeholder="Ej: COLECCIÓN EXCLUSIVA"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-[#3C6E71] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block">
                      IMAGEN
                    </label>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono-custom">
                      📐 Medida: 800 × 1000 px
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={card.image}
                      onChange={(e) => handleUpdatePromoCard(idx, 'image', e.target.value)}
                      placeholder="URL de la imagen..."
                      className="flex-grow px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-mono-custom outline-none"
                    />
                    <input
                      type="file"
                      id={`promo-card-file-${idx}`}
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await uploadOrCompressBanner(file, API_BASE_URL, token);
                          if (url) handleUpdatePromoCard(idx, 'image', url);
                        }
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor={`promo-card-file-${idx}`}
                      className="px-2.5 py-1.5 bg-[#1C2321] hover:bg-black text-white rounded-xl text-[10px] font-bold font-display cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <Image className="w-3.5 h-3.5" />
                      <span>SUBIR</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    LINK / REDIRECCIÓN
                  </label>
                  <select
                    value={
                      card.link === '#/catalogo?genero=outlet'
                        ? 'outlet'
                        : card.link?.startsWith('#/catalogo?categoria=')
                        ? card.link.replace('#/catalogo?categoria=', '')
                        : card.link === '#/catalogo' || !card.link
                        ? ''
                        : 'custom'
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'outlet') {
                        handleUpdatePromoCard(idx, 'link', '#/catalogo?genero=outlet');
                      } else if (val === 'custom') {
                        // Keep current link
                      } else if (val) {
                        handleUpdatePromoCard(idx, 'link', `#/catalogo?categoria=${val}`);
                      } else {
                        handleUpdatePromoCard(idx, 'link', '#/catalogo');
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none cursor-pointer"
                  >
                    <option value="">Todo el catálogo (#/catalogo)</option>
                    <option value="outlet">Outlet / Ofertas (#/catalogo?genero=outlet)</option>
                    {(categoriesList || []).map((cat) => (
                      <option key={cat.id} value={cat.slug}>
                        Categoría: {cat.name} ({cat.slug})
                      </option>
                    ))}
                    <option value="custom">Enlace personalizado...</option>
                  </select>

                  <input
                    type="text"
                    value={card.link || ''}
                    onChange={(e) => handleUpdatePromoCard(idx, 'link', e.target.value)}
                    placeholder="#/catalogo?categoria=..."
                    className="w-full px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-xl text-[11px] font-mono-custom text-gray-700 outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 5: BANNERS LIST */}
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
      {isFormOpen && (
        <div ref={formRef} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-display text-sm font-bold tracking-wider text-gray-900 uppercase">
              {editingIndex !== null ? `EDITANDO BANNER #${editingIndex + 1}` : 'NUEVO BANNER PROMOCIONAL'}
            </h3>
            <button
              type="button"
              onClick={() => { setIsFormOpen(false); setEditingIndex(null); }}
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
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block">IMAGEN DESKTOP</label>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono-custom">
                    📐 Medida: 1920 × 800 px (Horizontal)
                  </span>
                </div>
                
                {desktopImage && (
                  <div className="relative w-full h-24 rounded-lg overflow-hidden bg-white border border-gray-200 mb-2">
                    <img src={desktopImage} alt="Desktop Preview" className="w-full h-full object-cover" />
                    {overlayOpacity > 0 && (
                      <div 
                        className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
                        style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity / 100})` }}
                      />
                    )}
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
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await uploadOrCompressBanner(file, API_BASE_URL, token);
                        if (url) setDesktopImage(url);
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
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block">IMAGEN MOBILE</label>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono-custom">
                    📐 Medida: 1080 × 1350 px (Vertical)
                  </span>
                </div>
                
                {mobileImage && (
                  <div className="relative w-full h-24 rounded-lg overflow-hidden bg-white border border-gray-200 mb-2">
                    <img src={mobileImage} alt="Mobile Preview" className="w-full h-full object-cover" />
                    {overlayOpacity > 0 && (
                      <div 
                        className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
                        style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity / 100})` }}
                      />
                    )}
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
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await uploadOrCompressBanner(file, API_BASE_URL, token);
                        if (url) setMobileImage(url);
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
                  CAPA OSCURA / FILTRO NEGRO DE CONTRASTE: <span className="text-[#3C6E71] font-mono-custom font-bold">{overlayOpacity}%</span>
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
                  { label: '45% (Clásico / Contraste Texto)', val: 45 },
                  { label: '65% (Oscuro / Alto Contraste)', val: 65 }
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
                onClick={() => { setIsFormOpen(false); setEditingIndex(null); }}
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
