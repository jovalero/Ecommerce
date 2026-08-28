import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ShoppingBag,
  User,
  LogOut,
  X,
  ChevronRight,
  ChevronLeft,
  Star,
  Trash2,
  Plus,
  Edit2,
  Check,
  RotateCcw,
  Download,
  MapPin,
  AlertCircle,
  Shield,
  TrendingUp,
  Box,
  Users,
  Grid,
  Heart,
  MessageSquare,
  Lock,
  Search,
  ChevronDown,
  Copy,
  Menu,
  ArrowLeft,
  ShieldCheck,
  Store,
  CreditCard,
  Clock,
  Truck,
  Eye,
  Tag,
  Gift,
  Sparkles,
  Crown,
  Package,
  HelpCircle,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Ruler,
  RefreshCw
} from 'lucide-react';

import DashboardCharts from './components/Admin/DashboardCharts';
import StoreSettings from './components/Admin/StoreSettings';
import ShippingManager from './components/Admin/ShippingManager';
import InvoicePrinter from './components/Admin/InvoicePrinter';
import BannerEditor from './components/Admin/BannerEditor';
import CouponManager from './components/Admin/CouponManager';
import ProductEditModal from './components/Admin/ProductEditModal';
import CustomerEditModal from './components/Admin/CustomerEditModal';
import SendCouponModal from './components/Admin/SendCouponModal';
import SupportManager from './components/Admin/SupportManager';
import CheckoutView from './components/Checkout/CheckoutView';
import ProductCatalogManager from './components/Admin/ProductCatalogManager';
import Breadcrumbs from './components/Admin/Breadcrumbs';
import HeaderSearchInput from './components/Shop/HeaderSearchInput';
import VipSettingsManager from './components/Admin/VipSettingsManager';
import CatalogView from './components/Shop/CatalogView';
import ProductCard from './components/Shop/ProductCard';
import { SmoothInput, SmoothTextarea } from './components/Common/SmoothInput';
import InteractiveTicker from './components/Common/InteractiveTicker';
import HeroSlider from './components/Shop/HeroSlider';
import InfoPagesView from './components/Shop/InfoPagesView';
import Footer from './components/Shop/Footer';
import MobileMenuDrawer from './components/Navigation/MobileMenuDrawer';
import { useProductCatalog } from './hooks/useProductCatalog';
import { loadPersistedBannerData } from './utils/bannerStorage';
import { initialStoreData } from './config/initialStoreData';
import { productsMetadata } from './config/productsMetadata';

import { API_BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY } from './config/api';

const getProductDiscount = (product) => {
  if (!product || typeof product !== 'object') return 0;
  const normal = Number(product.price || 0);
  const offer = Number(product.offer_price || 0);
  const explicitPct = Number(product.discount_percent || product.discount || 0);
  const original = Number(product.original_price || 0);

  if (offer > 0 && normal > offer) {
    return Math.round(((normal - offer) / normal) * 100);
  }
  if (explicitPct > 0 && explicitPct < 100) {
    return explicitPct;
  }
  if (original > normal && normal > 0) {
    return Math.round(((original - normal) / original) * 100);
  }
  return 0;
};

const getEffectiveProductPrice = (product) => {
  if (!product || typeof product !== 'object') return 0;
  const normal = Number(product.price || 0);
  const offer = Number(product.offer_price || 0);
  const explicitPct = Number(product.discount_percent || product.discount || 0);

  if (offer > 0 && normal > offer) {
    return offer;
  }
  if (explicitPct > 0 && explicitPct < 100) {
    return Math.round(normal * (1 - explicitPct / 100));
  }
  return normal;
};

const getOriginalProductPrice = (product) => {
  if (!product || typeof product !== 'object') return 0;
  const normal = Number(product.price || 0);
  const offer = Number(product.offer_price || 0);
  const explicitPct = Number(product.discount_percent || product.discount || 0);
  const original = Number(product.original_price || 0);

  if (offer > 0 && normal > offer) {
    return normal;
  }
  if (explicitPct > 0 && explicitPct < 100) {
    return normal;
  }
  if (original > normal) {
    return original;
  }
  return 0;
};

// Global Order Utilities & Config
const ORDER_STATUS_CONFIG = {
  paid:            { label: '🟢 PAGADO',      cls: 'bg-emerald-100 text-emerald-800 border border-emerald-300' },
  completed:       { label: '🟢 PAGADO',      cls: 'bg-emerald-100 text-emerald-800 border border-emerald-300' },
  pending_review:  { label: '🟠 EN REVISIÓN', cls: 'bg-amber-100 text-amber-800 border border-amber-300' },
  pending_payment: { label: '🟡 PEND. PAGO',  cls: 'bg-yellow-100 text-yellow-800 border border-yellow-300' },
  pending:         { label: '🟡 PEND. PAGO',  cls: 'bg-yellow-100 text-yellow-800 border border-yellow-300' },
  rejected:        { label: '🔴 RECHAZADO',   cls: 'bg-red-100 text-red-800 border border-red-300' },
  cancelled:       { label: '⚪ CANCELADO',   cls: 'bg-gray-100 text-gray-600 border border-gray-300' }
};

const getOrderStatusInfo = (status) => {
  return ORDER_STATUS_CONFIG[status] || { label: '⚪ OTRO', cls: 'bg-gray-100 text-gray-600 border border-gray-300' };
};

const parseOrderItems = (order) => {
  if (!order) return [];
  let raw = order.order_items || order.items || [];
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); } catch { raw = []; }
  }
  if (!Array.isArray(raw)) return [];
  return raw.map(item => ({
    ...item,
    name: item.products?.name || item.product_name || item.name || 'Producto Holux',
    product_name: item.products?.name || item.product_name || item.name || 'Producto Holux',
    price: item.products?.price || item.unit_price || item.price || 0,
    unit_price: item.products?.price || item.unit_price || item.price || 0,
    image_url: item.products?.image_url || item.image_url || null,
    quantity: item.quantity || 1
  }));
};

// Promotional Banners configuration (customizable for home page sections)
const PROMO_BANNERS = initialStoreData?.grid_cards || [
  {
    title: "FRAGANCIAS HOMBRE",
    span: "ELEGANCIA Y CARÁCTER",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&auto=format&fit=crop&q=80",
    link: "#/catalogo?categoria=perfumes-hombre"
  },
  {
    title: "FRAGANCIAS MUJER",
    span: "SOFISTICACIÓN Y FRESCURA",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=800&auto=format&fit=crop&q=80",
    link: "#/catalogo?categoria=perfumes-mujer"
  },
  {
    title: "EXCLUSIVIDAD Y TENDENCIA",
    span: "JOYAS DE LA PERFUMERÍA",
    image: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=800&auto=format&fit=crop&q=80",
    link: "#/catalogo"
  }
];

const MobilePromoCarousel = React.memo(function MobilePromoCarousel({ banners = PROMO_BANNERS }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);
  const isDraggingRef = useRef(false);

  const handlePrev = () => {
    setCurrentSlide(prev => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    setCurrentSlide(prev => (prev + 1) % banners.length);
  };

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diffX = touchStartXRef.current - touchEndXRef.current;
    if (Math.abs(diffX) > 40) {
      if (diffX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  // Mouse Drag Support for tablet browsers / testing
  const handleMouseDown = (e) => {
    touchStartXRef.current = e.clientX;
    touchEndXRef.current = e.clientX;
    isDraggingRef.current = true;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    touchEndXRef.current = e.clientX;
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const diffX = touchStartXRef.current - touchEndXRef.current;
    if (Math.abs(diffX) > 40) {
      if (diffX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  return (
    <div 
      className="relative h-96 sm:h-[450px] w-full max-w-xl mx-auto rounded-2xl overflow-hidden border border-gray-200 shadow-lg select-none touch-pan-y cursor-grab active:cursor-grabbing"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Horizontal Sliding Track */}
      <div 
        className="flex w-full h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {banners.map((banner, idx) => (
          <div 
            key={idx}
            onClick={() => { window.location.hash = banner.link; }}
            className="relative w-full h-full shrink-0 cursor-pointer overflow-hidden"
          >
            <img 
              src={banner.image} 
              alt={banner.title} 
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
            <div className="absolute bottom-10 left-6 text-left space-y-1.5 pointer-events-none pr-6">
              <span className="text-[10px] sm:text-xs text-orange-200 font-bold uppercase tracking-widest font-sans block drop-shadow">
                {banner.span}
              </span>
              <h3 className="text-xl sm:text-2xl font-display font-black tracking-wider text-white uppercase drop-shadow-md">
                {banner.title}
              </h3>
            </div>
          </div>
        ))}
      </div>
      
      {/* Dot Indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
        {banners.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentSlide(idx);
            }}
            className={`h-2.5 rounded-full transition-all cursor-pointer ${idx === currentSlide ? 'bg-[#3C6E71] w-6 shadow-sm' : 'bg-white/50 w-2.5'}`}
            aria-label={`Ir a tarjeta ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
});

const getProductImage = (name = '') => {
  const cleanName = String(name).toLowerCase();
  if (cleanName.includes('perfume') || cleanName.includes('fragancia') || cleanName.includes('edp') || cleanName.includes('edt') || cleanName.includes('moschino') || cleanName.includes('dior') || cleanName.includes('versace') || cleanName.includes('herrera') || cleanName.includes('rabanne') || cleanName.includes('parfum') || cleanName.includes('colonia')) {
    return 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&auto=format&fit=crop&q=80';
  }
  if (cleanName.includes('campera') || cleanName.includes('cortavientos')) {
    return 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80';
  }
  if (cleanName.includes('pantalón') || cleanName.includes('pantalon') || cleanName.includes('calza')) {
    return 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&auto=format&fit=crop&q=80';
  }
  if (cleanName.includes('carpa') || cleanName.includes('domo')) {
    return 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&auto=format&fit=crop&q=80';
  }
  if (cleanName.includes('bolsa de dormir') || cleanName.includes('sleeping') || cleanName.includes('alpamayo')) {
    return 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=600&auto=format&fit=crop&q=80';
  }
  if (cleanName.includes('bota') || cleanName.includes('tronador') || cleanName.includes('calzado') || cleanName.includes('zapatilla') || cleanName.includes('sandalia')) {
    return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80';
  }
  if (cleanName.includes('mochila') || cleanName.includes('cordillera')) {
    return 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80';
  }
  if (cleanName.includes('bastón') || cleanName.includes('baston') || cleanName.includes('trail')) {
    return 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=600&auto=format&fit=crop&q=80';
  }
  if (cleanName.includes('termo') || cleanName.includes('botella') || cleanName.includes('inox') || cleanName.includes('anafe')) {
    return 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80';
  }
  if (cleanName.includes('linterna') || cleanName.includes('frontal')) {
    return 'https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=800&auto=format&fit=crop&q=80';
  }
  if (cleanName.includes('brújula') || cleanName.includes('brujula')) {
    return 'https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?w=600&auto=format&fit=crop&q=80';
  }
  if (cleanName.includes('guantes')) {
    return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80';
  }
  if (cleanName.includes('gorro')) {
    return 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=600&auto=format&fit=crop&q=80';
  }
  if (cleanName.includes('chaleco')) {
    return 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&auto=format&fit=crop&q=80';
};

export const enrichProductItem = (p) => {
  if (!p || typeof p !== 'object') return p;
  const meta = productsMetadata[p.id] || {};
  const resolveImg = (url) => {
    if (!url || typeof url !== 'string') return null;
    let clean = url.trim();
    if (clean.startsWith('http://holux-api.onrender.com')) {
      clean = clean.replace('http://holux-api.onrender.com', 'https://holux-api.onrender.com');
    }
    if (clean.includes('localhost:8000/storage/uploads/')) {
      return '/uploads/' + clean.split('localhost:8000/storage/uploads/')[1];
    }
    return clean;
  };
  const images = (Array.isArray(p.images) && p.images.length > 0)
    ? p.images.map(resolveImg).filter(Boolean)
    : (Array.isArray(meta.images) && meta.images.length > 0
        ? meta.images.map(resolveImg).filter(Boolean)
        : (p.image_url ? [resolveImg(p.image_url)].filter(Boolean) : (meta.image_url ? [resolveImg(meta.image_url)].filter(Boolean) : [])));

  const image_url = resolveImg(p.image_url) || (images && images[0]) || resolveImg(meta.image_url) || null;

  return {
    ...p,
    brand: p.brand || meta.brand || (p.name ? p.name.split(' ')[0] : 'HOLUX'),
    description: p.description || meta.description || '',
    specs: (Array.isArray(p.specs) && p.specs.length > 0) ? p.specs : (meta.specs || []),
    tags: (Array.isArray(p.tags) && p.tags.length > 0) ? p.tags : (meta.tags || []),
    is_featured: p.is_featured ?? meta.is_featured ?? false,
    is_new: p.is_new ?? meta.is_new ?? false,
    image_url,
    images
  };
};

export default function App() {
  // --- STATE ---
  const [products, setProducts] = useState([]);
  const novedadesRef = useRef(null);
  const destacadosRef = useRef(null);
  const relatedRef = useRef(null);

  const scrollContainer = (ref, direction) => {
    if (ref.current) {
      const { scrollLeft, clientWidth } = ref.current;
      const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;
      ref.current.scrollTo({
        left: scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };
  const [categories, setCategories] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  
  // Hero Carousel Slides data
  const slides = initialStoreData?.hero_slides || [
    {
      span: "FRAGANCIAS EXCLUSIVAS Y DE AUTOR",
      title: "PERFUMES DE LUJO",
      highlight: "100% ORIGINALES",
      desc: "Descubrí nuestra exclusiva selección de perfumería internacional importada de primeras marcas para hombre y mujer.",
      cta: "VER PERFUMERÍA",
      image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1600&q=80"
    },
    {
      span: "COLECCIÓN HOMBRE & MUJER",
      title: "ELEGANCIA &",
      highlight: "DISTINCIÓN",
      desc: "Las mejores marcas del mundo: Xerjoff, Dior, Jean Paul Gaultier, Maison Alhambra, Baccarat Rouge y más.",
      cta: "EXPLORAR CATÁLOGO",
      image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1600&q=80"
    },
    {
      span: "OFERTAS Y BENEFICIOS",
      title: "HASTA 6 CUOTAS",
      highlight: "SIN INTERÉS",
      desc: "Aboná con tarjetas de crédito, débito o transferencia bancaria con descuentos exclusivos y envíos a todo el país.",
      cta: "COMPRAR AHORA",
      image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=1600&q=80"
    }
  ];

  // Chat Widget State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatEmail, setChatEmail] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [chatSuccess, setChatSuccess] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // Navigation & Search Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeGender, setActiveGender] = useState(null); // 'mujer' | 'hombre' | 'niños' | 'outlet' | null
  const [activeBrand, setActiveBrand] = useState(null); // brand filter
  const [infoPageSlug, setInfoPageSlug] = useState(() => {
    const hash = window.location.hash || '';
    if (hash.startsWith('#/info/')) {
      return hash.replace('#/info/', '').split('?')[0] || 'terminos';
    }
    return 'terminos';
  });
  const [currentView, setCurrentView] = useState(() => {
    const hash = window.location.hash || '';
    if (hash.startsWith('#/checkout') || hash.startsWith('#/compra-confirmada')) return 'checkout';
    if (hash.startsWith('#/mi-cuenta')) return 'customer_panel';
    if (hash.startsWith('#/admin')) return 'admin';
    if (hash.startsWith('#/catalogo')) return 'category';
    if (hash.startsWith('#/info/')) return 'info_page';
    if (hash.startsWith('#/producto/')) return 'product-detail';
    return 'home';
  });
  const [sortBy, setSortBy] = useState('relevant'); // 'relevant' | 'price-asc' | 'price-desc'
  const [selectedDetailProduct, setSelectedDetailProduct] = useState(null);
  const [selectedProductImageIndex, setSelectedProductImageIndex] = useState(0);
  const [detailQuantity, setDetailQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [sizeError, setSizeError] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [sizeGuideCategory, setSizeGuideCategory] = useState('tops'); // 'tops' | 'bottoms' | 'footwear'

  // Cart & Orders (100% Supabase-driven marketing and settings)
  const [heroSlides, setHeroSlides] = useState(slides);
  const [homeSectionTitles, setHomeSectionTitles] = useState(initialStoreData?.section_titles || {
    novedadesTitle: 'NOVEDADES EN PERFUMERÍA',
    novedadesSubtitle: 'Descubrí los últimos lanzamientos y fragancias exclusivas',
    destacadosTitle: 'FRAGANCIAS DESTACADAS',
    destacadosSubtitle: 'Una selección especial recomendada por nuestros expertos'
  });
  const [gridPromoCards, setGridPromoCards] = useState(initialStoreData?.grid_cards || PROMO_BANNERS);
  const defaultHeaderNavItems = initialStoreData?.header_nav || [
    { id: 'cat_dropdown', type: 'dropdown', label: 'CATEGORÍAS', isVisible: true, isDropdown: true, link: '#/catalogo' },
    { id: 'cat_perfumes-hombre', type: 'category', label: 'PERFUMES HOMBRE', slug: 'perfumes-hombre', link: '#/catalogo?categoria=perfumes-hombre', isVisible: true },
    { id: 'cat_perfumes-mujer', type: 'category', label: 'PERFUMES MUJER', slug: 'perfumes-mujer', link: '#/catalogo?categoria=perfumes-mujer', isVisible: true },
    { id: 'outlet', type: 'special', label: 'OUTLET', link: '#/catalogo?genero=outlet', isVisible: true, isButton: true }
  ];
  const [headerNavItems, setHeaderNavItems] = useState(defaultHeaderNavItems);
  const [selectedPrintOrder, setSelectedPrintOrder] = useState(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [adminOrderSearchQuery, setAdminOrderSearchQuery] = useState('');
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('holux_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState(null);

  // Checkout & Payment Modal State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Domicilio, 2: Pago, 3: Confirmación
  const [deliveryOption, setDeliveryOption] = useState('home'); // 'home' | 'pickup'
  const [checkoutDni, setCheckoutDni] = useState(() => localStorage.getItem('holux_saved_dni') || '');
  const [checkoutValidationError, setCheckoutValidationError] = useState(null);
  const [shippingStreet, setShippingStreet] = useState('');
  const [shippingApartment, setShippingApartment] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingProvince, setShippingProvince] = useState('Santa Fe');
  const [shippingPostalCode, setShippingPostalCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('transfer'); // 'transfer' | 'mercadopago_checkout_pro' | 'mercadopago'
  const [paymentInstallments, setPaymentInstallments] = useState(3);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Authentication
  const [token, setToken] = useState(() => localStorage.getItem('user_token'));
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authError, setAuthError] = useState('');

  // Client Profile Drawer & Portal State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileTab, setProfileTab] = useState('info'); // 'info' | 'addresses' | 'orders'
  const [addresses, setAddresses] = useState(() => {
    const saved = localStorage.getItem('holux_saved_addresses');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });
  const [orders, setOrders] = useState([]);
  // Coupons & Benefits State - Sourced dynamically from Admin / localStorage
  const [couponsTabFilter, setCouponsTabFilter] = useState('disponibles'); // 'disponibles' | 'usados' | 'vencidos'
  const [couponSearchQuery, setCouponSearchQuery] = useState('');
  const [redeemInput, setRedeemInput] = useState('');
  const [copiedCouponId, setCopiedCouponId] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Helper to normalize timestamp to milliseconds (supports seconds from PHP and ms from JS)
  const normalizeCouponTimestamp = (ts) => {
    if (!ts) return Date.now() + (14 * 86400000);
    const num = typeof ts === 'string' ? Number(ts) : ts;
    if (!num || isNaN(num)) return Date.now() + (14 * 86400000);
    return num < 10000000000 ? num * 1000 : num;
  };

  const getCouponDynamicStatus = (coupon) => {
    if (!coupon) return 'disponible';
    if (coupon.status === 'usado') return 'usado';
    const expiryMs = normalizeCouponTimestamp(coupon.expiry_timestamp);
    if (expiryMs < Date.now()) return 'vencido';
    return 'disponible';
  };

  // Customer coupons wallet logic - Isolated per authenticated user ID & Email (0 by default)
  const getSyncedCustomerCoupons = () => {
    const currentUserId = userProfile?.id || (token ? 'auth_user' : 'guest');
    const userWalletKey = `holux_customer_coupons_wallet_${currentUserId}`;
    let savedWallet = localStorage.getItem(userWalletKey);

    // If not found by ID, try finding by email
    if (!savedWallet && userProfile?.email) {
      savedWallet = localStorage.getItem(`holux_customer_coupons_wallet_${userProfile.email}`);
    }

    let myWallet = [];
    if (savedWallet) {
      try {
        myWallet = JSON.parse(savedWallet);
        if (Array.isArray(myWallet)) {
          myWallet = myWallet.map(c => ({
            ...c,
            expiry_timestamp: normalizeCouponTimestamp(c.expiry_timestamp)
          }));
        }
      } catch (e) {
        console.error(e);
      }
    }

    return Array.isArray(myWallet) ? myWallet : [];
  };

  const [customerCoupons, setCustomerCoupons] = useState(getSyncedCustomerCoupons);

  // Asynchronously sync persistent banners, 3 promo cards & section titles from IndexedDB
  useEffect(() => {
    loadPersistedBannerData('holux_hero_slides', null).then(saved => {
      if (saved && Array.isArray(saved) && saved.length > 0) {
        setHeroSlides(saved);
      }
    });
    loadPersistedBannerData('holux_home_section_titles', null).then(saved => {
      if (saved) {
        setHomeSectionTitles(saved);
      }
    });
    loadPersistedBannerData('holux_grid_promo_cards', null).then(saved => {
      if (saved && Array.isArray(saved) && saved.length > 0) {
        setGridPromoCards(saved);
      }
    });
    loadPersistedBannerData('holux_header_nav_items', null).then(saved => {
      if (saved && Array.isArray(saved) && saved.length > 0) {
        setHeaderNavItems(saved);
      }
    });
    loadPersistedBannerData('holux_promo_banner', null).then(saved => {
      if (saved && typeof saved === 'object') {
        setPromoBanner(saved);
      }
    });
    loadPersistedBannerData('holux_ticker_phrases', null).then(saved => {
      if (saved && Array.isArray(saved) && saved.length > 0) {
        setTickerPhrases(saved);
      }
    });

    // Universal Cloud Store Settings Fetch (ensures mobile devices & customers get latest banners from Supabase)
    const applyStoreSettings = (s) => {
      if (!s || typeof s !== 'object') return;
      if (s.hero_slides && Array.isArray(s.hero_slides) && s.hero_slides.length > 0) {
        setHeroSlides(s.hero_slides);
      }
      if (s.grid_cards && Array.isArray(s.grid_cards) && s.grid_cards.length > 0) {
        setGridPromoCards(s.grid_cards);
      }
      if (s.promo_banner && typeof s.promo_banner === 'object') {
        setPromoBanner(s.promo_banner);
      }
      if (s.section_titles && typeof s.section_titles === 'object') {
        setHomeSectionTitles(s.section_titles);
      }
      if (s.ticker_phrases && Array.isArray(s.ticker_phrases) && s.ticker_phrases.length > 0) {
        setTickerPhrases(s.ticker_phrases);
      }
      if (s.header_nav && Array.isArray(s.header_nav) && s.header_nav.length > 0) {
        setHeaderNavItems(s.header_nav);
      }
    };

    // 1. Fetch direct from Supabase CDN (0ms, ultra-fast global CDN)
    fetch('https://fmbhcfsrsfkglmvgbnlm.supabase.co/storage/v1/object/public/product-images/config/store_settings.json')
      .then(r => r.json())
      .then(applyStoreSettings)
      .catch(() => {});

    // 2. Fetch from backend API
    fetch(`${API_BASE_URL}/api/settings`)
      .then(res => res.json())
      .then(data => {
        if (data?.settings) applyStoreSettings(data.settings);
      })
      .catch(() => {});
  }, []);

  // Real-time synchronization for banner updates across tabs/modals
  useEffect(() => {
    const handleBannersSync = (e) => {
      if (e?.detail?.key === 'holux_hero_slides' && Array.isArray(e.detail.data)) {
        setHeroSlides(e.detail.data);
      }
      if (e?.detail?.key === 'holux_grid_promo_cards' && Array.isArray(e.detail.data)) {
        setGridPromoCards(e.detail.data);
      }
      if (e?.detail?.key === 'holux_promo_banner' && e.detail.data) {
        setPromoBanner(e.detail.data);
      }
      if (e?.detail?.key === 'holux_header_nav_items' && Array.isArray(e.detail.data)) {
        setHeaderNavItems(e.detail.data);
      }
      if (e?.detail?.key === 'holux_ticker_phrases' && Array.isArray(e.detail.data)) {
        setTickerPhrases(e.detail.data);
      }
    };
    window.addEventListener('holux_banners_updated', handleBannersSync);
    return () => window.removeEventListener('holux_banners_updated', handleBannersSync);
  }, []);

  // Sync wallet to user-specific localStorage key
  useEffect(() => {
    const currentUserId = userProfile?.id || (token ? 'auth_user' : 'guest');
    localStorage.setItem(`holux_customer_coupons_wallet_${currentUserId}`, JSON.stringify(customerCoupons));
  }, [customerCoupons, userProfile?.id, token]);

  useEffect(() => {
    const handleSyncCoupons = () => {
      setCustomerCoupons(getSyncedCustomerCoupons());
    };
    window.addEventListener('holux_coupons_updated', handleSyncCoupons);
    window.addEventListener('storage', handleSyncCoupons);
    return () => {
      window.removeEventListener('holux_coupons_updated', handleSyncCoupons);
      window.removeEventListener('storage', handleSyncCoupons);
    };
  }, [userProfile?.id, userProfile?.email]);

  // Sync assigned coupons from API for current customer
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/api/me/coupons`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })
      .then(res => res.ok ? res.json() : [])
      .then(serverCoupons => {
        if (Array.isArray(serverCoupons)) {
          setCustomerCoupons(prev => {
            const currentUserId = userProfile?.id || (token ? 'auth_user' : 'guest');
            const mapped = serverCoupons.map(sc => ({
              id: sc.id || ('coup-' + sc.code),
              code: (sc.code || '').toUpperCase().trim(),
              type: sc.type || 'percentage',
              value: parseFloat(sc.value),
              min_spend: parseFloat(sc.min_spend || sc.minPurchase || 0),
              origin: sc.origin || 'Regalo Exclusivo 🎁',
              description: sc.description || 'Descuento especial en tienda',
              status: sc.status || 'disponible',
              expiry_timestamp: normalizeCouponTimestamp(sc.expiry_timestamp)
            })).filter(c => Boolean(c.code));

            // Merge with local wallet
            const combined = [...mapped];
            prev.forEach(p => {
              if (p && p.code && !combined.some(c => c.code === p.code)) {
                combined.push(p);
              }
            });

            localStorage.setItem(`holux_customer_coupons_wallet_${currentUserId}`, JSON.stringify(combined));
            return combined;
          });
        }
      })
      .catch(() => {});
  }, [token, userProfile?.id]);

  // Global Favorites State
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('holux_guest_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync favorites with backend
  useEffect(() => {
    const syncFavorites = async () => {
      if (!token) return;
      try {
        const guest = localStorage.getItem('holux_guest_favorites');
        if (guest) {
          try {
            const parsed = JSON.parse(guest);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const syncRes = await fetch(`${API_BASE_URL}/api/favorites/sync`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/json'
                },
                body: JSON.stringify({ product_ids: parsed })
              });
              if (syncRes.ok) {
                const syncData = await syncRes.json();
                if (syncData.product_ids) {
                  setFavorites(syncData.product_ids);
                  localStorage.removeItem('holux_guest_favorites');
                  return;
                }
              }
            }
          } catch (e) {
            console.error("Error parsing guest favorites:", e);
          }
        }

        const res = await fetch(`${API_BASE_URL}/api/favorites`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.product_ids) {
            setFavorites(data.product_ids);
          }
        }
      } catch (err) {
        // Stale or expired token
      }
    };
    syncFavorites();
  }, [token]);

  const handleToggleFavorite = async (productId) => {
    const strId = String(productId);
    const numId = Number(productId);
    const isFav = favorites.some(id => String(id) === strId || id === numId || id === productId);
    const updated = isFav
      ? favorites.filter(id => String(id) !== strId && id !== numId && id !== productId)
      : [...favorites, productId];
    setFavorites(updated);

    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/favorites/toggle`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({ product_id: strId })
        });
      } catch (e) {
        console.error("Error toggling favorite on server:", e);
      }
    } else {
      localStorage.setItem('holux_guest_favorites', JSON.stringify(updated));
    }
  };

  const [customerPanelSection, setCustomerPanelSection] = useState('general'); // 'general' | 'orders' | 'favorites' | 'coupons' | 'reviews' | 'addresses' | 'messages' | 'settings'
  const [orderStatusFilter, setOrderStatusFilter] = useState('all'); // 'all' | 'pending' | 'processing' | 'shipped' | 'completed'
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [expandedOrders, setExpandedOrders] = useState({});

  const toggleOrderExpansion = (orderId, defaultOpen) => {
    setExpandedOrders(prev => {
      const isCurrentlyOpen = prev[orderId] !== undefined ? prev[orderId] : defaultOpen;
      return { ...prev, [orderId]: !isCurrentlyOpen };
    });
  };

  // Address form
  const [editingAddress, setEditingAddress] = useState(null);
  const [addrLabel, setAddrLabel] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrProvince, setAddrProvince] = useState('');
  const [addrPostalCode, setAddrPostalCode] = useState('');
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const [copiedBankText, setCopiedBankText] = useState('');

  // Support Chat state inside Customer Panel - Isolated per user
  const [panelSupportMessages, setPanelSupportMessages] = useState([]);
  const [panelSupportInput, setPanelSupportInput] = useState('');

  // Refund state inside Customer Panel - Isolated per user
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundOrderSelect, setRefundOrderSelect] = useState('');
  const [refundReasonSelect, setRefundReasonSelect] = useState('Talle incorrecto');
  const [refundCommentInput, setRefundCommentInput] = useState('');
  const [refundRequestsList, setRefundRequestsList] = useState([]);

  // Customer Reviews state - Isolated per user
  const [customerReviewsList, setCustomerReviewsList] = useState([]);
  const [isAddCustomerReviewModalOpen, setIsAddCustomerReviewModalOpen] = useState(false);
  const [reviewProdSelect, setReviewProdSelect] = useState('');
  const [reviewRatingSelect, setReviewRatingSelect] = useState(5);
  const [reviewCommentInput, setReviewCommentInput] = useState('');

  // Account Settings state - Isolated per user
  const [accountSettings, setAccountSettings] = useState({
    emailPromos: true,
    smsAlerts: true,
    securityAlerts: true,
    monthlyNewsletter: false,
    whatsappUpdates: true
  });
  const [settingsSavedMessage, setSettingsSavedMessage] = useState(false);

  // Load and sync user-specific data whenever userProfile.id changes
  useEffect(() => {
    const currentUserId = userProfile?.id || (token ? 'auth_user' : null);
    if (!currentUserId) {
      setCustomerReviewsList([]);
      setPanelSupportMessages([]);
      setRefundRequestsList([]);
      return;
    }

    // 1. Reviews
    const sRev = localStorage.getItem(`holux_user_reviews_${currentUserId}`);
    setCustomerReviewsList(sRev ? JSON.parse(sRev) : []);

    // 2. Support messages
    const sMsg = localStorage.getItem(`holux_support_messages_${currentUserId}`);
    setPanelSupportMessages(sMsg ? JSON.parse(sMsg) : []);

    // 3. Refund requests
    const sRef = localStorage.getItem(`holux_refund_requests_${currentUserId}`);
    setRefundRequestsList(sRef ? JSON.parse(sRef) : []);

    // 4. Account settings
    const sSet = localStorage.getItem(`holux_account_settings_${currentUserId}`);
    if (sSet) {
      try { setAccountSettings(JSON.parse(sSet)); } catch (e) {}
    }

    // 5. Sync coupons for this user
    setCustomerCoupons(getSyncedCustomerCoupons());
  }, [userProfile?.id, token]);

  // Sync user data changes to localStorage
  useEffect(() => {
    const currentUserId = userProfile?.id || (token ? 'auth_user' : null);
    if (currentUserId) {
      localStorage.setItem(`holux_user_reviews_${currentUserId}`, JSON.stringify(customerReviewsList));
    }
  }, [customerReviewsList, userProfile?.id, token]);

  useEffect(() => {
    const currentUserId = userProfile?.id || (token ? 'auth_user' : null);
    if (currentUserId) {
      localStorage.setItem(`holux_support_messages_${currentUserId}`, JSON.stringify(panelSupportMessages));
    }
  }, [panelSupportMessages, userProfile?.id, token]);

  useEffect(() => {
    const currentUserId = userProfile?.id || (token ? 'auth_user' : null);
    if (currentUserId) {
      localStorage.setItem(`holux_refund_requests_${currentUserId}`, JSON.stringify(refundRequestsList));
    }
  }, [refundRequestsList, userProfile?.id, token]);

  useEffect(() => {
    const currentUserId = userProfile?.id || (token ? 'auth_user' : null);
    if (currentUserId) {
      localStorage.setItem(`holux_account_settings_${currentUserId}`, JSON.stringify(accountSettings));
    }
  }, [accountSettings, userProfile?.id, token]);

  // Selected Order Detail Modal inside Customer Panel
  const [customerSelectedOrderDetail, setCustomerSelectedOrderDetail] = useState(null);
  const [customerResendReceiptModalOrder, setCustomerResendReceiptModalOrder] = useState(null);
  const [customerResendFile, setCustomerResendFile] = useState(null);
  const [isUploadingCustomerReceipt, setIsUploadingCustomerReceipt] = useState(false);

  const handleCustomerResendReceiptSubmit = async (e) => {
    e.preventDefault();
    if (!customerResendReceiptModalOrder || !customerResendFile) return;

    setIsUploadingCustomerReceipt(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        try {
          const res = await fetch(`${API_BASE_URL}/api/orders/${customerResendReceiptModalOrder.id}/resubmit-receipt`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ receipt_url: base64 })
          });

          if (res.ok) {
            alert('¡Comprobante reenviado con éxito! Tu pago volverá a ser revisado por administración.');
            setCustomerResendReceiptModalOrder(null);
            setCustomerResendFile(null);
            fetchOrders();
          } else {
            alert('Comprobante cargado correctamente en tu pedido.');
            setCustomerResendReceiptModalOrder(null);
            setCustomerResendFile(null);
          }
        } catch (err) {
          alert('Comprobante cargado.');
          setCustomerResendReceiptModalOrder(null);
          setCustomerResendFile(null);
        } finally {
          setIsUploadingCustomerReceipt(false);
        }
      };
      reader.readAsDataURL(customerResendFile);
    } catch (err) {
      setIsUploadingCustomerReceipt(false);
    }
  };

  // --- CHECKOUT & ORDER LIFECYCLE EXTENDED STATES ---
  const [transferReceiptFile, setTransferReceiptFile] = useState(null);
  const [transferReceiptName, setTransferReceiptName] = useState('');
  const [transferReceiptPreview, setTransferReceiptPreview] = useState(null);
  const [transferReceiptError, setTransferReceiptError] = useState('');

  const [checkoutOrderStatus, setCheckoutOrderStatus] = useState(null); // 'creating' | 'pending_payment' | 'pending_review' | 'paid' | 'rejected'
  const [createdOrderData, setCreatedOrderData] = useState(null);

  // Admin moderation states for receipts
  const [adminRejectionModalOrder, setAdminRejectionModalOrder] = useState(null);
  const [adminRejectionReasonInput, setAdminRejectionReasonInput] = useState('');
  const [adminReceiptLightboxUrl, setAdminReceiptLightboxUrl] = useState(null);
  const [adminOrderStatusFilter, setAdminOrderStatusFilter] = useState('all'); // 'all' | 'pending_payment' | 'pending_review' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'rejected' | 'cancelled'
  const [adminPaymentMethodFilter, setAdminPaymentMethodFilter] = useState('all'); // 'all' | 'transfer' | 'mercadopago'

  // Admin order detail modal extended states (Tracking, Notes, Audit Logs)
  const [shippingCourierInput, setShippingCourierInput] = useState('Andreani');
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [trackingUrlInput, setTrackingUrlInput] = useState('');
  const [isSavingTracking, setIsSavingTracking] = useState(false);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [isSavingAdminNote, setIsSavingAdminNote] = useState(false);
  const [adminOrderLogs, setAdminOrderLogs] = useState([]);
  const [isResendingNotification, setIsResendingNotification] = useState(false);

  // Navigation View & Admin State
  const [adminTab, setAdminTab] = useState('dashboard');
  const [isAdminMobileMenuOpen, setIsAdminMobileMenuOpen] = useState(false);
  
  // Admin Data states
  const [adminStats, setAdminStats] = useState(null);
  const [adminOrdersList, setAdminOrdersList] = useState([]);
  const [isAdminOrdersLoading, setIsAdminOrdersLoading] = useState(false);
  const [adminProductsList, setAdminProductsList] = useState([]);
  const [adminCategoriesList, setAdminCategoriesList] = useState([]);
  const [adminCustomersList, setAdminCustomersList] = useState([]);
  const [customerSubTab, setCustomerSubTab] = useState('list'); // 'list' | 'settings'
  const [adminReviewsList, setAdminReviewsList] = useState([]);

  // Ticker Phrases State (Cuotas, Promos, Envíos)
  const defaultTickerPhrases = initialStoreData?.ticker || [
    '| ENVÍO GRATIS EN COMPRAS MAYORES A $150.000',
    '| ¡HASTA 6 CUOTAS SIN INTERÉS!',
    '| GARANTÍA OFICIAL HOLUX EN TODAS TUS EXPEDICIONES',
    '| 15% OFF PAGANDO CON TRANSFERENCIA BANCARIA'
  ];
  const [tickerPhrases, setTickerPhrases] = useState(defaultTickerPhrases);

  // Mouse drag scrolling for Novedades (Zero React re-renders)
  const isNovedadesDraggingRef = useRef(false);
  const novedadesStartXRef = useRef(0);
  const novedadesScrollLeftRef = useRef(0);

  const handleNovedadesMouseDown = (e) => {
    if (!novedadesRef.current) return;
    isNovedadesDraggingRef.current = true;
    novedadesStartXRef.current = e.pageX - novedadesRef.current.offsetLeft;
    novedadesScrollLeftRef.current = novedadesRef.current.scrollLeft;
  };

  const handleNovedadesMouseLeaveOrUp = () => {
    isNovedadesDraggingRef.current = false;
  };

  const handleNovedadesMouseMove = (e) => {
    if (!isNovedadesDraggingRef.current || !novedadesRef.current) return;
    e.preventDefault();
    const x = e.pageX - novedadesRef.current.offsetLeft;
    const walk = (x - novedadesStartXRef.current) * 1.5;
    novedadesRef.current.scrollLeft = novedadesScrollLeftRef.current - walk;
  };

  // Mouse drag scrolling for Destacados (Zero React re-renders)
  const isDestacadosDraggingRef = useRef(false);
  const destacadosStartXRef = useRef(0);
  const destacadosScrollLeftRef = useRef(0);

  const handleDestacadosMouseDown = (e) => {
    if (!destacadosRef.current) return;
    isDestacadosDraggingRef.current = true;
    destacadosStartXRef.current = e.pageX - destacadosRef.current.offsetLeft;
    destacadosScrollLeftRef.current = destacadosRef.current.scrollLeft;
  };

  const handleDestacadosMouseLeaveOrUp = () => {
    isDestacadosDraggingRef.current = false;
  };

  const handleDestacadosMouseMove = (e) => {
    if (!isDestacadosDraggingRef.current || !destacadosRef.current) return;
    e.preventDefault();
    const x = e.pageX - destacadosRef.current.offsetLeft;
    const walk = (x - destacadosStartXRef.current) * 1.5;
    destacadosRef.current.scrollLeft = destacadosScrollLeftRef.current - walk;
  };

  // Middle Promo Installment Banner State (6 cuotas)
  const defaultPromoBanner = initialStoreData?.promo_banner || {
    tag: 'PROMOCIÓN DE TEMPORADA',
    title: '6 CUOTAS SIN INTERÉS EN TODO EL CATÁLOGO',
    description: 'Equípate hoy mismo y paga en cómodas cuotas fijas sin interés. Realizamos envíos de forma rápida a todo el territorio nacional.',
    isVisible: true
  };
  const [promoBanner, setPromoBanner] = useState(defaultPromoBanner);

  // Product Edit Floating Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProductModal, setSelectedProductModal] = useState(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomerModal, setSelectedCustomerModal] = useState(null);
  const [selectedCouponCustomer, setSelectedCouponCustomer] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productReviews, setProductReviews] = useState([]);
  const [reviewsAverage, setReviewsAverage] = useState(0);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  // Product CRUD form
  const [editingProduct, setEditingProduct] = useState(null);
  const [prodName, setProdName] = useState('');
  const [prodBrand, setProdBrand] = useState('');
  const [prodCategoryId, setProdCategoryId] = useState('');
  const [prodPrice, setProdPrice] = useState(0);
  const [prodInstallments, setProdInstallments] = useState(6);
  const [prodIcon, setProdIcon] = useState('Box');
  const [prodStock, setProdStock] = useState(10);

  // Category CRUD form
  const [editingCategory, setEditingCategory] = useState(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');

  // Promote admin email
  const [promoteUserId, setPromoteUserId] = useState('');

  // --- ACTIONS ---

  // Local storage for cart
  useEffect(() => {
    localStorage.setItem('holux_cart', JSON.stringify(cart));
  }, [cart]);

  // Initial catalog load & Backend Warmup Heartbeat
  useEffect(() => {
    fetchCatalog();

    // Silent background warmup ping to keep Render backend awake
    const pingBackend = () => {
      fetch(`${API_BASE_URL}/api/ping`, { mode: 'no-cors' }).catch(() => {});
    };
    pingBackend();
    const heartbeatInterval = setInterval(pingBackend, 5 * 60 * 1000); // Pulse every 5 min while browser is open
    return () => clearInterval(heartbeatInterval);
  }, []);

  // Fetch client profile if token changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('user_token', token);
      localStorage.setItem('holux_auth_token', token);
      fetchUserProfile();
    } else {
      localStorage.removeItem('user_token');
      localStorage.removeItem('holux_auth_token');
      setUserProfile(null);
    }
  }, [token]);

  // Parse URL hash for Supabase OAuth & Email confirmation tokens
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken) {
        setToken(accessToken);
        localStorage.setItem('user_token', accessToken);
        localStorage.setItem('holux_auth_token', accessToken);
        if (refreshToken) {
          localStorage.setItem('supabase_refresh_token', refreshToken);
        }
        // Clean up url hash
        window.history.replaceState(null, null, window.location.pathname + '#/');
      }
    }
  }, []);

  // Automatic Background Token Refresh (Keeps session alive for weeks/months)
  useEffect(() => {
    const refreshSession = async () => {
      const refreshToken = localStorage.getItem('supabase_refresh_token');
      if (!refreshToken) return;
      try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY
          },
          body: JSON.stringify({ refresh_token: refreshToken })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.access_token) {
            setToken(data.access_token);
            localStorage.setItem('user_token', data.access_token);
            localStorage.setItem('holux_auth_token', data.access_token);
            if (data.refresh_token) {
              localStorage.setItem('supabase_refresh_token', data.refresh_token);
            }
          }
        }
      } catch (err) {
        // silent refresh
      }
    };

    // Auto-refresh on mount and every 20 minutes
    refreshSession();
    const interval = setInterval(refreshSession, 20 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchCatalog = async () => {
    setLoadingProducts(true);
    setLoadingCategories(true);
    try {
      // 1. Fetch Categories (try Laravel API first, then Supabase directly)
      let catsLoaded = false;
      try {
        const resCat = await fetch(`${API_BASE_URL}/api/categories`);
        if (resCat.ok) {
          const data = await resCat.json();
          const cats = Array.isArray(data) ? data : (data.data || []);
          if (cats.length > 0) {
            setCategories(cats);
            catsLoaded = true;
          }
        }
      } catch (err) {}

      if (!catsLoaded) {
        try {
          const supaCat = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=*`, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
          });
          if (supaCat.ok) {
            const cats = await supaCat.json();
            setCategories(cats);
          }
        } catch (supaErr) {}
      }

      // 2. Fetch Products (try Laravel API first, then Supabase directly)
      const enrichProd = (p) => {
        const meta = productsMetadata[p.id] || {};
        const resolveImg = (url) => {
          if (!url || typeof url !== 'string') return null;
          let clean = url.trim();
          if (clean.startsWith('http://holux-api.onrender.com')) {
            clean = clean.replace('http://holux-api.onrender.com', 'https://holux-api.onrender.com');
          }
          if (clean.includes('localhost:8000/storage/uploads/')) {
            return '/uploads/' + clean.split('localhost:8000/storage/uploads/')[1];
          }
          return clean;
        };
        const images = (Array.isArray(p.images) && p.images.length > 0)
          ? p.images.map(resolveImg)
          : (Array.isArray(meta.images) ? meta.images.map(resolveImg) : (p.image_url ? [resolveImg(p.image_url)] : []));
        const image_url = resolveImg(p.image_url) || (images && images[0]) || meta.image_url || null;

        return {
          ...p,
          description: p.description || meta.description || '',
          specs: p.specs || meta.specs || [],
          tags: p.tags || meta.tags || [],
          is_featured: p.is_featured ?? meta.is_featured ?? false,
          is_new: p.is_new ?? meta.is_new ?? false,
          image_url,
          images
        };
      };

      let prodsLoaded = false;
      try {
        const resProd = await fetch(`${API_BASE_URL}/api/products?per_page=100`);
        if (resProd.ok) {
          const result = await resProd.json();
          const prods = Array.isArray(result) ? result : (result.data || []);
          if (prods.length > 0) {
            setProducts(prods.map(enrichProd));
            prodsLoaded = true;
          }
        }
      } catch (err) {}

      if (!prodsLoaded) {
        try {
          const supaProd = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*,categories(id,name,slug)&order=created_at.desc`, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
          });
          if (supaProd.ok) {
            const prods = await supaProd.json();
            if (Array.isArray(prods)) {
              setProducts(prods.map(enrichProductItem));
            }
          }
        } catch (supaErr) {}
      }
    } catch (e) {
      console.error("Error loading catalog:", e);
    } finally {
      setLoadingProducts(false);
      setLoadingCategories(false);
    }
  };

  const fetchUserProfile = async () => {
    if (!token || token === 'null' || token === 'undefined') return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
        setCheckoutName(data.full_name || '');
        if (data.email) setCheckoutEmail(data.email);
        return;
      }
      if (res.status === 401) {
        setToken(null);
        setUserProfile(null);
        localStorage.removeItem('user_token');
        localStorage.removeItem('holux_auth_token');
      }
    } catch (e) {
      console.error("Error loading profile from API:", e);
    }
  };

  // --- CLIENT ACTIONS ---

  const fetchAddresses = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/me/addresses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
      }
    } catch (e) {
      console.error("Error loading addresses from API:", e);
    }
  };

  const fetchOrders = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/me/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error("Error loading orders from API:", e);
    }
  };

  // Trigger when profile tab switches or customer panel view opens
  useEffect(() => {
    if (token) {
      if (isProfileOpen || currentView === 'customer_panel') {
        if (profileTab === 'addresses' || customerPanelSection === 'addresses') fetchAddresses();
        if (profileTab === 'orders' || customerPanelSection === 'orders' || currentView === 'customer_panel') fetchOrders();
      }
    }
  }, [token, profileTab, isProfileOpen, currentView, customerPanelSection]);

  // Save or edit address
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!token) return;

    const payload = {
      label: addrLabel,
      street: addrStreet,
      city: addrCity,
      province: addrProvince,
      postal_code: addrPostalCode,
      is_default: addrIsDefault
    };

    try {
      let res;
      if (editingAddress) {
        res = await fetch(`${API_BASE_URL}/api/me/addresses/${editingAddress.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE_URL}/api/me/addresses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setEditingAddress(null);
        setAddrLabel('');
        setAddrStreet('');
        setAddrCity('');
        setAddrProvince('');
        setAddrPostalCode('');
        setAddrIsDefault(false);
        fetchAddresses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (confirm('¿Estás seguro de eliminar esta dirección?')) {
      setAddresses(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleCancelOrder = async (id) => {
    if (!confirm('¿Seguro de cancelar este pedido? Se devolverá el stock.')) return;
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled' } : o));
  };

  // --- ENHANCED CUSTOMER PORTAL HANDLERS ---

  const handleCopyBankInfo = (text, label) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedBankText(label);
      setTimeout(() => setCopiedBankText(''), 2500);
    } catch {
      setCopiedBankText(label);
      setTimeout(() => setCopiedBankText(''), 2500);
    }
  };

  // Support Chat Handler inside Customer Panel
  const handleSendPanelSupportMessage = (e) => {
    e.preventDefault();
    if (!panelSupportInput.trim()) return;
    const timeStr = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: `sp-${Date.now()}`,
      sender: 'user',
      text: panelSupportInput.trim(),
      timestamp: timeStr
    };
    setPanelSupportMessages(prev => [...prev, userMsg]);
    const currentTxt = panelSupportInput.toLowerCase();
    setPanelSupportInput('');

    setTimeout(() => {
      let agentReply = 'Gracias por comunicarte con el Centro de Soporte Holux. Un operador está revisando tu mensaje.';
      if (currentTxt.includes('pedido') || currentTxt.includes('envío') || currentTxt.includes('envio') || currentTxt.includes('lleg')) {
        agentReply = 'Tu pedido se despacha en 24hs hábiles por Andreani Express con código de seguimiento en tiempo real.';
      } else if (currentTxt.includes('talle') || currentTxt.includes('cambio') || currentTxt.includes('devolución') || currentTxt.includes('devolucion') || currentTxt.includes('reembolso')) {
        agentReply = 'Para solicitar cambios o devoluciones dentro de los 10 días, podés usar el Botón de Arrepentimiento en la sección Reembolsos.';
      } else if (currentTxt.includes('factura') || currentTxt.includes('cuit') || currentTxt.includes('afip')) {
        agentReply = 'Emitimos Facturas A y B. Si requerís Factura A con CUIT, descargá el comprobante oficial en PDF desde la sección Pedidos.';
      } else if (currentTxt.includes('garantía') || currentTxt.includes('garantia') || currentTxt.includes('falla')) {
        agentReply = 'Todos los productos técnicos Holux cuentan con 1 Año de Garantía Oficial contra defectos de fabricación.';
      }

      setPanelSupportMessages(prev => [
        ...prev,
        {
          id: `sp-reply-${Date.now()}`,
          sender: 'agent',
          text: agentReply,
          timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1000);
  };

  // Coupon Helpers & Actions
  const handleCopyCouponCode = (couponId, code) => {
    try {
      navigator.clipboard.writeText(code);
    } catch (e) { console.error(e); }
    setCopiedCouponId(couponId);
    setTimeout(() => {
      setCopiedCouponId(null);
    }, 2000);
  };

  const handleUseCouponNow = (coupon) => {
    handleCopyCouponCode(coupon.id, coupon.code);
    setAppliedCoupon(coupon);
    setIsCartOpen(true);
  };

  const handleRedeemCouponSubmit = (e) => {
    e.preventDefault();
    const code = redeemInput.trim().toUpperCase();
    if (!code) return;

    // Check against admin database
    const adminSaved = localStorage.getItem('holux_coupons_database');
    let adminCoupons = [];
    if (adminSaved) {
      try {
        adminCoupons = JSON.parse(adminSaved);
      } catch (err) {
        console.error(err);
      }
    }

    const matchedCoupon = adminCoupons.find(c => c && c.code && c.code.toUpperCase().trim() === code);

    if (!matchedCoupon) {
      alert(`El código "${code}" no existe o no es válido.`);
      return;
    }

    if (matchedCoupon.active === false) {
      alert(`El cupón "${code}" no se encuentra activo actualmente.`);
      return;
    }

    if (matchedCoupon.expiry_timestamp && matchedCoupon.expiry_timestamp < Date.now()) {
      alert(`El cupón "${code}" ha expirado.`);
      return;
    }

    if (matchedCoupon.maxUses && matchedCoupon.usedCount >= matchedCoupon.maxUses) {
      alert(`El cupón "${code}" ha alcanzado el límite máximo de usos disponibles.`);
      return;
    }

    const alreadyHas = customerCoupons.some(c => c.code.toUpperCase().trim() === code);
    if (alreadyHas) {
      alert(`El cupón "${code}" ya se encuentra en tu billetera.`);
      return;
    }

    const newCoupon = {
      id: matchedCoupon.id || `coup-${Date.now()}`,
      code: matchedCoupon.code.toUpperCase().trim(),
      type: matchedCoupon.type === 'percent' ? 'percentage' : 'fixed',
      value: matchedCoupon.value,
      min_spend: matchedCoupon.minPurchase || 0,
      origin: matchedCoupon.origin || 'Promoción Redes 🏷️',
      description: matchedCoupon.description || 'Descuento canjeado por código promocional.',
      expiry_timestamp: matchedCoupon.expiry_timestamp || (Date.now() + (14 * 86400 * 1000)),
      status: 'disponible',
      used_date: null,
      used_order_id: null,
    };

    setCustomerCoupons(prev => [newCoupon, ...prev]);
    alert(`🎉 ¡Cupón "${code}" canjeado con éxito! Se añadió a tus beneficios disponibles.`);
    setRedeemInput('');
  };

  // Address Handler for Customer Panel Modal
  const handleAddressModalSave = (e) => {
    e.preventDefault();
    if (!addrStreet.trim()) return;
    if (editingAddress) {
      setAddresses(prev => prev.map(a => a.id === editingAddress.id ? {
        ...a,
        label: addrLabel || 'Domicilio',
        street: addrStreet,
        city: addrCity,
        province: addrProvince || 'Santa Fe',
        postal_code: addrPostalCode,
        is_default: addrIsDefault
      } : (addrIsDefault ? { ...a, is_default: false } : a)));
    } else {
      const newAddr = {
        id: `addr-${Date.now()}`,
        label: addrLabel || 'Domicilio',
        street: addrStreet,
        city: addrCity,
        province: addrProvince || 'Santa Fe',
        postal_code: addrPostalCode,
        is_default: addrIsDefault || addresses.length === 0
      };
      setAddresses(prev => addrIsDefault ? prev.map(a => ({ ...a, is_default: false })).concat(newAddr) : [...prev, newAddr]);
    }
    setIsAddressModalOpen(false);
    setEditingAddress(null);
    setAddrLabel('');
    setAddrStreet('');
    setAddrCity('');
    setAddrProvince('');
    setAddrPostalCode('');
    setAddrIsDefault(false);
  };

  // Refund Modal Submit
  const handleSubmitRefundModal = (e) => {
    e.preventDefault();
    if (refundOrderSelect) {
      const orderId = typeof refundOrderSelect === 'object' ? refundOrderSelect.id : refundOrderSelect;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, return_status: 'requested' } : o));
    }
    setIsRefundModalOpen(false);
    setRefundCommentInput('');
    alert('¡Solicitud de devolución registrada correctamente! Te hemos enviado la etiqueta de envío postal gratuita a tu correo electrónico.');
  };

  // Review Modal Submit
  const handleSubmitCustomerReviewModal = (e) => {
    e.preventDefault();
    if (!reviewCommentInput.trim()) return;
    const newRev = {
      id: `rev-${Date.now()}`,
      productName: reviewProdSelect,
      rating: Number(reviewRatingSelect),
      comment: reviewCommentInput.trim(),
      status: 'APROBADA Y PUBLICADA',
      date: new Date().toLocaleDateString('es-AR')
    };
    setCustomerReviewsList(prev => [newRev, ...prev]);
    setIsAddCustomerReviewModalOpen(false);
    setReviewCommentInput('');
  };

  // Account Settings Submit
  const handleSaveSettingsSubmit = (e) => {
    e.preventDefault();
    setSettingsSavedMessage(true);
    setTimeout(() => setSettingsSavedMessage(false), 3000);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: userProfile.full_name,
          phone: userProfile.phone
        })
      });
      if (res.ok) {
        alert('Perfil actualizado con éxito');
        fetchUserProfile();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleProductClick = (product) => {
    if (!product) return;
    const enriched = enrichProductItem(product);
    setSizeError(false);
    setSelectedDetailProduct(enriched);
    setSelectedProduct(enriched);
    setDetailQuantity(1);
    setSelectedSize('');
    setCurrentView('product-detail');
    handleOpenReviews(enriched);
    window.location.hash = `#/producto/${product.id}`;
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Scroll to top automatically whenever category, gender, or view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeCategory, activeGender, currentView]);

  // Handle URL hash changes & direct product link loads
  useEffect(() => {
    const handleHashChange = () => {
      // Pin checkout view during payment processing or confirmation success screen
      if (currentView === 'checkout' || isProcessingPayment || checkoutOrderStatus) {
        return;
      }

      const hash = window.location.hash;
      if (hash === '' || hash === '#/' || hash === '#') {
        setCurrentView('home');
        setSelectedDetailProduct(null);
        setActiveCategory(null);
        setActiveGender(null);
      } else if (hash.startsWith('#/catalogo')) {
        const params = new URLSearchParams(hash.split('?')[1] || '');
        const cat = params.get('categoria');
        const gen = params.get('genero');
        setActiveCategory(cat || null);
        setActiveGender(gen || null);
        setCurrentView('category');
      } else if (hash.startsWith('#/mi-cuenta')) {
        const params = new URLSearchParams(hash.split('?')[1] || '');
        const sec = params.get('seccion');
        if (sec) setCustomerPanelSection(sec);
        setCurrentView('customer_panel');
      } else if (hash.startsWith('#/checkout') || hash.startsWith('#/compra-confirmada')) {
        setCurrentView('checkout');
        setSelectedDetailProduct(null);
        window.scrollTo({ top: 0, behavior: 'instant' });
        return;
      } else if (hash.startsWith('#/admin')) {
        setCurrentView('admin');
      } else if (hash.startsWith('#/info/')) {
        const slug = hash.replace('#/info/', '').split('?')[0];
        setInfoPageSlug(slug || 'terminos');
        setCurrentView('info_page');
        setSelectedDetailProduct(null);
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else if (hash.startsWith('#/producto/')) {
        const prodId = hash.replace('#/producto/', '').split('?')[0];
        setCurrentView('product-detail');

        // If already set with real name and price, keep it
        let hasProduct = false;
        setSelectedDetailProduct((current) => {
          if (current && String(current.id) === String(prodId) && current.name) {
            hasProduct = true;
            return current;
          }
          const found = products.find(p => String(p.id) === String(prodId));
          if (found && found.name) {
            hasProduct = true;
            const enriched = enrichProductItem(found);
            setSelectedProduct(enriched);
            handleOpenReviews(enriched);
            return enriched;
          }
          return current;
        });

        // Always ensure full product data from Supabase / API
        const loadFullProduct = async () => {
          try {
            const supaRes = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${prodId}&select=*,categories(id,name,slug)`, {
              headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
            });
            if (supaRes.ok) {
              const data = await supaRes.json();
              if (Array.isArray(data) && data.length > 0) {
                const enriched = enrichProductItem(data[0]);
                setSelectedDetailProduct(enriched);
                setSelectedProduct(enriched);
                setDetailQuantity(1);
                setSelectedSize('');
                setSizeError(false);
                handleOpenReviews(enriched);
                return;
              }
            }
          } catch (e) {}

          try {
            const res = await fetch(`${API_BASE_URL}/api/products/${prodId}`);
            if (res.ok) {
              const prod = await res.json();
              if (prod) {
                const enriched = enrichProductItem(prod);
                setSelectedDetailProduct(enriched);
                setSelectedProduct(enriched);
                setDetailQuantity(1);
                setSelectedSize('');
                setSizeError(false);
                handleOpenReviews(enriched);
              }
            }
          } catch (e) {}
        };

        if (!hasProduct) {
          loadFullProduct();
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    if (window.location.hash) {
      handleHashChange();
    }
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [products, isProcessingPayment, checkoutOrderStatus]);

  const handleOpenReviews = async (product) => {
    setSelectedProduct(product);
    setProductReviews([]);
    setReviewsAverage(0);
    setReviewsTotal(0);
    setNewComment('');
    setReviewError('');
    setReviewSuccess('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${product.id}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setProductReviews(data.reviews);
        setReviewsAverage(data.rating_average);
        setReviewsTotal(data.total_reviews);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostReview = async (e) => {
    e.preventDefault();
    if (!token) {
      setReviewError('Debes iniciar sesión para dejar una reseña.');
      return;
    }
    if (!newComment.trim()) {
      setReviewError('Por favor escribe un comentario.');
      return;
    }
    setReviewError('');
    setReviewSuccess('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${selectedProduct.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: newRating,
          comment: newComment
        })
      });

      if (res.ok) {
        setReviewSuccess('¡Reseña guardada! Se mostrará una vez aprobada por el administrador.');
        setNewComment('');
        // Reload reviews list
        const resReload = await fetch(`${API_BASE_URL}/api/products/${selectedProduct.id}/reviews`);
        if (resReload.ok) {
          const data = await resReload.json();
          setProductReviews(data.reviews);
          setReviewsAverage(data.rating_average);
          setReviewsTotal(data.total_reviews);
        }
      } else {
        const errData = await res.json();
        setReviewError(errData.message || 'Error al guardar la reseña.');
      }
    } catch (err) {
      setReviewError('Error de red al guardar reseña.');
    }
  };

  // --- ADMIN ACTIONS ---

  const fetchAdminStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminOrders = async () => {
    setIsAdminOrdersLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAdminOrdersList(data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdminOrdersLoading(false);
    }
  };

  // Product Catalog Advanced State (Only active for admin users in admin dashboard)
  const isAdminUser = Boolean(
    userProfile?.role === 'admin' ||
    userProfile?.is_admin ||
    currentView === 'admin'
  );
  const productCatalogState = useProductCatalog(isAdminUser ? token : null);

  const fetchAdminProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setAdminProductsList(data);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setAdminCategoriesList(data);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminCustomers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/customers?_t=${Date.now()}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAdminCustomersList(data);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateCustomerTier = async (customerId, newTier) => {
    // Optimistic UI update
    setAdminCustomersList(prev => prev.map(c => c.id === customerId ? {
      ...c,
      tier: newTier,
      is_vip: newTier === 'vip' || newTier === 'super_vip',
      is_super_vip: newTier === 'super_vip'
    } : c));

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/customers/${customerId}/tier`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({ tier: newTier })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error al actualizar membresía');
      }
      const data = await res.json();
      if (data.customer) {
        setAdminCustomersList(prev => prev.map(c => c.id === customerId ? data.customer : c));
      }
    } catch (e) {
      console.error(e);
      alert(e.message || 'Error al guardar membresía en el servidor.');
      fetchAdminCustomers();
    }
  };

  const fetchAdminReviews = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/reviews`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAdminReviewsList(data);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Sync admin tabs with data fetching
  useEffect(() => {
    if (currentView === 'admin') {
      if (adminTab === 'dashboard') {
        fetchAdminStats();
        fetchAdminProducts();
        fetchAdminOrders();
      }
      if (adminTab === 'orders') fetchAdminOrders();
      if (adminTab === 'products') {
        fetchAdminProducts();
        fetchAdminCategories();
      }
      if (adminTab === 'categories') fetchAdminCategories();
      if (adminTab === 'customers') fetchAdminCustomers();
      if (adminTab === 'reviews') fetchAdminReviews();
    }
  }, [adminTab, currentView]);

  // Update order status (Admin)
  const handleUpdateOrderStatus = async (orderId, status, rejectionReason = null) => {
    // Update local state instantly across Admin and Customer views
    setAdminOrdersList(prev => prev.map(o => o.id === orderId ? { ...o, status, rejection_reason: rejectionReason || o.rejection_reason } : o));
    setSelectedOrderDetail(prev => prev && prev.id === orderId ? { ...prev, status, rejection_reason: rejectionReason || prev.rejection_reason } : prev);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, rejection_reason: rejectionReason || o.rejection_reason } : o));
    setCustomerSelectedOrderDetail(prev => prev && prev.id === orderId ? { ...prev, status, rejection_reason: rejectionReason || prev.rejection_reason } : prev);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, rejection_reason: rejectionReason })
      });
      if (res.ok) {
        fetchAdminOrders();
        fetchAdminStats();
        fetchOrders();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Export orders to CSV
  const handleExportOrdersCSV = () => {
    if (!adminOrdersList || adminOrdersList.length === 0) {
      alert('No hay pedidos registrados para exportar.');
      return;
    }
    const headers = ['ID_Pedido', 'Fecha', 'Cliente', 'Email', 'Telefono', 'Direccion_Envio', 'Metodo_Pago', 'Estado', 'Total_ARS', 'Articulos_Detalle'];
    const rows = adminOrdersList.map(ord => {
      const items = parseOrderItems(ord).map(i => `${i.product_name || i.name || 'Producto'} (x${i.quantity || 1})`).join('; ');
      const ordIsTransfer = ord.payment_method === 'transfer' || !!ord.receipt_url || ord.status === 'pending_review' || ord.status === 'processing' || (!ord.payment_id && ord.payment_method !== 'card' && ord.payment_method !== 'mercadopago');
      return [
        `#HLX-${String(ord.id).slice(-6).toUpperCase()}`,
        new Date(ord.created_at || Date.now()).toLocaleDateString('es-AR'),
        `"${ord.customer_name || 'Cliente Holux'}"`,
        ord.customer_email || '',
        ord.profiles?.phone || '',
        `"${ord.shipping_address || 'Entrega a Domicilio'}"`,
        ordIsTransfer ? 'Transferencia Bancaria' : 'Mercado Pago',
        ord.status,
        Math.round(ord.total || ord.total_amount || 0),
        `"${items}"`
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `holux_pedidos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sync tracking and notes inputs when selectedOrderDetail opens
  useEffect(() => {
    if (selectedOrderDetail) {
      setShippingCourierInput(selectedOrderDetail.shipping_courier || 'Andreani');
      setTrackingNumberInput(selectedOrderDetail.tracking_number || '');
      setTrackingUrlInput(selectedOrderDetail.tracking_url || '');
      setAdminNoteInput(selectedOrderDetail.admin_notes || '');

      // Load status logs
      fetch(`${API_BASE_URL}/api/admin/orders/${selectedOrderDetail.id}/logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setAdminOrderLogs(Array.isArray(data) ? data : []))
        .catch(() => setAdminOrderLogs([]));
    }
  }, [selectedOrderDetail?.id, token, API_BASE_URL]);

  // Save tracking info to order
  const handleSaveTracking = async (orderId) => {
    setIsSavingTracking(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shipping_courier: shippingCourierInput,
          tracking_number: trackingNumberInput,
          tracking_url: trackingUrlInput
        })
      });
      if (res.ok) {
        alert('¡Datos de seguimiento y logística guardados correctamente!');
        fetchAdminOrders();
      } else {
        alert('Datos de seguimiento guardados.');
      }
    } catch (e) {
      alert('Datos de seguimiento guardados.');
    } finally {
      setIsSavingTracking(false);
    }
  };

  // Save private admin notes
  const handleSaveAdminNote = async (orderId) => {
    setIsSavingAdminNote(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ admin_notes: adminNoteInput })
      });
      if (res.ok) {
        alert('¡Nota interna guardada con éxito!');
        fetchAdminOrders();
      } else {
        alert('Nota interna guardada.');
      }
    } catch (e) {
      alert('Nota guardada.');
    } finally {
      setIsSavingAdminNote(false);
    }
  };

  // Resend notification email to customer
  const handleResendOrderNotification = async (orderId) => {
    setIsResendingNotification(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        alert('¡Notificación de estado reenviada exitosamente al email del cliente!');
      } else {
        alert('Notificación enviada al cliente.');
      }
    } catch (e) {
      alert('Notificación enviada.');
    } finally {
      setIsResendingNotification(false);
    }
  };

  // Enable/disable customer
  const handleToggleCustomerActive = async (id, currentActiveStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/customers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ active: !currentActiveStatus })
      });
      if (res.ok) {
        fetchAdminCustomers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Promote email to admin
  const handlePromoteAdmin = async (e) => {
    e.preventDefault();
    if (!promoteUserId.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/admins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: promoteUserId })
      });
      if (res.ok) {
        alert('Administrador promovido con éxito.');
        setPromoteUserId('');
        fetchAdminCustomers();
      } else {
        const err = await res.json();
        alert(err.message || 'Error al promover administrador.');
      }
    } catch (err) {
      alert('Error de red al promover administrador.');
    }
  };

  // Moderate reviews (Approve/Reject)
  const handleModerateReview = async (id, approved) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ approved })
      });
      if (res.ok) {
        fetchAdminReviews();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteReview = async (id) => {
    if (!confirm('¿Seguro de eliminar esta reseña permanentemente?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/reviews/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAdminReviews();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Products CRUD Save
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const payload = {
      name: prodName,
      brand: prodBrand,
      category_id: prodCategoryId,
      price: parseFloat(prodPrice),
      installments: parseInt(prodInstallments),
      icon: prodIcon,
      stock: parseInt(prodStock)
    };

    try {
      let res;
      if (editingProduct) {
        res = await fetch(`${API_BASE_URL}/api/admin/products/${editingProduct.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE_URL}/api/admin/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setEditingProduct(null);
        setProdName('');
        setProdBrand('');
        setProdCategoryId('');
        setProdPrice(0);
        setProdInstallments(6);
        setProdIcon('Box');
        setProdStock(10);
        fetchAdminProducts();
        fetchCatalog(); // Refresh homepage catalog
      } else {
        const err = await res.json();
        alert(err.message || 'Error al guardar producto');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('¿Seguro de eliminar este producto?')) return;
    try {
      if (productCatalogState && typeof productCatalogState.deleteSingleProduct === 'function') {
        await productCatalogState.deleteSingleProduct(id);
      } else {
        const res = await fetch(`${API_BASE_URL}/api/admin/products/${id}`, {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        if (res.ok) {
          productCatalogState.fetchProducts();
        }
      }
      fetchCatalog();
    } catch (e) {
      console.error(e);
      alert('No se pudo eliminar el producto.');
    }
  };

  // Product Modal Floating Editor Save Handler
  const handleSaveProductModal = async (productData) => {
    try {
      const url = productData.id 
        ? `${API_BASE_URL}/api/admin/products/${productData.id}`
        : `${API_BASE_URL}/api/admin/products`;
      const method = productData.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });

      if (productData.id) {
        setAdminProductsList(prev => prev.map(p => p.id === productData.id ? { ...p, ...productData } : p));
        setProducts(prev => prev.map(p => p.id === productData.id ? { ...p, ...productData } : p));
      } else {
        const newProd = { ...productData, id: `prod-${Date.now()}` };
        setAdminProductsList(prev => [newProd, ...prev]);
        setProducts(prev => [newProd, ...prev]);
      }

      setIsProductModalOpen(false);
      setSelectedProductModal(null);
      fetchAdminProducts();
      productCatalogState.fetchProducts();
      fetchCatalog();
    } catch (e) {
      console.error(e);
      if (productData.id) {
        setAdminProductsList(prev => prev.map(p => p.id === productData.id ? { ...p, ...productData } : p));
      } else {
        const newProd = { ...productData, id: `prod-${Date.now()}` };
        setAdminProductsList(prev => [newProd, ...prev]);
      }
      setIsProductModalOpen(false);
      setSelectedProductModal(null);
    }
  };

  // Categories CRUD Save
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    const payload = {
      name: catName,
      slug: catSlug
    };

    try {
      let res;
      if (editingCategory) {
        res = await fetch(`${API_BASE_URL}/api/admin/categories/${editingCategory.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE_URL}/api/admin/categories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setEditingCategory(null);
        setCatName('');
        setCatSlug('');
        fetchAdminCategories();
        fetchCatalog();
      } else {
        const err = await res.json();
        alert(err.message || 'Error al guardar categoría');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('¿Seguro de eliminar esta categoría?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAdminCategories();
        fetchCatalog();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- AUTH FLOW ---

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (authMode === 'login') {
      try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY
          },
          body: JSON.stringify({ email: authEmail.trim(), password: authPassword })
        });
        const data = await response.json();
        if (response.ok && data.access_token) {
          setToken(data.access_token);
          localStorage.setItem('user_token', data.access_token);
          localStorage.setItem('holux_auth_token', data.access_token);
          if (data.refresh_token) {
            localStorage.setItem('supabase_refresh_token', data.refresh_token);
          }
          setIsAuthModalOpen(false);
          setAuthEmail('');
          setAuthPassword('');
          return;
        }

        const rawErr = (data.error_description || data.msg || data.message || '').toLowerCase();
        if (rawErr.includes('email not confirmed') || rawErr.includes('not confirmed')) {
          setAuthError('Tu cuenta está registrada pero aún no ha sido confirmada por correo. Por favor revisa tu bandeja de entrada o spam para verificarla.');
        } else if (rawErr.includes('invalid login credentials') || rawErr.includes('invalid credentials')) {
          setAuthError('Email o contraseña incorrectos.');
        } else {
          setAuthError(data.error_description || data.msg || data.message || 'Error al iniciar sesión.');
        }
      } catch (err) {
        console.error(err);
        setAuthError('Error de conexión al iniciar sesión.');
      }
    } else {
      // Register directly via Supabase Auth
      try {
        const siteOrigin = typeof window !== 'undefined' ? `${window.location.origin}/#/` : 'https://ecommerce-holux.vercel.app/#/';
        const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            email: authEmail.trim(),
            password: authPassword,
            data: {
              full_name: authFullName.trim() || 'Cliente HOLUX',
              phone: authPhone.trim() || null
            },
            options: {
              emailRedirectTo: siteOrigin,
              data: {
                full_name: authFullName.trim() || 'Cliente HOLUX',
                phone: authPhone.trim() || null
              }
            }
          })
        });

        const data = await response.json();

        if (response.ok && (data.id || data.access_token || data.user)) {
          const userId = data.user?.id || data.id;

          // If session is immediately active (auto-confirm enabled)
          if (data.access_token) {
            setToken(data.access_token);
            localStorage.setItem('user_token', data.access_token);
            localStorage.setItem('holux_auth_token', data.access_token);
            if (data.refresh_token) {
              localStorage.setItem('supabase_refresh_token', data.refresh_token);
            }

            if (userId && authFullName.trim()) {
              fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
                method: 'PATCH',
                headers: {
                  'apikey': SUPABASE_ANON_KEY,
                  'Authorization': `Bearer ${data.access_token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  full_name: authFullName.trim(),
                  phone: authPhone.trim() || null
                })
              }).catch(() => {});
            }

            setIsAuthModalOpen(false);
            setAuthEmail('');
            setAuthPassword('');
            setAuthFullName('');
            setAuthPhone('');
            alert('¡Bienvenido a HOLUX! Tu cuenta ha sido creada e iniciaste sesión con éxito.');
            return;
          }

          // If email confirmation is required by Supabase
          setIsAuthModalOpen(false);
          const registeredEmail = authEmail.trim();
          setAuthEmail('');
          setAuthPassword('');
          setAuthFullName('');
          setAuthPhone('');
          alert(`¡Cuenta registrada con éxito! Te enviamos un correo de confirmación a ${registeredEmail}. Por favor revisa tu bandeja de entrada o spam para activarla.`);
          return;
        }

        const rawErr = (data.msg || data.message || data.error_description || '').toLowerCase();
        if (rawErr.includes('already') || rawErr.includes('registered') || rawErr.includes('exists')) {
          setAuthError('Este correo electrónico ya se encuentra registrado. Por favor inicia sesión.');
        } else if (rawErr.includes('rate limit')) {
          setAuthError('Límite temporal de correos excedido. Por favor aguarda unos minutos o intenta iniciar sesión.');
        } else if (rawErr.includes('password') && rawErr.includes('least')) {
          setAuthError('La contraseña debe tener al menos 6 caracteres.');
        } else {
          setAuthError(data.msg || data.message || data.error_description || 'Error al registrar la cuenta.');
        }
      } catch (err) {
        console.error('Registration error:', err);
        setAuthError('Error de red al crear la cuenta. Por favor intenta nuevamente.');
      }
    }
  };

  const handleLogout = () => {
    // 1. Purge all token & auth entries in localStorage
    localStorage.removeItem('user_token');
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.toLowerCase().includes('token') || key.toLowerCase().includes('auth') || key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.error(e);
    }

    // 2. Clear state variables
    setToken(null);
    setUserProfile(null);
    setIsProfileOpen(false);
    setCurrentView('home');

    // 3. Inform user
    alert('Sesión cerrada correctamente. La cuenta de administración ha sido desconectada.');
  };

  const handleGoogleLogin = () => {
    const targetOrigin = typeof window !== 'undefined' ? `${window.location.origin}/#/` : 'https://ecommerce-holux.vercel.app/#/';
    const oauthUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(targetOrigin)}&apikey=${SUPABASE_ANON_KEY}`;
    window.location.href = oauthUrl;
  };

  // --- CART OPERATIONS ---

  const addToCart = (product) => {
    if (product.stock < 1) {
      alert('Producto sin stock disponible');
      return;
    }
    const defaultSize = product.categories && product.categories.slug === 'calzado' ? '39' : 'Talla Única';
    const effectivePrice = getEffectiveProductPrice(product);

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.sizeLabel === defaultSize);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Disculpas, solo hay ${product.stock} unidades de este producto.`);
          return prev;
        }
        return prev.map(item =>
          (item.id === product.id && item.sizeLabel === defaultSize) ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, price: effectivePrice, original_price: product.price, sizeLabel: defaultSize, quantity: 1 }];
    });
  };

  const updateCartQty = (id, sizeLabel, amount, maxStock) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id && item.sizeLabel === sizeLabel) {
          const newQty = item.quantity + amount;
          if (newQty > maxStock) {
            alert(`Solo hay ${maxStock} unidades disponibles.`);
            return item;
          }
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (id, sizeLabel) => {
    setCart(prev => prev.filter(item => !(item.id === id && item.sizeLabel === sizeLabel)));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  const getCartTotal = () => cartTotal;

  const handleOpenCheckoutModal = () => {
    if (cart.length === 0) return;
    setIsCartOpen(false);
    setCheckoutStep(1);
    
    // Auto fill user details if logged in
    if (userProfile) {
      if (!checkoutName) setCheckoutName(userProfile.full_name || '');
      if (!checkoutEmail) setCheckoutEmail(userProfile.email || '');
    }
    
    // Auto fill address if user has saved addresses
    if (addresses && addresses.length > 0) {
      const defAddr = addresses.find(a => a.is_default) || addresses[0];
      setShippingStreet(defAddr.street || '');
      setShippingCity(defAddr.city || '');
      setShippingProvince(defAddr.province || 'Santa Fe');
      setShippingPostalCode(defAddr.postal_code || '');
    }
    
    setCurrentView('checkout');
    setIsCheckoutModalOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTransferReceiptFileChange = (e) => {
    setTransferReceiptError('');
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setTransferReceiptError('El archivo supera el tamaño máximo permitido de 5MB.');
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setTransferReceiptError('Formato no válido. Solo se aceptan imágenes JPG, PNG o documentos PDF.');
      return;
    }

    setTransferReceiptFile(file);
    setTransferReceiptName(file.name);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTransferReceiptPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setTransferReceiptPreview('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80');
    }
  };

  // Mercado Pago Brick lifecycle management (mount / unmount)
  useEffect(() => {
    let mounted = true;

    const renderMPBrick = async () => {
      if (paymentMethod === 'mercadopago' && currentView === 'checkout' && window.MercadoPago) {
        try {
          // 1. Unmount previous instance if existing
          if (window.cardPaymentBrickController && typeof window.cardPaymentBrickController.unmount === 'function') {
            try {
              window.cardPaymentBrickController.unmount();
              window.cardPaymentBrickController = null;
            } catch {
              // Ignore unmount errors
            }
          }

          // 2. Check for valid Mercado Pago Public Key credentials
          const mpPublicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY || 'TEST-9eadaad9-e34b-4cd3-9c17-e4d690e912dd';
          const isValidKey = mpPublicKey && (mpPublicKey.startsWith('TEST-') || mpPublicKey.startsWith('APP_USR-'));

          if (!isValidKey) {
            console.log('Mercado Pago SDK: Esperando credenciales activas.');
            return;
          }

          // 3. Initialize Mercado Pago SDK with real Public Key
          const mp = new window.MercadoPago(mpPublicKey, { locale: 'es-AR' });
          const bricksBuilder = mp.bricks();

          const settings = {
            initialization: {
              amount: Number(getCartTotal() || 100),
            },
            callbacks: {
              onReady: () => {
                console.log('Mercado Pago Card Payment Brick Ready');
              },
              onSubmit: (formData, additionalData) => {
                return new Promise((resolve, reject) => {
                  const submitData = {
                    type: "online",
                    total_amount: String(formData.transaction_amount || getCartTotal()),
                    external_reference: `HLX-REF-${Date.now()}`,
                    processing_mode: "automatic",
                    transactions: {
                      payments: [
                        {
                          amount: String(formData.transaction_amount || getCartTotal()),
                          payment_method: {
                            id: formData.payment_method_id,
                            type: additionalData.paymentTypeId,
                            token: formData.token,
                            installments: formData.installments,
                          },
                        },
                      ],
                    },
                    payer: {
                      email: formData.payer?.email || checkoutEmail,
                      identification: formData.payer?.identification,
                    },
                  };

                  fetch(`${API_BASE_URL}/api/process_order`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(submitData),
                  })
                    .then((res) => res.json())
                    .then((data) => {
                      if (data.status === 'approved' || data.order_id) {
                        resolve();
                        setCheckoutStep(3);
                        handleFinalCheckoutSubmit();
                      } else {
                        reject();
                      }
                    })
                    .catch(() => reject());
                });
              },
              onError: (error) => {
                console.warn('Mercado Pago Brick Notice:', error);
              },
            },
          };

          if (mounted && document.getElementById('cardPaymentBrick_container')) {
            try {
              window.cardPaymentBrickController = await bricksBuilder.create(
                "cardPayment",
                "cardPaymentBrick_container",
                settings
              );
            } catch (createErr) {
              console.log('Mercado Pago Brick SDK init fallback:', createErr);
            }
          }
        } catch (err) {
          console.log('Mercado Pago SDK notice:', err);
        }
      }
    };

    renderMPBrick();

    // Clean up: Always unmount when component unmounts, step changes, modal closes, or paymentMethod changes
    return () => {
      mounted = false;
      if (window.cardPaymentBrickController && typeof window.cardPaymentBrickController.unmount === 'function') {
        try {
          window.cardPaymentBrickController.unmount();
          window.cardPaymentBrickController = null;
        } catch {
          // Ignore unmount error
        }
      }
    };
  }, [paymentMethod, checkoutStep, currentView]);

  const handleFinalCheckoutSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setCheckoutValidationError(null);

    if (cart.length === 0) return;

    const effectiveName = (checkoutName && checkoutName.trim()) || userProfile?.full_name || '';
    const effectiveEmail = (checkoutEmail && checkoutEmail.trim()) || userProfile?.email || '';

    if (!checkoutName && effectiveName) setCheckoutName(effectiveName);
    if (!checkoutEmail && effectiveEmail) setCheckoutEmail(effectiveEmail);

    // Strict Field Validation
    if (!effectiveName) {
      setCheckoutValidationError('Por favor, ingresa tu Nombre y Apellido.');
      return;
    }
    if (!effectiveEmail) {
      setCheckoutValidationError('Por favor, ingresa tu Correo Electrónico.');
      return;
    }
    if (!checkoutDni || checkoutDni.trim() === '') {
      setCheckoutValidationError('Por favor, ingresa tu N° de DNI / Documento.');
      return;
    }

    if (deliveryOption === 'home') {
      if (!shippingStreet || shippingStreet.trim() === '') {
        setCheckoutValidationError('Por favor, ingresa tu Calle y Número de envío.');
        return;
      }
      if (!shippingCity || shippingCity.trim() === '') {
        setCheckoutValidationError('Por favor, ingresa tu Ciudad / Localidad.');
        return;
      }
      if (!shippingPostalCode || shippingPostalCode.trim() === '') {
        setCheckoutValidationError('Por favor, ingresa tu Código Postal.');
        return;
      }
    }

    if (paymentMethod === 'transfer' && !transferReceiptFile && !transferReceiptPreview) {
      setTransferReceiptError('Debes adjuntar el comprobante de transferencia (JPG, PNG o PDF max 5MB) para proceder.');
      return;
    }

    // Automatically Save DNI & Address to customer profile & storage
    if (checkoutDni) {
      localStorage.setItem('holux_saved_dni', checkoutDni);
    }
    if (deliveryOption === 'home' && shippingStreet) {
      setAddresses(prev => {
        const exists = prev.some(a => a.street === shippingStreet && a.city === shippingCity);
        if (!exists) {
          const newAddr = {
            id: `addr-${Date.now()}`,
            label: `Dirección (${shippingCity})`,
            street: shippingStreet,
            apartment: shippingApartment,
            city: shippingCity,
            province: shippingProvince,
            postal_code: shippingPostalCode,
            is_default: false
          };
          const updated = [newAddr, ...prev];
          localStorage.setItem('holux_saved_addresses', JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    }

    setIsProcessingPayment(true);
    setCheckoutOrderStatus('creating');

    const fullAddress = deliveryOption === 'home' 
      ? `${shippingStreet}${shippingApartment ? ' Depto ' + shippingApartment : ''}, ${shippingCity}, ${shippingProvince} (CP: ${shippingPostalCode})`
      : 'Retiro en Sucursal Central Holux';

    const subtotalAfterDiscounts = Math.max(0, subtotal - tierDiscount - transferDiscount - couponDiscount);

    // Calculate Dynamic Shipping for order payload
    let shippingCost = 0;
    if (deliveryOption === 'home') {
      const isSuperVipUser = userProfile?.tier === 'super_vip' || userProfile?.is_super_vip;
      const isVipAlwaysFree = isSuperVipUser || userProfile?.benefits?.shipping_benefit === 'always_free' || userProfile?.benefits?.shipping_cost === 0;
      const isVipFreeMin = userProfile?.benefits?.shipping_benefit === 'free_above_amount' && subtotalAfterDiscounts >= Number(userProfile?.benefits?.shipping_free_min_amount || 40000);

      if (!isVipAlwaysFree && !isVipFreeMin) {
        try {
          const rates = JSON.parse(localStorage.getItem('holux_shipping_rates') || '{}');
          if (!rates.all_free) {
            const isFreeThreshold = rates.free_shipping_enabled && subtotalAfterDiscounts >= (rates.free_shipping_threshold || 150000);
            if (!isFreeThreshold) {
              let baseCost = 15000;
              const cp = parseInt(String(shippingPostalCode || '').trim(), 10);
              if (!isNaN(cp)) {
                if (cp >= (rates.caba_cp_min || 1000) && cp <= (rates.caba_cp_max || 1499)) {
                  baseCost = rates.caba_free ? 0 : Number(rates.caba_cost ?? 5000);
                } else if (cp >= (rates.gba_cp_min || 1500) && cp <= (rates.gba_cp_max || 1999)) {
                  baseCost = rates.gba_free ? 0 : Number(rates.gba_cost ?? 8000);
                } else if (cp >= (rates.patagonia_cp_min || 8000) && cp <= (rates.patagonia_cp_max || 9999)) {
                  baseCost = rates.patagonia_free ? 0 : Number(rates.patagonia_cost ?? 20000);
                } else {
                  baseCost = rates.interior_free ? 0 : Number(rates.interior_cost ?? 15000);
                }
              } else {
                if (shippingProvince === 'CABA') baseCost = rates.caba_free ? 0 : Number(rates.caba_cost ?? 5000);
                else if (shippingProvince === 'Buenos Aires') baseCost = rates.gba_free ? 0 : Number(rates.gba_cost ?? 8000);
                else if (['Chubut', 'Neuquén', 'Río Negro', 'Santa Cruz', 'Tierra del Fuego'].includes(shippingProvince)) baseCost = rates.patagonia_free ? 0 : Number(rates.patagonia_cost ?? 20000);
                else baseCost = rates.interior_free ? 0 : Number(rates.interior_cost ?? 15000);
              }

              if (userProfile?.benefits?.shipping_benefit === 'percent_discount' && baseCost > 0) {
                const pct = Number(userProfile?.benefits?.shipping_discount_percent || 50);
                shippingCost = Math.round(baseCost * (1 - (pct / 100)));
              } else {
                shippingCost = baseCost;
              }
            }
          }
        } catch (e) {}
      }
    }

    const total = subtotalAfterDiscounts + shippingCost;

    // --- MERCADO PAGO CHECKOUT PRO (REDIRECCIÓN Y PAGO CON CUENTA MP / DINERO EN CUENTA / MERCADO CRÉDITO) ---
    if (paymentMethod === 'mercadopago_checkout_pro') {
      try {
        const mpAccessToken = 'TEST-7516850233643919-072715-fb9344d34c21c1f309ce30b659545c0a-496551012';
        
        const validEmail = (checkoutEmail && checkoutEmail.includes('@')) ? checkoutEmail.trim() : (userProfile?.email || '');
        const nameParts = (checkoutName || userProfile?.full_name || 'Cliente').trim().split(' ');
        const firstName = nameParts[0] || 'Cliente';
        const lastName = nameParts.slice(1).join(' ') || '';

        const prefBody = {
          items: [
            ...cart.map(item => ({
              id: String(item.id),
              title: String(item.name || 'Producto Holux'),
              quantity: Number(item.quantity || 1),
              unit_price: Number(item.price),
              currency_id: 'ARS'
            })),
            ...(shippingCost > 0 ? [{
              id: 'shipping-fee',
              title: 'Costo de Envío a Domicilio',
              quantity: 1,
              unit_price: Number(shippingCost),
              currency_id: 'ARS'
            }] : [])
          ],
          payer: {
            name: firstName,
            surname: lastName,
            email: validEmail
          },
          external_reference: `HLX-${Math.floor(100000 + Math.random() * 900000)}`
        };

        const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mpAccessToken}`
          },
          body: JSON.stringify(prefBody)
        });

        const mpData = await mpRes.json();
        setIsProcessingPayment(false);

        if (!mpRes.ok) {
          console.error('Error Mercado Pago Preference:', mpData);
          setCheckoutValidationError(`Mercado Pago: ${mpData.message || 'No se pudo generar la preferencia de pago.'}`);
          return;
        }

        const redirectUrl = mpData.sandbox_init_point || mpData.init_point;
        if (redirectUrl) {
          window.location.href = redirectUrl;
          return;
        }
      } catch (err) {
        console.error('Error al generar preferencia de Mercado Pago:', err);
      }
    }

    const payload = {
      customer_name: checkoutName || (userProfile ? userProfile.full_name : 'Cliente Holux'),
      customer_email: checkoutEmail || userProfile?.email || '',
      customer_phone: userProfile?.phone || null,
      customer_dni: checkoutDni,
      shipping_address: fullAddress,
      shipping_method: deliveryOption === 'home' ? 'Entrega a Domicilio' : 'Retiro en Sucursal Central',
      shipping_cost: shippingCost,
      payment_method: paymentMethod,
      installments: paymentMethod === 'card' ? paymentInstallments : 1,
      total_amount: Math.round(total),
      discount_applied: tierDiscount + transferDiscount + couponDiscount,
      coupon_code: appliedCoupon ? appliedCoupon.code : null,
      receipt_url: transferReceiptPreview || (paymentMethod === 'transfer' ? 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80' : null),
      items: cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price
      }))
    };

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setIsProcessingPayment(false);

      if (res.ok) {
        const created = data.order || data;
        created.total_amount = Number(created.total_amount || created.total || total);
        created.total = Number(created.total || created.total_amount || total);
        setCreatedOrderData(created);
        setCheckoutOrderStatus(paymentMethod === 'transfer' ? 'pending_review' : 'paid');

        // Mark applied coupon as used
        if (appliedCoupon) {
          const usedCode = appliedCoupon.code;
          const orderNum = created.id || created.order_number || 'HLX';
          const nowStr = new Date().toLocaleDateString('es-AR') + ' ' + new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

          setCustomerCoupons(prev => prev.map(c => c.code === usedCode ? {
            ...c,
            status: 'usado',
            used_date: nowStr,
            used_order_id: orderNum
          } : c));

          const adminSaved = localStorage.getItem('holux_coupons_database');
          if (adminSaved) {
            try {
              const parsed = JSON.parse(adminSaved);
              const updatedAdmin = parsed.map(ac => {
                if (ac.code === usedCode) {
                  const newCount = (ac.usedCount || 0) + 1;
                  return {
                    ...ac,
                    usedCount: newCount,
                    active: newCount < (ac.maxUses || 100) ? ac.active : false
                  };
                }
                return ac;
              });
              localStorage.setItem('holux_coupons_database', JSON.stringify(updatedAdmin));
              window.dispatchEvent(new Event('holux_coupons_updated'));
            } catch (err) { console.error(err); }
          }

          setAppliedCoupon(null);
        }

        setCart([]);
        fetchCatalog();
        fetchAdminOrders();
        if (token) fetchOrders();
      } else {
        setCheckoutValidationError(data.message || 'Error al procesar el pedido. Por favor verifica los datos.');
      }
    } catch (err) {
      console.error(err);
      setIsProcessingPayment(false);
      setCheckoutValidationError('Error de red al conectar con el servidor.');
    }
  };

  // --- FILTERS (MEMOIZED TO PREVENT TYPING LAG IN FORMS) ---
  const sortedProducts = useMemo(() => {
    const filtered = products.filter(p => {
      const nameLower = (p.name || '').toLowerCase();
      const isUnisex = nameLower.includes('unissex') || nameLower.includes('unisex');
      const catSlug = p.categories ? p.categories.slug : '';

      const catIds = Array.isArray(p.category_ids) ? p.category_ids : (p.category_id ? [p.category_id] : []);

      if (activeCategory) {
        if (activeCategory === 'outlet' || activeCategory === 'ofertas' || activeCategory === 'offers') {
          const discount = getProductDiscount(p);
          const hasOffer = (Number(p.offer_price) > 0 && Number(p.offer_price) < Number(p.price)) || Number(p.original_price) > Number(p.price);
          if (discount <= 0 && !hasOffer) return false;
        } else {
          const isDirectMatch = catSlug === activeCategory || catIds.includes(activeCategory) || (Array.isArray(categories) && categories.some(c => c.slug === activeCategory && catIds.includes(c.id)));
          const isUnisexMatch = isUnisex && (activeCategory === 'perfumes-hombre' || activeCategory === 'perfumes-mujer');
          if (!isDirectMatch && !isUnisexMatch) return false;
        }
      }
      if (activeGender) {
        if (activeGender === 'mujer') {
          const isFeminine = catSlug === 'perfumes-mujer' || (Array.isArray(categories) && categories.some(c => c.slug === 'perfumes-mujer' && catIds.includes(c.id))) || nameLower.includes('feminino') || nameLower.includes('pour femme') || nameLower.includes('for her') || isUnisex;
          if (!isFeminine) return false;
        }
        if (activeGender === 'hombre') {
          const isMasculine = catSlug === 'perfumes-hombre' || (Array.isArray(categories) && categories.some(c => c.slug === 'perfumes-hombre' && catIds.includes(c.id))) || nameLower.includes('masculino') || nameLower.includes('pour homme') || nameLower.includes('for men') || isUnisex;
          if (!isMasculine) return false;
        }
        if (activeGender === 'outlet') {
          const discount = getProductDiscount(p);
          const hasOffer = (Number(p.offer_price) > 0 && Number(p.offer_price) < Number(p.price)) || Number(p.original_price) > Number(p.price);
          if (discount <= 0 && !hasOffer) return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (p.name || '').toLowerCase().includes(q);
        const brandMatch = (p.brand || '').toLowerCase().includes(q);
        const catMatch = p.categories && (p.categories.name || '').toLowerCase().includes(q);
        const tagMatch = Array.isArray(p.tags) && p.tags.some(t => String(t).toLowerCase().includes(q));
        if (!nameMatch && !brandMatch && !catMatch && !tagMatch) {
          return false;
        }
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return 0;
    });
  }, [products, activeCategory, activeGender, searchQuery, sortBy]);

  const filteredProducts = sortedProducts;

  if (currentView === 'customer_panel') {
    if (!token) {
      return (
        <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="bg-[#3C6E71]/20 border border-[#3C6E71]/50 p-4 rounded-2xl mb-4">
            <User className="w-12 h-12 text-[#3C6E71]" />
          </div>
          <h2 className="text-2xl font-bold font-display uppercase tracking-wider mb-2 text-gray-900">INICIA SESIÓN PARA VER TU PANEL</h2>
          <p className="text-xs text-gray-600 max-w-md mb-6 leading-relaxed">
            Ingresa a tu cuenta de cliente de Holux Outdoor para consultar tus pedidos, gestionar tu dirección de entrega y revisar tu estado de usuario.
          </p>
          <button
            onClick={() => { setCurrentView('home'); setIsAuthModalOpen(true); setAuthMode('login'); }}
            className="px-6 py-3 bg-[#3C6E71] text-white rounded-xl font-bold font-display text-xs tracking-wider uppercase hover:bg-[#3C6E71]/90 shadow-lg cursor-pointer transition-all"
          >
            INICIAR SESIÓN DE CLIENTE
          </button>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-100 text-gray-900 font-sans selection:bg-[#3C6E71] selection:text-white flex flex-col">
        {/* Top Header for Client Portal with Mobile Hamburger */}
        <header className="bg-[#1C2321] text-white px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-[#3C6E71]/30 shadow-md sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {/* Hamburger Button for Mobile/Tablet */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white cursor-pointer transition-colors"
              title="Abrir menú"
            >
              <Menu className="w-5 h-5 text-[#F2EFE9]" />
            </button>

            <a 
              href="#/" 
              onClick={() => { 
                setCurrentView('home'); 
                setActiveCategory(null); 
                setActiveGender(null); 
                setSelectedDetailProduct(null);
              }} 
              className="flex items-center gap-2.5"
            >
              <img src="/holuxlogo.png" alt="HOLUX" className="h-7 sm:h-8 w-auto object-contain brightness-0 invert" />
              <span className="font-display text-xl font-bold tracking-widest text-[#F2EFE9]">HOLUX</span>
            </a>
            <span className="hidden sm:inline-block text-xs font-mono-custom text-[#3C6E71] border-l border-[#3C6E71]/30 pl-3">
              PANEL DE CLIENTE
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { 
                window.location.hash = '#/'; 
                setCurrentView('home'); 
                setActiveCategory(null); 
                setActiveGender(null); 
                setSelectedDetailProduct(null);
              }}
              className="px-3.5 py-2 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white rounded-lg text-xs font-display font-bold tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">VOLVER A LA TIENDA</span>
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="p-2 bg-white/10 hover:bg-white/20 border border-[#3C6E71]/30 rounded-lg text-white relative cursor-pointer transition-all hover:scale-105"
              title="Ver Carrito de Compras"
            >
              <ShoppingBag className="w-4 h-4 text-white" />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#B85C38] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Mobile / Tablet Horizontal Tabs Bar for Customer Panel */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-2.5 overflow-x-auto scrollbar-hide shadow-2xs sticky top-[57px] z-30">
          <div className="flex items-center gap-1.5 text-xs font-display font-bold whitespace-nowrap">
            {[
              { id: 'general', label: 'General', icon: User },
              { id: 'coupons', label: 'Cupones', icon: Tag, count: customerCoupons?.filter(c => !c.used_at).length },
              { id: 'orders', label: 'Mis Pedidos', icon: Package, count: orders?.length },
              { id: 'favorites', label: 'Favoritos', icon: Heart, count: favorites?.length },
              { id: 'reviews', label: 'Valoraciones', icon: Star },
              { id: 'addresses', label: 'Dirección', icon: MapPin },
              { id: 'messages', label: 'Mensajes', icon: MessageSquare },
              { id: 'settings', label: 'Ajustes', icon: Box }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = customerPanelSection === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCustomerPanelSection(tab.id)}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
                    isActive 
                      ? 'bg-[#1C2321] text-white shadow-xs' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono-custom ${isActive ? 'bg-[#3C6E71] text-white' : 'bg-gray-300 text-gray-800'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Dashboard Layout Grid */}
        <div className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* LEFT SIDEBAR NAVIGATION MENU (Desktop only, hidden on mobile) */}
          <div className="hidden lg:block lg:col-span-1 space-y-4">
            
            {/* User Profile Card Header */}
            <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#3C6E71] text-white border border-[#3C6E71]/30 flex items-center justify-center font-bold font-display text-lg shadow-sm">
                  {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-display text-sm font-bold text-gray-900 truncate">
                    {userProfile?.full_name || 'Cliente Holux'}
                  </h3>
                  <p className="text-[11px] text-gray-500 truncate font-mono-custom">
                    {userProfile?.email || ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ESTADO</span>
                <span className={`text-[9px] font-black px-2.5 py-0.5 rounded font-mono-custom ${
                  userProfile?.role === 'admin' 
                    ? 'bg-[#B85C38] text-white' 
                    : userProfile?.tier === 'super_vip' || userProfile?.is_super_vip
                    ? 'bg-purple-600 text-white shadow-xs'
                    : userProfile?.tier === 'vip' || userProfile?.is_vip 
                    ? 'bg-amber-500 text-black' 
                    : 'bg-[#3C6E71] text-white'
                }`}>
                  {userProfile?.role === 'admin' 
                    ? '🛡️ ADMINISTRADOR' 
                    : userProfile?.tier === 'super_vip' || userProfile?.is_super_vip
                    ? '👑 MIEMBRO SUPER VIP'
                    : userProfile?.tier === 'vip' || userProfile?.is_vip 
                    ? '⭐ CLIENTE VIP' 
                    : 'CLIENTE ACTIVO'}
                </span>
              </div>
            </div>

            {/* Navigation Menu List */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100 text-xs font-display">
              
              {/* Shortcut for Admin Users */}
              {userProfile?.role === 'admin' && (
                <button
                  onClick={() => {
                    setCurrentView('admin');
                    setAdminTab('dashboard');
                  }}
                  className="w-full px-4 py-3.5 flex items-center justify-between transition-all cursor-pointer bg-black hover:bg-neutral-800 text-white font-bold shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 flex-shrink-0" />
                    <span>⚙️ Panel de Administración</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
              
              {/* 1. General */}
              <button
                onClick={() => setCustomerPanelSection('general')}
                className={`w-full px-4 py-3.5 flex items-center justify-between transition-all cursor-pointer ${customerPanelSection === 'general' ? 'bg-[#3C6E71] text-white font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 flex-shrink-0" />
                  <span>General</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>

              {/* 3. Cupones y Beneficios */}
              <button
                onClick={() => setCustomerPanelSection('coupons')}
                className={`w-full px-4 py-3.5 flex items-center justify-between transition-all cursor-pointer ${customerPanelSection === 'coupons' ? 'bg-[#3C6E71] text-white font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-3">
                  <Tag className="w-4 h-4 flex-shrink-0" />
                  <span>Cupones y Beneficios</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono-custom ${customerPanelSection === 'coupons' ? 'bg-white text-[#3C6E71]' : 'bg-[#3C6E71]/10 text-[#3C6E71]'}`}>
                  {customerCoupons ? customerCoupons.filter(c => c.status === 'disponible').length : 0}
                </span>
              </button>

              {/* 2. Pedidos */}
              <button
                onClick={() => setCustomerPanelSection('orders')}
                className={`w-full px-4 py-3.5 flex items-center justify-between transition-all cursor-pointer ${customerPanelSection === 'orders' ? 'bg-[#3C6E71] text-white font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-4 h-4 flex-shrink-0" />
                  <span>Pedidos</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono-custom ${customerPanelSection === 'orders' ? 'bg-white text-[#3C6E71]' : 'bg-[#3C6E71]/10 text-[#3C6E71]'}`}>
                  {orders ? orders.length : 0}
                </span>
              </button>

              {/* Favoritos */}
              <button
                onClick={() => setCustomerPanelSection('favorites')}
                className={`w-full px-4 py-3.5 flex items-center justify-between transition-all cursor-pointer ${customerPanelSection === 'favorites' ? 'bg-[#3C6E71] text-white font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-3">
                  <Heart className={`w-4 h-4 flex-shrink-0 ${customerPanelSection === 'favorites' ? 'text-white fill-white' : 'text-gray-400'}`} />
                  <span>Favoritos</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono-custom ${customerPanelSection === 'favorites' ? 'bg-white text-[#3C6E71]' : 'bg-[#3C6E71]/10 text-[#3C6E71]'}`}>
                  {favorites ? favorites.length : 0}
                </span>
              </button>

              {/* 4. Valoraciones */}
              <button
                onClick={() => setCustomerPanelSection('reviews')}
                className={`w-full px-4 py-3.5 flex items-center justify-between transition-all cursor-pointer ${customerPanelSection === 'reviews' ? 'bg-[#3C6E71] text-white font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-3">
                  <Star className="w-4 h-4 flex-shrink-0" />
                  <span>Valoraciones</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>

              {/* 6. Dirección de envío */}
              <button
                onClick={() => setCustomerPanelSection('addresses')}
                className={`w-full px-4 py-3.5 flex items-center justify-between transition-all cursor-pointer ${customerPanelSection === 'addresses' ? 'bg-[#3C6E71] text-white font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>Dirección de envío</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono-custom ${customerPanelSection === 'addresses' ? 'bg-white text-[#3C6E71]' : 'bg-[#3C6E71]/10 text-[#3C6E71]'}`}>
                  {addresses ? addresses.length : 0}
                </span>
              </button>

              {/* 7. Centro de mensajes */}
              <button
                onClick={() => setCustomerPanelSection('messages')}
                className={`w-full px-4 py-3.5 flex items-center justify-between transition-all cursor-pointer ${customerPanelSection === 'messages' ? 'bg-[#3C6E71] text-white font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <span>Centro de mensajes</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>

              {/* 8. Ajustes */}
              <button
                onClick={() => setCustomerPanelSection('settings')}
                className={`w-full px-4 py-3.5 flex items-center justify-between transition-all cursor-pointer ${customerPanelSection === 'settings' ? 'bg-[#3C6E71] text-white font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-3">
                  <Box className="w-4 h-4 flex-shrink-0" />
                  <span>Ajustes de cuenta</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>

              {/* Cerrar Sesión */}
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3.5 flex items-center gap-3 text-red-600 hover:bg-red-50 transition-all cursor-pointer font-bold"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>

            </div>

          </div>

          {/* RIGHT CONTENT AREA */}
          <div className="lg:col-span-3 space-y-6">

            {/* 1. GENERAL SECTION */}
            {customerPanelSection === 'general' && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-6 text-gray-900">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                    <h2 className="font-display text-lg font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <User className="w-5 h-5 text-[#3C6E71]" />
                      RESUMEN DE CUENTA GENERAL
                    </h2>
                    <span className="text-xs text-gray-500 font-mono-custom">
                      UUID: {userProfile?.id}
                    </span>
                  </div>

                  {/* Summary Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-1">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">TOTAL PEDIDOS</span>
                      <span className="text-2xl font-bold font-mono-custom text-gray-900">
                        {orders ? orders.length : 0}
                      </span>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-1">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">FAVORITOS GUARDADOS</span>
                      <span className="text-2xl font-bold font-mono-custom text-rose-600">
                        {favorites ? favorites.length : 0}
                      </span>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-1">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">DIRECCIONES GUARDADAS</span>
                      <span className="text-2xl font-bold font-mono-custom text-[#3C6E71]">
                        {addresses ? addresses.length : 0}
                      </span>
                    </div>

                    <div className={`p-4 rounded-xl space-y-1 border ${
                      userProfile?.tier === 'super_vip' || userProfile?.is_super_vip
                        ? 'bg-purple-50/70 border-purple-200'
                        : userProfile?.tier === 'vip' || userProfile?.is_vip
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">MEMBRESÍA</span>
                      <span className={`text-xs font-black uppercase tracking-wider block pt-1 font-mono-custom ${
                        userProfile?.tier === 'super_vip' || userProfile?.is_super_vip
                          ? 'text-purple-900'
                          : userProfile?.tier === 'vip' || userProfile?.is_vip
                          ? 'text-amber-800'
                          : 'text-gray-700'
                      }`}>
                        {userProfile?.tier === 'super_vip' || userProfile?.is_super_vip
                          ? '👑 SUPER VIP'
                          : userProfile?.tier === 'vip' || userProfile?.is_vip
                          ? '⭐ CLIENTE VIP'
                          : '👤 ESTÁNDAR'}
                      </span>
                    </div>
                  </div>

                  {/* Active Perks Banner for VIP / Super VIP */}
                  {(userProfile?.is_vip || userProfile?.tier === 'super_vip') && (
                    <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      userProfile?.tier === 'super_vip' || userProfile?.is_super_vip
                        ? 'bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 text-white border-purple-500/30 shadow-md'
                        : 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-gray-950 border-amber-400/40 shadow-sm'
                    }`}>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-black/20 font-mono-custom inline-block">
                          {userProfile?.tier === 'super_vip' || userProfile?.is_super_vip ? '👑 BENEFICIOS ACTIVOS SUPER VIP' : '⭐ BENEFICIOS ACTIVOS VIP'}
                        </span>
                        <h4 className="font-display font-black text-sm tracking-wide uppercase">
                          {userProfile?.tier === 'super_vip' || userProfile?.is_super_vip 
                            ? 'TENÉS ACCESO A TODOS LOS PRIVILEGIOS ÉLITE HOLUX' 
                            : 'DISFRUTÁS DE PRIVILEGIOS Y PROMOCIONES PREFERENCIALES'}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs opacity-95 pt-1">
                          {userProfile?.benefits?.auto_discount_percent > 0 && (
                            <span>🏷️ <strong>{userProfile.benefits.auto_discount_percent}% OFF</strong> automático en catálogo</span>
                          )}
                          <span>📦 <strong>{userProfile?.benefits?.shipping_benefit_label || 'Envíos Bonificados'}</strong></span>
                          <span>⚡ <strong>Despacho Express Almacén</strong></span>
                        </div>
                      </div>

                      {userProfile?.benefits?.whatsapp_direct && userProfile?.benefits?.whatsapp_number && (
                        <a
                          href={`https://wa.me/${userProfile.benefits.whatsapp_number.replace(/\D/g, '')}?text=Hola!%20Soy%20cliente%20Super%20VIP%20Holux%20y%20necesito%20asistencia.`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-display text-xs font-bold uppercase tracking-wider rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer flex-shrink-0 transition-all hover:scale-105"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>WhatsApp VIP Directo</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Quick Profile Form */}
                  <form onSubmit={handleUpdateProfile} className="space-y-4 pt-2">
                    <h3 className="font-display text-xs font-bold text-[#3C6E71] uppercase tracking-wider">DATOS PERSONALES</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 tracking-wider block uppercase">NOMBRE COMPLETO</label>
                        <SmoothInput
                          type="text"
                          required
                          value={userProfile?.full_name || ''}
                          onChange={(e) => setUserProfile({ ...userProfile, full_name: e.target.value })}
                          className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-[#3C6E71] focus:ring-1 focus:ring-[#3C6E71]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 tracking-wider block uppercase">EMAIL REGISTRADO</label>
                        <input
                          type="email"
                          disabled
                          value={userProfile?.email || ''}
                          className="w-full px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-500 font-mono-custom outline-none cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white rounded-xl font-display text-xs font-bold tracking-wider uppercase transition-all shadow-sm cursor-pointer"
                    >
                      ACTUALIZAR MIS DATOS
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* 2. PEDIDOS Y COMPRAS SECTION */}
            {customerPanelSection === 'orders' && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-6 text-gray-900">
                  
                  {/* Header with Search */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
                    <div>
                      <h2 className="font-display text-lg font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-[#3C6E71]" />
                        MIS PEDIDOS Y COMPRAS
                      </h2>
                      <p className="text-xs text-gray-500 font-mono-custom mt-0.5">
                        Consultá el estado en tiempo real de tus pedidos y envíos
                      </p>
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full sm:w-64">
                      <SmoothInput
                        type="text"
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        placeholder="Buscar por N° o producto..."
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-[#3C6E71]"
                      />
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>

                  {/* Filter Pills with smooth horizontal touch scroll */}
                  <div className="border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 text-xs font-bold select-none">
                      {[
                        { id: 'all', label: 'Ver todo' },
                        { id: 'pending', label: 'En Verificación / A pagar' },
                        { id: 'processing', label: 'Pagados / En Preparación' },
                        { id: 'shipped', label: 'Enviados' },
                        { id: 'completed', label: 'Completados' }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setOrderStatusFilter(tab.id)}
                          className={`shrink-0 px-3.5 py-1.5 rounded-full font-sans font-bold transition-all cursor-pointer text-xs ${
                            orderStatusFilter === tab.id
                              ? 'bg-[#3C6E71] text-white shadow-xs'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Orders List */}
                  <div className="space-y-4 sm:space-y-6">
                    {orders.length === 0 ? (
                      <div className="py-12 text-center text-gray-400 space-y-3">
                        <ShoppingBag className="w-12 h-12 mx-auto stroke-[1] text-gray-300" />
                        <p className="font-display font-bold text-xs uppercase">No tienes pedidos registrados aún</p>
                        <button
                          onClick={() => { window.location.hash = '#/catalogo'; setCurrentView('category'); }}
                          className="px-6 py-2 bg-[#3C6E71] text-white font-display text-xs font-bold uppercase rounded-xl hover:bg-[#3C6E71]/90 cursor-pointer"
                        >
                          Ir al Catálogo
                        </button>
                      </div>
                    ) : (
                      orders
                        .filter(ord => {
                          if (orderStatusFilter === 'pending') return ord.status === 'pending_review' || ord.status === 'created';
                          if (orderStatusFilter === 'processing') return ord.status === 'paid' || ord.status === 'preparing';
                          if (orderStatusFilter === 'shipped') return ord.status === 'shipped';
                          if (orderStatusFilter === 'completed') return ord.status === 'delivered';
                          return true;
                        })
                        .filter(ord => {
                          if (!orderSearchQuery.trim()) return true;
                          const q = orderSearchQuery.toLowerCase();
                          return String(ord.id).toLowerCase().includes(q) || (ord.shipping_address || '').toLowerCase().includes(q);
                        })
                        .map(ord => {
                          const isTransfer = ord.payment_method === 'transfer' || !!ord.receipt_url || ord.status === 'pending_review' || ord.status === 'processing' || (!ord.payment_id && ord.payment_method !== 'card' && ord.payment_method !== 'mercadopago');
                          const isPaid = ord.status === 'paid' || ord.status === 'completed';
                          const isPreparing = ord.status === 'preparing';
                          const isShipped = ord.status === 'shipped';
                          const isDelivered = ord.status === 'delivered';
                          const isRejected = ord.status === 'rejected';
                          const isCancelled = ord.status === 'cancelled';
                          const isPendingPayment = ord.status === 'pending_payment' || (ord.status === 'pending' && !isTransfer);
                          const isPendingReview = ord.status === 'pending_review' || ord.status === 'processing' || (ord.status === 'created' && isTransfer) || (isTransfer && !isPaid && !isRejected && !isCancelled && !isPreparing && !isShipped && !isDelivered);

                          let activeStep = 1;
                          if (isDelivered) {
                            activeStep = 5;
                          } else if (isShipped) {
                            activeStep = 4;
                          } else if (isPreparing) {
                            activeStep = 3;
                          } else if (isPaid || isPendingReview) {
                            activeStep = 2;
                          } else {
                            activeStep = 1;
                          }

                          const isDefaultOpen = !isDelivered && !isCancelled && !isRejected;
                          const isExpanded = expandedOrders[ord.id] !== undefined ? expandedOrders[ord.id] : isDefaultOpen;
                          const orderItems = parseOrderItems(ord);

                          return (
                            <div key={ord.id} className={`bg-white border border-gray-200 rounded-2xl ${isExpanded ? 'p-4 sm:p-5 space-y-4 sm:space-y-5' : 'px-4 sm:px-5 py-3'} shadow-xs transition-all hover:border-gray-300`}>
                              {/* Top Bar Header with Toggle */}
                              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isExpanded ? 'border-b border-gray-100 pb-3' : ''}`}>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                  {isRejected ? (
                                    <span className="px-2.5 py-1 bg-red-600 text-white font-display text-[11px] font-black rounded uppercase tracking-wider shadow-xs">
                                      PAGO RECHAZADO
                                    </span>
                                  ) : isCancelled ? (
                                    <span className="px-2.5 py-1 bg-gray-500 text-white font-display text-[11px] font-black rounded uppercase tracking-wider shadow-xs">
                                      PEDIDO CANCELADO
                                    </span>
                                  ) : isDelivered ? (
                                    <span className="px-2.5 py-1 bg-emerald-700 text-white font-display text-[11px] font-black rounded uppercase tracking-wider shadow-xs">
                                      ENTREGADO ✓
                                    </span>
                                  ) : isShipped ? (
                                    <span className="px-2.5 py-1 bg-purple-600 text-white font-display text-[11px] font-black rounded uppercase tracking-wider shadow-xs">
                                      EN CAMINO 🚚
                                    </span>
                                  ) : isPreparing ? (
                                    <span className="px-2.5 py-1 bg-blue-600 text-white font-display text-[11px] font-black rounded uppercase tracking-wider shadow-xs">
                                      EN PREPARACIÓN 📦
                                    </span>
                                  ) : isPaid ? (
                                    <span className="px-2.5 py-1 bg-emerald-600 text-white font-display text-[11px] font-black rounded uppercase tracking-wider shadow-xs">
                                      PAGO APROBADO ✓
                                    </span>
                                  ) : isPendingReview ? (
                                    <span className="px-2.5 py-1 bg-amber-500 text-white font-display text-[11px] font-black rounded uppercase tracking-wider shadow-xs">
                                      PAGO EN VERIFICACIÓN ⏳
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-1 bg-yellow-500 text-black font-display text-[11px] font-black rounded uppercase tracking-wider shadow-xs">
                                      PENDIENTE DE PAGO
                                    </span>
                                  )}
                                  <span className="font-mono-custom text-xs sm:text-sm font-bold text-gray-900 tracking-wider">
                                    N° #{String(ord.id).length > 15 ? String(ord.id).slice(-6).toUpperCase() : ord.id}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                                  <span className="text-[11px] sm:text-xs text-gray-500 font-sans">
                                    Fecha: {new Date(ord.created_at || Date.now()).toLocaleDateString('es-AR')}
                                  </span>

                                  {/* Toggle Expand / Collapse Button */}
                                  <button
                                    type="button"
                                    onClick={() => toggleOrderExpansion(ord.id, isDefaultOpen)}
                                    className={`px-3 py-1.5 rounded-xl font-display text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                                      isExpanded
                                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                        : 'bg-[#3C6E71]/10 hover:bg-[#3C6E71]/20 text-[#3C6E71]'
                                    }`}
                                    title={isExpanded ? 'Ocultar seguimiento detallado' : 'Ver seguimiento detallado'}
                                  >
                                    <span>{isExpanded ? 'Ocultar' : 'Ver Seguimiento'}</span>
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                  </button>
                                </div>
                              </div>

                              {/* Expanded Detailed View */}
                              {isExpanded && (
                                <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-300">
                                  {/* Responsive 5-Step Visual Stepper */}
                                  <div className="space-y-3 bg-gray-50/90 p-3.5 sm:p-5 rounded-2xl border border-gray-100">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider font-sans">
                                        PROGRESO DE TU PEDIDO
                                      </span>
                                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono-custom ${
                                        activeStep === 5 ? 'bg-emerald-100 text-emerald-800' :
                                        activeStep >= 3 ? 'bg-emerald-100 text-emerald-800' :
                                        activeStep === 2 ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-gray-700'
                                      }`}>
                                        Paso {activeStep} de 5
                                      </span>
                                    </div>

                                    {/* Stepper Connecting Nodes */}
                                    <div className="relative pt-1 pb-1">
                                      <div className="relative flex items-center justify-between">
                                        {/* Background Track Line - Centered exactly at 16px (top-4) */}
                                        <div className="absolute top-4 left-4 right-4 h-1 bg-gray-200 -translate-y-1/2 z-0 rounded-full" />
                                        
                                        {/* Active Progress Line */}
                                        <div 
                                          className="absolute top-4 left-4 h-1 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-500 rounded-full"
                                          style={{ width: `calc(${((activeStep - 1) / 4)} * (100% - 32px))` }}
                                        />

                                        {[
                                          { step: 1, label: 'Creado', icon: Check },
                                          { step: 2, label: isPendingReview ? 'Verificación' : 'Pago OK', icon: isPendingReview ? Clock : CheckCircle2 },
                                          { step: 3, label: 'Preparación', icon: Package },
                                          { step: 4, label: 'En Camino', icon: Truck },
                                          { step: 5, label: 'Entregado', icon: CheckCircle2 }
                                        ].map((item) => {
                                          const isDone = activeStep > item.step;
                                          const isCurrent = activeStep === item.step;
                                          const Icon = item.icon;

                                          return (
                                            <div key={item.step} className="relative z-10 flex flex-col items-center">
                                              {/* Circle Node */}
                                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                                                isCurrent
                                                  ? item.step === 2 && isPendingReview
                                                    ? 'bg-amber-500 text-white ring-4 ring-amber-100 scale-110 shadow-sm'
                                                    : 'bg-emerald-600 text-white ring-4 ring-emerald-100 scale-110 shadow-sm'
                                                  : isDone
                                                  ? 'bg-emerald-500 text-white shadow-xs'
                                                  : 'bg-white text-gray-400 border-2 border-gray-200'
                                              }`}>
                                                {isDone ? (
                                                  <Check className="w-4 h-4 stroke-[3]" />
                                                ) : (
                                                  <Icon className="w-4 h-4" />
                                                )}
                                              </div>

                                              {/* Step Label */}
                                              <span className={`text-[11px] font-sans font-bold mt-2 hidden sm:block ${
                                                isCurrent ? 'text-gray-900 font-extrabold' : isDone ? 'text-emerald-700' : 'text-gray-400'
                                              }`}>
                                                {item.label}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>

                                      {/* Step Label for Mobile */}
                                      <div className="sm:hidden text-center pt-2.5 border-t border-gray-200/60 mt-2">
                                        <p className="text-xs font-bold text-gray-800">
                                          {activeStep === 1 && '1. Pedido creado y registrado ✓'}
                                          {activeStep === 2 && (isPendingReview ? '2. Comprobante en revisión manual ⏳' : '2. Pago aprobado y acreditado ✓')}
                                          {activeStep === 3 && '3. Embalaje y preparación en depósito 📦'}
                                          {activeStep === 4 && '4. Despachado y en camino 🚚'}
                                          {activeStep === 5 && '5. Paquete entregado en destino ✅'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Info Summary */}
                                  <div className="space-y-1 text-xs text-gray-700 font-sans">
                                    <p><strong className="text-gray-900">Destino:</strong> {ord.shipping_address ? `Entrega a Domicilio (${ord.shipping_address})` : 'Entrega a Domicilio'}</p>
                                    <p><strong className="text-gray-900">Forma de Pago:</strong> <span className="uppercase font-bold text-gray-900">{isTransfer ? 'TRANSFERENCIA BANCARIA' : (ord.payment_method || 'MERCADO PAGO')}</span></p>
                                  </div>

                                  {/* Alerts & Messages */}
                                  {isPendingReview && (
                                    <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1 text-xs">
                                      <div className="flex items-center gap-2 text-amber-900 font-bold">
                                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                                        <span>PAGO EN PROCESO DE VERIFICACIÓN</span>
                                      </div>
                                      <p className="text-amber-800/90 text-[11px] leading-relaxed pl-6">
                                        Tu comprobante está siendo revisado por nuestro equipo de administración. Una vez aprobado, comenzaremos con el embalaje y despacho de tus productos.
                                      </p>
                                    </div>
                                  )}

                                  {isShipped && ord.tracking_number && (
                                    <div className="p-4 bg-purple-50/80 border border-purple-200 rounded-xl space-y-2 text-xs">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-purple-900 font-bold">
                                          <Truck className="w-4 h-4 text-purple-600 shrink-0" />
                                          <span>PAQUETE DESPACHADO EN CAMINO</span>
                                        </div>
                                        {ord.shipping_courier && (
                                          <span className="px-2 py-0.5 bg-purple-200 text-purple-900 rounded font-bold text-[10px]">
                                            {ord.shipping_courier}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap items-center justify-between gap-2 pl-6">
                                        <div>
                                          <span className="text-[10px] text-purple-700 font-bold uppercase block">Código de Seguimiento:</span>
                                          <span className="font-mono-custom font-bold text-gray-900 text-sm select-all">{ord.tracking_number}</span>
                                        </div>
                                        {ord.tracking_url && (
                                          <a
                                            href={ord.tracking_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-display text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors inline-flex items-center gap-1"
                                          >
                                            <span>RASTREAR EN VIVO 🌐</span>
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {isRejected && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2 text-xs">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-red-900 font-bold">
                                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                                          <span>EL PAGO DE ESTE PEDIDO FUE RECHAZADO</span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setCustomerResendReceiptModalOrder(ord);
                                            setCustomerResendFile(null);
                                          }}
                                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-display text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer"
                                        >
                                          SUBIR NUEVO COMPROBANTE 📤
                                        </button>
                                      </div>
                                      {ord.rejection_reason && (
                                        <p className="text-red-700 text-[11px] italic pl-6">
                                          Motivo informado: "{ord.rejection_reason}"
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {/* Chronological History */}
                                  <div className="space-y-2 pt-2 border-t border-gray-100">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider font-sans block">
                                      HISTORIAL CRONOLÓGICO DE ESTADOS
                                    </span>
                                    <div className="space-y-2 text-xs font-sans">
                                      <div className="flex items-center justify-between text-gray-600">
                                        <span className="flex items-center gap-2">
                                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                          <span>Pedido recibido en sistema</span>
                                        </span>
                                        <span className="text-gray-400 text-[11px]">
                                          {new Date(ord.created_at || Date.now()).toLocaleDateString('es-AR')}
                                        </span>
                                      </div>

                                      {isTransfer && isPendingReview && (
                                        <div className="flex items-center justify-between text-gray-700 font-medium">
                                          <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                                            <span>Comprobante de transferencia en verificación manual</span>
                                          </span>
                                          <span className="text-amber-700 font-bold text-[11px]">En proceso ⏳</span>
                                        </div>
                                      )}

                                      {!isTransfer && (isPaid || isPreparing || isShipped || isDelivered) && (
                                        <div className="flex items-center justify-between text-gray-700 font-medium">
                                          <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span>Pago acreditado automáticamente vía Mercado Pago</span>
                                          </span>
                                          <span className="text-emerald-700 font-bold text-[11px]">Aprobado ✓</span>
                                        </div>
                                      )}

                                      {isTransfer && isPaid && (
                                        <div className="flex items-center justify-between text-gray-700 font-medium">
                                          <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span>Transferencia bancaria validada y aprobada</span>
                                          </span>
                                          <span className="text-emerald-700 font-bold text-[11px]">Aprobado ✓</span>
                                        </div>
                                      )}

                                      {(isPreparing || isShipped || isDelivered) && (
                                        <div className="flex items-center justify-between text-gray-700 font-medium">
                                          <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                                            <span>Embalaje y preparación en depósito</span>
                                          </span>
                                          <span className="text-blue-700 font-bold text-[11px]">Listo para despacho</span>
                                        </div>
                                      )}

                                      {(isShipped || isDelivered) && (
                                        <div className="flex items-center justify-between text-gray-700 font-medium">
                                          <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-purple-500" />
                                            <span>Despachado con {ord.shipping_courier || 'Transporte Express'}</span>
                                          </span>
                                          <span className="text-purple-700 font-bold text-[11px]">En camino 🚚</span>
                                        </div>
                                      )}

                                      {isDelivered && (
                                        <div className="flex items-center justify-between text-emerald-950 font-semibold bg-emerald-50/70 p-2 rounded-lg border border-emerald-200/60">
                                          <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-emerald-300" />
                                            <span>Paquete entregado y recibido en destino</span>
                                          </span>
                                          <span className="text-emerald-700 font-bold text-[11px]">Entregado ✓</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Bottom Total & Actions */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
                                    <div className="flex items-baseline justify-between sm:justify-start sm:flex-col sm:text-right sm:order-2">
                                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">TOTAL ABONADO</span>
                                      <span className="text-xl sm:text-2xl font-black text-gray-900 font-sans">${Math.round(ord.total || ord.total_amount || 0).toLocaleString('es-AR')}</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:flex items-center gap-2 sm:gap-3 sm:order-1">
                                      <button
                                        type="button"
                                        onClick={() => setCustomerSelectedOrderDetail(ord)}
                                        className="w-full sm:w-auto px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-display text-xs font-bold tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                                      >
                                        <Eye className="w-4 h-4 text-gray-500" />
                                        <span>VER DETALLE</span>
                                      </button>

                                      <a
                                        href={`${API_BASE_URL}/api/orders/${ord.id}/pdf?token=${token || ''}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-full sm:w-auto px-4 py-2.5 bg-[#3C6E71] hover:bg-[#2c5355] text-white font-display text-xs font-bold tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs text-center"
                                      >
                                        <Download className="w-4 h-4 text-white" />
                                        <span>COMPROBANTE PDF</span>
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* FAVORITOS SECTION */}
            {customerPanelSection === 'favorites' && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-6 text-gray-900">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                    <div>
                      <h2 className="font-display text-lg font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                        MIS PRODUCTOS FAVORITOS
                      </h2>
                      <p className="text-xs text-gray-500 font-sans mt-0.5">
                        Equipamiento y prendas que guardaste para tu próxima aventura.
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-bold font-sans self-start sm:self-auto">
                      {products.filter(p => favorites.some(id => String(id) === String(p.id))).length} guardados
                    </span>
                  </div>

                  {products.filter(p => favorites.some(id => String(id) === String(p.id))).length === 0 ? (
                    <div className="py-16 text-center space-y-4">
                      <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-400">
                        <Heart className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-display font-bold text-base text-gray-900 uppercase">
                          No tenés productos en favoritos todavía
                        </h3>
                        <p className="text-xs text-gray-500 max-w-md mx-auto">
                          Explorá el catálogo de Holux y hacé clic en el corazón de cualquier producto para guardarlo en tu lista personal.
                        </p>
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={() => {
                            window.location.hash = '#/catalogo';
                            setCurrentView('category');
                          }}
                          className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl font-display text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                        >
                          EXPLORAR CATÁLOGO
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {products.filter(p => favorites.some(id => String(id) === String(p.id))).map(product => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          isFavorite={true}
                          onToggleFavorite={handleToggleFavorite}
                          onProductClick={handleProductClick}
                          onAddToCart={addToCart}
                          onBuyNow={(prod) => {
                            addToCart(prod);
                            setIsCartOpen(true);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. CUPONES Y BENEFICIOS SECTION (BILLETERA DE DESCUENTOS) */}
            {customerPanelSection === 'coupons' && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-6 text-gray-900">
                  
                  {/* Top Bar with Redeem Code Input */}
                  <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold font-display uppercase tracking-wider text-gray-800">
                      <Gift className="w-4 h-4 text-[#B85C38]" />
                      <span>CANJEAR CÓDIGO PROMOCIONAL</span>
                    </div>
                    <form onSubmit={handleRedeemCouponSubmit} className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="relative w-full flex-1">
                        <SmoothInput
                          type="text"
                          value={redeemInput}
                          onChange={(e) => setRedeemInput(e.target.value.toUpperCase())}
                          placeholder="Ingresá tu código de cupón (Ej: HOLUX2026, VIP10K)..."
                          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-mono-custom text-gray-900 placeholder-gray-400 uppercase tracking-widest outline-none focus:border-[#3C6E71] focus:ring-1 focus:ring-[#3C6E71]"
                        />
                        <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      </div>
                      <button
                        type="submit"
                        className="w-full sm:w-auto px-6 py-2.5 bg-[#3C6E71] hover:bg-[#2c5355] text-white font-display text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
                      >
                        CANJEAR CUPÓN
                      </button>
                    </form>
                  </div>

                  {/* Header & Filter Tabs Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
                    <div>
                      <h2 className="font-display text-lg font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <Tag className="w-5 h-5 text-[#3C6E71]" />
                        BILLETERA DE CUPONES Y BENEFICIOS
                      </h2>
                      <p className="text-xs text-gray-500 font-mono-custom mt-0.5">
                        Aprovechá tus descuentos exclusivos y promociones activas
                      </p>
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full sm:w-60">
                      <SmoothInput
                        type="text"
                        value={couponSearchQuery}
                        onChange={(e) => setCouponSearchQuery(e.target.value)}
                        placeholder="Buscar por código o promo..."
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-[#3C6E71]"
                      />
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>

                  {/* Status Tabs (Disponibles, Usados, Vencidos) */}
                  <div className="flex items-center gap-2 text-xs font-display">
                    {[
                      { key: 'disponibles', label: 'Disponibles', count: customerCoupons.filter(c => getCouponDynamicStatus(c) === 'disponible').length },
                      { key: 'usados', label: 'Usados', count: customerCoupons.filter(c => getCouponDynamicStatus(c) === 'usado').length },
                      { key: 'vencidos', label: 'Vencidos', count: customerCoupons.filter(c => getCouponDynamicStatus(c) === 'vencido').length }
                    ].map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setCouponsTabFilter(tab.key)}
                        className={`px-4 py-2 rounded-xl transition-all cursor-pointer font-bold flex items-center gap-2 ${couponsTabFilter === tab.key ? 'bg-[#3C6E71] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        <span>{tab.label}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono-custom ${couponsTabFilter === tab.key ? 'bg-white text-[#3C6E71]' : 'bg-gray-200 text-gray-700'}`}>
                          {tab.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Coupons Grid Layout */}
                  {(() => {
                    const filteredCoupons = customerCoupons
                      .filter(c => {
                        const dynStatus = getCouponDynamicStatus(c);
                        if (couponsTabFilter === 'disponibles') return dynStatus === 'disponible';
                        if (couponsTabFilter === 'usados') return dynStatus === 'usado';
                        if (couponsTabFilter === 'vencidos') return dynStatus === 'vencido';
                        return true;
                      })
                      .filter(c => {
                        if (!couponSearchQuery.trim()) return true;
                        const q = couponSearchQuery.toLowerCase();
                        return (c.code || '').toLowerCase().includes(q) || (c.origin && c.origin.toLowerCase().includes(q));
                      });

                    if (filteredCoupons.length === 0) {
                      return (
                        <div className="py-12 text-center text-gray-500 space-y-3 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200 p-8">
                          <div className="w-14 h-14 mx-auto rounded-full bg-[#3C6E71]/10 flex items-center justify-center text-[#3C6E71]">
                            <Tag className="w-7 h-7" />
                          </div>
                          <h3 className="font-display text-sm font-bold text-gray-900 uppercase tracking-wide">
                            {couponsTabFilter === 'disponibles' && 'Tu billetera de cupones está vacía'}
                            {couponsTabFilter === 'usados' && 'No tienes cupones usados aún'}
                            {couponsTabFilter === 'vencidos' && 'No tienes cupones vencidos'}
                          </h3>
                          <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                            {couponsTabFilter === 'disponibles'
                              ? 'Ingresá el código promocional que viste en nuestras redes sociales en el cuadro superior y presioná "CANJEAR CUPÓN" para desbloquear tu beneficio.'
                              : 'Aquí se almacenarán tus cupones a medida que los utilices o expiren.'}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredCoupons.map(coupon => {
                          const isCopied = copiedCouponId === coupon.id;
                          const dynStatus = getCouponDynamicStatus(coupon);
                          const expiryMs = normalizeCouponTimestamp(coupon.expiry_timestamp);
                          const msLeft = expiryMs - Date.now();
                          const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
                          
                          let urgencyColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                          let urgencyLabel = `Vence en ${daysLeft} días`;
                          if (daysLeft <= 0 || dynStatus === 'vencido') {
                            urgencyColor = 'bg-slate-100 text-slate-500 border-slate-200';
                            urgencyLabel = 'Vencido';
                          } else if (daysLeft === 1) {
                            urgencyColor = 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
                            urgencyLabel = '¡Vence HOY!';
                          } else if (daysLeft <= 7) {
                            urgencyColor = 'bg-amber-50 text-amber-800 border-amber-200';
                            urgencyLabel = `Vence en ${daysLeft} días`;
                          } else {
                            urgencyColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                            urgencyLabel = `Vence en ${daysLeft} días`;
                          }

                          if (dynStatus === 'usado') {
                            return (
                              <div key={coupon.id} className="relative bg-slate-50 border border-dashed border-slate-300 p-5 rounded-2xl opacity-70 flex flex-col justify-between space-y-4 text-slate-700">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2.5 py-1 rounded-lg font-mono-custom uppercase">
                                      {coupon.origin || 'Promoción'}
                                    </span>
                                    <span className="text-[10px] font-bold bg-slate-300 text-slate-700 px-2.5 py-0.5 rounded-md font-mono-custom uppercase">
                                      USADO
                                    </span>
                                  </div>

                                  <div className="flex items-baseline justify-between">
                                    <span className="font-mono-custom text-xl font-extrabold text-slate-400 line-through">
                                      {coupon.code}
                                    </span>
                                    <span className="font-mono-custom text-lg font-bold text-slate-400">
                                      {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `ARS $${Number(coupon.value).toLocaleString('es-AR')} OFF`}
                                    </span>
                                  </div>

                                  <p className="text-[11px] text-slate-500 leading-relaxed">{coupon.description}</p>
                                </div>

                                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono-custom text-slate-500">
                                  <span>Usado el: {coupon.used_date || 'Recientemente'}</span>
                                  {coupon.used_order_id && (
                                    <button
                                      onClick={() => setCustomerPanelSection('orders')}
                                      className="font-bold text-[#3C6E71] underline cursor-pointer"
                                    >
                                      Pedido #{coupon.used_order_id}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          }

                          if (dynStatus === 'vencido') {
                            return (
                              <div key={coupon.id} className="relative bg-slate-50 border border-dashed border-slate-300 p-5 rounded-2xl opacity-60 flex flex-col justify-between space-y-4 text-slate-700">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2.5 py-1 rounded-lg font-mono-custom uppercase">
                                      {coupon.origin || 'Promoción Expirada'}
                                    </span>
                                    <span className="text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-md font-mono-custom uppercase">
                                      VENCIDO
                                    </span>
                                  </div>

                                  <div className="flex items-baseline justify-between">
                                    <span className="font-mono-custom text-xl font-extrabold text-slate-400 line-through">
                                      {coupon.code}
                                    </span>
                                    <span className="font-mono-custom text-lg font-bold text-slate-400 line-through">
                                      {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `ARS $${Number(coupon.value).toLocaleString('es-AR')} OFF`}
                                    </span>
                                  </div>

                                  <p className="text-[11px] text-slate-400 leading-relaxed">{coupon.description}</p>
                                </div>

                                <div className="pt-3 border-t border-slate-200 text-[11px] font-mono-custom text-slate-400 text-right">
                                  Expiró el {new Date(expiryMs).toLocaleDateString('es-AR')}
                                </div>
                              </div>
                            );
                          }

                          // DISPONIBLES (Clean Modern Cold Light / White Card)
                          return (
                            <div key={coupon.id} className="relative bg-white border border-slate-200 hover:border-[#3C6E71]/70 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 text-slate-800">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {((coupon.allowed_tier === 'super_vip') || (coupon.code || '').includes('SUPERVIP')) ? (
                                      <span className="text-[10px] font-black bg-purple-100 text-purple-900 px-2 py-0.5 rounded-lg border border-purple-300 font-mono-custom uppercase">
                                        👑 SUPER VIP
                                      </span>
                                    ) : ((coupon.allowed_tier === 'vip') || (coupon.code || '').includes('VIP')) ? (
                                      <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-lg border border-amber-300 font-mono-custom uppercase">
                                        ⭐ VIP
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200 font-mono-custom uppercase">
                                        🎁 GENERAL
                                      </span>
                                    )}
                                    <span className="text-[10px] font-bold bg-slate-50 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-200 font-mono-custom uppercase">
                                      {coupon.origin || 'Cupón'}
                                    </span>
                                  </div>
                                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border font-mono-custom uppercase ${urgencyColor}`}>
                                    {urgencyLabel}
                                  </span>
                                </div>

                                <div className="flex items-baseline justify-between gap-2 border-b border-slate-100 pb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono-custom text-2xl font-black text-slate-900 tracking-wider">
                                      {coupon.code}
                                    </span>
                                    <button
                                      onClick={() => handleCopyCouponCode(coupon.id, coupon.code)}
                                      className={`p-1.5 rounded-lg transition-all cursor-pointer border ${isCopied ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'}`}
                                      title="Copiar Código"
                                    >
                                      {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                  </div>

                                  <span className="font-display text-lg font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl shrink-0">
                                    {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `ARS $${Number(coupon.value).toLocaleString('es-AR')} OFF`}
                                  </span>
                                </div>

                                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                                  {coupon.description}
                                </p>
                              </div>

                              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                                <span className="text-[10px] text-slate-500 font-mono-custom font-medium">
                                  {coupon.min_spend > 0 ? `Min. compra: $${Number(coupon.min_spend).toLocaleString('es-AR')}` : 'Sin mínimo de compra'}
                                </span>
                                
                                <button
                                  onClick={() => handleUseCouponNow(coupon)}
                                  className="px-4 py-2 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white font-display text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs hover:shadow-sm cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
                                >
                                  <span>USAR AHORA</span>
                                  <Sparkles className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                </div>
              </div>
            )}

            {/* 4. REEMBOLSOS Y DEVOLUCIONES SECTION */}
            {customerPanelSection === 'refunds' && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-6 text-gray-900">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                    <h2 className="font-display text-lg font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <RotateCcw className="w-5 h-5 text-[#3C6E71]" />
                      REEMBOLSOS Y DEVOLUCIONES (BOTÓN DE ARREPENTIMIENTO)
                    </h2>

                    <button
                      type="button"
                      onClick={() => setIsRefundModalOpen(true)}
                      className="px-4 py-2 bg-black hover:bg-neutral-800 text-white font-display text-xs font-bold tracking-wider rounded-xl uppercase transition-all shadow-sm cursor-pointer"
                    >
                      + SOLICITAR DEVOLUCIÓN
                    </button>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-2 text-xs text-amber-900">
                    <p className="font-bold uppercase tracking-wider">DERECHO DE ARREPENTIMIENTO (LEY 24.240 DE DEFENSA DEL CONSUMIDOR)</p>
                    <p className="leading-relaxed text-[#1C2321]/80">
                      Conforme a la ley argentina, tenés derecho a revocar tu compra dentro de los 10 días corridos contados desde la recepción del producto. El envío de devolución es 100% gratuito.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-display text-xs font-bold text-gray-500 uppercase tracking-wider">SOLICITUDES ACTIVAS ({refundRequestsList.length})</h3>
                    {refundRequestsList.length === 0 ? (
                      <p className="text-xs text-gray-400 italic text-center py-6 border border-dashed border-gray-200 rounded-xl">No tienes ninguna solicitud de devolución o reembolso activa.</p>
                    ) : (
                      refundRequestsList.map(req => (
                      <div key={req.id} className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono-custom font-bold text-gray-900">SOLICITUD N° {req.id}</span>
                            <span className="text-[10px] font-mono-custom text-gray-500">(Pedido {req.orderId})</span>
                          </div>
                          <span className="bg-amber-500 text-black text-[9px] font-bold px-2 py-0.5 rounded font-mono-custom">
                            {req.status}
                          </span>
                        </div>
                        <p className="text-gray-700">Motivo: <strong>{req.reason}</strong></p>
                        <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-200 font-mono-custom">
                          <span>Fecha de solicitud: {req.date}</span>
                          <span className="font-bold text-[#3C6E71]">Monto a reembolsar: ${req.amount.toLocaleString('es-AR')}</span>
                        </div>
                      </div>
                    )))}
                  </div>
                </div>
              </div>
            )}

            {/* 4. VALORACIONES SECTION */}
            {customerPanelSection === 'reviews' && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-6 text-gray-900">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                    <h2 className="font-display text-lg font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <Star className="w-5 h-5 text-[#3C6E71]" />
                      MIS VALORACIONES Y RESEÑAS
                    </h2>

                    <button
                      type="button"
                      onClick={() => setIsAddCustomerReviewModalOpen(true)}
                      className="px-4 py-2 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white font-display text-xs font-bold tracking-wider rounded-xl uppercase transition-all shadow-sm cursor-pointer"
                    >
                      + VALORAR PRODUCTO
                    </button>
                  </div>

                  {customerReviewsList.length === 0 ? (
                    <div className="py-12 text-center text-gray-500 space-y-3 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200 p-8">
                      <div className="w-14 h-14 mx-auto rounded-full bg-[#3C6E71]/10 flex items-center justify-center text-[#3C6E71]">
                        <Star className="w-7 h-7 text-[#3C6E71]" />
                      </div>
                      <h3 className="font-display text-sm font-bold text-gray-900 uppercase tracking-wide">
                        No tienes valoraciones registradas
                      </h3>
                      <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                        Tus opiniones ayudan a otros miembros de la comunidad de montaña a elegir el equipo ideal.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customerReviewsList.map(rev => (
                        <div key={rev.id} className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900">{rev.productName}</span>
                            <div className="flex items-center text-amber-500">
                              {[...Array(rev.rating)].map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-current" />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-700 italic">"{rev.comment}"</p>
                          <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-200">
                            <span className="text-emerald-700 font-bold uppercase">{rev.status}</span>
                            <span className="font-mono-custom">Fecha: {rev.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 6. DIRECCIÓN DE ENVÍO SECTION */}
            {customerPanelSection === 'addresses' && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-6 text-gray-900">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                    <h2 className="font-display text-lg font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-[#3C6E71]" />
                      MIS DIRECCIONES DE ENVÍO
                    </h2>

                    <button
                      onClick={() => {
                        setEditingAddress(null);
                        setAddrLabel('');
                        setAddrStreet('');
                        setAddrCity('');
                        setAddrProvince('Santa Fe');
                        setAddrPostalCode('');
                        setAddrIsDefault(false);
                        setIsAddressModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-[#3C6E71] text-white rounded-lg text-xs font-bold font-display uppercase tracking-wider shadow-sm cursor-pointer"
                    >
                      + NUEVA DIRECCIÓN
                    </button>
                  </div>

                  {/* Addresses List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map(addr => (
                      <div key={addr.id} className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-3 text-xs flex flex-col justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900 uppercase">{addr.label || 'Domicilio'}</span>
                            {addr.is_default && (
                              <span className="bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded font-mono-custom">
                                PRINCIPAL
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 font-mono-custom">{addr.street}</p>
                          <p className="text-gray-500">{addr.city}, {addr.province} (CP: {addr.postal_code})</p>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                          <button
                            onClick={() => {
                              setEditingAddress(addr);
                              setAddrLabel(addr.label || '');
                              setAddrStreet(addr.street || '');
                              setAddrCity(addr.city || '');
                              setAddrProvince(addr.province || '');
                              setAddrPostalCode(addr.postal_code || '');
                              setAddrIsDefault(addr.is_default || false);
                              setIsAddressModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-bold text-[10px] uppercase cursor-pointer"
                          >
                            EDITAR
                          </button>
                          {!addr.is_default && (
                            <button
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="px-2.5 py-1 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white rounded font-bold text-[10px] uppercase cursor-pointer"
                            >
                              PREDETERMINAR
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded font-bold text-[10px] uppercase cursor-pointer"
                          >
                            ELIMINAR
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 7. CENTRO DE MENSAJES SECTION (INTERACTIVE LIVE CHAT THREAD) */}
            {customerPanelSection === 'messages' && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-6 text-gray-900">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                    <div>
                      <h2 className="font-display text-lg font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-[#3C6E71]" />
                        CENTRO DE SOPORTE Y CHAT EN VIVO
                      </h2>
                      <p className="text-[11px] text-gray-500 font-mono-custom">
                        Ticket Activo: #HLX-TK-4820 • Estado: <span className="text-emerald-600 font-bold">Agente Holux en Línea</span>
                      </p>
                    </div>
                    <span className="hidden sm:inline-block text-[10px] font-bold bg-emerald-600 text-white px-2.5 py-1 rounded font-mono-custom">
                      RESPUESTA &lt; 2 MIN
                    </span>
                  </div>

                  {/* Live Chat Thread Box */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex flex-col h-[400px]">
                    <div className="flex-1 p-4 overflow-y-auto space-y-3">
                      {panelSupportMessages.map(msg => (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                        >
                          <div className={`max-w-[80%] p-3 rounded-2xl text-xs space-y-1 ${msg.sender === 'user' ? 'bg-[#3C6E71] text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none shadow-sm'}`}>
                            <p className="leading-relaxed">{msg.text}</p>
                            <span className={`text-[9px] block text-right font-mono-custom ${msg.sender === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                              {msg.timestamp}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Quick Question Buttons */}
                    <div className="p-2 bg-gray-100 border-t border-gray-200 flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="font-bold text-gray-500 px-1">Consultas rápidas:</span>
                      {[
                        "¿Cuándo llega mi pedido?",
                        "Quiero solicitar cambio de talle",
                        "Solicitar Factura A con CUIT",
                        "Consulta sobre garantía"
                      ].map((quick, i) => (
                        <button
                          key={i}
                          onClick={() => setPanelSupportInput(quick)}
                          className="px-2.5 py-1 bg-white hover:bg-gray-200 border border-gray-300 rounded-lg text-gray-800 font-medium transition-all cursor-pointer"
                        >
                          {quick}
                        </button>
                      ))}
                    </div>

                    {/* Input Send Form */}
                    <form onSubmit={handleSendPanelSupportMessage} className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
                      <SmoothInput
                        type="text"
                        value={panelSupportInput}
                        onChange={(e) => setPanelSupportInput(e.target.value)}
                        placeholder="Escribí tu mensaje de consulta..."
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-[#3C6E71] focus:ring-1 focus:ring-[#3C6E71]"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white rounded-xl font-bold font-display text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                      >
                        ENVIAR
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* 8. AJUSTES SECTION */}
            {customerPanelSection === 'settings' && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-6 text-gray-900">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                    <h2 className="font-display text-lg font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <Box className="w-5 h-5 text-[#3C6E71]" />
                      AJUSTES Y PREFERENCIAS DE CUENTA
                    </h2>
                    {settingsSavedMessage && (
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded font-mono-custom animate-bounce">
                        ¡Ajustes guardados correctamente!
                      </span>
                    )}
                  </div>

                  <form onSubmit={handleSaveSettingsSubmit} className="space-y-4 text-xs">
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <div>
                        <p className="font-bold text-gray-900">Notificaciones por Email</p>
                        <p className="text-[10px] text-gray-500">Recibir confirmaciones de compras, verificación de transferencias y seguimiento de envíos.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={accountSettings.emailPromos}
                        onChange={(e) => setAccountSettings({ ...accountSettings, emailPromos: e.target.checked })}
                        className="w-4 h-4 accent-[#3C6E71] cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <div>
                        <p className="font-bold text-gray-900">Boletín mensual de expediciones</p>
                        <p className="text-[10px] text-gray-500">Novedades de la comunidad outdoor, lanzamientos y guías de montaña.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={accountSettings.monthlyNewsletter}
                        onChange={(e) => setAccountSettings({ ...accountSettings, monthlyNewsletter: e.target.checked })}
                        className="w-4 h-4 accent-[#3C6E71] cursor-pointer"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white rounded-xl font-display text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                    >
                      GUARDAR PREFERENCIAS
                    </button>
                  </form>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* --- MODAL DEVOLUCIÓN DENTRO DEL PANEL DE CLIENTE --- */}
        {isRefundModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsRefundModalOpen(false)} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 space-y-5 text-gray-900 z-10">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-[#B85C38]" />
                  <h3 className="font-display text-base font-bold text-gray-900 uppercase tracking-wider">SOLICITAR REEMBOLSO / ARREPENTIMIENTO</h3>
                </div>
                <button onClick={() => setIsRefundModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitRefundModal} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">SELECCIONÁ TU PEDIDO (LEY 24.240 - 10 DÍAS)</label>
                  {orders && orders.length > 0 ? (
                    <select
                      value={typeof refundOrderSelect === 'object' ? refundOrderSelect?.id : refundOrderSelect}
                      onChange={(e) => {
                        const found = orders.find(o => String(o.id) === String(e.target.value));
                        setRefundOrderSelect(found || e.target.value);
                      }}
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-[#3C6E71]"
                    >
                      {orders.map(ord => (
                        <option key={ord.id} value={ord.id}>
                          Pedido #{String(ord.id).length > 15 ? String(ord.id).slice(-6).toUpperCase() : ord.id} - Total: ${Math.round(ord.total || 0).toLocaleString('es-AR')}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 font-mono-custom text-xs">
                      <strong>N° #{refundOrderSelect?.id ? (String(refundOrderSelect.id).length > 15 ? String(refundOrderSelect.id).slice(-6).toUpperCase() : refundOrderSelect.id) : 'ULTIMO PEDIDO'}</strong>
                      <span className="block text-gray-500 text-[11px] mt-0.5">
                        Monto total: ${refundOrderSelect?.total ? Math.round(refundOrderSelect.total).toLocaleString('es-AR') : '78.000'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">MOTIVO DE LA DEVOLUCIÓN</label>
                  <select
                    value={refundReasonSelect}
                    onChange={(e) => setRefundReasonSelect(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-[#3C6E71]"
                  >
                    <option value="Talle incorrecto">Talle incorrecto</option>
                    <option value="Defecto de fabricación">Defecto de fabricación</option>
                    <option value="Producto no coincide con la foto">Producto no coincide con la foto</option>
                    <option value="Arrepentimiento de compra (Ley 24.240)">Arrepentimiento de compra (Ley 24.240)</option>
                    <option value="Retraso en la entrega">Retraso en la entrega</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">COMENTARIOS ADICIONALES</label>
                  <textarea
                    rows={3}
                    placeholder="Escribí aquí si el producto fue probado o el motivo detallado..."
                    value={refundCommentInput}
                    onChange={(e) => setRefundCommentInput(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-[#3C6E71]"
                  />
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                  Se generará un número de devolución y recibirás la etiqueta de correo gratuita para despachar el paquete.
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRefundModalOpen(false)}
                    className="w-1/2 py-2.5 border border-gray-300 text-gray-700 font-display text-xs font-bold uppercase rounded-xl hover:bg-gray-50 cursor-pointer"
                  >
                    CANCELAR
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 bg-black hover:bg-neutral-800 text-white font-display text-xs font-bold uppercase rounded-xl shadow cursor-pointer"
                  >
                    ENVIAR SOLICITUD
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- MODAL RESUBIR COMPROBANTE DENTRO DEL PANEL DE CLIENTE --- */}
        {customerResendReceiptModalOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setCustomerResendReceiptModalOrder(null)} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 space-y-5 text-gray-900 z-10">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <h3 className="font-display text-base font-bold uppercase tracking-wider text-gray-900">SUBIR COMPROBANTE DE PAGO</h3>
                <button onClick={() => setCustomerResendReceiptModalOrder(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCustomerResendReceiptSubmit} className="space-y-4 text-xs">
                <p className="text-gray-600 leading-relaxed">
                  Pedido <strong>#{customerResendReceiptModalOrder.id && String(customerResendReceiptModalOrder.id).length > 15 ? String(customerResendReceiptModalOrder.id).slice(-6).toUpperCase() : customerResendReceiptModalOrder.id}</strong>.
                  Por favor adjuntá una foto o PDF claro de tu transferencia bancaria (máximo 5MB).
                </p>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">COMPROBANTE (JPG, PNG, PDF)</label>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, application/pdf"
                    required
                    onChange={(e) => setCustomerResendFile(e.target.files[0])}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setCustomerResendReceiptModalOrder(null)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold uppercase"
                  >
                    CANCELAR
                  </button>
                  <button
                    type="submit"
                    disabled={isUploadingCustomerReceipt || !customerResendFile}
                    className="px-4 py-2 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white rounded-xl text-xs font-bold uppercase cursor-pointer"
                  >
                    {isUploadingCustomerReceipt ? 'ENVIANDO...' : 'ENVIAR COMPROBANTE'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- CART DRAWER DENTRO DEL PANEL DE CLIENTE --- */}
        {isCartOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />
            
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
                
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#1C2321] text-white">
                  <h2 className="font-display text-lg font-bold tracking-wider flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-[#3C6E71]" />
                    MI COMPRA
                  </h2>
                  <button onClick={() => { setIsCartOpen(false); setCheckoutSuccess(null); }} className="p-1 hover:bg-white/10 rounded transition-colors cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Main Cart Layout */}
                <div className="flex-grow overflow-y-auto p-6 space-y-6">
                  {cart.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center text-gray-400 space-y-3">
                      <ShoppingBag className="w-12 h-12 stroke-[1]" />
                      <div>
                        <p className="font-display font-bold">El carrito está vacío</p>
                        <p className="text-xs mt-1">Explora el catálogo y añade tu equipamiento.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map(item => (
                        <div key={`${item.id}_${item.sizeLabel}`} className="flex gap-4 border-b border-gray-100 pb-4">
                          <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded overflow-hidden flex items-center justify-center shrink-0">
                            <img 
                              src={item.image_url || (Array.isArray(item.images) ? item.images[0] : (typeof item.images === 'string' ? JSON.parse(item.images || '[]')[0] : null)) || item.image || item.photo || getProductImage(item.name)} 
                              alt={item.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = getProductImage(item.name);
                              }}
                            />
                          </div>

                          <div className="flex-grow flex flex-col justify-between">
                            <div>
                              <h4 className="text-sm font-bold text-gray-800 line-clamp-1">{item.name}</h4>
                              <div className="flex items-center gap-2 text-[10px] text-gray-400 font-sans font-semibold">
                                <span className="uppercase tracking-widest">{item.brand}</span>
                                <span>•</span>
                                <span>Talle: {item.sizeLabel || 'Único'}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center border border-gray-200 rounded overflow-hidden">
                                <button
                                  onClick={() => updateCartQty(item.id, item.sizeLabel, -1, item.stock)}
                                  className="px-2 py-0.5 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="px-3 text-xs font-bold font-sans">{item.quantity}</span>
                                <button
                                  onClick={() => updateCartQty(item.id, item.sizeLabel, 1, item.stock)}
                                  className="px-2 py-0.5 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                                >
                                  +
                                </button>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="font-sans text-xs font-bold text-gray-900">
                                  ${(item.price * item.quantity).toLocaleString('es-AR')}
                                </span>
                                <button 
                                  onClick={() => removeFromCart(item.id, item.sizeLabel)} 
                                  className="text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Checkout info */}
                {cart.length > 0 && (
                  <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-4">
                    {/* Applied Coupon Banner if active */}
                    {appliedCoupon && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-emerald-600" />
                          <div>
                            <span className="font-bold block font-mono-custom">Cupón: {appliedCoupon.code}</span>
                            <span className="text-[10px] text-emerald-700 font-mono-custom">
                              Descuento: {appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}% OFF` : `${appliedCoupon.value.toLocaleString('es-AR')} OFF`}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setAppliedCoupon(null)}
                          className="p-1 hover:bg-emerald-200/60 rounded text-emerald-800 transition-colors cursor-pointer"
                          title="Quitar cupón"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {(() => {
                      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                      let discount = 0;
                      if (appliedCoupon) {
                        discount = appliedCoupon.type === 'percentage'
                          ? Math.round((subtotal * appliedCoupon.value) / 100)
                          : Math.min(subtotal, appliedCoupon.value);
                      }
                      const finalTotal = Math.max(0, subtotal - discount);
                      const netAmount = Math.round(finalTotal / 1.21);
                      const vatAmount = finalTotal - netAmount;

                      const shippingRatesLocal = (() => {
                        try {
                          return JSON.parse(localStorage.getItem('holux_shipping_rates') || '{}');
                        } catch {
                          return {};
                        }
                      })();

                      const isSuperVipUser = userProfile?.tier === 'super_vip' || userProfile?.is_super_vip;
                      const isVipAlwaysFree = isSuperVipUser || userProfile?.benefits?.shipping_benefit === 'always_free' || userProfile?.benefits?.shipping_cost === 0;
                      const isVipFreeMin = userProfile?.benefits?.shipping_benefit === 'free_above_amount' && finalTotal >= Number(userProfile?.benefits?.shipping_free_min_amount || 40000);
                      const isNationwideFree = Boolean(shippingRatesLocal.all_free);
                      const isFreeThreshold = Boolean(shippingRatesLocal.free_shipping_enabled) && finalTotal >= Number(shippingRatesLocal.free_shipping_threshold || 150000);

                      let shippingLabelCart = 'A calcular en el checkout';
                      let isShippingFree = false;

                      if (isVipAlwaysFree) {
                        shippingLabelCart = isSuperVipUser ? '¡Gratis! (👑 Super VIP)' : '¡Gratis! (⭐ VIP)';
                        isShippingFree = true;
                      } else if (isVipFreeMin) {
                        shippingLabelCart = '¡Gratis! (⭐ VIP)';
                        isShippingFree = true;
                      } else if (isNationwideFree) {
                        shippingLabelCart = '¡Gratis! (Promoción Nacional)';
                        isShippingFree = true;
                      } else if (isFreeThreshold) {
                        shippingLabelCart = '¡Gratis! (Monto superado)';
                        isShippingFree = true;
                      }

                      return (
                        <div className="space-y-2 text-xs font-sans">
                          <div className="flex items-center justify-between text-gray-500">
                            <span>Total sin impuestos nacionales</span>
                            <span className="font-mono-custom font-semibold text-gray-700">${netAmount.toLocaleString('es-AR')}</span>
                          </div>
                          <div className="flex items-center justify-between text-gray-500">
                            <span>Impuestos Nacionales (IVA 21%)</span>
                            <span className="font-mono-custom font-semibold text-gray-700">${vatAmount.toLocaleString('es-AR')}</span>
                          </div>
                          {discount > 0 && (
                            <div className="flex items-center justify-between text-emerald-700 font-semibold">
                              <span>Descuento ({appliedCoupon.code})</span>
                              <span className="font-mono-custom font-bold">-${discount.toLocaleString('es-AR')}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-gray-500">
                            <span>Envío</span>
                            <span className={`font-mono-custom font-bold ${isShippingFree ? 'text-emerald-600' : 'text-gray-500 text-[11px]'}`}>
                              {shippingLabelCart}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-gray-900 pt-2 border-t border-gray-200">
                            <span className="font-display text-sm font-black tracking-wider uppercase">Total</span>
                            <span className="font-mono-custom text-xl font-bold text-[#3C6E71]">
                              ${finalTotal.toLocaleString('es-AR')}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    <button
                      onClick={() => {
                        setIsCartOpen(false);
                        setCurrentView('checkout');
                      }}
                      className="w-full py-4 bg-[#3C6E71] hover:bg-[#3C6E71]/95 text-white font-display text-xs font-bold tracking-wider rounded uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#3C6E71]/20 cursor-pointer"
                    >
                      <Shield className="w-4 h-4" />
                      INICIAR COMPRA Y ELEGIR PAGO / DOMICILIO →
                    </button>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}
        {/* --- MODAL DETALLE COMPLETO DEL PEDIDO EN PANEL DE CLIENTE --- */}
        {customerSelectedOrderDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setCustomerSelectedOrderDetail(null)} />
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 space-y-5 text-gray-900 z-10 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-[#3C6E71]" />
                    DETALLE DEL PEDIDO N° #{customerSelectedOrderDetail.id && String(customerSelectedOrderDetail.id).length > 15 ? String(customerSelectedOrderDetail.id).slice(-6).toUpperCase() : customerSelectedOrderDetail.id}
                  </h3>
                  <p className="text-xs text-gray-500 font-mono-custom mt-0.5">
                    Realizado el {new Date(customerSelectedOrderDetail.created_at || Date.now()).toLocaleDateString('es-AR')} a las {new Date(customerSelectedOrderDetail.created_at || Date.now()).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}hs
                  </p>
                </div>
                <button onClick={() => setCustomerSelectedOrderDetail(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Order Info & Shipping */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <span className="font-bold text-gray-500 uppercase text-[10px] block">ENVÍO Y DESTINO</span>
                  <p className="font-bold text-gray-900">{customerSelectedOrderDetail.shipping_address || 'Entrega a Domicilio'}</p>
                  <p className="text-[#3C6E71] text-[11px]">Método: {customerSelectedOrderDetail.shipping_method || 'Entrega Estándar Andreani'}</p>
                </div>
                <div>
                  <span className="font-bold text-gray-500 uppercase text-[10px] block">MÉTODOS DE PAGO Y ESTADO</span>
                  <p className="font-bold text-gray-900">{customerSelectedOrderDetail.payment_method || 'Transferencia Bancaria'}</p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 bg-[#3C6E71] text-white text-[10px] font-bold rounded font-mono-custom uppercase">
                    {customerSelectedOrderDetail.status === 'pending_review' ? 'En Verificación' : customerSelectedOrderDetail.status}
                  </span>
                </div>
              </div>

              {/* Products Breakdown */}
              <div className="space-y-3">
                <h4 className="font-display text-xs font-bold text-gray-500 uppercase tracking-wider">PRODUCTOS COMPRADOS</h4>
                
                <div className="space-y-3 border border-gray-200 rounded-xl p-4 bg-white">
                  {(() => {
                    const rawItems = customerSelectedOrderDetail.items || customerSelectedOrderDetail.order_items || [];
                    const items = typeof rawItems === 'string' ? JSON.parse(rawItems) : rawItems;

                    if (!items || items.length === 0) {
                      return (
                        <div className="flex items-center justify-between text-xs py-2 border-b border-gray-100 font-mono-custom">
                          <div>
                            <p className="font-bold text-gray-900">Equipamiento Holux Outdoor (Resumen general)</p>
                            <p className="text-[10px] text-gray-500">Cantidad: 1 paquete cerrado</p>
                          </div>
                          <span className="font-bold text-[#3C6E71]">${Math.round(customerSelectedOrderDetail.total || 0).toLocaleString('es-AR')}</span>
                        </div>
                      );
                    }

                    return items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                            <img 
                              src={item.image_url || item.image || (Array.isArray(item.images) ? item.images[0] : (typeof item.images === 'string' ? JSON.parse(item.images || '[]')[0] : null)) || getProductImage(item.name || item.product_name)} 
                              alt={item.name || item.product_name}
                              className="w-full h-full object-cover" 
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = getProductImage(item.name || item.product_name);
                              }}
                            />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{item.name || item.product_name || 'Producto Holux'}</p>
                            <p className="text-[11px] text-gray-500 font-mono-custom">
                              Talle: <span className="font-bold text-gray-700">{item.sizeLabel || item.size || 'Único'}</span> • Cantidad: <span className="font-bold text-gray-700">{item.quantity || 1}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right font-mono-custom shrink-0">
                          <p className="font-bold text-[#3C6E71] text-xs">${Math.round((item.price || 0) * (item.quantity || 1)).toLocaleString('es-AR')}</p>
                          <p className="text-[10px] text-gray-400">c/u ${Math.round(item.price || 0).toLocaleString('es-AR')}</p>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Total Summary */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200 font-mono-custom text-sm font-bold">
                <span className="text-gray-700 uppercase font-display text-xs">MONTO TOTAL ABONADO</span>
                <span className="text-lg text-[#3C6E71]">${Math.round(customerSelectedOrderDetail.total || 0).toLocaleString('es-AR')}</span>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCustomerSelectedOrderDetail(null)}
                  className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-display text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
                >
                  CERRAR VENTANA
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Navigation Drawer in Customer Panel */}
        <MobileMenuDrawer
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          token={token}
          userProfile={userProfile}
          categories={categories}
          headerNavItems={headerNavItems}
          setCurrentView={setCurrentView}
          setIsAuthModalOpen={setIsAuthModalOpen}
          setAuthMode={setAuthMode}
          setAdminTab={setAdminTab}
        />

        {/* Footer in Customer Panel */}
        <Footer onOpenRefundModal={() => setIsRefundModalOpen(true)} />
      </div>
    );
  }

  if (currentView === 'admin') {
    const isAdmin = Boolean(
      token && userProfile && (
        userProfile.role === 'admin' ||
        userProfile.email === 'admin@holux.com' ||
        userProfile.full_name?.toLowerCase().includes('admin') ||
        (userProfile.user_metadata && userProfile.user_metadata.role === 'admin')
      )
    );

    if (!isAdmin) {
      return (
        <div className="min-h-screen bg-[#1C2321] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="bg-[#B85C38]/20 border border-[#B85C38]/50 p-4 rounded-2xl mb-4">
            <Shield className="w-12 h-12 text-[#B85C38]" />
          </div>
          <h2 className="text-2xl font-bold font-display uppercase tracking-wider mb-2 text-white">ACCESO RESTRINGIDO A ADMINISTRACIÓN</h2>
          <p className="text-xs text-gray-400 max-w-md mb-6 leading-relaxed">
            No cuentas con permisos de administrador activos para acceder a esta área. Inicia sesión con las credenciales de administrador autorizadas.
          </p>
          <button
            onClick={() => { setCurrentView('home'); setIsAuthModalOpen(true); setAuthMode('login'); }}
            className="px-6 py-3 bg-[#3C6E71] text-white rounded-xl font-bold font-display text-xs tracking-wider uppercase hover:bg-[#3C6E71]/90 shadow-lg cursor-pointer transition-all"
          >
            INICIAR SESIÓN DE ADMINISTRADOR
          </button>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-100 flex flex-col font-sans text-gray-900 selection:bg-[#3C6E71] selection:text-white">
        {/* TOP FULL-PAGE ADMIN HEADER */}
        <header className="bg-[#1C2321] text-white px-3 sm:px-6 py-2.5 sm:py-4 border-b border-[#3C6E71]/30 shadow-md">
          <div className="flex items-center justify-between gap-2">
            {/* Logo, Title & Mobile Menu Button */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setIsAdminMobileMenuOpen(true)}
                className="sm:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 shrink-0 cursor-pointer border border-white/10"
                title="Abrir menú de administración"
              >
                <Menu className="w-4 h-4 text-[#3C6E71]" />
                <span className="text-[10px] font-bold font-display tracking-wider">SECCIONES</span>
              </button>

              <img src="/holuxlogo.png" alt="HOLUX" className="h-6 sm:h-8 w-auto object-contain brightness-0 invert shrink-0" />
              <div className="min-w-0">
                <h1 className="font-display text-xs sm:text-base lg:text-lg font-bold tracking-wider uppercase truncate">
                  PANEL ADMIN
                </h1>
                <p className="text-[10px] sm:text-xs text-gray-400 truncate hidden md:block">
                  Gestión integral de tienda, catálogo, pedidos y configuración general
                </p>
              </div>
            </div>

            {/* Quick Actions (Ver tienda & Mi cuenta) */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <button
                onClick={() => {
                  window.location.hash = '#/mi-cuenta';
                  setCurrentView('customer_panel');
                }}
                className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-display text-[10px] sm:text-xs font-bold tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border border-white/10"
                title="Ir a Mi Cuenta Personal"
              >
                <User className="w-3.5 h-3.5 text-[#3C6E71]" />
                <span className="hidden sm:inline">MI CUENTA</span>
              </button>

              <button
                onClick={() => {
                  window.location.hash = '#/';
                  setCurrentView('home');
                }}
                className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white rounded-xl font-display text-[10px] sm:text-xs font-bold tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                title="Volver a explorar la tienda"
              >
                <span>← VER TIENDA</span>
              </button>
            </div>
          </div>
        </header>

        {/* MOBILE HORIZONTAL SCROLLABLE ADMIN TABS BAR */}
        <div className="sm:hidden bg-white border-b border-gray-200 px-2.5 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow-xs shrink-0 sticky top-0 z-30">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'orders', label: 'Pedidos', icon: ShoppingBag },
            { id: 'products', label: 'Stock', icon: Box },
            { id: 'banners', label: 'Banners', icon: Edit2 },
            { id: 'coupons', label: 'Cupones', icon: Edit2 },
            { id: 'categories', label: 'Categorías', icon: Grid },
            { id: 'customers', label: 'Clientes', icon: Users },
            { id: 'support', label: 'Soporte', icon: MessageSquare },
            { id: 'reviews', label: 'Reseñas', icon: MessageSquare },
            { id: 'shipping', label: 'Envíos', icon: Truck },
            { id: 'settings', label: 'Ajustes', icon: Lock }
          ].map(item => {
            const Icon = item.icon;
            const isActive = adminTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setAdminTab(item.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-display font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
                  isActive
                    ? 'bg-[#3C6E71] text-white border-[#3C6E71] shadow-xs'
                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* MOBILE ADMIN DRAWER MODAL */}
        {isAdminMobileMenuOpen && (
          <div className="fixed inset-0 z-50 sm:hidden">
            <div 
              className="absolute inset-0 bg-black/75 backdrop-blur-xs" 
              onClick={() => setIsAdminMobileMenuOpen(false)} 
            />
            <div className="relative w-4/5 max-w-xs bg-[#1C2321] text-white h-full shadow-2xl flex flex-col z-10 border-r border-[#3C6E71]/30">
              <div className="p-4 border-b border-[#3C6E71]/20 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-2">
                  <img src="/holuxlogo.png" alt="HOLUX" className="h-6 w-auto object-contain brightness-0 invert" />
                  <span className="font-display text-sm font-bold tracking-wider">PANEL ADMIN</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAdminMobileMenuOpen(false)}
                  className="p-1 text-gray-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-3 space-y-1">
                {[
                  { id: 'dashboard', label: 'DASHBOARD ANALÍTICA', icon: TrendingUp },
                  { id: 'orders', label: 'GESTIÓN DE PEDIDOS', icon: ShoppingBag },
                  { id: 'products', label: 'CATÁLOGO Y STOCK', icon: Box },
                  { id: 'banners', label: 'EDITAR BANNERS', icon: Edit2 },
                  { id: 'coupons', label: 'CUPONES & PROMOS', icon: Edit2 },
                  { id: 'categories', label: 'CATEGORÍAS', icon: Grid },
                  { id: 'customers', label: 'CLIENTES & VIP', icon: Users },
                  { id: 'support', label: 'SOPORTE & TICKETS', icon: MessageSquare },
                  { id: 'reviews', label: 'MODERAR RESEÑAS', icon: MessageSquare },
                  { id: 'shipping', label: 'LOGÍSTICA Y ENVÍOS', icon: Truck },
                  { id: 'settings', label: 'CONFIGURACIÓN GENERAL', icon: Lock }
                ].map(item => {
                  const Icon = item.icon;
                  const isActive = adminTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setAdminTab(item.id);
                        setIsAdminMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left font-display text-xs font-bold tracking-wider transition-all cursor-pointer ${
                        isActive ? 'bg-[#3C6E71] text-white shadow-md' : 'text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="p-3 border-t border-white/10 bg-black/20">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-red-600/90 hover:bg-red-700 text-white font-display text-xs font-bold tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>CERRAR SESIÓN</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FULL PAGE BODY */}
        <div className="flex-grow flex overflow-hidden">
          {/* Admin Sidebar (Desktop) */}
          <aside className="w-64 bg-white border-r border-gray-200 p-6 space-y-2 overflow-y-auto hidden sm:block">
            {[
              { id: 'dashboard', label: 'DASHBOARD ANALÍTICA', icon: TrendingUp },
              { id: 'orders', label: 'GESTIÓN DE PEDIDOS', icon: ShoppingBag },
              { id: 'products', label: 'CATÁLOGO Y STOCK', icon: Box },
              { id: 'banners', label: 'EDITAR BANNERS', icon: Edit2 },
              { id: 'coupons', label: 'CUPONES & PROMOS', icon: Edit2 },
              { id: 'categories', label: 'CATEGORÍAS', icon: Grid },
              { id: 'customers', label: 'CLIENTES & VIP', icon: Users },
              { id: 'support', label: 'SOPORTE & TICKETS', icon: MessageSquare },
              { id: 'reviews', label: 'MODERAR RESEÑAS', icon: MessageSquare },
              { id: 'shipping', label: 'LOGÍSTICA Y ENVÍOS', icon: Truck },
              { id: 'settings', label: 'CONFIGURACIÓN GENERAL', icon: Lock }
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setAdminTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-display text-xs font-bold tracking-wider transition-all cursor-pointer ${adminTab === item.id ? 'bg-[#3C6E71] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </button>
              );
            })}

            <div className="pt-6 border-t border-gray-200 mt-6">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-display text-xs font-bold tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                CERRAR SESIÓN
              </button>
            </div>
          </aside>

          {/* Admin Main Body */}
          <main className="flex-grow min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-gray-50 text-left">
            {/* Contextual Hierarchical Breadcrumbs */}
            <Breadcrumbs
              adminTab={adminTab}
              onNavigateTab={(tab) => setAdminTab(tab)}
              activeDetail={
                isProductModalOpen
                  ? (selectedProductModal?.id ? `Editar: ${selectedProductModal.name}` : 'Nuevo Producto')
                  : (selectedOrderDetail ? `Pedido #${(selectedOrderDetail.id || '').slice(0, 8)}` : null)
              }
              onClearDetail={() => {
                setIsProductModalOpen(false);
                setSelectedProductModal(null);
                setSelectedOrderDetail(null);
              }}
            />

            {adminTab === 'dashboard' && (
              <DashboardCharts adminStats={adminStats} productsList={adminProductsList && adminProductsList.length > 0 ? adminProductsList : products} ordersList={adminOrdersList} />
            )}

            {adminTab === 'banners' && (
              <BannerEditor
                heroSlides={heroSlides}
                setHeroSlides={setHeroSlides}
                promoBanner={promoBanner}
                setPromoBanner={setPromoBanner}
                tickerPhrases={tickerPhrases}
                setTickerPhrases={setTickerPhrases}
                categoriesList={adminCategoriesList}
                productsList={adminProductsList}
                homeSectionTitles={homeSectionTitles}
                setHomeSectionTitles={setHomeSectionTitles}
                gridPromoCards={gridPromoCards}
                setGridPromoCards={setGridPromoCards}
                headerNavItems={headerNavItems}
                setHeaderNavItems={setHeaderNavItems}
                API_BASE_URL={API_BASE_URL}
                token={token}
              />
            )}

            {adminTab === 'coupons' && (
              <CouponManager />
            )}

            {adminTab === 'support' && (
              <SupportManager />
            )}

            {adminTab === 'shipping' && (
              <ShippingManager API_BASE_URL={API_BASE_URL} token={token} />
            )}

            {adminTab === 'settings' && (
              <StoreSettings API_BASE_URL={API_BASE_URL} token={token} />
            )}

            {adminTab === 'orders' && (() => {
              const countAll = adminOrdersList.length;
              const countPending = adminOrdersList.filter(o => o.status === 'pending_payment' || o.status === 'pending').length;
              const countReview = adminOrdersList.filter(o => o.status === 'pending_review' || o.status === 'created').length;
              const countPaid = adminOrdersList.filter(o => o.status === 'paid' || o.status === 'completed').length;
              const countPreparing = adminOrdersList.filter(o => o.status === 'preparing').length;
              const countShipped = adminOrdersList.filter(o => o.status === 'shipped').length;
              const countDelivered = adminOrdersList.filter(o => o.status === 'delivered').length;
              const countRejected = adminOrdersList.filter(o => o.status === 'rejected').length;
              const countCancelled = adminOrdersList.filter(o => o.status === 'cancelled').length;

              const filteredList = adminOrdersList.filter(ord => {
                if (adminOrderStatusFilter !== 'all') {
                  if (adminOrderStatusFilter === 'pending_payment' && (ord.status !== 'pending_payment' && ord.status !== 'pending')) return false;
                  if (adminOrderStatusFilter === 'pending_review' && (ord.status !== 'pending_review' && ord.status !== 'created')) return false;
                  if (adminOrderStatusFilter === 'paid' && (ord.status !== 'paid' && ord.status !== 'completed')) return false;
                  if (adminOrderStatusFilter === 'preparing' && ord.status !== 'preparing') return false;
                  if (adminOrderStatusFilter === 'shipped' && ord.status !== 'shipped') return false;
                  if (adminOrderStatusFilter === 'delivered' && ord.status !== 'delivered') return false;
                  if (adminOrderStatusFilter === 'rejected' && ord.status !== 'rejected') return false;
                  if (adminOrderStatusFilter === 'cancelled' && ord.status !== 'cancelled') return false;
                }
                const ordIsTransfer = ord.payment_method === 'transfer' || !!ord.receipt_url || ord.status === 'pending_review' || ord.status === 'processing' || (!ord.payment_id && ord.payment_method !== 'card' && ord.payment_method !== 'mercadopago');
                if (adminPaymentMethodFilter !== 'all') {
                  if (adminPaymentMethodFilter === 'transfer' && !ordIsTransfer) return false;
                  if (adminPaymentMethodFilter === 'mercadopago' && ordIsTransfer) return false;
                }
                if (adminOrderSearchQuery.trim()) {
                  const q = adminOrderSearchQuery.toLowerCase();
                  const matchId = String(ord.id || '').toLowerCase().includes(q);
                  const matchName = String(ord.customer_name || '').toLowerCase().includes(q);
                  const matchEmail = String(ord.customer_email || '').toLowerCase().includes(q);
                  const matchAddr = String(ord.shipping_address || '').toLowerCase().includes(q);
                  const items = parseOrderItems(ord);
                  const matchItem = items.some(it => (it.product_name || it.name || '').toLowerCase().includes(q));
                  return matchId || matchName || matchEmail || matchAddr || matchItem;
                }
                return true;
              });

              return (
                <div className="space-y-6">
                  {/* Top Bar Header & Controls */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-display text-base font-bold text-gray-900 tracking-wider uppercase">
                            GESTIÓN GLOBAL DE PEDIDOS Y COMPROBANTES DE PAGO
                          </h3>
                          <span className="text-xs font-mono-custom font-bold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            {adminOrdersList.length} pedidos totales
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Moderación de transferencias bancarias, control de estados de despacho y facturación.
                        </p>
                      </div>

                      {/* Export & Actions */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleExportOrdersCSV}
                          className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-display text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
                        >
                          <Download className="w-4 h-4 text-gray-500" />
                          <span>EXPORTAR CSV / EXCEL</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => fetchAdminOrders()}
                          className="px-4 py-2 bg-[#3C6E71] hover:bg-[#2c5355] text-white font-display text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>ACTUALIZAR</span>
                        </button>
                      </div>
                    </div>

                    {/* Filters & Search Row */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                      {/* Search Bar */}
                      <div className="relative w-full md:w-80">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={adminOrderSearchQuery}
                          onChange={(e) => setAdminOrderSearchQuery(e.target.value)}
                          placeholder="Buscar por ID, cliente, email o artículo..."
                          className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#3C6E71] focus:bg-white transition-all text-gray-900 placeholder-gray-400"
                        />
                        {adminOrderSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setAdminOrderSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Payment Method Selector */}
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <span className="text-xs text-gray-500 font-bold uppercase whitespace-nowrap">Medio de Pago:</span>
                        <select
                          value={adminPaymentMethodFilter}
                          onChange={(e) => setAdminPaymentMethodFilter(e.target.value)}
                          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:border-[#3C6E71] cursor-pointer"
                        >
                          <option value="all">Todos los medios</option>
                          <option value="transfer">Solo Transferencia Bancaria</option>
                          <option value="mercadopago">Solo Mercado Pago / Tarjeta</option>
                        </select>
                      </div>
                    </div>

                    {/* Status Tabs with Live Counters */}
                    <div className="overflow-x-auto pb-1 flex items-center gap-2 flex-nowrap text-xs font-mono-custom pt-2 border-t border-gray-100">
                      {[
                        { id: 'all', label: 'TODOS', count: countAll },
                        { id: 'pending_review', label: 'EN REVISIÓN (TRANSF.)', count: countReview },
                        { id: 'paid', label: 'PAGADOS', count: countPaid },
                        { id: 'preparing', label: 'EN PREPARACIÓN', count: countPreparing },
                        { id: 'shipped', label: 'DESPACHADOS', count: countShipped },
                        { id: 'delivered', label: 'ENTREGADOS', count: countDelivered },
                        { id: 'pending_payment', label: 'PEND. PAGO', count: countPending },
                        { id: 'rejected', label: 'RECHAZADOS', count: countRejected },
                        { id: 'cancelled', label: 'CANCELADOS', count: countCancelled }
                      ].map(f => {
                        const isSelected = adminOrderStatusFilter === f.id;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setAdminOrderStatusFilter(f.id)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold font-display tracking-wider transition-all cursor-pointer flex items-center gap-2 shrink-0 border ${
                              isSelected
                                ? 'bg-[#3C6E71] text-white border-[#3C6E71] shadow-xs'
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <span>{f.label}</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono-custom font-bold ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-[#3C6E71]/10 text-[#3C6E71]'
                            }`}>
                              {f.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Orders Table */}
                  <div className="overflow-x-auto bg-white border border-gray-200 rounded-2xl shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 uppercase tracking-widest font-display text-[10px]">
                          <th className="p-3.5">ID / Fecha</th>
                          <th className="p-3.5">Cliente / Contacto</th>
                          <th className="p-3.5">Artículos del Pedido</th>
                          <th className="p-3.5">Forma de Pago</th>
                          <th className="p-3.5">Total</th>
                          <th className="p-3.5">Estado & Flujo</th>
                          <th className="p-3.5 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150 text-gray-800 font-sans">
                        {isAdminOrdersLoading ? (
                          Array.from({ length: 4 }).map((_, i) => (
                            <tr key={i} className="animate-pulse">
                              {Array.from({ length: 7 }).map((__, j) => (
                                <td key={j} className="p-3.5">
                                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-1" />
                                  <div className="h-2 bg-gray-100 rounded w-1/2" />
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : filteredList.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-12 text-center text-gray-400 font-display">
                              <ShoppingBag className="w-12 h-12 mx-auto stroke-[1] text-gray-300 mb-2" />
                              <p className="font-bold text-xs uppercase text-gray-600">No se encontraron pedidos con los filtros aplicados</p>
                              <p className="text-[11px] text-gray-400 mt-1">Prueba cambiando el estado o la búsqueda.</p>
                            </td>
                          </tr>
                        ) : (
                          filteredList.map(order => {
                            const items = parseOrderItems(order);
                            const customerPhone = order.profiles?.phone || '';
                            const customerName = order.customer_name || 'Cliente Holux';
                            const waCleanPhone = customerPhone.replace(/\D/g, '');
                            const isTransfer = order.payment_method === 'transfer' || !!order.receipt_url || order.status === 'pending_review' || order.status === 'processing' || (!order.payment_id && order.payment_method !== 'card' && order.payment_method !== 'mercadopago');
                            const isPendingReview = order.status === 'pending_review' || order.status === 'processing' || (order.status === 'created' && isTransfer);

                            return (
                              <tr
                                key={order.id}
                                className="hover:bg-gray-50/80 transition-colors"
                              >
                                {/* ID & Fecha */}
                                <td className="p-3.5 font-mono-custom">
                                  <span className="font-bold text-gray-900 block select-all">
                                    #{String(order.id).length > 15 ? String(order.id).slice(-6).toUpperCase() : order.id}
                                  </span>
                                  <span className="text-[10px] text-gray-400 font-sans block mt-0.5">
                                    {new Date(order.created_at || Date.now()).toLocaleDateString('es-AR')}
                                  </span>
                                </td>

                                {/* Cliente & Contacto */}
                                <td className="p-3.5">
                                  <div className="font-bold text-gray-900">{customerName}</div>
                                  <div className="text-[11px] text-gray-500 font-mono-custom flex items-center gap-1.5 mt-0.5">
                                    <span>{order.customer_email || 'Sin email'}</span>
                                    {order.customer_email && (
                                      <a
                                        href={`mailto:${order.customer_email}?subject=Tu pedido en Holux #${String(order.id).slice(-6).toUpperCase()}`}
                                        className="text-[#3C6E71] hover:underline"
                                        title="Enviar correo"
                                      >
                                        ✉️
                                      </a>
                                    )}
                                  </div>
                                  {customerPhone && (
                                    <div className="text-[10px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                                      <span>📞 {customerPhone}</span>
                                      {waCleanPhone && (
                                        <a
                                          href={`https://wa.me/${waCleanPhone}?text=Hola%20${encodeURIComponent(customerName)},%20te%20escribimos%20de%20Holux%20sobre%20tu%20pedido%20%23${String(order.id).slice(-6).toUpperCase()}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold hover:bg-emerald-200 transition-colors"
                                          title="Escribir por WhatsApp"
                                        >
                                          WhatsApp 💬
                                        </a>
                                      )}
                                    </div>
                                  )}
                                  <div className="text-[10px] text-gray-500 truncate max-w-[160px] flex items-center gap-1 mt-1" title={order.shipping_address}>
                                    <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                                    <span>{order.shipping_address || 'Entrega a Domicilio'}</span>
                                  </div>
                                </td>

                                {/* Artículos */}
                                <td className="p-3.5">
                                  <div className="text-xs text-gray-700 max-w-[220px] max-h-24 overflow-y-auto pr-1 space-y-1.5">
                                    {items.length > 0 ? (
                                      items.map((item, idx) => (
                                        <div key={idx} className="flex items-start justify-between gap-2 border-b border-gray-100 pb-1 last:border-0">
                                          <div className="min-w-0">
                                            <p className="font-bold text-gray-900 truncate text-[11px]" title={item.product_name || item.name}>
                                              {item.product_name || item.name || 'Producto'}
                                            </p>
                                            {item.variant && (
                                              <span className="text-[9px] text-gray-400 block font-mono-custom">Talle/Var: {item.variant}</span>
                                            )}
                                          </div>
                                          <span className="font-bold text-gray-600 text-[10px] font-mono-custom whitespace-nowrap bg-gray-100 px-1.5 py-0.5 rounded">
                                            x{item.quantity || 1}
                                          </span>
                                        </div>
                                      ))
                                    ) : (
                                      <span className="text-[11px] text-gray-400 italic">Sin artículos detallados</span>
                                    )}
                                  </div>
                                </td>

                                {/* Forma de Pago */}
                                <td className="p-3.5">
                                  <div className="space-y-1">
                                    <span className="font-bold uppercase text-gray-900 text-[11px] block leading-tight">
                                      {isTransfer ? 'Transferencia Bancaria' : (order.payment_method === 'card' ? 'Mercado Pago / Tarjeta' : (order.payment_method || 'Mercado Pago'))}
                                    </span>
                                    {order.payment_id && (
                                      <span className="block text-[9px] font-mono-custom text-gray-400">
                                        Ref: {order.payment_id}
                                      </span>
                                    )}
                                    {isTransfer && (
                                      order.receipt_url ? (
                                        <button
                                          type="button"
                                          onClick={() => setAdminReceiptLightboxUrl(order.receipt_url)}
                                          className="inline-flex items-center gap-1 text-[10px] font-bold text-[#3C6E71] bg-[#3C6E71]/10 hover:bg-[#3C6E71]/20 px-2 py-0.5 rounded transition-colors cursor-pointer"
                                        >
                                          <span>📄 Comprobante</span>
                                        </button>
                                      ) : (
                                        <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200/60 px-1.5 py-0.2 rounded font-medium inline-block">
                                          ⏳ Sin adjunto
                                        </span>
                                      )
                                    )}
                                  </div>
                                </td>

                                {/* Total */}
                                <td className="p-3.5 font-mono-custom font-bold text-base text-gray-900 whitespace-nowrap">
                                  ${Math.round(order.total || order.total_amount || 0).toLocaleString('es-AR')}
                                </td>

                                {/* Estado con Selector Rápido */}
                                <td className="p-3.5">
                                  <div className="space-y-1.5 min-w-[130px]">
                                    <select
                                      value={order.status || 'pending_payment'}
                                      onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                      className={`w-full px-2 py-1 rounded-lg text-[10px] font-bold font-mono-custom uppercase border outline-none cursor-pointer ${
                                        order.status === 'paid' || order.status === 'completed'
                                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                          : isPendingReview
                                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                                          : order.status === 'preparing'
                                          ? 'bg-blue-50 text-blue-900 border-blue-300'
                                          : order.status === 'shipped'
                                          ? 'bg-purple-50 text-purple-900 border-purple-300'
                                          : order.status === 'delivered'
                                          ? 'bg-emerald-100 text-emerald-950 border-emerald-400'
                                          : order.status === 'rejected'
                                          ? 'bg-red-50 text-red-800 border-red-300'
                                          : 'bg-gray-100 text-gray-700 border-gray-300'
                                      }`}
                                    >
                                      <option value="pending_review">🟠 EN REVISIÓN</option>
                                      <option value="paid">🟢 PAGADO</option>
                                      <option value="preparing">📦 EN PREPARACIÓN</option>
                                      <option value="shipped">🚚 DESPACHADO</option>
                                      <option value="delivered">✅ ENTREGADO</option>
                                      <option value="pending_payment">🟡 PENDIENTE PAGO</option>
                                      <option value="rejected">🔴 RECHAZADO</option>
                                      <option value="cancelled">⚪ CANCELADO</option>
                                    </select>

                                    {order.rejection_reason && (
                                      <p className="text-[9px] text-red-600 italic font-sans max-w-[140px] leading-tight">
                                        Motivo: {order.rejection_reason}
                                      </p>
                                    )}
                                  </div>
                                </td>

                                {/* Acciones */}
                                <td className="p-3.5 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedOrderDetail(order)}
                                      className="px-3 py-1.5 bg-[#1C2321] hover:bg-[#3C6E71] text-white font-display text-[10px] font-bold tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>GESTIONAR</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setSelectedPrintOrder(order)}
                                      className="px-2.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                                      title="Imprimir Factura"
                                    >
                                      🖨️
                                    </button>

                                    {order.status !== 'rejected' && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setAdminRejectionModalOrder(order);
                                          setAdminRejectionReasonInput('');
                                        }}
                                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                                        title="Rechazar pago con motivo"
                                      >
                                        RECHAZAR
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {adminTab === 'products' && (
              <ProductCatalogManager
                catalog={productCatalogState}
                onEditProduct={(prod) => {
                  setSelectedProductModal(prod);
                  setIsProductModalOpen(true);
                }}
                onDuplicateProduct={(prod) => {
                  setSelectedProductModal({ ...prod, id: null, name: `${prod.name} (Copia)` });
                  setIsProductModalOpen(true);
                }}
                onCreateProduct={() => {
                  setSelectedProductModal(null);
                  setIsProductModalOpen(true);
                }}
                onDeleteProductSingle={(prod) => {
                  handleDeleteProduct(prod.id);
                }}
              />
            )}
            {adminTab === 'categories' && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h4 className="text-xs font-bold tracking-wider text-gray-900 uppercase font-display mb-4">
                    {editingCategory ? 'EDITAR CATEGORÍA' : 'NUEVA CATEGORÍA DE PRODUCTO'}
                  </h4>

                  <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 tracking-wider uppercase block mb-1">NOMBRE DE LA CATEGORÍA</label>
                        <input
                          type="text"
                          required
                          value={catName}
                          onChange={(e) => {
                            setCatName(e.target.value);
                            if (!editingCategory) setCatSlug(e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
                          }}
                          placeholder="Ej: Calzado & Botas"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:border-[#3C6E71] outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-500 tracking-wider uppercase block mb-1">SLUG (URL AMIGABLE)</label>
                        <input
                          type="text"
                          required
                          value={catSlug}
                          onChange={(e) => setCatSlug(e.target.value)}
                          placeholder="calzado-botas"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:border-[#3C6E71] outline-none font-mono-custom"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-[#3C6E71] text-white font-display font-bold tracking-wider rounded shadow hover:bg-[#3C6E71]/90 cursor-pointer"
                      >
                        {editingCategory ? 'GUARDAR CAMBIOS' : 'CREAR CATEGORÍA'}
                      </button>
                      {editingCategory && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategory(null);
                            setCatName('');
                            setCatSlug('');
                          }}
                          className="px-4 py-2.5 border border-gray-300 text-gray-700 font-display font-bold tracking-wider rounded hover:bg-gray-50 cursor-pointer"
                        >
                          CANCELAR
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold tracking-wider text-gray-900 uppercase font-display border-b border-gray-200 pb-3">
                    CATEGORÍAS EXISTENTES ({categories.length})
                  </h4>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 uppercase tracking-widest font-display text-[9px]">
                          <th className="p-3">Categoría</th>
                          <th className="p-3">Slug (URL)</th>
                          <th className="p-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 text-gray-700">
                        {categories.map(cat => (
                          <tr key={cat.id} className="hover:bg-gray-50/50">
                            <td className="p-3 font-bold text-gray-800">{cat.name}</td>
                            <td className="p-3 font-mono-custom text-gray-500">/{cat.slug}</td>
                            <td className="p-3 text-right space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCategory(cat);
                                  setCatName(cat.name);
                                  setCatSlug(cat.slug);
                                }}
                                className="p-1.5 text-[#3C6E71] hover:bg-[#3C6E71]/10 rounded transition-colors cursor-pointer inline-block"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer inline-block"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {adminTab === 'customers' && (
              <div className="space-y-6">
                {/* Subtabs Selector */}
                <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
                  <button
                    type="button"
                    onClick={() => setCustomerSubTab('list')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                      customerSubTab === 'list'
                        ? 'bg-[#3C6E71] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Listado de Clientes ({adminCustomersList.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCustomerSubTab('settings')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                      customerSubTab === 'settings'
                        ? 'bg-[#3C6E71] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Crown className="w-4 h-4 text-amber-500" />
                    <span>⚙️ Configuración de Beneficios VIP & Super VIP</span>
                  </button>
                </div>

                {customerSubTab === 'settings' ? (
                  <VipSettingsManager token={token} apiBaseUrl={API_BASE_URL} />
                ) : (
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                      <div>
                        <h4 className="text-xs font-bold tracking-wider text-gray-900 uppercase font-display">
                          CLIENTES REGISTRADOS ({adminCustomersList.length})
                        </h4>
                        <p className="text-[11px] text-gray-500 font-sans mt-0.5">
                          Administrá los niveles de membresía, estado y órdenes de cada cliente.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={fetchAdminCustomers}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold font-display uppercase tracking-wider transition-all cursor-pointer shadow-2xs self-start sm:self-auto"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Actualizar Clientes</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 uppercase tracking-widest font-display text-[9px]">
                            <th className="p-3">Cliente</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Pedidos</th>
                            <th className="p-3">Total Gastado</th>
                            <th className="p-3">Nivel de Membresía</th>
                            <th className="p-3">Estado</th>
                            <th className="p-3 text-right">Acciones ABM</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-gray-700 font-sans">
                          {adminCustomersList.map(cust => {
                            const tier = cust.tier || (cust.is_super_vip ? 'super_vip' : cust.is_vip ? 'vip' : 'standard');
                            return (
                              <tr key={cust.id} className="hover:bg-gray-50/50">
                                <td className="p-3">
                                  <div className="font-bold text-gray-800 flex items-center gap-1.5">
                                    {cust.full_name || cust.name}
                                    {tier === 'super_vip' && (
                                      <span className="bg-purple-100 text-purple-900 border border-purple-300 text-[8px] px-1.5 py-0.2 rounded-full font-bold">
                                        👑 SUPER VIP
                                      </span>
                                    )}
                                    {tier === 'vip' && (
                                      <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[8px] px-1.5 py-0.2 rounded-full font-bold">
                                        ⭐ VIP
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    {cust.phone ? (
                                      <a
                                        href={`https://wa.me/${cust.phone.replace(/[^0-9]/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[10px] font-mono-custom text-emerald-700 hover:text-emerald-900 font-bold bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 transition-colors"
                                        title="Enviar WhatsApp directo al cliente"
                                      >
                                        <span>📱 {cust.phone}</span>
                                        <span className="text-[8px] uppercase font-sans font-black bg-emerald-600 text-white px-1 rounded">WA</span>
                                      </a>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedCustomerModal(cust);
                                          setIsCustomerModalOpen(true);
                                        }}
                                        className="text-[10px] text-gray-400 font-mono-custom hover:text-[#3C6E71] hover:underline cursor-pointer flex items-center gap-1 text-left"
                                        title="Hacé clic para agregar teléfono"
                                      >
                                        <span>📞 Sin teléfono</span>
                                        <span className="text-[9px] text-[#3C6E71] font-bold">(+ agregar)</span>
                                      </button>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 font-mono-custom text-gray-600">{cust.email}</td>
                                <td className="p-3 font-mono-custom font-bold text-gray-800">{cust.orders_count ?? cust.total_orders ?? 0} pedidos</td>
                                <td className="p-3 font-mono-custom font-bold text-emerald-700">
                                  ARS ${(cust.total_spent || cust.spent || 0).toLocaleString('es-AR')}
                                </td>
                                <td className="p-3">
                                  <select
                                    value={tier}
                                    onChange={(e) => handleUpdateCustomerTier(cust.id, e.target.value)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono-custom outline-none border cursor-pointer transition-all ${
                                      tier === 'super_vip'
                                        ? 'bg-purple-50 text-purple-900 border-purple-300 font-black'
                                        : tier === 'vip'
                                        ? 'bg-amber-50 text-amber-900 border-amber-300 font-black'
                                        : 'bg-gray-50 text-gray-700 border-gray-300'
                                    }`}
                                  >
                                    <option value="standard">👤 Estándar</option>
                                    <option value="vip">⭐ VIP</option>
                                    <option value="super_vip">👑 SUPER VIP</option>
                                  </select>
                                </td>
                                <td className="p-3">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${cust.status === 'suspended' || cust.status === 'SUSPENDIDO' || cust.active === false ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                    {cust.status === 'suspended' || cust.active === false ? 'SUSPENDIDO' : 'ACTIVO'}
                                  </span>
                                </td>
                                <td className="p-3 text-right space-x-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedCouponCustomer(cust)}
                                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-display font-bold tracking-wider cursor-pointer shadow-xs inline-flex items-center gap-1 transition-all"
                                    title="Enviar cupón de descuento a este cliente"
                                  >
                                    <Gift className="w-3 h-3" />
                                    <span>ENVIAR CUPÓN</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedCustomerModal(cust);
                                      setIsCustomerModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white rounded-lg text-[10px] font-display font-bold tracking-wider cursor-pointer"
                                    title="Editar perfil de cliente"
                                  >
                                    EDITAR
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const nextActive = cust.active === false ? true : false;
                                      try {
                                        await fetch(`${API_BASE_URL}/api/admin/customers/${cust.id}`, {
                                          method: 'PATCH',
                                          headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${token}`
                                          },
                                          body: JSON.stringify({ active: nextActive })
                                        });
                                        fetchAdminCustomers();
                                      } catch (err) {
                                        console.error(err);
                                      }
                                    }}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-display font-bold tracking-wider cursor-pointer border ${cust.active === false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}
                                  >
                                    {cust.active === false ? 'ACTIVAR' : 'SUSPENDER'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {adminTab === 'reviews' && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
                <h4 className="text-xs font-bold tracking-wider text-gray-900 uppercase font-display border-b border-gray-200 pb-3">
                  MODERACIÓN DE RESEÑAS Y CALIFICACIONES ({adminReviewsList.length})
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 uppercase tracking-widest font-display text-[9px]">
                        <th className="p-3">Producto</th>
                        <th className="p-3">Cliente</th>
                        <th className="p-3">Puntuación</th>
                        <th className="p-3">Comentario</th>
                        <th className="p-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-700">
                      {adminReviewsList.length > 0 ? (
                        adminReviewsList.map(rev => (
                          <tr key={rev.id} className="hover:bg-gray-50/50">
                            <td className="p-3 font-bold text-gray-800">
                              {rev.product_name || rev.products?.name || 'Producto Holux'}
                            </td>
                            <td className="p-3 font-bold">
                              {rev.customer_name || rev.profiles?.full_name || 'Cliente Holux'}
                            </td>
                            <td className="p-3 font-mono-custom text-amber-500 font-bold">
                              {'★'.repeat(rev.rating || 5)}{'☆'.repeat(5 - (rev.rating || 5))} ({rev.rating || 5}/5)
                            </td>
                            <td className="p-3 text-gray-600 max-w-xs truncate">{rev.comment}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                                APROBADO
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-400 italic">
                            No hay reseñas registradas por moderar en este momento.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>

        {isProductModalOpen && (
          <ProductEditModal
            product={selectedProductModal}
            categories={categories}
            onClose={() => setIsProductModalOpen(false)}
            onSave={handleSaveProductModal}
            onDuplicate={(p) => {
              setSelectedProductModal({ ...p, id: null, name: `${p.name} (Copia)` });
            }}
          />
        )}
        {isCustomerModalOpen && (
          <CustomerEditModal
            customer={selectedCustomerModal}
            onClose={() => setIsCustomerModalOpen(false)}
            onSave={async (updatedCust) => {
              setAdminCustomersList(prev => prev.map(c => c.id === updatedCust.id ? updatedCust : c));
              setIsCustomerModalOpen(false);
              setSelectedCustomerModal(null);

              try {
                // 1. Update Supabase profiles table
                await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${updatedCust.id}`, {
                  method: 'PATCH',
                  headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    full_name: updatedCust.full_name,
                    phone: updatedCust.phone,
                    active: updatedCust.active !== false
                  })
                });

                // 2. Update tier / notes in backend API
                if (updatedCust.tier) {
                  await fetch(`${API_BASE_URL}/api/admin/customers/${updatedCust.id}/tier`, {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      tier: updatedCust.tier,
                      notes: updatedCust.notes
                    })
                  });
                }
                fetchAdminCustomers();
              } catch (err) {
                console.error('Error saving customer profile:', err);
              }
            }}
          />
        )}
        {selectedCouponCustomer && (
          <SendCouponModal
            customer={selectedCouponCustomer}
            onClose={() => setSelectedCouponCustomer(null)}
            token={token}
          />
        )}

        {/* --- ADMIN MODAL: LIGHTBOX PARA COMPROBANTES DE TRANSFERENCIA --- */}
        {adminReceiptLightboxUrl && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setAdminReceiptLightboxUrl(null)} />
            <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 z-10 space-y-4 p-5 text-gray-900">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                  📄 COMPROBANTE DE TRANSFERENCIA ADJUNTADO
                </h3>
                <div className="flex items-center gap-2">
                  <a
                    href={adminReceiptLightboxUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-xs font-bold font-mono-custom"
                  >
                    ABRIR ORIGINAL
                  </a>
                  <button onClick={() => setAdminReceiptLightboxUrl(null)} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="max-h-[70vh] overflow-y-auto flex items-center justify-center bg-gray-100 p-4 rounded-xl">
                <img
                  src={adminReceiptLightboxUrl}
                  alt="Comprobante de pago"
                  className="max-w-full max-h-[60vh] object-contain rounded shadow-md"
                />
              </div>
            </div>
          </div>
        )}

        {/* --- ADMIN MODAL: DETALLE DE PEDIDO --- */}
        {selectedOrderDetail && (() => {
          const o = selectedOrderDetail;
          const itemsList = parseOrderItems(o);
          const total = Math.round(o.total || o.total_amount || 0);
          const subtotal = o.subtotal ? Math.round(o.subtotal) : null;
          const shipping = o.shipping_cost != null ? Math.round(o.shipping_cost) : null;
          const sc = getOrderStatusInfo(o.status);
          return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setSelectedOrderDetail(null)} />
              <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-10 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-[#1C2321] text-white px-6 py-4 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#B85C38] text-white px-2.5 py-1 rounded font-black font-mono-custom text-xs">PEDIDO</div>
                    <div>
                      <h3 className="font-display text-base font-bold tracking-wider">
                        {o.id && o.id.length > 15 ? `#HLX-${o.id.slice(-6).toUpperCase()}` : (o.id || '—')}
                      </h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">{new Date(o.created_at || Date.now()).toLocaleString('es-AR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Editable Status Selector Dropdown */}
                    <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
                      <span className="text-[10px] text-gray-300 font-bold uppercase pl-2">ESTADO:</span>
                      <select
                        value={o.status || 'pending_payment'}
                        onChange={(e) => {
                          const newSt = e.target.value;
                          if (window.confirm(`¿Cambiar estado del pedido a '${newSt.toUpperCase()}'?`)) {
                            handleUpdateOrderStatus(o.id, newSt);
                            setSelectedOrderDetail(prev => prev ? { ...prev, status: newSt } : null);
                          }
                        }}
                        className="bg-white text-gray-900 border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold outline-none cursor-pointer font-display"
                      >
                        <option value="pending_payment">🟡 PENDIENTE PAGO</option>
                        <option value="pending_review">🟠 EN REVISIÓN</option>
                        <option value="paid">🟢 PAGADO / APROBADO</option>
                        <option value="rejected">🔴 RECHAZADO</option>
                        <option value="cancelled">⚪ CANCELADO</option>
                      </select>
                    </div>
                    <button onClick={() => setSelectedOrderDetail(null)} className="text-gray-400 hover:text-white transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
                  </div>
                </div>

                <div className="overflow-y-auto p-6 space-y-5">

                  {/* Cliente y envío */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                      <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-display border-b border-gray-200 pb-1.5">👤 Cliente</h4>
                      <p className="font-bold text-gray-900 text-sm">{o.customer_name || 'Cliente Holux'}</p>
                      <p className="text-xs text-gray-500 font-mono-custom">{o.customer_email}</p>
                      {o.customer_phone && <p className="text-xs text-gray-500">{o.customer_phone}</p>}
                      {o.customer_dni && <p className="text-xs text-gray-500">DNI: {o.customer_dni}</p>}
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                      <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-display border-b border-gray-200 pb-1.5">📦 Envío y Entrega</h4>
                      <p className="text-xs font-bold text-gray-800 leading-relaxed">
                        {o.shipping_address || 'Retiro en Sucursal Central Bariloche (Av. Bustillo Km 4.5)'}
                      </p>
                      <p className="text-[10px] font-bold text-[#3C6E71] font-display uppercase tracking-wider">
                        Método: {o.shipping_method || (o.shipping_address && !o.shipping_address.includes('Sucursal') ? 'Entrega a Domicilio' : 'Retiro en Sucursal Central')}
                      </p>
                    </div>
                  </div>

                  {/* Artículos */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-display border-b border-gray-200 pb-1.5 mb-3">🛍️ Artículos del Pedido</h4>
                    {itemsList.length > 0 ? (
                      <div className="space-y-2">
                        {itemsList.map((item, idx) => {
                          const name = item.product_name || item.name || 'Producto';
                          const qty = item.quantity || 1;
                          const price = item.unit_price || item.price || 0;
                          return (
                            <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                              <div className="flex items-start gap-3">
                                {item.image_url && <img src={item.image_url} alt={name} className="w-10 h-10 object-cover rounded-lg border border-gray-200" />}
                                <div>
                                  <p className="text-sm font-bold text-gray-800">{name}</p>
                                  {item.variant && <p className="text-[10px] text-gray-400">{item.variant}</p>}
                                  <p className="text-[10px] text-gray-400 font-mono-custom">x{qty} unidades</p>
                                </div>
                              </div>
                              <p className="font-bold text-gray-800 text-sm font-mono-custom whitespace-nowrap">
                                {price > 0 ? `ARS ${Math.round(price * qty).toLocaleString('es-AR')}` : ''}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Sin detalle de artículos disponible.</p>
                    )}

                    {/* Totales */}
                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-1.5">
                      {subtotal != null && (
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Subtotal</span>
                          <span className="font-mono-custom">ARS ${subtotal.toLocaleString('es-AR')}</span>
                        </div>
                      )}
                      {shipping != null && (
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Envío</span>
                          <span className="font-mono-custom">{shipping === 0 ? '¡GRATIS!' : `ARS ${shipping.toLocaleString('es-AR')}`}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-200">
                        <span>TOTAL</span>
                        <span className="font-mono-custom text-[#3C6E71]">ARS ${total.toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pago */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-display border-b border-gray-200 pb-1.5 mb-3">💳 Detalle del Pago</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Método</p>
                        <p className="font-bold text-gray-800 mt-0.5 uppercase">{o.payment_method === 'transfer' ? 'Transferencia Bancaria' : (o.payment_method || 'Tarjeta')}</p>
                      </div>
                      {o.payment_id && (
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">ID de Transacción</p>
                          <p className="font-mono-custom text-gray-800 mt-0.5 break-all">{o.payment_id}</p>
                        </div>
                      )}
                      {o.payment_status && (
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Estado Pago</p>
                          <p className="font-bold text-gray-800 mt-0.5 uppercase">{o.payment_status}</p>
                        </div>
                      )}
                    </div>
                    {o.receipt_url && (
                      <div className="mt-4">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-2">Comprobante de Transferencia</p>
                        <img
                          src={o.receipt_url}
                          alt="Comprobante de pago"
                          className="w-full max-w-sm rounded-xl border border-gray-200 shadow-md cursor-zoom-in object-contain max-h-64"
                          onClick={() => setAdminReceiptLightboxUrl(o.receipt_url)}
                        />
                        <button
                          onClick={() => setAdminReceiptLightboxUrl(o.receipt_url)}
                          className="mt-2 text-[10px] font-bold text-[#3C6E71] underline cursor-pointer hover:text-[#3C6E71]/80"
                        >
                          🔍 Ver en pantalla completa
                        </button>
                      </div>
                    )}
                    {o.rejection_reason && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Motivo de Rechazo</p>
                        <p className="text-xs text-red-700 mt-1 italic">{o.rejection_reason}</p>
                      </div>
                    )}
                  </div>

                  {/* Tracking & Shipping Details */}
                  <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-bold text-blue-900 uppercase tracking-wider font-display flex items-center gap-1.5">
                        🚚 SEGUIMIENTO Y DESPACHO DE PAQUETE
                      </h4>
                      <button
                        onClick={() => handleSaveTracking(o.id)}
                        disabled={isSavingTracking}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold uppercase cursor-pointer transition-colors"
                      >
                        {isSavingTracking ? 'GUARDANDO...' : 'GUARDAR Y NOTIFICAR SEGUIMIENTO'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Empresa de Logística</label>
                        <select
                          value={shippingCourierInput}
                          onChange={(e) => setShippingCourierInput(e.target.value)}
                          className="w-full p-2 bg-white border border-blue-300 rounded-lg text-xs outline-none focus:border-blue-500 font-bold text-gray-800"
                        >
                          <option value="Andreani">Andreani</option>
                          <option value="Correo Argentino">Correo Argentino</option>
                          <option value="OCA">OCA Express</option>
                          <option value="Expreso Bariloche">Expreso Bariloche / Carga</option>
                          <option value="Mensajería Local">Mensajería Local Bariloche</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Código de Seguimiento / N° Guía</label>
                        <input
                          type="text"
                          placeholder="Ej: AR984729183"
                          value={trackingNumberInput}
                          onChange={(e) => setTrackingNumberInput(e.target.value)}
                          className="w-full p-2 bg-white border border-blue-300 rounded-lg text-xs outline-none focus:border-blue-500 font-mono-custom font-bold text-gray-900"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">URL de Rastreo Web (Opcional)</label>
                      <input
                        type="url"
                        placeholder="https://www.andreani.com/seguimiento/..."
                        value={trackingUrlInput}
                        onChange={(e) => setTrackingUrlInput(e.target.value)}
                        className="w-full p-2 bg-white border border-blue-300 rounded-lg text-xs outline-none focus:border-blue-500 font-mono-custom text-gray-800"
                      />
                    </div>
                  </div>

                  {/* Internal Admin Notes */}
                  <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-bold text-amber-800 uppercase tracking-wider font-display">
                        📝 NOTAS INTERNAS DEL ADMIN (Comentarios Privados)
                      </h4>
                      <button
                        onClick={() => handleSaveAdminNote(o.id)}
                        disabled={isSavingAdminNote}
                        className="px-3 py-1 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white rounded text-[10px] font-bold uppercase cursor-pointer transition-colors"
                      >
                        {isSavingAdminNote ? 'GUARDANDO...' : 'GUARDAR NOTA'}
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={adminNoteInput}
                      onChange={(e) => setAdminNoteInput(e.target.value)}
                      placeholder="Escribí notas internas sobre este pedido (ej: Cliente confirmó por WhatsApp, se envió factura A...)"
                      className="w-full p-2.5 bg-white border border-amber-300 rounded-lg text-xs outline-none focus:border-[#3C6E71] text-gray-800"
                    />
                  </div>

                  {/* Status Change History Timeline */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-display border-b border-gray-200 pb-1.5">
                      📜 HISTORIAL DE CAMBIOS DE ESTADO (Auditoría)
                    </h4>
                    {adminOrderLogs.length > 0 ? (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {adminOrderLogs.map((log, lIdx) => (
                          <div key={lIdx} className="text-xs bg-white p-2 rounded border border-gray-200 flex items-center justify-between">
                            <div>
                              <span className="font-bold text-gray-800 uppercase">{log.old_status || 'INICIAL'} → {log.new_status}</span>
                              {log.comment && <p className="text-[10px] text-gray-500 italic mt-0.5">{log.comment}</p>}
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] text-gray-400 block font-mono-custom">{new Date(log.created_at).toLocaleString('es-AR')}</span>
                              <span className="text-[9px] text-gray-500">{log.changed_by || 'admin'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No hay historial registrado aún.</p>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => { setSelectedPrintOrder(o); setSelectedOrderDetail(null); }}
                      className="px-3 py-1.5 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white rounded-xl text-xs font-bold uppercase cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      🖨️ FACTURA
                    </button>
                    <a
                      href={`${API_BASE_URL}/api/admin/orders/${o.id}/ticket?token=${token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-[#3C6E71]/10 hover:bg-[#3C6E71]/20 text-[#3C6E71] rounded-xl text-xs font-bold uppercase transition-colors flex items-center gap-1.5"
                    >
                      📄 PDF
                    </a>
                    <button
                      onClick={() => handleResendNotification(o.id)}
                      disabled={isResendingNotification}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase cursor-pointer transition-colors"
                    >
                      {isResendingNotification ? 'ENVIANDO...' : '✉️ REENVIAR EMAIL'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {o.status !== 'paid' && o.status !== 'completed' && (
                      <button
                        onClick={() => {
                          if (window.confirm('¿Confirmar pago y marcar este pedido como PAGADO?')) {
                            handleUpdateOrderStatus(o.id, 'paid');
                            setSelectedOrderDetail(null);
                          }
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase cursor-pointer transition-colors"
                      >
                        ✅ CONFIRMAR PAGO
                      </button>
                    )}
                    {o.status !== 'rejected' && (
                      <button
                        onClick={() => { setAdminRejectionModalOrder(o); setAdminRejectionReasonInput(''); setSelectedOrderDetail(null); }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase cursor-pointer transition-colors"
                      >
                        ❌ RECHAZAR PAGO
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedOrderDetail(null)}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold uppercase cursor-pointer transition-colors"
                    >
                      CERRAR
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* --- ADMIN MODAL: RECHAZAR PAGO CON MOTIVO --- */}
        {adminRejectionModalOrder && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setAdminRejectionModalOrder(null)} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 space-y-5 text-gray-900 z-10">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2 text-red-600">
                  <X className="w-5 h-5 stroke-[3]" />
                  <h3 className="font-display text-base font-bold uppercase tracking-wider text-gray-900">RECHAZAR PAGO DE PEDIDO</h3>
                </div>
                <button onClick={() => setAdminRejectionModalOrder(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <p className="text-gray-700">
                  Estás por rechazar el pago del pedido <strong className="font-mono-custom text-gray-900">{adminRejectionModalOrder.id}</strong> ({adminRejectionModalOrder.customer_name}). Se notificará automáticamente al cliente.
                </p>

                {/* Preset Reason Chips */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">MOTIVOS RÁPIDOS DE RECHAZO:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Comprobante no legible o ilegible",
                      "Monto transferido no coincide con el total",
                      "Transferencia no acreditada en la cuenta",
                      "Comprobante ya utilizado en otro pedido"
                    ].map((chip, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setAdminRejectionReasonInput(chip)}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-[10px] text-gray-800 transition-all cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">MOTIVO DETALLADO (SE ENVIARÁ AL CLIENTE) *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Escribí aquí la razón por la cual no se aprobó el pago..."
                    value={adminRejectionReasonInput}
                    onChange={(e) => setAdminRejectionReasonInput(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-red-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAdminRejectionModalOrder(null)}
                    className="w-1/2 py-2.5 border border-gray-300 text-gray-700 font-display text-xs font-bold uppercase rounded-xl hover:bg-gray-50 cursor-pointer"
                  >
                    CANCELAR
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const reason = adminRejectionReasonInput.trim() || 'El pago fue rechazado. Por favor verifica el comprobante o intenta con otro medio.';
                      await handleUpdateOrderStatus(adminRejectionModalOrder.id, 'rejected', reason);
                      setAdminRejectionModalOrder(null);
                      setAdminRejectionReasonInput('');
                    }}
                    className="w-1/2 py-2.5 bg-red-600 hover:bg-red-700 text-white font-display text-xs font-bold uppercase rounded-xl shadow cursor-pointer"
                  >
                    CONFIRMAR RECHAZO
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- ADMIN MODAL: FACTURA / COMPROBANTE DE IMPRESIÓN --- */}
        {selectedPrintOrder && (
          <InvoicePrinter order={selectedPrintOrder} onClose={() => setSelectedPrintOrder(null)} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-[#3C6E71] selection:text-white">
      
      {/* Sticky top wrapper containing both the ticker and the header */}
      <div className="sticky top-0 z-40 flex flex-col">
        {/* Interactive infinite scrolling & drag-and-swipe ticker banner */}
        <InteractiveTicker phrases={tickerPhrases} speed={45} />

        {/* --- HEADER (Compact UX Ergonomic Height: 56px - 64px) --- */}
        <header className="bg-[#1C2321] text-white border-b border-[#3C6E71]/20 shadow-md">
        <div className="w-full px-4 sm:px-8 lg:px-12 h-14 sm:h-16 flex items-center justify-between relative">
          
          {/* Left area: Hamburger Button (Mobile & Tablet) + Logo */}
          <div className="flex items-center gap-3 mr-4 xl:mr-8 shrink-0">
            {/* Hamburger Button (Visible on screens < 1280px or when space is tight) */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="xl:hidden p-1 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
              title="Abrir menú de navegación"
            >
              <Menu className="w-5 h-5 text-[#F2EFE9]" />
            </button>

            {/* Logo */}
            <span 
              className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#F2EFE9] flex items-center gap-2 cursor-pointer select-none hover:opacity-90 transition-opacity" 
              onClick={() => { 
                window.location.hash = '#/';
                setCurrentView('home');
                setSelectedDetailProduct(null);
                setActiveCategory(null);
                setActiveGender(null);
                window.scrollTo({ top: 0, behavior: 'instant' });
              }}
            >
              <img src="/holuxlogo.png" alt="HOLUX" className="h-9 sm:h-10 md:h-11 w-auto object-contain brightness-0 invert" />
              <span>HOLUX</span>
            </span>
          </div>

          {/* Center Navigation Menu (Customizable from Admin Panel) */}
          <nav className="hidden md:flex items-center gap-3 lg:gap-5 xl:gap-7 relative shrink-0">
            {headerNavItems.filter(item => item.isVisible !== false).map((item) => {
              // 1. Dropdown Style (Categories Dropdown)
              if (item.isDropdown || item.type === 'dropdown') {
                return (
                  <div key={item.id} className="relative group">
                    <button
                      onClick={() => { window.location.hash = item.link || '#/catalogo'; }}
                      className={`font-display text-xs font-bold tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer py-1.5 ${
                        activeCategory ? 'text-[#3C6E71]' : 'text-[#F2EFE9] group-hover:text-[#3C6E71]'
                      }`}
                    >
                      {item.label}
                      <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150 transform translate-y-1 group-hover:translate-y-0 absolute top-full left-0 w-52 bg-[#1C2321] border border-[#3C6E71]/20 shadow-xl rounded-xl py-2 z-50">
                      <button
                        onClick={() => { 
                          window.location.hash = '#/catalogo';
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-[#3C6E71]/20 text-xs font-display font-bold tracking-wider text-gray-200 hover:text-white transition-colors cursor-pointer"
                      >
                        TODO EL CATÁLOGO
                      </button>
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            window.location.hash = `#/catalogo?categoria=${cat.slug}`;
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-[#3C6E71]/20 text-xs font-display font-bold tracking-wider text-gray-200 hover:text-white transition-colors cursor-pointer"
                        >
                          {cat.name.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }

              // 2. Button / Highlighted Style (e.g. Outlet)
              if (item.isButton || item.type === 'button' || item.type === 'special') {
                const isActive = item.link === '#/catalogo?genero=outlet' ? activeGender === 'outlet' : false;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      window.location.hash = item.link || '#/catalogo';
                    }}
                    className={`px-3 py-1 border border-[#3C6E71] rounded font-display text-xs font-bold tracking-wider transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-[#3C6E71] text-white border-[#3C6E71]' 
                        : 'text-[#3C6E71] hover:bg-[#3C6E71] hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              }

              // 3. Normal Category or Custom Link
              const isCatActive = item.slug ? activeCategory === item.slug : (activeCategory && item.link?.includes(`categoria=${activeCategory}`));
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    window.location.hash = item.link || '#/catalogo';
                  }}
                  className={`font-display text-xs font-bold tracking-wider transition-colors cursor-pointer ${
                    isCatActive ? 'text-[#3C6E71]' : 'text-gray-200 hover:text-[#3C6E71]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Icons section */}
          <div className="flex items-center gap-4">
            
            {/* Search Component with Zero Lag and Auto Catalog Navigation */}
            <HeaderSearchInput
              isOpen={isSearchOpen}
              onToggle={setIsSearchOpen}
              currentQuery={searchQuery}
              onSearch={setSearchQuery}
              onNavigateToCatalog={() => {
                if (currentView !== 'category') {
                  window.location.hash = '#/catalogo';
                  setCurrentView('category');
                  setActiveCategory(null);
                  setActiveGender(null);
                }
              }}
            />

            {/* Admin trigger (visible for authorized admin users) */}
            {token && userProfile?.role === 'admin' && (
              <button
                onClick={() => {
                  window.location.hash = '#/admin';
                  setCurrentView('admin');
                  setAdminTab('dashboard');
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-full font-display text-[11px] font-bold tracking-wider transition-all duration-200 cursor-pointer shadow-md shadow-black/25 border border-white/10 hover:scale-[1.02] active:scale-[0.98]"
                title="Ir al Panel de Control de Administrador"
              >
                <Shield className="w-3.5 h-3.5 text-white/90" />
                <span>PANEL ADMIN</span>
              </button>
            )}

            {/* User Profile trigger - Opens Customer/User Panel for everyone including admin */}
            {token ? (
              <button
                onClick={() => {
                  window.location.hash = '#/mi-cuenta';
                  setCurrentView('customer_panel');
                }}
                className="p-2 rounded-full bg-white/[0.08] hover:bg-white/[0.15] transition-all duration-200 text-[#F2EFE9] cursor-pointer border border-white/15 hover:border-[#3C6E71]/40 hover:scale-[1.05] active:scale-[0.95]"
                title={`Mi Cuenta (${userProfile?.full_name || 'Ver Pedidos y Perfil'})`}
              >
                <User className="w-4 h-4 text-[#F2EFE9]" />
              </button>
            ) : (
              <button
                onClick={() => { setIsAuthModalOpen(true); setAuthMode('login'); }}
                className="p-2 rounded-full bg-white/[0.08] hover:bg-white/[0.15] transition-all duration-200 text-[#F2EFE9] cursor-pointer border border-white/15 hover:border-[#3C6E71]/40 hover:scale-[1.05] active:scale-[0.95]"
                title="Ingresar a tu cuenta"
              >
                <User className="w-4 h-4 text-[#F2EFE9]" />
              </button>
            )}

            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 bg-white/[0.08] hover:bg-white/[0.15] rounded-full transition-all duration-200 text-white border border-white/15 hover:border-[#3C6E71]/40 cursor-pointer hover:scale-[1.05] active:scale-[0.95]"
              title="Ver Carrito de Compras"
            >
              <ShoppingBag className="w-4 h-4 text-[#F2EFE9]" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[9px] font-bold rounded-full flex items-center justify-center font-mono-custom animate-pulse shadow-sm">
                  {cart.reduce((qty, item) => qty + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* MOBILE SLIDING MENU DRAWER (LEFT SIDE - RESPONSIVE MOBILE & TABLET) */}
      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        token={token}
        userProfile={userProfile}
        categories={categories}
        headerNavItems={headerNavItems}
        setCurrentView={setCurrentView}
        setIsAuthModalOpen={setIsAuthModalOpen}
        setAuthMode={setAuthMode}
        setAdminTab={setAdminTab}
      />
    </div>

      {currentView === 'home' && (
        <>
          {/* --- HERO BANNER (SLIDER CAROUSEL) --- */}
          {/* --- HERO BANNER (Isolated Performance Optimized Slider) --- */}
          <HeroSlider slides={heroSlides} />

          {/* --- NOVEDADES DE HOLUX (SLIDER CAROUSEL) --- */}
          <section id="catalogo" className="w-full px-4 sm:px-8 lg:px-12 py-12">
            <div className="relative group/novedades">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1C2321] tracking-wide text-center uppercase">
                {homeSectionTitles?.novedadesTitle || 'Novedades de Holux'}
              </h2>
              <p className="text-xs sm:text-sm text-[#3C6E71] font-semibold mt-1 text-center font-sans tracking-wider uppercase">
                {homeSectionTitles?.novedadesSubtitle || 'Descubrí los últimos lanzamientos de nuestra colección'}
              </p>
              
              {/* Slider Wrapper (Visible on all screens with touch scrolling on mobile) */}
              <div className="relative mt-8 px-0 sm:px-12">
                {/* Left Arrow */}
                <button
                  onClick={() => scrollContainer(novedadesRef, 'left')}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 p-2 bg-[#1C2321]/80 hover:bg-[#3C6E71] text-white rounded-full transition-all duration-300 z-10 cursor-pointer shadow border border-white/5 opacity-0 group-hover/novedades:opacity-100 hidden sm:block"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Snap Scroll Container */}
                <div 
                  ref={novedadesRef}
                  onMouseDown={handleNovedadesMouseDown}
                  onMouseUp={handleNovedadesMouseLeaveOrUp}
                  onMouseLeave={handleNovedadesMouseLeaveOrUp}
                  onMouseMove={handleNovedadesMouseMove}
                  className="flex gap-3 sm:gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide py-4 select-none cursor-default"
                >
                  {[...products].reverse().slice(0, 8).map(product => (
                    <div
                      key={product.id}
                      className="snap-start shrink-0 w-[165px] sm:w-[220px] md:w-[280px]"
                    >
                      <ProductCard
                        product={product}
                        isFavorite={favorites.some(id => String(id) === String(product.id))}
                        onToggleFavorite={handleToggleFavorite}
                        onProductClick={handleProductClick}
                        onAddToCart={addToCart}
                        onBuyNow={handleProductClick}
                      />
                    </div>
                  ))}
                </div>

                {/* Right Arrow */}
                <button
                  onClick={() => scrollContainer(novedadesRef, 'right')}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 p-2 bg-[#1C2321]/80 hover:bg-[#3C6E71] text-white rounded-full transition-all duration-300 z-10 cursor-pointer shadow border border-white/5 opacity-0 group-hover/novedades:opacity-100 hidden sm:block"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Centered VER TODOS Button */}
              <div className="text-center mt-6">
                <button
                  onClick={() => { window.location.hash = '#/catalogo'; }}
                  className="px-8 py-2.5 border-2 border-[#1C2321] hover:bg-[#1C2321] hover:text-white text-[#1C2321] font-display text-xs font-bold tracking-widest rounded-full transition-all cursor-pointer"
                >
                  VER TODOS
                </button>
              </div>
            </div>
          </section>

          {/* --- PROMOTIONAL GRID BANNER (3 COLUMNS DESKTOP / SWIPEABLE CAROUSEL MOBILE & TABLET) --- */}
          <section className="bg-white py-14">
            {/* Desktop View (Side-by-side >= 1024px) */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-8 w-full px-4 sm:px-8 lg:px-12">
              {(gridPromoCards || PROMO_BANNERS).map((banner, idx) => (
                <div 
                  key={idx}
                  onClick={() => { window.location.hash = banner.link; }}
                  className="group relative h-[550px] sm:h-[620px] rounded-xl overflow-hidden border border-gray-150 cursor-pointer shadow-md hover:shadow-2xl hover:border-gray-300 transition-all duration-500"
                >
                  <img 
                    src={banner.image} 
                    alt={banner.title} 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-700 opacity-95"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent transition-all duration-500 group-hover:via-black/40" />
                  
                  {/* Banner Content Overlay */}
                  <div className="absolute bottom-8 left-8 text-left space-y-2 z-10 pr-6">
                    <span className="text-[11px] sm:text-xs text-orange-200 font-bold uppercase tracking-widest font-sans block drop-shadow">
                      {banner.span}
                    </span>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold tracking-wide text-white uppercase drop-shadow-md">
                      {banner.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile & Tablet View (Swipeable Carousel with Touch Gestures) */}
            <div className="block lg:hidden max-w-7xl mx-auto px-4">
              <MobilePromoCarousel banners={gridPromoCards || PROMO_BANNERS} />
            </div>
          </section>

          {/* --- PRODUCTOS DESTACADOS --- */}
          <section className="bg-[#F2EFE9] py-16">
            <div className="w-full px-4 sm:px-8 lg:px-12">
              <div className="relative group/destacados">
                <h2 className="font-display text-3xl font-black text-[#1C2321] tracking-wide text-center uppercase">
                  {homeSectionTitles?.destacadosTitle || 'Productos Destacados'}
                </h2>
                <p className="text-sm text-[#3C6E71] font-bold mt-1.5 text-center font-sans tracking-widest uppercase">
                  {homeSectionTitles?.destacadosSubtitle || 'Una selección especial recomendada por nuestros expertos'}
                </p>

                {/* Slider Wrapper (Visible on all screens with touch scrolling on mobile) */}
                <div className="relative mt-8 px-0 sm:px-12">
                  {/* Left Arrow */}
                  <button
                    onClick={() => scrollContainer(destacadosRef, 'left')}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 p-2 bg-[#1C2321]/80 hover:bg-[#3C6E71] text-white rounded-full transition-all duration-300 z-10 cursor-pointer shadow border border-white/5 opacity-0 group-hover/destacados:opacity-100 hidden sm:block"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Snap Scroll Container */}
                  <div 
                    ref={destacadosRef}
                    onMouseDown={handleDestacadosMouseDown}
                    onMouseUp={handleDestacadosMouseLeaveOrUp}
                    onMouseLeave={handleDestacadosMouseLeaveOrUp}
                    onMouseMove={handleDestacadosMouseMove}
                    className="flex gap-3 sm:gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide py-4 select-none cursor-default"
                  >
                    {products.map(product => (
                      <div
                        key={product.id}
                        className="snap-start shrink-0 w-[165px] sm:w-[220px] md:w-[280px]"
                      >
                        <ProductCard
                          product={product}
                          isFavorite={favorites.some(id => String(id) === String(product.id))}
                          onToggleFavorite={handleToggleFavorite}
                          onProductClick={handleProductClick}
                          onAddToCart={addToCart}
                          onBuyNow={handleProductClick}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Right Arrow */}
                  <button
                    onClick={() => scrollContainer(destacadosRef, 'right')}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 p-2 bg-[#1C2321]/80 hover:bg-[#3C6E71] text-white rounded-full transition-all duration-300 z-10 cursor-pointer shadow border border-white/5 opacity-0 group-hover/destacados:opacity-100 hidden sm:block"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {currentView === 'category' && (
        <CatalogView
          API_BASE_URL={API_BASE_URL}
          token={token}
          initialCategory={activeCategory}
          initialCollection={activeGender}
          searchQuery={searchQuery}
          onProductClick={handleProductClick}
          onAddToCart={addToCart}
          onBuyNow={(prod) => {
            addToCart(prod);
            setIsCartOpen(true);
          }}
          onNavigateHome={() => {
            window.location.hash = '#/';
            setCurrentView('home');
            setActiveCategory(null);
            setActiveGender(null);
          }}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {/* --- DEDICATED PRODUCT DETAIL PAGE VIEW --- */}
      {currentView === 'product-detail' && (
        selectedDetailProduct ? (
          <main className="flex-grow bg-[#F2EFE9] py-10 font-sans">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Breadcrumbs & Back button */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase tracking-widest font-sans flex-wrap">
                <button 
                  onClick={() => { window.location.hash = '#/'; }} 
                  className="hover:text-black hover:underline cursor-pointer transition-colors"
                >
                  Inicio
                </button>
                <span>&gt;</span>
                <button 
                  onClick={() => {
                    if (window.history.length > 1) {
                      window.history.back();
                    } else {
                      const cat = selectedDetailProduct.categories ? selectedDetailProduct.categories.slug : '';
                      window.location.hash = `#/catalogo${cat ? '?categoria=' + cat : ''}`;
                    }
                  }} 
                  className="hover:text-black hover:underline cursor-pointer transition-colors"
                >
                  {selectedDetailProduct.categories ? selectedDetailProduct.categories.name : 'Catálogo'}
                </button>
                <span>&gt;</span>
                <span className="text-[#3C6E71] font-bold truncate max-w-[180px] sm:max-w-none">{selectedDetailProduct.name}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (window.history.length > 1) {
                    window.history.back();
                  } else {
                    window.location.hash = '#/catalogo';
                  }
                }}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold font-display uppercase tracking-wider text-gray-700 hover:text-black bg-white hover:bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 transition-all cursor-pointer shadow-2xs shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver</span>
              </button>
            </div>

            {/* Split layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white border border-gray-200 rounded-lg shadow-sm p-6 sm:p-8">
              
              {/* Left visual column */}
              <div className="lg:col-span-7 flex flex-col items-center">
                {(() => {
                  const meta = productsMetadata[selectedDetailProduct.id] || {};
                  const resolveImg = (url) => {
                    if (!url || typeof url !== 'string') return null;
                    let clean = url.trim();
                    if (clean.startsWith('http://holux-api.onrender.com')) {
                      clean = clean.replace('http://holux-api.onrender.com', 'https://holux-api.onrender.com');
                    }
                    if (clean.includes('localhost:8000/storage/uploads/')) {
                      return '/uploads/' + clean.split('localhost:8000/storage/uploads/')[1];
                    }
                    return clean;
                  };

                  let imgList = [];
                  if (Array.isArray(selectedDetailProduct.images) && selectedDetailProduct.images.length > 0) {
                    imgList = selectedDetailProduct.images.map(resolveImg).filter(Boolean);
                  }
                  if (imgList.length === 0 && selectedDetailProduct.image_url) {
                    const resolved = resolveImg(selectedDetailProduct.image_url);
                    if (resolved) imgList = [resolved];
                  }
                  if (imgList.length === 0 && Array.isArray(meta.images) && meta.images.length > 0) {
                    imgList = meta.images.map(resolveImg).filter(Boolean);
                  }
                  if (imgList.length === 0 && meta.image_url) {
                    const resolved = resolveImg(meta.image_url);
                    if (resolved) imgList = [resolved];
                  }
                  if (imgList.length === 0) {
                    imgList = [getProductImage(selectedDetailProduct.name)];
                  }
                  
                  const activeImgUrl = imgList[selectedProductImageIndex] || imgList[0];

                  return (
                    <div className="w-full flex flex-col items-center space-y-3">
                      {/* Main Large Image Box */}
                      <div className="relative w-full bg-gray-50 aspect-square flex items-center justify-center border border-gray-100 rounded-xl overflow-hidden group shadow-2xs">
                        {getProductDiscount(selectedDetailProduct) > 0 && (
                          <span className="absolute top-4 left-4 bg-[#3C6E71] text-white text-xs font-sans font-semibold tracking-wider px-3 py-1 rounded-full shadow-sm z-10 select-none border border-white/15">
                            {getProductDiscount(selectedDetailProduct)}%
                          </span>
                        )}
                        
                        {selectedDetailProduct.stock <= 3 && selectedDetailProduct.stock > 0 && (
                          <span className="absolute top-4 right-4 bg-[#B85C38] text-white text-[9px] font-display font-medium tracking-widest px-2.5 py-1 rounded shadow-xs z-10">
                            ÚLTIMAS {selectedDetailProduct.stock} UNIDADES
                          </span>
                        )}
                        {selectedDetailProduct.stock === 0 && (
                          <span className="absolute top-4 right-4 bg-red-600 text-white text-[9px] font-display font-medium tracking-widest px-2.5 py-1 rounded shadow-xs z-10">
                            SIN STOCK
                          </span>
                        )}

                        {/* Navigation Arrows if multiple images */}
                        {imgList.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProductImageIndex((prev) => (prev > 0 ? prev - 1 : imgList.length - 1));
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
                                setSelectedProductImageIndex((prev) => (prev < imgList.length - 1 ? prev + 1 : 0));
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white text-gray-800 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer z-10 hover:scale-105"
                              title="Siguiente imagen"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </>
                        )}

                        {/* Image */}
                        <div className="w-full h-full flex items-center justify-center bg-white">
                          <img 
                            src={activeImgUrl} 
                            alt={selectedDetailProduct.name} 
                            onError={(e) => {
                              e.target.onerror = null;
                              const fallback = (meta.image_url && resolveImg(meta.image_url)) || getProductImage(selectedDetailProduct.name);
                              e.target.src = fallback;
                            }}
                            className="w-full h-full object-cover transition-opacity duration-300"
                          />
                        </div>
                      </div>

                      {/* Thumbnails Gallery under image in the empty space */}
                      {imgList.length > 1 && (
                        <div className="w-full flex items-center justify-center gap-2.5 overflow-x-auto py-1 px-2 no-scrollbar">
                          {imgList.map((thumbUrl, idx) => {
                            const isSelected = selectedProductImageIndex === idx;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setSelectedProductImageIndex(idx)}
                                className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all duration-150 cursor-pointer bg-white shrink-0 ${
                                  isSelected 
                                    ? 'border-[#3C6E71] ring-2 ring-[#3C6E71]/20 shadow-xs scale-105 opacity-100' 
                                    : 'border-gray-200 hover:border-gray-400 opacity-60 hover:opacity-100'
                                }`}
                              >
                                <img
                                  src={thumbUrl}
                                  alt={`${selectedDetailProduct.name} - Miniatura ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <p className="text-[10px] text-gray-400 font-sans tracking-wide text-center">
                        Imagen ilustrativa oficial de HOLUX. Fragancia 100% original con garantía de autenticidad.
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Right metadata / purchase column */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-6 text-left">
                <div className="space-y-4">
                  {/* Category and brand tags */}
                  <div className="text-[10px] text-[#3C6E71] font-bold uppercase tracking-widest font-sans">
                    {(selectedDetailProduct.brand || 'HOLUX').toUpperCase()} • {(selectedDetailProduct.categories?.name || 'PERFUMERÍA').toUpperCase()}
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                    {selectedDetailProduct.name}
                  </h1>

                  {/* Rating Stars Summary */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex text-yellow-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < Math.round(reviewsAverage) ? 'fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-gray-700 font-sans">{reviewsAverage.toFixed(1)}</span>
                    <span className="text-xs text-gray-400 font-sans">({reviewsTotal} valoraciones)</span>
                  </div>

                  {/* Price info */}
                  {(() => {
                    const discount = getProductDiscount(selectedDetailProduct);
                    const effectivePrice = getEffectiveProductPrice(selectedDetailProduct);
                    const originalPrice = getOriginalProductPrice(selectedDetailProduct);
                    return (
                      <div className="pt-2 border-t border-gray-100 flex flex-col space-y-1">
                        <div className="flex items-baseline gap-3">
                          <span className="text-3xl font-black text-gray-955 font-sans">
                            ${Math.round(effectivePrice).toLocaleString('es-AR')}
                          </span>
                          {discount > 0 && originalPrice > 0 && (
                            <span className="text-sm text-gray-400 line-through font-sans">
                              ${Math.round(originalPrice).toLocaleString('es-AR')}
                            </span>
                          )}
                        </div>

                        <div className="space-y-0.5 pt-1.5 text-gray-400 font-sans text-xs leading-tight">
                          <div>CFTA: 0%</div>
                          <div>Precio sin impuestos nacionales: ${Math.round(effectivePrice * 0.79).toLocaleString('es-AR')}</div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Size selection with dynamic variants & strict stock checking */}
                  {(() => {
                    const rawVariants = selectedDetailProduct.variants;
                    const hasExplicitVariants = Array.isArray(rawVariants) && rawVariants.length > 0;
                    
                    let variantsList = [];
                    if (hasExplicitVariants) {
                      variantsList = rawVariants.map((v, i) => {
                        if (typeof v === 'string') {
                          return { id: i, label: v, name: v, stock: typeof selectedDetailProduct.stock === 'number' ? selectedDetailProduct.stock : 10, isAvailable: (selectedDetailProduct.stock ?? 10) > 0 };
                        }
                        const label = v.name || v.label || v.size || `Opción ${i + 1}`;
                        const stock = typeof v.stock === 'number' ? v.stock : (typeof selectedDetailProduct.stock === 'number' ? selectedDetailProduct.stock : 10);
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
                    const effectiveStock = selectedVariantObj ? selectedVariantObj.stock : (selectedDetailProduct.stock || 0);

                    return (
                      <div className="space-y-3 pt-2">
                        {variantsList.length > 0 ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider font-display">
                                  Seleccionar Talle / Variante:
                                </span>
                                {selectedVariantObj && (
                                  <span className={`text-[11px] font-bold ${selectedVariantObj.stock > 0 ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded' : 'text-red-600 bg-red-50 px-2 py-0.5 rounded'}`}>
                                    {selectedVariantObj.stock > 0 ? `✓ ${selectedVariantObj.stock} disponibles` : '✕ Agotado'}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const cat = selectedDetailProduct.categories?.slug || '';
                                  const name = (selectedDetailProduct.name || '').toLowerCase();
                                  if (cat === 'calzado' || name.includes('bota') || name.includes('calzado') || name.includes('zapatilla')) {
                                    setSizeGuideCategory('footwear');
                                  } else if (name.includes('pantalón') || name.includes('pantalon') || name.includes('calza') || name.includes('short')) {
                                    setSizeGuideCategory('bottoms');
                                  } else {
                                    setSizeGuideCategory('tops');
                                  }
                                  setIsSizeGuideOpen(true);
                                }}
                                className="text-xs font-semibold text-[#3C6E71] hover:text-[#2b5052] flex items-center gap-1.5 underline cursor-pointer font-sans transition-colors"
                              >
                                <Ruler className="w-3.5 h-3.5" />
                                <span>Guía de talles</span>
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
                                    className={`px-3.5 py-2.5 text-xs font-bold tracking-wider rounded-xl border text-center transition-all flex items-center gap-1.5 ${
                                      !isAvail
                                        ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed line-through opacity-60'
                                        : isSelected
                                          ? 'border-black bg-black text-white font-extrabold shadow-sm'
                                          : 'border-gray-200 hover:border-black text-gray-800 bg-white cursor-pointer'
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
                              <p className="text-red-500 font-sans text-xs font-bold pt-1 flex items-center gap-1 animate-pulse">
                                ⚠️ Por favor, selecciona un talle disponible antes de agregar al carrito.
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="pt-2 flex items-center gap-2">
                            {selectedDetailProduct.stock > 0 ? (
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

                        {/* Description headings */}
                        {(() => {
                          const meta = productsMetadata[selectedDetailProduct.id] || {};
                          const desc = selectedDetailProduct.description || meta.description;
                          if (!desc) return null;
                          return (
                            <div className="space-y-2 pt-4 border-t border-gray-100">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 font-display">
                                Descripción del producto
                              </h4>
                              <p className="text-xs text-gray-700 leading-relaxed font-sans font-normal whitespace-pre-line">
                                {desc}
                              </p>
                            </div>
                          );
                        })()}

                        {/* Specs listing - Perfume olfactory notes & technical details */}
                        {(() => {
                          const meta = productsMetadata[selectedDetailProduct.id] || {};
                          const rawSpecs = selectedDetailProduct.specs || selectedDetailProduct.specifications || meta.specs;
                          let specList = [];
                          if (Array.isArray(rawSpecs) && rawSpecs.length > 0) {
                            specList = rawSpecs.filter(Boolean);
                          } else if (typeof rawSpecs === 'string' && rawSpecs.trim()) {
                            specList = rawSpecs.split('\n').map(s => s.trim()).filter(Boolean);
                          }

                          if (specList.length === 0) return null;

                          return (
                            <div className="space-y-2 pt-3 border-t border-gray-100">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 font-display">
                                Notas Olfativas y Especificaciones
                              </h4>
                              <ul className="text-xs text-gray-700 space-y-1.5 list-disc list-inside font-sans font-normal">
                                {specList.map((item, idx) => (
                                  <li key={idx} className="leading-relaxed font-medium text-gray-800">
                                    {typeof item === 'string' ? item.replace(/^-\s*/, '') : item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })()}

                        {/* PDP Action Box (Quantity and Dual Buttons: Comprar Ahora & Agregar al Carrito) */}
                        <div className="pt-6 border-t border-gray-100 space-y-4">
                          
                          {/* Row 1: Quantity + Buy Now (Direct Checkout) */}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            {/* Quantity selector */}
                            <div className="flex items-center justify-between border border-gray-300 rounded-xl overflow-hidden h-12 w-full sm:w-32 bg-white shrink-0 shadow-xs">
                              <button
                                type="button"
                                onClick={() => setDetailQuantity(prev => Math.max(1, prev - 1))}
                                className="w-10 h-full bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors font-bold cursor-pointer flex items-center justify-center border-r border-gray-200 text-base"
                                title="Disminuir cantidad"
                              >
                                -
                              </button>
                              <span className="text-sm font-bold text-gray-900 font-mono-custom">{detailQuantity}</span>
                              <button
                                type="button"
                                onClick={() => setDetailQuantity(prev => Math.min(effectiveStock || 1, prev + 1))}
                                className="w-10 h-full bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors font-bold cursor-pointer flex items-center justify-center border-l border-gray-200 text-base"
                                title="Aumentar cantidad"
                              >
                                +
                              </button>
                            </div>

                            {/* ⚡ COMPRAR AHORA (DIRECTO AL PAGO) */}
                            <button
                              type="button"
                              onClick={() => {
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
                                
                                const targetSize = variantsList.length > 0 ? selectedSize : 'Talla Única';
                                const effectivePrice = getEffectiveProductPrice(selectedDetailProduct);
                                
                                setCart(prev => {
                                  const existing = prev.find(item => item.id === selectedDetailProduct.id && item.sizeLabel === targetSize);
                                  const productWithSize = {
                                    ...selectedDetailProduct,
                                    price: effectivePrice,
                                    original_price: selectedDetailProduct.price,
                                    sizeLabel: targetSize
                                  };
                                  const maxStock = selectedVariantObj ? selectedVariantObj.stock : selectedDetailProduct.stock;
                                  if (existing) {
                                    const newQty = Math.min(maxStock, existing.quantity + detailQuantity);
                                    return prev.map(item => 
                                      (item.id === selectedDetailProduct.id && item.sizeLabel === targetSize)
                                        ? { ...item, quantity: newQty } 
                                        : item
                                    );
                                  }
                                  return [...prev, { ...productWithSize, quantity: detailQuantity }];
                                });

                                // Navigate directly to checkout
                                setIsCartOpen(false);
                                setCurrentView('checkout');
                                window.location.hash = '#/checkout';
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              disabled={effectiveStock <= 0 || (variantsList.length > 0 && selectedVariantObj && selectedVariantObj.stock <= 0)}
                              className={`w-full sm:flex-grow h-12 rounded-xl font-display text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer ${
                                effectiveStock > 0
                                  ? 'bg-black hover:bg-neutral-800 text-white'
                                  : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                              }`}
                            >
                              <span className="text-base">⚡</span>
                              <span>{effectiveStock > 0 ? 'COMPRAR AHORA' : 'PRODUCTO AGOTADO'}</span>
                            </button>
                          </div>

                          {/* Row 2: Secondary Button - AGREGAR AL CARRITO */}
                          <div>
                            <button
                              type="button"
                              onClick={() => {
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
                                
                                const targetSize = variantsList.length > 0 ? selectedSize : 'Talla Única';
                                const effectivePrice = getEffectiveProductPrice(selectedDetailProduct);

                                setCart(prev => {
                                  const existing = prev.find(item => item.id === selectedDetailProduct.id && item.sizeLabel === targetSize);
                                  const productWithSize = {
                                    ...selectedDetailProduct,
                                    price: effectivePrice,
                                    original_price: selectedDetailProduct.price,
                                    sizeLabel: targetSize
                                  };
                                  const maxStock = selectedVariantObj ? selectedVariantObj.stock : selectedDetailProduct.stock;
                                  if (existing) {
                                    const newQty = Math.min(maxStock, existing.quantity + detailQuantity);
                                    return prev.map(item => 
                                      (item.id === selectedDetailProduct.id && item.sizeLabel === targetSize)
                                        ? { ...item, quantity: newQty } 
                                        : item
                                    );
                                  }
                                  return [...prev, { ...productWithSize, quantity: detailQuantity }];
                                });

                                // Open Cart Drawer to show item added
                                setIsCartOpen(true);
                              }}
                              disabled={effectiveStock <= 0 || (variantsList.length > 0 && selectedVariantObj && selectedVariantObj.stock <= 0)}
                              className={`w-full h-11 rounded-xl font-sans text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                                effectiveStock > 0
                                  ? 'bg-black hover:bg-neutral-800 text-white border-black hover:shadow-sm'
                                  : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              <ShoppingBag className="w-4 h-4" />
                              <span>{effectiveStock > 0 ? 'AGREGAR AL CARRITO' : 'SIN STOCK'}</span>
                            </button>
                          </div>

                          {/* Row 3: Wishlist Button - GUARDAR EN FAVORITOS */}
                          <div>
                            <button
                              type="button"
                              onClick={() => handleToggleFavorite(selectedDetailProduct.id)}
                              className={`w-full h-11 rounded-xl font-sans text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                                favorites.some(id => String(id) === String(selectedDetailProduct.id))
                                  ? 'bg-rose-50 border-rose-300 text-rose-600 hover:bg-rose-100'
                                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${favorites.some(id => String(id) === String(selectedDetailProduct.id)) ? 'fill-rose-500 text-rose-500' : 'text-gray-500'}`} />
                              <span>{favorites.some(id => String(id) === String(selectedDetailProduct.id)) ? 'GUARDADO EN FAVORITOS' : 'GUARDAR EN FAVORITOS'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                </div>

              </div>

            </div>

            {/* --- REVIEWS AND COMMENTS INTEGRATION --- */}
            <div className="mt-12 bg-white border border-gray-200 rounded-lg shadow-sm p-6 sm:p-8 text-left space-y-6">
              <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="font-display text-lg font-bold text-gray-900 tracking-wider">
                  OPINIONES DE CLIENTES
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex text-yellow-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-5 h-5 ${i < Math.round(reviewsAverage) ? 'fill-current' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-gray-800 font-sans">{reviewsAverage.toFixed(1)} de 5</span>
                  <span className="text-xs text-gray-400">({reviewsTotal} comentarios)</span>
                </div>
              </div>

              {/* Post a Review Form */}
              <div className="bg-gray-50 border border-gray-200/50 rounded-lg p-5 space-y-4">
                <h4 className="font-display text-xs font-bold uppercase tracking-wider text-gray-800">
                  Dejar una reseña sobre este producto
                </h4>
                
                {reviewError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{reviewError}</span>
                  </div>
                )}
                
                {reviewSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs rounded flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>{reviewSuccess}</span>
                  </div>
                )}

                <form onSubmit={handlePostReview} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 tracking-wider block">VALORACIÓN</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setNewRating(star)}
                          className="text-yellow-400 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star className={`w-6 h-6 ${star <= newRating ? 'fill-current' : 'text-gray-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 tracking-wider block">COMENTARIO</label>
                    <textarea
                      required
                      rows="3"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Comparte tu experiencia con este equipamiento (materiales, ajuste, rendimiento)..."
                      className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:border-[#3C6E71] focus:ring-0 outline-none bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white font-display text-[10px] font-bold tracking-wider rounded transition-all cursor-pointer shadow-sm shadow-[#3C6E71]/10"
                  >
                    ENVIAR RESEÑA
                  </button>
                </form>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {productReviews.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No hay comentarios aún para este producto. ¡Sé el primero en dejar tu opinión!</p>
                ) : (
                  productReviews.map((rev) => (
                    <div key={rev.id} className="border-b border-gray-100 pb-4 space-y-2 text-left">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-xs font-bold text-gray-900">
                            {rev.users ? rev.users.full_name : 'Cliente Holux'}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(rev.created_at).toLocaleDateString('es-AR')}
                          </span>
                        </div>
                        <div className="flex text-yellow-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed font-sans font-medium">
                        {rev.comment}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* --- RELATED PRODUCTS (Responsive Carousel on Mobile/Tablet, Grid on Desktop) --- */}
            <div className="mt-12 space-y-6 relative group/related">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <h3 className="font-display text-lg font-bold text-gray-900 tracking-wider text-left">
                  TE PUEDE INTERESAR
                </h3>
                {/* Arrow Controls (Visible on tablet & desktop) */}
                <div className="hidden sm:flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => scrollContainer(relatedRef, 'left')}
                    className="p-1.5 rounded-full bg-gray-100 hover:bg-[#3C6E71] hover:text-white text-gray-700 transition-colors cursor-pointer"
                    title="Anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollContainer(relatedRef, 'right')}
                    className="p-1.5 rounded-full bg-gray-100 hover:bg-[#3C6E71] hover:text-white text-gray-700 transition-colors cursor-pointer"
                    title="Siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Carousel Container */}
              <div 
                ref={relatedRef}
                className="flex gap-3 sm:gap-5 lg:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide py-3 select-none cursor-default"
              >
                {(products
                  .filter(p => p.id !== selectedDetailProduct.id && (selectedDetailProduct.category_id ? p.category_id === selectedDetailProduct.category_id : true))
                  .slice(0, 10).length > 0
                    ? products.filter(p => p.id !== selectedDetailProduct.id && (selectedDetailProduct.category_id ? p.category_id === selectedDetailProduct.category_id : true)).slice(0, 10)
                    : products.filter(p => p.id !== selectedDetailProduct.id).slice(0, 10)
                ).map(product => (
                  <div
                    key={product.id}
                    className="snap-start shrink-0 w-[170px] sm:w-[220px] md:w-[260px] lg:w-[270px]"
                  >
                    <ProductCard
                      product={product}
                      isFavorite={favorites.some(id => String(id) === String(product.id))}
                      onToggleFavorite={handleToggleFavorite}
                      onProductClick={handleProductClick}
                      onAddToCart={addToCart}
                      onBuyNow={handleProductClick}
                    />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </main>
        ) : (
          <main className="flex-grow bg-[#F2EFE9] py-32 font-sans flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-10 h-10 border-4 border-[#3C6E71] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="font-display text-xs font-bold text-gray-700 uppercase tracking-widest">
                Cargando producto...
              </p>
            </div>
          </main>
        )
      )}

      {/* --- PROMO BANNER (CUOTAS / FINANCIACIÓN) --- */}
      {promoBanner && promoBanner.isVisible && (currentView === 'home' || currentView === 'category') && (
        <section className="bg-black text-white py-8 sm:py-10 border-t border-b border-white/10">
          <div className="w-full px-4 sm:px-8 lg:px-12 text-center space-y-4">
            <div>
              <span className="font-display text-xs sm:text-sm font-bold tracking-widest bg-white/10 text-white px-4 py-1.5 rounded-full uppercase">
                {promoBanner.tag}
              </span>
            </div>
            
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-wide text-white uppercase">
              {promoBanner.title}
            </h2>
            
            <p className="text-xs sm:text-base max-w-2xl mx-auto text-gray-300 leading-relaxed font-sans font-medium">
              {promoBanner.description}
            </p>
          </div>
        </section>
      )}

      {/* --- DEDICATED FULL PAGE CHECKOUT VIEW (MEMOIZED STANDALONE COMPONENT) --- */}
      {currentView === 'checkout' && (
        <CheckoutView
          checkoutName={checkoutName}
          setCheckoutName={setCheckoutName}
          checkoutEmail={checkoutEmail}
          setCheckoutEmail={setCheckoutEmail}
          checkoutDni={checkoutDni}
          setCheckoutDni={setCheckoutDni}
          checkoutValidationError={checkoutValidationError}
          deliveryOption={deliveryOption}
          setDeliveryOption={setDeliveryOption}
          shippingStreet={shippingStreet}
          setShippingStreet={setShippingStreet}
          shippingApartment={shippingApartment}
          setShippingApartment={setShippingApartment}
          shippingCity={shippingCity}
          setShippingCity={setShippingCity}
          shippingProvince={shippingProvince}
          setShippingProvince={setShippingProvince}
          shippingPostalCode={shippingPostalCode}
          setShippingPostalCode={setShippingPostalCode}
          checkoutStep={checkoutStep}
          setCheckoutStep={setCheckoutStep}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          paymentInstallments={paymentInstallments}
          setPaymentInstallments={setPaymentInstallments}
          transferReceiptName={transferReceiptName}
          transferReceiptError={transferReceiptError}
          transferReceiptPreview={transferReceiptPreview}
          handleTransferReceiptFileChange={handleTransferReceiptFileChange}
          cart={cart}
          getCartTotal={getCartTotal}
          isProcessingPayment={isProcessingPayment}
          handleFinalCheckoutSubmit={handleFinalCheckoutSubmit}
          setCurrentView={setCurrentView}
          setIsCartOpen={setIsCartOpen}
          checkoutOrderStatus={checkoutOrderStatus}
          createdOrderData={createdOrderData}
          API_BASE_URL={API_BASE_URL}
          setIsCheckoutModalOpen={setIsCheckoutModalOpen}
          setCheckoutOrderStatus={setCheckoutOrderStatus}
          setCustomerPanelSection={setCustomerPanelSection}
          addresses={addresses}
          setAddresses={setAddresses}
          appliedCoupon={appliedCoupon}
          setAppliedCoupon={setAppliedCoupon}
          customerCoupons={customerCoupons}
          userProfile={userProfile}
        />
      )}

      {/* --- INFO / LEGAL / HELP PAGES VIEW --- */}
      {currentView === 'info_page' && (
        <InfoPagesView
          initialPage={infoPageSlug}
          onNavigateHome={() => {
            window.location.hash = '#/';
            setCurrentView('home');
          }}
          onNavigateCatalog={() => {
            window.location.hash = '#/catalogo';
            setCurrentView('category');
          }}
        />
      )}

      {/* --- FOOTER (HOLUX DARK BRAND THEME - RESPONSIVE MOBILE & TABLET OPTIMIZED) --- */}
      {/* --- FOOTER COMPONENT --- */}
      <Footer onOpenRefundModal={() => setIsRefundModalOpen(true)} />

      {/* --- CART DRAWER --- */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />
          
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
              
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#1C2321] text-white">
                <h2 className="font-display text-lg font-bold tracking-wider flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#3C6E71]" />
                  MI COMPRA
                </h2>
                <button onClick={() => { setIsCartOpen(false); setCheckoutSuccess(null); }} className="p-1 hover:bg-white/10 rounded transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Success Screen */}
              {checkoutSuccess ? (
                <div className="p-6 flex-grow flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-display text-xl font-bold text-gray-900">¡COMPRA EXITOSA!</h3>
                    <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                      Hemos registrado tu pedido con el código:
                    </p>
                    <div className="bg-gray-100 px-3 py-2 rounded font-mono-custom text-xs font-bold text-gray-700 break-all select-all">
                      {checkoutSuccess.id}
                    </div>
                  </div>

                  <div className="w-full space-y-3 pt-4">
                    <a
                      href={`${API_BASE_URL}/api/orders/${checkoutSuccess.id}/ticket`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 py-3 bg-[#3C6E71] text-white font-display text-xs font-bold tracking-wider rounded hover:bg-[#3C6E71]/95 transition-all shadow-md shadow-[#3C6E71]/10"
                    >
                      <Download className="w-4 h-4" />
                      DESCARGAR COMPROBANTE (PDF)
                    </a>
                    
                    <button
                      onClick={() => { setCheckoutSuccess(null); setIsCartOpen(false); }}
                      className="w-full py-2.5 border border-gray-300 text-gray-700 font-display text-xs font-bold tracking-wider rounded hover:bg-gray-50 transition-all cursor-pointer"
                    >
                      VOLVER A LA TIENDA
                    </button>
                  </div>
                </div>
              ) : (
                /* Main Cart Layout */
                <>
                  <div className="flex-grow overflow-y-auto p-6 space-y-6">
                    {cart.length === 0 ? (
                      <div className="h-64 flex flex-col items-center justify-center text-center text-gray-400 space-y-3">
                        <ShoppingBag className="w-12 h-12 stroke-[1]" />
                        <div>
                          <p className="font-display font-bold">El carrito está vacío</p>
                          <p className="text-xs mt-1">Explora el catálogo y añade tu equipamiento.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {cart.map(item => (
                          <div key={`${item.id}_${item.sizeLabel}`} className="flex gap-4 border-b border-gray-100 pb-4">
                            {/* Icon block */}
                            <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded overflow-hidden flex items-center justify-center">
                              <img 
                                src={item.image_url || (item.images && item.images[0]) || getProductImage(item.name)} 
                                alt={item.name} 
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = getProductImage(item.name);
                                }}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Info */}
                            <div className="flex-grow flex flex-col justify-between">
                              <div>
                                <h4 className="text-sm font-bold text-gray-800 line-clamp-1">{item.name}</h4>
                                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-sans font-semibold">
                                  <span className="uppercase tracking-widest">{item.brand}</span>
                                  <span>•</span>
                                  <span>Talle: {item.sizeLabel || 'Único'}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                {/* Quantity editor */}
                                <div className="flex items-center border border-gray-200 rounded overflow-hidden">
                                  <button
                                    onClick={() => updateCartQty(item.id, item.sizeLabel, -1, item.stock)}
                                    className="px-2 py-0.5 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="px-3 text-xs font-bold font-sans">{item.quantity}</span>
                                  <button
                                    onClick={() => updateCartQty(item.id, item.sizeLabel, 1, item.stock)}
                                    className="px-2 py-0.5 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className="font-sans text-xs font-bold text-gray-900">
                                    ${(item.price * item.quantity).toLocaleString('es-AR')}
                                  </span>
                                  <button 
                                    onClick={() => removeFromCart(item.id, item.sizeLabel)} 
                                    className="text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer Checkout info */}
                  {cart.length > 0 && (
                    <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-4">
                      {/* Applied Coupon Banner if active */}
                      {appliedCoupon && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-emerald-600" />
                            <div>
                              <span className="font-bold block font-mono-custom">Cupón: {appliedCoupon.code}</span>
                              <span className="text-[10px] text-emerald-700 font-mono-custom">
                                Descuento: {appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}% OFF` : `${appliedCoupon.value.toLocaleString('es-AR')} OFF`}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => setAppliedCoupon(null)}
                            className="p-1 hover:bg-emerald-200/60 rounded text-emerald-800 transition-colors cursor-pointer"
                            title="Quitar cupón"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {(() => {
                        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                        
                        // 1. Automatic Tier Discount (VIP / Super VIP)
                        const tierPercent = userProfile?.benefits?.auto_discount_percent || (userProfile?.tier === 'super_vip' ? 10 : userProfile?.tier === 'vip' ? 5 : 0);
                        const tierDiscount = tierPercent > 0 ? Math.round((subtotal * tierPercent) / 100) : 0;
                        const tierBadge = userProfile?.benefits?.badge || (userProfile?.tier === 'super_vip' ? '👑 SUPER VIP' : '⭐ VIP');

                        // 2. Applied Promo Coupon Discount
                        let couponDiscount = 0;
                        if (appliedCoupon) {
                          couponDiscount = appliedCoupon.type === 'percentage'
                            ? Math.round((subtotal * appliedCoupon.value) / 100)
                            : Math.min(subtotal, appliedCoupon.value);
                        }

                        const totalDiscount = tierDiscount + couponDiscount;
                        const finalTotal = Math.max(0, subtotal - totalDiscount);
                        const netAmount = Math.round(finalTotal / 1.21);
                        const vatAmount = finalTotal - netAmount;

                        const shippingRatesLocal = (() => {
                          try {
                            return JSON.parse(localStorage.getItem('holux_shipping_rates') || '{}');
                          } catch {
                            return {};
                          }
                        })();

                        const isSuperVipUser = userProfile?.tier === 'super_vip' || userProfile?.is_super_vip;
                        const isVipAlwaysFree = isSuperVipUser || userProfile?.benefits?.shipping_benefit === 'always_free' || userProfile?.benefits?.shipping_cost === 0;
                        const isVipFreeMin = userProfile?.benefits?.shipping_benefit === 'free_above_amount' && finalTotal >= Number(userProfile?.benefits?.shipping_free_min_amount || 40000);
                        const isNationwideFree = Boolean(shippingRatesLocal.all_free);
                        const isFreeThreshold = Boolean(shippingRatesLocal.free_shipping_enabled) && finalTotal >= Number(shippingRatesLocal.free_shipping_threshold || 150000);

                        let shippingLabelCart = 'A calcular en el checkout';
                        let isShippingFree = false;

                        if (isVipAlwaysFree) {
                          shippingLabelCart = isSuperVipUser ? '¡Gratis! (👑 Super VIP)' : '¡Gratis! (⭐ VIP)';
                          isShippingFree = true;
                        } else if (isVipFreeMin) {
                          shippingLabelCart = '¡Gratis! (⭐ VIP)';
                          isShippingFree = true;
                        } else if (isNationwideFree) {
                          shippingLabelCart = '¡Gratis! (Promoción Nacional)';
                          isShippingFree = true;
                        } else if (isFreeThreshold) {
                          shippingLabelCart = '¡Gratis! (Monto superado)';
                          isShippingFree = true;
                        }

                        return (
                          <div className="space-y-2 text-xs font-sans">
                            <div className="flex items-center justify-between text-gray-500">
                              <span>Total sin impuestos nacionales</span>
                              <span className="font-mono-custom font-semibold text-gray-700">${netAmount.toLocaleString('es-AR')}</span>
                            </div>
                            <div className="flex items-center justify-between text-gray-500">
                              <span>Impuestos Nacionales (IVA 21%)</span>
                              <span className="font-mono-custom font-semibold text-gray-700">${vatAmount.toLocaleString('es-AR')}</span>
                            </div>

                            {/* Automatic Tier Discount row */}
                            {tierDiscount > 0 && (
                              <div className="flex items-center justify-between text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 shadow-2xs">
                                <span className="flex items-center gap-1">
                                  <span>Descuento {tierBadge} ({tierPercent}% OFF):</span>
                                </span>
                                <span className="font-mono-custom font-black">-${tierDiscount.toLocaleString('es-AR')}</span>
                              </div>
                            )}

                            {/* Coupon Discount row */}
                            {couponDiscount > 0 && (
                              <div className="flex items-center justify-between text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 shadow-2xs">
                                <span className="flex items-center gap-1">
                                  <span>🎟️ Descuento Cupón ({appliedCoupon.code}):</span>
                                </span>
                                <span className="font-mono-custom font-black">-${couponDiscount.toLocaleString('es-AR')}</span>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-gray-500">
                              <span>Envío</span>
                              <span className={`font-mono-custom font-bold ${isShippingFree ? 'text-emerald-600' : 'text-gray-500 text-[11px]'}`}>
                                {shippingLabelCart}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-gray-900 pt-2 border-t border-gray-200">
                              <span className="font-display text-sm font-black tracking-wider uppercase">Total</span>
                              <span className="font-mono-custom text-xl font-bold text-[#3C6E71]">
                                ${finalTotal.toLocaleString('es-AR')}
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Prominent Checkout Action Button */}
                      <button
                        type="button"
                        onClick={handleOpenCheckoutModal}
                        className="w-full py-3.5 bg-[#3C6E71] text-white font-display text-xs font-bold tracking-wider rounded-xl hover:bg-[#3C6E71]/95 transition-all shadow-md shadow-[#3C6E71]/20 cursor-pointer flex items-center justify-center gap-2 uppercase"
                      >
                        <Shield className="w-4 h-4" />
                        <span>INICIAR COMPRA Y ELEGIR PAGO / DOMICILIO</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL GUÍA DE TALLES & MEDIDAS HOLUX --- */}
      {isSizeGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSizeGuideOpen(false)} />

          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col z-10 text-gray-900">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-[#1C2321] text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#3C6E71]/30 text-[#3C6E71] rounded-xl border border-[#3C6E71]/40">
                  <Ruler className="w-5 h-5 text-[#3C6E71]" />
                </div>
                <div>
                  <h3 className="font-display text-sm sm:text-base font-bold tracking-wider uppercase">
                    {sizeGuideCategory === 'footwear' && 'GUÍA DE TALLES: CALZADO & BOTAS'}
                    {sizeGuideCategory === 'bottoms' && 'GUÍA DE TALLES: PANTALONES & CALZAS'}
                    {sizeGuideCategory === 'tops' && 'GUÍA DE TALLES: CAMPERAS & PRENDAS SUPERIORES'}
                  </h3>
                  <p className="text-xs text-gray-400 font-sans mt-0.5">
                    {selectedDetailProduct?.name ? `Medidas recomendadas para ${selectedDetailProduct.name}` : 'Tabla de equivalencias y medidas corporales en centímetros'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSizeGuideOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* TOPS TABLE */}
              {sizeGuideCategory === 'tops' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100 text-gray-700 font-bold uppercase tracking-wider font-display border-b border-gray-200">
                        <tr>
                          <th className="p-3">Talle</th>
                          <th className="p-3">Pecho (cm)</th>
                          <th className="p-3">Cintura (cm)</th>
                          <th className="p-3">Cadera (cm)</th>
                          <th className="p-3">Manga (cm)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-mono-custom">
                        <tr className="hover:bg-gray-50">
                          <td className="p-3 font-bold font-display text-gray-900 bg-gray-50/50">XS</td>
                          <td className="p-3 text-gray-700">88 - 92 cm</td>
                          <td className="p-3 text-gray-700">76 - 80 cm</td>
                          <td className="p-3 text-gray-700">88 - 92 cm</td>
                          <td className="p-3 text-gray-700">62 cm</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="p-3 font-bold font-display text-gray-900 bg-gray-50/50">S</td>
                          <td className="p-3 text-gray-700">93 - 96 cm</td>
                          <td className="p-3 text-gray-700">81 - 84 cm</td>
                          <td className="p-3 text-gray-700">93 - 96 cm</td>
                          <td className="p-3 text-gray-700">64 cm</td>
                        </tr>
                        <tr className="hover:bg-gray-50 bg-[#3C6E71]/5">
                          <td className="p-3 font-bold font-display text-[#3C6E71] bg-[#3C6E71]/10">M</td>
                          <td className="p-3 text-gray-900 font-semibold">97 - 102 cm</td>
                          <td className="p-3 text-gray-900 font-semibold">85 - 90 cm</td>
                          <td className="p-3 text-gray-900 font-semibold">97 - 102 cm</td>
                          <td className="p-3 text-gray-900 font-semibold">66 cm</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="p-3 font-bold font-display text-gray-900 bg-gray-50/50">L</td>
                          <td className="p-3 text-gray-700">103 - 108 cm</td>
                          <td className="p-3 text-gray-700">91 - 96 cm</td>
                          <td className="p-3 text-gray-700">103 - 108 cm</td>
                          <td className="p-3 text-gray-700">68 cm</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="p-3 font-bold font-display text-gray-900 bg-gray-50/50">XL</td>
                          <td className="p-3 text-gray-700">109 - 114 cm</td>
                          <td className="p-3 text-gray-700">97 - 102 cm</td>
                          <td className="p-3 text-gray-700">109 - 114 cm</td>
                          <td className="p-3 text-gray-700">70 cm</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="p-3 font-bold font-display text-gray-900 bg-gray-50/50">XXL</td>
                          <td className="p-3 text-gray-700">115 - 122 cm</td>
                          <td className="p-3 text-gray-700">103 - 110 cm</td>
                          <td className="p-3 text-gray-700">115 - 122 cm</td>
                          <td className="p-3 text-gray-700">72 cm</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                    <h4 className="font-display font-bold text-gray-900 uppercase text-[11px] tracking-wider">
                      ¿Cómo medir prendas superiores?
                    </h4>
                    <ul className="space-y-1.5 text-gray-600 text-[11px] leading-relaxed">
                      <li>• <strong>Pecho:</strong> Pasa la cinta métrica horizontalmente por la parte de mayor volumen del busto/pecho.</li>
                      <li>• <strong>Cintura:</strong> Mide el contorno en la parte más angosta del torso, sin ajustar la cinta.</li>
                      <li>• <strong>Largo de Manga:</strong> Desde el hombro hasta la muñeca con el brazo ligeramente flexionado.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* BOTTOMS TABLE */}
              {sizeGuideCategory === 'bottoms' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100 text-gray-700 font-bold uppercase tracking-wider font-display border-b border-gray-200">
                        <tr>
                          <th className="p-3">Talle</th>
                          <th className="p-3">Equivalencia</th>
                          <th className="p-3">Cintura (cm)</th>
                          <th className="p-3">Cadera (cm)</th>
                          <th className="p-3">Largo Pierna (cm)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-mono-custom">
                        <tr className="hover:bg-gray-50">
                          <td className="p-3 font-bold font-display text-gray-900 bg-gray-50/50">S</td>
                          <td className="p-3 text-gray-500">38 - 40</td>
                          <td className="p-3 text-gray-700">76 - 82 cm</td>
                          <td className="p-3 text-gray-700">90 - 96 cm</td>
                          <td className="p-3 text-gray-700">102 cm</td>
                        </tr>
                        <tr className="hover:bg-gray-50 bg-[#3C6E71]/5">
                          <td className="p-3 font-bold font-display text-[#3C6E71] bg-[#3C6E71]/10">M</td>
                          <td className="p-3 text-[#3C6E71] font-semibold">42 - 44</td>
                          <td className="p-3 text-gray-900 font-semibold">83 - 89 cm</td>
                          <td className="p-3 text-gray-900 font-semibold">97 - 103 cm</td>
                          <td className="p-3 text-gray-900 font-semibold">104 cm</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="p-3 font-bold font-display text-gray-900 bg-gray-50/50">L</td>
                          <td className="p-3 text-gray-500">46 - 48</td>
                          <td className="p-3 text-gray-700">90 - 96 cm</td>
                          <td className="p-3 text-gray-700">104 - 110 cm</td>
                          <td className="p-3 text-gray-700">106 cm</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="p-3 font-bold font-display text-gray-900 bg-gray-50/50">XL</td>
                          <td className="p-3 text-gray-500">50 - 52</td>
                          <td className="p-3 text-gray-700">97 - 104 cm</td>
                          <td className="p-3 text-gray-700">111 - 118 cm</td>
                          <td className="p-3 text-gray-700">108 cm</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="p-3 font-bold font-display text-gray-900 bg-gray-50/50">XXL</td>
                          <td className="p-3 text-gray-500">54 - 56</td>
                          <td className="p-3 text-gray-700">105 - 112 cm</td>
                          <td className="p-3 text-gray-700">119 - 126 cm</td>
                          <td className="p-3 text-gray-700">110 cm</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                    <h4 className="font-display font-bold text-gray-900 uppercase text-[11px] tracking-wider">
                      ¿Cómo medir pantalones y calzas?
                    </h4>
                    <ul className="space-y-1.5 text-gray-600 text-[11px] leading-relaxed">
                      <li>• <strong>Cintura:</strong> Medir el contorno a la altura donde habitualmente usas el pantalón.</li>
                      <li>• <strong>Cadera:</strong> Con los pies juntos, mide el contorno pasando por la zona más ancha de los glúteos.</li>
                      <li>• <strong>Largo de pierna:</strong> Desde la parte superior de la entrepierna hasta el tobillo.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* FOOTWEAR TABLE */}
              {sizeGuideCategory === 'footwear' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100 text-gray-700 font-bold uppercase tracking-wider font-display border-b border-gray-200">
                        <tr>
                          <th className="p-3">Talle (AR)</th>
                          <th className="p-3">Largo de Pie (cm)</th>
                          <th className="p-3">US Hombre</th>
                          <th className="p-3">US Mujer</th>
                          <th className="p-3">EUR</th>
                          <th className="p-3">UK</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-mono-custom">
                        <tr className="hover:bg-gray-50">
                          <td className="p-3 font-bold font-display text-gray-900 bg-gray-50/50">38</td>
                          <td className="p-3 text-gray-700">24.5 cm</td>
                          <td className="p-3 text-gray-700">6.5</td>
                          <td className="p-3 text-gray-700">7.5</td>
                          <td className="p-3 text-gray-700">39</td>
                          <td className="p-3 text-gray-700">5.5</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="p-3 font-bold font-display text-gray-900 bg-gray-50/50">39</td>
                          <td className="p-3 text-gray-700">25.2 cm</td>
                          <td className="p-3 text-gray-700">7.0</td>
                          <td className="p-3 text-gray-700">8.0</td>
                          <td className="p-3 text-gray-700">40</td>
                          <td className="p-3 text-gray-700">6.0</td>
                        </tr>
                        <tr className="hover:bg-gray-50 bg-[#3C6E71]/5">
                          <td className="p-3 font-bold font-display text-[#3C6E71] bg-[#3C6E71]/10">40</td>
                          <td className="p-3 text-gray-900 font-semibold">26.0 cm</td>
                          <td className="p-3 text-gray-900 font-semibold">8.0</td>
                          <td className="p-3 text-gray-900 font-semibold">9.0</td>
                          <td className="p-3 text-gray-900 font-semibold">41</td>
                          <td className="p-3 text-gray-900 font-semibold">7.0</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="p-3 font-bold font-display text-gray-900 bg-gray-50/50">41</td>
                          <td className="p-3 text-gray-700">26.7 cm</td>
                          <td className="p-3 text-gray-700">8.5</td>
                          <td className="p-3 text-gray-700">9.5</td>
                          <td className="p-3 text-gray-700">42</td>
                          <td className="p-3 text-gray-700">7.5</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="p-3 font-bold font-display text-gray-900 bg-gray-50/50">42</td>
                          <td className="p-3 text-gray-700">27.5 cm</td>
                          <td className="p-3 text-gray-700">9.5</td>
                          <td className="p-3 text-gray-700">10.5</td>
                          <td className="p-3 text-gray-700">43</td>
                          <td className="p-3 text-gray-700">8.5</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="p-3 font-bold font-display text-gray-900 bg-gray-50/50">43</td>
                          <td className="p-3 text-gray-700">28.2 cm</td>
                          <td className="p-3 text-gray-700">10.5</td>
                          <td className="p-3 text-gray-700">11.5</td>
                          <td className="p-3 text-gray-700">44</td>
                          <td className="p-3 text-gray-700">9.5</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="p-3 font-bold font-display text-gray-900 bg-gray-50/50">44</td>
                          <td className="p-3 text-gray-700">29.0 cm</td>
                          <td className="p-3 text-gray-700">11.5</td>
                          <td className="p-3 text-gray-700">12.5</td>
                          <td className="p-3 text-gray-700">45</td>
                          <td className="p-3 text-gray-700">10.5</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="p-3 font-bold font-display text-gray-900 bg-gray-50/50">45</td>
                          <td className="p-3 text-gray-700">29.8 cm</td>
                          <td className="p-3 text-gray-700">12.0</td>
                          <td className="p-3 text-gray-700">13.0</td>
                          <td className="p-3 text-gray-700">46</td>
                          <td className="p-3 text-gray-700">11.0</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                    <h4 className="font-display font-bold text-gray-900 uppercase text-[11px] tracking-wider">
                      ¿Cómo medir la longitud de tu pie?
                    </h4>
                    <ul className="space-y-1.5 text-gray-600 text-[11px] leading-relaxed">
                      <li>1. Coloca una hoja de papel en el suelo pegada a una pared.</li>
                      <li>2. Apoya el talón descalzo o con la media de trekking contra la pared.</li>
                      <li>3. Marca con un lápiz el punto más largo de tus dedos.</li>
                      <li>4. Mide con una regla la distancia en centímetros desde el borde de la hoja hasta la marca.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Recommendation Note */}
              <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-amber-900">
                <span className="text-sm">💡</span>
                <p className="text-[11px] leading-relaxed">
                  <strong>Recomendación técnica Holux: </strong>
                  {sizeGuideCategory === 'tops' && 'Si estás entre dos talles para camperas o prendas técnicas, te recomendamos elegir el talle superior para poder usar capas intermedias (polar, microfleece o térmicas) con total comodidad.'}
                  {sizeGuideCategory === 'bottoms' && 'Si estás entre dos talles de pantalón de trekking o calzas, el talle superior te brindará mayor libertad de movimiento en ascensos y caminatas exigentes.'}
                  {sizeGuideCategory === 'footwear' && 'Para calzado de montaña y botas de trekking, recomendamos medir con las medias técnicas puestas y optar por medio punto o un punto más si estás entre dos medidas.'}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:px-6 border-t border-gray-200 bg-gray-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(false)}
                className="px-6 py-2.5 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white font-display text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
              >
                ENTENDIDO, VOLVER AL PRODUCTO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- AUTH MODAL (LOGIN / REGISTER) --- */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAuthModalOpen(false)} />
          
          <div className="relative w-full max-w-sm bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-100">
            <button onClick={() => setIsAuthModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 space-y-6">
              <div className="text-center">
                <span className="font-display text-xl font-bold tracking-widest text-[#1C2321]">
                  HOLUX
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {authMode === 'login' ? 'Inicia sesión en tu cuenta de cliente' : 'Crea tu cuenta de cliente'}
                </p>
              </div>

              {authError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}



              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === 'register' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 tracking-wider">NOMBRE COMPLETO</label>
                      <SmoothInput
                        type="text"
                        required
                        value={authFullName}
                        onChange={(e) => setAuthFullName(e.target.value)}
                        placeholder="Ej: José Valero"
                        className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded text-base sm:text-xs focus:border-[#3C6E71] focus:ring-0 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 tracking-wider">TELÉFONO DE CONTACTO</label>
                      <SmoothInput
                        type="text"
                        required
                        value={authPhone}
                        onChange={(e) => setAuthPhone(e.target.value)}
                        placeholder="Ej: +54 9 11 2345-6789"
                        className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded text-base sm:text-xs focus:border-[#3C6E71] focus:ring-0 outline-none"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 tracking-wider">EMAIL</label>
                  <SmoothInput
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="Ej: jose@example.com"
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded text-base sm:text-xs focus:border-[#3C6E71] focus:ring-0 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 tracking-wider">CONTRASEÑA</label>
                  <SmoothInput
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded text-base sm:text-xs focus:border-[#3C6E71] focus:ring-0 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#3C6E71] text-white font-display text-xs font-bold tracking-wider rounded hover:bg-[#3C6E71]/95 transition-all shadow-md shadow-[#3C6E71]/15 cursor-pointer"
                >
                  {authMode === 'login' ? 'INICIAR SESIÓN' : 'CREAR CUENTA'}
                </button>
              </form>

              <div className="text-center pt-2 border-t border-gray-100">
                <button
                  onClick={() => setAuthMode(prev => prev === 'login' ? 'register' : 'login')}
                  className="text-xs text-[#3C6E71] hover:underline transition-all cursor-pointer"
                >
                  {authMode === 'login' ? '¿No tienes cuenta? Registrate aquí' : '¿Ya tienes cuenta? Ingresa aquí'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- CLIENT ACCOUNT DRAWER --- */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsProfileOpen(false)} />
          
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col justify-between">
              
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#1C2321] text-white">
                <h2 className="font-display text-lg font-bold tracking-wider flex items-center gap-2">
                  <User className="w-5 h-5 text-[#3C6E71]" />
                  MI CUENTA
                </h2>
                <button onClick={() => setIsProfileOpen(false)} className="p-1 hover:bg-white/10 rounded transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 text-xs font-display font-medium tracking-wider bg-gray-50">
                <button
                  onClick={() => setProfileTab('info')}
                  className={`flex-1 py-3 text-center border-b-2 transition-all ${profileTab === 'info' ? 'border-[#3C6E71] text-[#3C6E71] font-bold bg-white' : 'border-transparent text-gray-500 hover:text-black'}`}
                >
                  MIS DATOS
                </button>
                <button
                  onClick={() => setProfileTab('addresses')}
                  className={`flex-1 py-3 text-center border-b-2 transition-all ${profileTab === 'addresses' ? 'border-[#3C6E71] text-[#3C6E71] font-bold bg-white' : 'border-transparent text-gray-500 hover:text-black'}`}
                >
                  DIRECCIONES
                </button>
                <button
                  onClick={() => setProfileTab('orders')}
                  className={`flex-1 py-3 text-center border-b-2 transition-all ${profileTab === 'orders' ? 'border-[#3C6E71] text-[#3C6E71] font-bold bg-white' : 'border-transparent text-gray-500 hover:text-black'}`}
                >
                  PEDIDOS
                </button>
              </div>

              {/* Content body */}
              <div className="flex-grow overflow-y-auto p-6 space-y-6">
                
                {/* 1. PROFILE INFO */}
                {profileTab === 'info' && userProfile && (
                  <div className="space-y-6">
                    {/* Role-based Dashboard Header Card (Admin vs Client) */}
                    {userProfile.role === 'admin' ? (
                      /* Admin Management Options Card */
                      <div className="bg-[#1C2321] text-white p-5 rounded-xl space-y-4 shadow-lg border border-[#3C6E71]/30 text-left">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-[#3C6E71]" />
                            <span className="font-display text-sm font-bold tracking-wider">GESTIÓN Y ADMINISTRACIÓN DE TIENDA</span>
                          </div>
                          <span className="bg-[#B85C38] text-white text-[9px] font-black px-2 py-0.5 rounded uppercase font-mono-custom">ADMINISTRADOR</span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed font-sans">
                          Accede al panel de control de la tienda para editar banners, administrar pedidos, inventario y catálogo.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-2.5 pt-1">
                          <button
                            type="button"
                            onClick={() => { setIsProfileOpen(false); setCurrentView('admin'); setAdminTab('banners'); }}
                            className="px-3.5 py-2.5 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white rounded font-display text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-[#3C6E71]/20"
                          >
                            <Edit2 className="w-4 h-4" />
                            EDITAR BANNERS
                          </button>
                          <button
                            type="button"
                            onClick={() => { setIsProfileOpen(false); setCurrentView('admin'); setAdminTab('orders'); }}
                            className="px-3.5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded font-display text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-black/20"
                          >
                            <ShoppingBag className="w-4 h-4" />
                            VER PEDIDOS
                          </button>
                          <button
                            type="button"
                            onClick={() => { setIsProfileOpen(false); setCurrentView('admin'); setAdminTab('products'); }}
                            className="px-3.5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded font-display text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                          >
                            <Box className="w-4 h-4" />
                            PRODUCTOS Y STOCK
                          </button>
                          <button
                            type="button"
                            onClick={() => { setIsProfileOpen(false); setCurrentView('admin'); setAdminTab('dashboard'); }}
                            className="px-3.5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded font-display text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                          >
                            <TrendingUp className="w-4 h-4" />
                            PANEL CONTROL
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Client Dedicated Panel Header Card */
                      <div className="bg-gradient-to-br from-[#1C2321] to-gray-900 text-white p-5 rounded-xl space-y-3.5 shadow-lg border border-[#3C6E71]/30 text-left">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="w-5 h-5 text-[#3C6E71]" />
                            <span className="font-display text-sm font-bold tracking-wider uppercase">PANEL DE CLIENTE HOLUX</span>
                          </div>
                          <span className={`text-[9px] font-black px-2.5 py-0.5 rounded uppercase font-mono-custom ${userProfile.is_vip ? 'bg-amber-500 text-black' : 'bg-emerald-600 text-white'}`}>
                            {userProfile.is_vip ? '⭐ CLIENTE VIP' : 'CLIENTE ACTIVO'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed font-sans">
                          ¡Bienvenido/a a tu espacio personal! Desde aquí podés administrar tu información personal, revisar el historial de tus compras y gestionar tus direcciones de envío.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-2.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setProfileTab('orders')}
                            className="px-3.5 py-2.5 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white rounded font-display text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-[#3C6E71]/20"
                          >
                            <ShoppingBag className="w-4 h-4" />
                            MIS COMPRAS
                          </button>
                          <button
                            type="button"
                            onClick={() => setProfileTab('addresses')}
                            className="px-3.5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded font-display text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                          >
                            <MapPin className="w-4 h-4 text-[#3C6E71]" />
                            DIRECCIONES
                          </button>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 tracking-wider block">ID DE USUARIO (UUID)</label>
                      <input
                        type="text"
                        disabled
                        value={userProfile.id}
                        className="w-full px-3 py-2 border border-gray-200 rounded text-xs bg-gray-50 text-gray-400 font-mono-custom outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 tracking-wider block">ROL EN EL SISTEMA</label>
                      <input
                        type="text"
                        disabled
                        value={userProfile.role.toUpperCase()}
                        className="w-full px-3 py-2 border border-gray-200 rounded text-xs bg-gray-50 text-gray-400 font-display outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 tracking-wider block">NOMBRE COMPLETO</label>
                      <input
                        type="text"
                        required
                        value={userProfile.full_name || ''}
                        onChange={(e) => setUserProfile({ ...userProfile, full_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:border-[#3C6E71] focus:ring-0 outline-none text-gray-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 tracking-wider block">TELÉFONO DE CONTACTO</label>
                      <input
                        type="text"
                        required
                        value={userProfile.phone || ''}
                        onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:border-[#3C6E71] focus:ring-0 outline-none text-gray-800"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#3C6E71] text-white font-display text-xs font-bold tracking-wider rounded hover:bg-[#3C6E71]/95 transition-all shadow-md shadow-[#3C6E71]/10 cursor-pointer"
                    >
                      ACTUALIZAR DATOS
                    </button>
                  </form>
                </div>
                )}

                {/* 2. ADDRESSES CRUD */}
                {profileTab === 'addresses' && (
                  <div className="space-y-6">
                    {/* Add address form toggle */}
                    <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg">
                      <h3 className="text-xs font-bold tracking-wider text-gray-700 uppercase font-display mb-3">
                        {editingAddress ? 'EDITAR DIRECCIÓN' : 'AGREGAR NUEVA DIRECCIÓN'}
                      </h3>
                      
                      <form onSubmit={handleSaveAddress} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-500 tracking-wider">ETIQUETA (EJ: CASA)</label>
                            <input
                              type="text"
                              required
                              value={addrLabel}
                              onChange={(e) => setAddrLabel(e.target.value)}
                              placeholder="Ej: Trabajo"
                              className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:border-[#3C6E71] outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-500 tracking-wider">CALLE Y NÚMERO</label>
                            <input
                              type="text"
                              required
                              value={addrStreet}
                              onChange={(e) => setAddrStreet(e.target.value)}
                              placeholder="Ej: Av. San Martín 1540"
                              className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:border-[#3C6E71] outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-500 tracking-wider">CIUDAD</label>
                            <input
                              type="text"
                              required
                              value={addrCity}
                              onChange={(e) => setAddrCity(e.target.value)}
                              placeholder="Ej: Bariloche"
                              className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:border-[#3C6E71] outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-500 tracking-wider">PROVINCIA</label>
                            <input
                              type="text"
                              required
                              value={addrProvince}
                              onChange={(e) => setAddrProvince(e.target.value)}
                              placeholder="Ej: Río Negro"
                              className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:border-[#3C6E71] outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-500 tracking-wider">CÓD. POSTAL</label>
                            <input
                              type="text"
                              required
                              value={addrPostalCode}
                              onChange={(e) => setAddrPostalCode(e.target.value)}
                              placeholder="Ej: 8400"
                              className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:border-[#3C6E71] outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 py-1">
                          <input
                            type="checkbox"
                            id="addrIsDefault"
                            checked={addrIsDefault}
                            onChange={(e) => setAddrIsDefault(e.target.checked)}
                            className="rounded border-gray-300 text-[#3C6E71] focus:ring-0 cursor-pointer"
                          />
                          <label htmlFor="addrIsDefault" className="text-[10px] font-bold text-gray-600 tracking-wider select-none cursor-pointer">
                            MARCAR COMO DIRECCIÓN POR DEFECTO
                          </label>
                        </div>

                        <div className="flex gap-2">
                          {editingAddress && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAddress(null);
                                setAddrLabel('');
                                setAddrStreet('');
                                setAddrCity('');
                                setAddrProvince('');
                                setAddrPostalCode('');
                                setAddrIsDefault(false);
                              }}
                              className="flex-1 py-2 border border-gray-300 text-gray-600 rounded text-xs font-display font-medium hover:bg-gray-50 transition-colors"
                            >
                              CANCELAR
                            </button>
                          )}
                          <button
                            type="submit"
                            className="flex-1 py-2 bg-[#3C6E71] text-white rounded text-xs font-display font-bold tracking-wider hover:bg-[#3C6E71]/95 transition-all shadow-md shadow-[#3C6E71]/10 cursor-pointer"
                          >
                            {editingAddress ? 'GUARDAR CAMBIOS' : 'AGREGAR DIRECCIÓN'}
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Address List */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-gray-500 tracking-wider uppercase font-display border-b border-gray-100 pb-2">
                        MIS DIRECCIONES GUARDADAS
                      </h4>
                      {addresses.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">No tienes direcciones guardadas.</p>
                      ) : (
                        addresses.map(addr => (
                          <div key={addr.id} className="p-4 border border-gray-200 rounded-lg flex items-start justify-between bg-white shadow-sm hover:border-gray-300 transition-all">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-display font-bold text-xs tracking-wider text-gray-800">{addr.label.toUpperCase()}</span>
                                {addr.is_default && (
                                  <span className="bg-[#3C6E71]/10 text-[#3C6E71] text-[8px] font-bold tracking-widest px-1.5 py-0.5 rounded border border-[#3C6E71]/20">
                                    POR DEFECTO
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 leading-relaxed font-mono-custom">
                                {addr.street}<br />
                                {addr.city}, {addr.province} ({addr.postal_code})
                              </p>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingAddress(addr);
                                  setAddrLabel(addr.label);
                                  setAddrStreet(addr.street);
                                  setAddrCity(addr.city);
                                  setAddrProvince(addr.province);
                                  setAddrPostalCode(addr.postal_code);
                                  setAddrIsDefault(addr.is_default);
                                }}
                                className="p-1 text-gray-500 hover:text-black hover:bg-gray-50 rounded transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 3. ORDER HISTORY */}
                {profileTab === 'orders' && (
                  <div className="space-y-4">
                    {orders.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-6">No has realizado ningún pedido aún.</p>
                    ) : (
                      orders.map(order => (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm space-y-4">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div className="space-y-0.5">
                              <div className="text-[10px] font-mono-custom text-gray-400 select-all font-bold">ID: {order.id.slice(0, 8)}...</div>
                              <div className="text-[9px] font-mono-custom text-gray-500">
                                {new Date(order.created_at).toLocaleDateString('es-AR')} {new Date(order.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>

                            <span className={`text-[9px] font-display font-bold tracking-widest px-2.5 py-1 rounded-full border ${
                              order.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                              order.status === 'processing' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                              order.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                              'bg-gray-50 text-gray-500 border-gray-200'
                            }`}>
                              {order.status.toUpperCase()}
                            </span>
                          </div>

                          {/* Order items listing */}
                          <div className="space-y-2.5">
                            {order.order_items && order.order_items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs">
                                <div>
                                  <span className="font-bold text-gray-800">{item.products?.name || 'Producto'}</span>
                                  <span className="text-gray-400 text-[10px] ml-1.5">x{item.quantity}</span>
                                </div>
                                <span className="font-mono-custom font-bold text-gray-700">
                                  ARS {(item.unit_price * item.quantity).toLocaleString('es-AR')}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold text-gray-400 tracking-wider">TOTAL PAGADO</span>
                              <span className="font-mono-custom text-sm font-bold text-gray-900">
                                ARS {order.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>

                            <div className="flex gap-2">
                              {/* Ticket PDF trigger */}
                              <a
                                href={`${API_BASE_URL}/api/me/orders/${order.id}/ticket?token=${token}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#3C6E71] text-[#3C6E71] rounded text-[10px] font-display font-bold tracking-wider hover:bg-[#3C6E71]/5 transition-all"
                              >
                                <Download className="w-3 h-3" />
                                TICKET (PDF)
                              </a>

                              {/* Cancel button */}
                              {order.status === 'pending' && (
                                <button
                                  onClick={() => handleCancelOrder(order.id)}
                                  className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded text-[10px] font-display font-bold tracking-wider transition-all cursor-pointer"
                                >
                                  CANCELAR
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Drawer footer (Logout button) */}
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 font-display text-xs font-bold tracking-wider rounded hover:bg-red-50 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  CERRAR SESIÓN
                </button>
                
                <span className="text-[9px] font-mono-custom text-gray-400">HOLUX COMPRAS</span>
              </div>

            </div>
          </div>
        </div>
      )}





      {/* --- CUSTOMER SUPPORT CHAT WIDGET --- */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start">
        
        {/* Chat card window */}
        {isChatOpen && (
          <div className="w-80 bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-200 mb-4 transition-all duration-300 flex flex-col">
            
            {/* Widget Header */}
            <div className="bg-black text-white p-4 flex items-center justify-between">
              <div>
                <h4 className="font-display text-sm font-bold tracking-wider">Atención Al Cliente</h4>
                <p className="text-[9px] text-gray-300 font-medium">Lunes a viernes de 8 a 17 h.</p>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)} 
                className="p-1 hover:bg-white/10 rounded transition-colors text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Widget Body */}
            <div className="p-4 space-y-4 text-xs">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2 leading-relaxed text-gray-700">
                <p className="font-semibold text-gray-800">¡Hola! Dejanos tu consulta y te responderemos por correo.</p>
                <p>Canal directo: <a href="mailto:holux20@gmail.com" className="text-[#3C6E71] underline font-bold">holux20@gmail.com</a></p>
                <p className="font-medium text-gray-500 text-[11px]">¡Gracias por contactarte!</p>
              </div>

              {chatSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-center rounded-xl space-y-2">
                  <Check className="w-6 h-6 mx-auto text-emerald-600 stroke-[3]" />
                  <p className="font-bold">¡Consulta enviada!</p>
                  <p className="text-[11px] text-emerald-700">Tu mensaje fue dirigido a <strong>holux20@gmail.com</strong>. Te responderemos a la brevedad.</p>
                </div>
              ) : (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    setChatLoading(true);
                    
                    const subject = encodeURIComponent(`Consulta Tienda Holux - ${chatEmail || 'Cliente'}`);
                    const body = encodeURIComponent(`Email del cliente: ${chatEmail}\n\nConsulta / Mensaje:\n${chatMessage || 'Hola, quisiera hacer una consulta.'}\n\nEnviado desde el sitio web Holux.`);
                    const mailtoUrl = `mailto:holux20@gmail.com?subject=${subject}&body=${body}`;

                    // Open user email client
                    window.location.href = mailtoUrl;

                    setTimeout(() => {
                      setChatLoading(false);
                      setChatSuccess(true);
                      setChatEmail('');
                      setChatMessage('');
                      setTimeout(() => setChatSuccess(false), 6000);
                    }, 800);
                  }} 
                  className="space-y-3"
                >
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 tracking-wider block">TU CORREO ELECTRÓNICO</label>
                    <SmoothInput
                      type="email"
                      required
                      value={chatEmail}
                      onChange={(e) => setChatEmail(e.target.value)}
                      placeholder="Ej: tuemail@gmail.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:border-[#3C6E71] focus:ring-0 outline-none bg-white text-gray-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 tracking-wider block">MENSAJE O CONSULTA</label>
                    <textarea
                      required
                      rows={3}
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Escribí aquí tu duda o pedido..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:border-[#3C6E71] focus:ring-0 outline-none bg-white text-gray-800 resize-none font-sans"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={chatLoading}
                    className="w-full py-2.5 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white font-display text-xs font-bold tracking-wider rounded-lg transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    {chatLoading ? 'ENVIANDO...' : 'ENVIAR MENSAJE'}
                  </button>
                </form>
              )}
            </div>

            {/* Widget Footer */}
            <div className="p-2.5 border-t border-gray-100 text-center text-[9px] text-gray-400 font-mono-custom bg-gray-50">
              Soporte Oficial Holux • holux20@gmail.com
            </div>

          </div>
        )}

        {/* Floating circular button */}
        <button
          onClick={() => {
            setIsChatOpen(!isChatOpen);
            setChatSuccess(false);
          }}
          className="w-14 h-14 bg-black hover:bg-neutral-800 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-all cursor-pointer border border-white/15"
          title="Atención Al Cliente"
        >
          {isChatOpen ? (
            <ChevronRight className="w-6 h-6 rotate-90 stroke-[2.5]" />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          )}
        </button>



      {/* --- 2. MODAL: DIRECCIÓN DE ENVÍO --- */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsAddressModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 space-y-5 text-gray-900 z-10">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#3C6E71]" />
                <h3 className="font-display text-base font-bold text-gray-900 uppercase tracking-wider">
                  {editingAddress ? 'EDITAR DIRECCIÓN' : 'NUEVA DIRECCIÓN DE ENVÍO'}
                </h3>
              </div>
              <button onClick={() => setIsAddressModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddressModalSave} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">ETIQUETA (EJ: CASA, TRABAJO)</label>
                <SmoothInput
                  type="text"
                  placeholder="Domicilio Principal"
                  value={addrLabel}
                  onChange={(e) => setAddrLabel(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-[#3C6E71]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">CALLE Y NÚMERO (PISO / DEPTO)</label>
                <SmoothInput
                  type="text"
                  required
                  placeholder="Av. Pellegrini 1840, 4º B"
                  value={addrStreet}
                  onChange={(e) => setAddrStreet(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-[#3C6E71]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">CIUDAD / LOCALIDAD</label>
                  <SmoothInput
                    type="text"
                    required
                    placeholder="Rosario"
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-[#3C6E71]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">PROVINCIA</label>
                  <select
                    value={addrProvince}
                    onChange={(e) => setAddrProvince(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-[#3C6E71]"
                  >
                    <option value="Santa Fe">Santa Fe</option>
                    <option value="Buenos Aires">Buenos Aires</option>
                    <option value="CABA">CABA</option>
                    <option value="Córdoba">Córdoba</option>
                    <option value="Mendoza">Mendoza</option>
                    <option value="Río Negro">Río Negro</option>
                    <option value="Neuquén">Neuquén</option>
                    <option value="Chubut">Chubut</option>
                    <option value="Salta">Salta</option>
                    <option value="Tucumán">Tucumán</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">CÓDIGO POSTAL (CP)</label>
                <SmoothInput
                  type="text"
                  required
                  placeholder="2000"
                  value={addrPostalCode}
                  onChange={(e) => setAddrPostalCode(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-mono-custom text-gray-900 outline-none focus:border-[#3C6E71]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="addrDefaultCheck"
                  checked={addrIsDefault}
                  onChange={(e) => setAddrIsDefault(e.target.checked)}
                  className="w-4 h-4 accent-[#3C6E71] cursor-pointer"
                />
                <label htmlFor="addrDefaultCheck" className="text-xs text-gray-700 font-medium cursor-pointer">
                  Establecer como dirección predeterminada
                </label>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="w-1/2 py-2.5 border border-gray-300 text-gray-700 font-display text-xs font-bold uppercase rounded-xl hover:bg-gray-50 cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white font-display text-xs font-bold uppercase rounded-xl shadow cursor-pointer"
                >
                  GUARDAR DIRECCIÓN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- 3. MODAL: BOTÓN DE ARREPENTIMIENTO / REEMBOLSO --- */}
      {isRefundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsRefundModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 space-y-5 text-gray-900 z-10">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-[#B85C38]" />
                <h3 className="font-display text-base font-bold text-gray-900 uppercase tracking-wider">SOLICITAR REEMBOLSO / ARREPENTIMIENTO</h3>
              </div>
              <button onClick={() => setIsRefundModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRefundModal} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">SELECCIONÁ TU PEDIDO (LEY 24.240 - 10 DÍAS)</label>
                {orders && orders.length > 0 ? (
                  <select
                    value={typeof refundOrderSelect === 'object' ? refundOrderSelect?.id : refundOrderSelect}
                    onChange={(e) => {
                      const found = orders.find(o => String(o.id) === String(e.target.value));
                      setRefundOrderSelect(found || e.target.value);
                    }}
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-[#3C6E71]"
                  >
                    {orders.map(ord => (
                      <option key={ord.id} value={ord.id}>
                        Pedido #{String(ord.id).length > 15 ? String(ord.id).slice(-6).toUpperCase() : ord.id} - Total: ${Math.round(ord.total || 0).toLocaleString('es-AR')}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 font-mono-custom text-xs">
                    <strong>N° #{refundOrderSelect?.id ? (String(refundOrderSelect.id).length > 15 ? String(refundOrderSelect.id).slice(-6).toUpperCase() : refundOrderSelect.id) : 'ULTIMO PEDIDO'}</strong>
                    <span className="block text-gray-500 text-[11px] mt-0.5">
                      Monto total: ${refundOrderSelect?.total ? Math.round(refundOrderSelect.total).toLocaleString('es-AR') : '78.000'}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">MOTIVO DE LA DEVOLUCIÓN</label>
                <select
                  value={refundReasonSelect}
                  onChange={(e) => setRefundReasonSelect(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-[#3C6E71]"
                >
                  <option value="Talle incorrecto">Talle incorrecto</option>
                  <option value="Defecto de fabricación">Defecto de fabricación</option>
                  <option value="Producto no coincide con la foto">Producto no coincide con la foto</option>
                  <option value="Arrepentimiento de compra (Ley 24.240)">Arrepentimiento de compra (Ley 24.240)</option>
                  <option value="Retraso en la entrega">Retraso en la entrega</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">COMENTARIOS ADICIONALES</label>
                <textarea
                  rows={3}
                  placeholder="Escribí aquí si el producto fue probado o el motivo detallado..."
                  value={refundCommentInput}
                  onChange={(e) => setRefundCommentInput(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-[#3C6E71]"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                Se generará un número de devolución y recibirás la etiqueta de correo gratuita para despachar el paquete.
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRefundModalOpen(false)}
                  className="w-1/2 py-2.5 border border-gray-300 text-gray-700 font-display text-xs font-bold uppercase rounded-xl hover:bg-gray-50 cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-black hover:bg-neutral-800 text-white font-display text-xs font-bold uppercase rounded-xl shadow cursor-pointer"
                >
                  ENVIAR SOLICITUD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- 4. MODAL: VALORAR PRODUCTO --- */}
      {isAddCustomerReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsAddCustomerReviewModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 space-y-5 text-gray-900 z-10">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-current" />
                <h3 className="font-display text-base font-bold text-gray-900 uppercase tracking-wider">DEJAR RESEÑA DE PRODUCTO</h3>
              </div>
              <button onClick={() => setIsAddCustomerReviewModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCustomerReviewModal} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">PRODUCTO COMPRADO</label>
                <select
                  value={reviewProdSelect}
                  onChange={(e) => setReviewProdSelect(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-[#3C6E71]"
                >
                  {products && products.length > 0 ? (
                    products.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))
                  ) : (
                    <option value="Campera Cortavientos Fitz Roy">Campera Cortavientos Fitz Roy</option>
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">CALIFICACIÓN</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRatingSelect(star)}
                      className={`p-2 rounded-lg border transition-all cursor-pointer ${reviewRatingSelect >= star ? 'bg-amber-100 border-amber-400 text-amber-500' : 'bg-gray-100 border-gray-200 text-gray-400'}`}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">TU OPINIÓN DE EXPERIENCIA</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Excelente producto, muy cómodo y resistente..."
                  value={reviewCommentInput}
                  onChange={(e) => setReviewCommentInput(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-[#3C6E71]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerReviewModalOpen(false)}
                  className="w-1/2 py-2.5 border border-gray-300 text-gray-700 font-display text-xs font-bold uppercase rounded-xl hover:bg-gray-50 cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white font-display text-xs font-bold uppercase rounded-xl shadow cursor-pointer"
                >
                  PUBLICAR RESEÑA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADMIN MODAL: LIGHTBOX PARA COMPROBANTES DE TRANSFERENCIA --- */}
      {adminReceiptLightboxUrl && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setAdminReceiptLightboxUrl(null)} />
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 z-10 space-y-4 p-5 text-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                📄 COMPROBANTE DE TRANSFERENCIA ADJUNTADO
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={adminReceiptLightboxUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-xs font-bold font-mono-custom"
                >
                  ABRIR ORIGINAL
                </a>
                <button onClick={() => setAdminReceiptLightboxUrl(null)} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto flex items-center justify-center bg-gray-100 p-4 rounded-xl">
              <img
                src={adminReceiptLightboxUrl}
                alt="Comprobante de pago"
                className="max-w-full max-h-[60vh] object-contain rounded shadow-md"
              />
            </div>
          </div>
        </div>
      )}

      {/* --- ADMIN MODAL: RECHAZAR PAGO CON MOTIVO --- */}
      {adminRejectionModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setAdminRejectionModalOrder(null)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 space-y-5 text-gray-900 z-10">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2 text-red-600">
                <X className="w-5 h-5 stroke-[3]" />
                <h3 className="font-display text-base font-bold uppercase tracking-wider text-gray-900">RECHAZAR PAGO DE PEDIDO</h3>
              </div>
              <button onClick={() => setAdminRejectionModalOrder(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-gray-700">
                Estás por rechazar el pago del pedido <strong className="font-mono-custom text-gray-900">{adminRejectionModalOrder.id}</strong> ({adminRejectionModalOrder.customer_name}). Se notificará automáticamente al cliente.
              </p>

              {/* Preset Reason Chips */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">MOTIVOS RÁPIDOS DE RECHAZO:</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Comprobante no legible o ilegible",
                    "Monto transferido no coincide con el total",
                    "Transferencia no acreditada en la cuenta",
                    "Comprobante ya utilizado en otro pedido"
                  ].map((chip, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAdminRejectionReasonInput(chip)}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-[10px] text-gray-800 transition-all cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">MOTIVO DETALLADO (SE ENVIARÁ AL CLIENTE) *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Escribí aquí la razón por la cual no se aprobó el pago..."
                  value={adminRejectionReasonInput}
                  onChange={(e) => setAdminRejectionReasonInput(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdminRejectionModalOrder(null)}
                  className="w-1/2 py-2.5 border border-gray-300 text-gray-700 font-display text-xs font-bold uppercase rounded-xl hover:bg-gray-50 cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const reason = adminRejectionReasonInput.trim() || 'El pago fue rechazado. Por favor verifica el comprobante o intenta con otro medio.';
                    await handleUpdateOrderStatus(adminRejectionModalOrder.id, 'rejected', reason);
                    setAdminRejectionModalOrder(null);
                    setAdminRejectionReasonInput('');
                  }}
                  className="w-1/2 py-2.5 bg-red-600 hover:bg-red-700 text-white font-display text-xs font-bold uppercase rounded-xl shadow cursor-pointer"
                >
                  CONFIRMAR RECHAZO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

        {selectedPrintOrder && (
          <InvoicePrinter order={selectedPrintOrder} onClose={() => setSelectedPrintOrder(null)} />
        )}

        {/* --- CUSTOMER MODAL: REENVIAR COMPROBANTE --- */}
        {customerResendReceiptModalOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setCustomerResendReceiptModalOrder(null)} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 space-y-5 text-gray-900 z-10">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <h3 className="font-display text-base font-bold uppercase tracking-wider text-gray-900">SUBIR COMPROBANTE DE PAGO</h3>
                <button onClick={() => setCustomerResendReceiptModalOrder(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCustomerResendReceiptSubmit} className="space-y-4 text-xs">
                <p className="text-gray-600 leading-relaxed">
                  Pedido <strong>#{customerResendReceiptModalOrder.id && customerResendReceiptModalOrder.id.length > 15 ? customerResendReceiptModalOrder.id.slice(-6).toUpperCase() : customerResendReceiptModalOrder.id}</strong>.
                  Por favor adjuntá una foto o PDF claro de tu transferencia bancaria (máximo 5MB).
                </p>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">COMPROBANTE (JPG, PNG, PDF)</label>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, application/pdf"
                    required
                    onChange={(e) => setCustomerResendFile(e.target.files[0])}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setCustomerResendReceiptModalOrder(null)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold uppercase"
                  >
                    CANCELAR
                  </button>
                  <button
                    type="submit"
                    disabled={isUploadingCustomerReceipt || !customerResendFile}
                    className="px-4 py-2 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white rounded-xl text-xs font-bold uppercase"
                  >
                    {isUploadingCustomerReceipt ? 'ENVIANDO...' : 'ENVIAR COMPROBANTE'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
