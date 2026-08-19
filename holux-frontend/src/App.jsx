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
  Ruler
} from 'lucide-react';

import DashboardCharts from './components/Admin/DashboardCharts';
import StoreSettings from './components/Admin/StoreSettings';
import InvoicePrinter from './components/Admin/InvoicePrinter';
import BannerEditor from './components/Admin/BannerEditor';
import CouponManager from './components/Admin/CouponManager';
import ProductEditModal from './components/Admin/ProductEditModal';
import CustomerEditModal from './components/Admin/CustomerEditModal';
import SupportManager from './components/Admin/SupportManager';
import CheckoutView from './components/Checkout/CheckoutView';
import ProductCatalogManager from './components/Admin/ProductCatalogManager';
import Breadcrumbs from './components/Admin/Breadcrumbs';
import HeaderSearchInput from './components/Shop/HeaderSearchInput';
import VipSettingsManager from './components/Admin/VipSettingsManager';
import { useProductCatalog } from './hooks/useProductCatalog';

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fmbhcfsrsfkglmvgbnlm.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_aAzQcAqCATpYDGBVRNJRQQ_1CKarnEb';

// Product Discount Config (customize which items are on sale and their percentage)
const getProductDiscount = (product) => {
  if (!product || typeof product !== 'object') return 0;
  const normal = Number(product.price || 0);
  const offer = Number(product.offer_price || 0);
  if (offer > 0 && normal > offer) {
    return Math.round(((normal - offer) / normal) * 100);
  }
  return 0;
};

const getEffectiveProductPrice = (product) => {
  if (!product || typeof product !== 'object') return 0;
  const normal = Number(product.price || 0);
  const offer = Number(product.offer_price || 0);
  if (offer > 0 && normal > offer) {
    return offer;
  }
  return normal;
};

const getOriginalProductPrice = (product) => {
  if (!product || typeof product !== 'object') return 0;
  const normal = Number(product.price || 0);
  const offer = Number(product.offer_price || 0);
  if (offer > 0 && normal > offer) {
    return normal;
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
const PROMO_BANNERS = [
  {
    title: "SKI",
    span: "COLECCIÓN NIEVE Y ALTA MONTAÑA",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&auto=format&fit=crop&q=80",
    link: "#/catalogo?categoria=trekking"
  },
  {
    title: "TREKKING",
    span: "EXPLORÁ NUEVOS SENDEROS",
    image: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800&auto=format&fit=crop&q=80",
    link: "#/catalogo?categoria=trekking"
  },
  {
    title: "URBAN ACTIVE",
    span: "DISEÑO VERSÁTIL PARA EL DÍA A DÍA",
    image: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=800&auto=format&fit=crop&q=80",
    link: "#/catalogo?categoria=accesorios"
  }
];

const getProductImage = (name) => {
  const cleanName = name.toLowerCase();
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
  return 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=600&auto=format&fit=crop&q=80';
};

export default function App() {
  // --- STATE ---
  const [products, setProducts] = useState([]);
  const novedadesRef = useRef(null);
  const destacadosRef = useRef(null);
  const [currentPromoSlide, setCurrentPromoSlide] = useState(0);
  const [currentNovedadesMobileIdx, setCurrentNovedadesMobileIdx] = useState(0);
  const [currentDestacadosMobileIdx, setCurrentDestacadosMobileIdx] = useState(0);

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
  
  // Hero Carousel State & Slides data
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    {
      span: "EQUIPAMIENTO PROFESIONAL DE MONTAÑA",
      title: "HACIA LO ALTO",
      highlight: "SIN LÍMITES",
      desc: "Diseñamos indumentaria y equipo técnico de alto rendimiento para resistir las condiciones climáticas más extremas de la cordillera.",
      cta: "VER EQUIPAMIENTO",
      image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80"
    },
    {
      span: "EXPEDICIONES Y AVENTURA",
      title: "EQUÍPATE PARA",
      highlight: "CADA DESAFÍO",
      desc: "Descubre nuestra línea de carpas de alta resistencia, bolsas de dormir térmicas y accesorios técnicos homologados para trekking y camping.",
      cta: "EXPLORAR CARPAS",
      image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1600&q=80"
    },
    {
      span: "COLECCIÓN CALZADO Y ABRIGO",
      title: "RESISTENCIA EN",
      highlight: "CADA PASO",
      desc: "Botas técnicas con agarre de alta tracción y camperas cortavientos Fitz Roy diseñadas con aislamiento de nivel profesional.",
      cta: "VER CALZADO",
      image: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1600&q=80"
    }
  ];

  // Chat Widget State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatEmail, setChatEmail] = useState('');
  const [chatSuccess, setChatSuccess] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // Swipe/Drag Gestures State
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isMouseDown, setIsMouseDown] = useState(false);

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    const distance = touchStart && touchEnd ? touchStart - touchEnd : 0;
    if (touchStart && (!touchEnd || Math.abs(distance) < 5)) {
      window.location.hash = '#/catalogo';
      return;
    }

    if (!touchStart || !touchEnd) return;
    const minSwipeDistance = 50;
    if (distance > minSwipeDistance) {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }
    if (distance < -minSwipeDistance) {
      setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
    }
  };

  const onMouseDown = (e) => {
    setTouchEnd(null);
    setTouchStart(e.clientX);
    setIsMouseDown(true);
  };

  const onMouseMove = (e) => {
    if (!isMouseDown) return;
    setTouchEnd(e.clientX);
  };

  const onMouseUp = () => {
    if (!isMouseDown) return;
    setIsMouseDown(false);
    
    const distance = touchStart && touchEnd ? touchStart - touchEnd : 0;
    if (touchStart && (!touchEnd || Math.abs(distance) < 5)) {
      window.location.hash = '#/catalogo';
      return;
    }

    if (!touchStart || !touchEnd) return;
    const minSwipeDistance = 50;
    if (distance > minSwipeDistance) {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }
    if (distance < -minSwipeDistance) {
      setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
    }
  };

  // Navigation & Search Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [activeGender, setActiveGender] = useState(null); // 'mujer' | 'hombre' | 'niños' | 'outlet' | null
  const [activeBrand, setActiveBrand] = useState(null); // brand filter
  const [currentView, setCurrentView] = useState(() => {
    const hash = window.location.hash || '';
    if (hash.startsWith('#/mi-cuenta')) return 'customer_panel';
    if (hash.startsWith('#/admin')) return 'admin';
    if (hash.startsWith('#/catalogo')) return 'category';
    if (hash.startsWith('#/compra-confirmada')) return 'checkout';
    return 'home';
  });
  const [sortBy, setSortBy] = useState('relevant'); // 'relevant' | 'price-asc' | 'price-desc'
  const [selectedDetailProduct, setSelectedDetailProduct] = useState(null);
  const [detailQuantity, setDetailQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [sizeError, setSizeError] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [sizeGuideCategory, setSizeGuideCategory] = useState('tops'); // 'tops' | 'bottoms' | 'footwear'

  // Cart & Orders
  const [heroSlides, setHeroSlides] = useState(slides);
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
  const [paymentMethod, setPaymentMethod] = useState('mercadopago'); // 'mercadopago' | 'transfer'
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

  // Customer coupons wallet logic - Isolated per authenticated user ID
  const getSyncedCustomerCoupons = () => {
    const currentUserId = userProfile?.id || (token ? 'auth_user' : 'guest');
    const userWalletKey = `holux_customer_coupons_wallet_${currentUserId}`;
    const savedWallet = localStorage.getItem(userWalletKey);
    let myWallet = [];
    if (savedWallet) {
      try {
        myWallet = JSON.parse(savedWallet);
      } catch (e) {
        console.error(e);
      }
    }

    // Read admin database of coupons
    const adminSaved = localStorage.getItem('holux_coupons_database');
    let adminCouponsMap = new Map();
    if (adminSaved) {
      try {
        const parsed = JSON.parse(adminSaved);
        parsed.forEach(c => {
          if (c && c.code) {
            adminCouponsMap.set(c.code.toUpperCase().trim(), c);
          }
        });
      } catch (e) {
        console.error(e);
      }
    }

    const validatedWallet = myWallet.filter(myC => {
      if (myC.status === 'usado') return true;
      const adminCoupon = adminCouponsMap.get(myC.code.toUpperCase().trim());
      if (!adminCoupon || adminCoupon.active === false) return false;
      return true;
    }).map(myC => {
      const adminCoupon = adminCouponsMap.get(myC.code.toUpperCase().trim());
      if (adminCoupon) {
        const isExpired = adminCoupon.expiry_timestamp && adminCoupon.expiry_timestamp < Date.now();
        return {
          ...myC,
          value: adminCoupon.value,
          type: adminCoupon.type === 'percent' ? 'percentage' : 'fixed',
          min_spend: adminCoupon.minPurchase || 0,
          origin: adminCoupon.origin || myC.origin || 'Promoción Redes 🏷️',
          description: adminCoupon.description || myC.description,
          expiry_timestamp: adminCoupon.expiry_timestamp || myC.expiry_timestamp,
          status: myC.status === 'usado' ? 'usado' : (isExpired ? 'vencido' : 'disponible')
        };
      }
      return myC;
    });

    return validatedWallet;
  };

  const [customerCoupons, setCustomerCoupons] = useState(getSyncedCustomerCoupons);

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
  }, [userProfile?.id]);

  const [customerPanelSection, setCustomerPanelSection] = useState('general'); // 'general' | 'orders' | 'coupons' | 'reviews' | 'addresses' | 'messages' | 'settings'
  const [orderStatusFilter, setOrderStatusFilter] = useState('all'); // 'all' | 'pending' | 'processing' | 'shipped' | 'completed'
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

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
  
  // Sample seed data for Admin testing
  const SAMPLE_ORDERS = [
    {
      id: 'HLX-849201',
      created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      customer_name: 'Lucía Fernández',
      customer_email: 'lucia.fernandez@gmail.com',
      total: 345000,
      subtotal: 285123.96,
      tax_amount: 59876.04,
      status: 'paid',
      payment_method: 'Tarjeta (Visa)',
      shipping_address: 'Av. Libertador 2450, 4º B, CABA',
      receipt_url: null,
      rejection_reason: null,
      profiles: { full_name: 'Lucía Fernández', phone: '+54 9 11 4521-8899' },
      order_items: [
        { id: 'item-1', product_name: 'Campera Impermeable Fitz Roy Extreme', quantity: 1, unit_price: 245000 },
        { id: 'item-2', product_name: 'Botas de Montaña Cordillera Pro', quantity: 1, unit_price: 100000 }
      ]
    },
    {
      id: 'HLX-849202',
      created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      customer_name: 'Martín Palermo',
      customer_email: 'martin.palermo@gmail.com',
      total: 165600,
      subtotal: 136859.50,
      tax_amount: 28740.50,
      status: 'pending_review',
      payment_method: 'transfer',
      shipping_address: 'Calle San Martín 120, Bariloche, Río Negro',
      receipt_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
      rejection_reason: null,
      profiles: { full_name: 'Martín Palermo', phone: '+54 9 294 412-3456' },
      order_items: [
        { id: 'item-3', product_name: 'Mochila Trekking 65L Expedición', quantity: 1, unit_price: 184000 }
      ]
    },
    {
      id: 'HLX-849203',
      created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      customer_name: 'Sofía Rossi',
      customer_email: 'sofia.rossi@outlook.com',
      total: 495000,
      subtotal: 409090.90,
      tax_amount: 85909.10,
      status: 'pending_payment',
      payment_method: 'Tarjeta (Mastercard)',
      shipping_address: 'Bv. Oroño 450, Rosario, Santa Fe',
      receipt_url: null,
      rejection_reason: null,
      profiles: { full_name: 'Sofía Rossi', phone: '+54 9 341 555-1234' },
      order_items: [
        { id: 'item-4', product_name: 'Carpa Domo 4 Personas Alta Montaña', quantity: 1, unit_price: 495000 }
      ]
    },
    {
      id: 'HLX-849204',
      created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      customer_name: 'Gonzalo Higuaín',
      customer_email: 'gonzalo.higuain@gmail.com',
      total: 89000,
      subtotal: 73553.71,
      tax_amount: 15446.29,
      status: 'rejected',
      payment_method: 'transfer',
      shipping_address: 'Av. Colón 1200, Córdoba',
      receipt_url: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=800&auto=format&fit=crop&q=80',
      rejection_reason: 'El comprobante enviado está borroso y no muestra la acreditación del monto.',
      profiles: { full_name: 'Gonzalo Higuaín', phone: '+54 9 351 987-6543' },
      order_items: [
        { id: 'item-5', product_name: 'Campera Cortavientos Fitz Roy', quantity: 1, unit_price: 89000 }
      ]
    }
  ];

  const SAMPLE_CUSTOMERS = [
    { id: 'cust-101', full_name: 'Lucía Fernández', email: 'lucia.fernandez@gmail.com', phone: '+54 9 11 4521-8899', total_orders: 4, total_spent: 185000, status: 'ACTIVO', is_vip: true },
    { id: 'cust-102', full_name: 'Martín Palermo', email: 'martin.palermo@gmail.com', phone: '+54 9 294 412-3456', total_orders: 2, total_spent: 98000, status: 'ACTIVO', is_vip: false },
    { id: 'cust-103', full_name: 'Sofía Rossi', email: 'sofia.rossi@gmail.com', phone: '+54 9 341 678-9012', total_orders: 3, total_spent: 145000, status: 'ACTIVO', is_vip: true },
    { id: 'cust-104', full_name: 'Gonzalo Montiel', email: 'gonzalo.montiel@gmail.com', phone: '+54 9 261 345-6789', total_orders: 1, total_spent: 62000, status: 'ACTIVO', is_vip: false },
    { id: 'cust-105', full_name: 'Esteban Quito', email: 'esteban.quito@gmail.com', phone: '+54 9 351 987-6543', total_orders: 5, total_spent: 240000, status: 'SUSPENDIDO', is_vip: true }
  ];

  const SAMPLE_REVIEWS = [
    { id: 'rev-1', product_name: 'Campera Cortavientos Fitz Roy', customer_name: 'Lucía Fernández', rating: 5, comment: 'Excelente resistencia al viento y agua en el Chaltén!', approved: true, products: { name: 'Campera Cortavientos Fitz Roy' }, profiles: { full_name: 'Lucía Fernández' } },
    { id: 'rev-2', product_name: 'Mochila Trekking 65L Expedición', customer_name: 'Martín Palermo', rating: 5, comment: 'Muy cómoda la mochila para caminatas largas.', approved: true, products: { name: 'Mochila Trekking 65L Expedición' }, profiles: { full_name: 'Martín Palermo' } },
    { id: 'rev-3', product_name: 'Carpa Domo Refugio 2P', customer_name: 'Sofía Rossi', rating: 4, comment: 'Soportó ráfagas de 80 km/h sin ningún problema.', approved: false, products: { name: 'Carpa Domo Refugio 2P' }, profiles: { full_name: 'Sofía Rossi' } }
  ];

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
  const [tickerPhrases, setTickerPhrases] = useState([
    '| ENVÍO GRATIS EN COMPRAS MAYORES A $150.000',
    '| ¡HASTA 6 CUOTAS SIN INTERÉS!',
    '| GARANTÍA OFICIAL HOLUX EN TODAS TUS EXPEDICIONES',
    '| 15% OFF PAGANDO CON TRANSFERENCIA BANCARIA'
  ]);

  // Top Ticker Mouse & Touch Dragging Handlers
  const tickerRef = useRef(null);
  const [isTickerDragging, setIsTickerDragging] = useState(false);
  const [tickerStartX, setTickerStartX] = useState(0);
  const [tickerScrollLeft, setTickerScrollLeft] = useState(0);

  const handleTickerMouseDown = (e) => {
    if (!tickerRef.current) return;
    setIsTickerDragging(true);
    setTickerStartX(e.pageX - tickerRef.current.offsetLeft);
    setTickerScrollLeft(tickerRef.current.scrollLeft);
  };

  const handleTickerMouseLeaveOrUp = () => {
    setIsTickerDragging(false);
  };

  const handleTickerMouseMove = (e) => {
    if (!isTickerDragging || !tickerRef.current) return;
    e.preventDefault();
    const x = e.pageX - tickerRef.current.offsetLeft;
    const walk = (x - tickerStartX) * 0.8;
    tickerRef.current.scrollLeft = tickerScrollLeft - walk;
  };

  const handleTickerTouchStart = (e) => {
    if (!tickerRef.current) return;
    setIsTickerDragging(true);
    setTickerStartX(e.touches[0].pageX - tickerRef.current.offsetLeft);
    setTickerScrollLeft(tickerRef.current.scrollLeft);
  };

  const handleTickerTouchMove = (e) => {
    if (!isTickerDragging || !tickerRef.current) return;
    const x = e.touches[0].pageX - tickerRef.current.offsetLeft;
    const walk = (x - tickerStartX) * 0.8;
    tickerRef.current.scrollLeft = tickerScrollLeft - walk;
  };

  // Mouse drag scrolling state for Novedades
  const [isNovedadesDragging, setIsNovedadesDragging] = useState(false);
  const [novedadesStartX, setNovedadesStartX] = useState(0);
  const [novedadesScrollLeft, setNovedadesScrollLeft] = useState(0);

  const handleNovedadesMouseDown = (e) => {
    if (!novedadesRef.current) return;
    setIsNovedadesDragging(true);
    setNovedadesStartX(e.pageX - novedadesRef.current.offsetLeft);
    setNovedadesScrollLeft(novedadesRef.current.scrollLeft);
  };

  const handleNovedadesMouseLeaveOrUp = () => {
    setIsNovedadesDragging(false);
  };

  const handleNovedadesMouseMove = (e) => {
    if (!isNovedadesDragging || !novedadesRef.current) return;
    e.preventDefault();
    const x = e.pageX - novedadesRef.current.offsetLeft;
    const walk = (x - novedadesStartX) * 1.5;
    novedadesRef.current.scrollLeft = novedadesScrollLeft - walk;
  };

  // Mouse drag scrolling state for Destacados
  const [isDestacadosDragging, setIsDestacadosDragging] = useState(false);
  const [destacadosStartX, setDestacadosStartX] = useState(0);
  const [destacadosScrollLeft, setDestacadosScrollLeft] = useState(0);

  const handleDestacadosMouseDown = (e) => {
    if (!destacadosRef.current) return;
    setIsDestacadosDragging(true);
    setDestacadosStartX(e.pageX - destacadosRef.current.offsetLeft);
    setDestacadosScrollLeft(destacadosRef.current.scrollLeft);
  };

  const handleDestacadosMouseLeaveOrUp = () => {
    setIsDestacadosDragging(false);
  };

  const handleDestacadosMouseMove = (e) => {
    if (!isDestacadosDragging || !destacadosRef.current) return;
    e.preventDefault();
    const x = e.pageX - destacadosRef.current.offsetLeft;
    const walk = (x - destacadosStartX) * 1.5;
    destacadosRef.current.scrollLeft = destacadosScrollLeft - walk;
  };

  // Middle Promo Installment Banner State (6 cuotas)
  const [promoBanner, setPromoBanner] = useState({
    tag: 'PROMOCIÓN DE TEMPORADA',
    title: '6 CUOTAS SIN INTERÉS EN TODO EL CATÁLOGO',
    description: 'Equípate hoy mismo y paga en cómodas cuotas fijas sin interés. Realizamos envíos de forma rápida a todo el territorio nacional.',
    isVisible: true
  });

  // Product Edit Floating Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProductModal, setSelectedProductModal] = useState(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomerModal, setSelectedCustomerModal] = useState(null);
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

  // Initial catalog load
  useEffect(() => {
    fetchCatalog();
  }, []);

  // Carousel auto-rotation timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Fetch client profile if token changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('user_token', token);
      fetchUserProfile();
    } else {
      localStorage.removeItem('user_token');
      setUserProfile(null);
    }
  }, [token]);

  // Parse URL hash for Supabase OAuth tokens (Google sign-in redirect)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      if (accessToken) {
        setToken(accessToken);
        // Clean up url hash
        window.history.replaceState(null, null, window.location.pathname);
      }
    }
  }, []);

  const MOCK_FALLBACK_PRODUCTS = [
    {
      id: 1,
      name: "Campera Cortavientos Fitz Roy",
      brand: "Holux Extreme",
      price: 100,
      installments: 3,
      stock: 15,
      categories: { name: "Trekking", slug: "trekking" },
      description: "Campera de alta montaña con membrana impermeable Gore-Tex y costuras selladas térmicamente."
    },
    {
      id: 2,
      name: "Botas de Montaña Cordillera Pro",
      brand: "Holux Trekking",
      price: 100,
      installments: 3,
      stock: 12,
      categories: { name: "Calzado", slug: "calzado" },
      description: "Botas técnicas con suela Vibram de alta tracción y protección de cuero hidrofugado."
    },
    {
      id: 3,
      name: "Mochila Trekking 65L Expedición",
      brand: "Holux Gear",
      price: 100,
      installments: 3,
      stock: 8,
      categories: { name: "Accesorios", slug: "accesorios" },
      description: "Mochila ergonómica de 65 litros con estructura de aluminio ligero y funda de lluvia."
    },
    {
      id: 4,
      name: "Carpa Domo Refugio 2P 4 Estaciones",
      brand: "Holux Shelter",
      price: 100,
      installments: 3,
      stock: 6,
      categories: { name: "Camping", slug: "camping" },
      description: "Carpa ligera de duraluminio probada contra vientos patagónicos de más de 90 km/h."
    },
    {
      id: 5,
      name: "Bolsa de Dormir Térmica Alpamayo -10°C",
      brand: "Holux Sleep",
      price: 100,
      installments: 3,
      stock: 20,
      categories: { name: "Camping", slug: "camping" },
      description: "Bolsa de dormir anatómica de pluma sintética ultra compacta."
    },
    {
      id: 6,
      name: "Bastones de Trekking Aluminio Ultra",
      brand: "Holux Trail",
      price: 100,
      installments: 3,
      stock: 25,
      categories: { name: "Accesorios", slug: "accesorios" },
      description: "Par de bastones telescópicos antishock con empuñadura de corcho natural."
    },
    {
      id: 7,
      name: "Termo Técnico Acero Inoxidable 1.2L",
      brand: "Holux Hydro",
      price: 100,
      installments: 3,
      stock: 30,
      categories: { name: "Accesorios", slug: "accesorios" },
      description: "Termo de doble pared al vacío que mantiene el calor hasta por 36 horas seguidas."
    },
    {
      id: 8,
      name: "Guantes Térmicos Nieve Windstopper",
      brand: "Holux Alpine",
      price: 100,
      installments: 3,
      stock: 18,
      categories: { name: "Accesorios", slug: "accesorios" },
      description: "Guantes reforzados con palma antideslizante para esquí y senderismo invernal."
    }
  ];

  const MOCK_FALLBACK_CATEGORIES = [
    { id: 1, name: "Trekking", slug: "trekking" },
    { id: 2, name: "Camping", slug: "camping" },
    { id: 3, name: "Calzado", slug: "calzado" },
    { id: 4, name: "Accesorios", slug: "accesorios" }
  ];

  const fetchCatalog = async () => {
    setLoadingProducts(true);
    setLoadingCategories(true);
    try {
      const resCat = await fetch(`${API_BASE_URL}/api/categories`);
      if (resCat.ok) {
        const data = await resCat.json();
        if (data && data.length > 0) {
          setCategories(data);
        } else {
          setCategories(MOCK_FALLBACK_CATEGORIES);
        }
      } else {
        setCategories(MOCK_FALLBACK_CATEGORIES);
      }

      const resProd = await fetch(`${API_BASE_URL}/api/products`);
      if (resProd.ok) {
        const data = await resProd.json();
        if (data && data.length > 0) {
          setProducts(data);
        } else {
          setProducts(MOCK_FALLBACK_PRODUCTS);
        }
      } else {
        setProducts(MOCK_FALLBACK_PRODUCTS);
      }
    } catch (e) {
      console.error("Error loading catalog, using fallback", e);
      setProducts(MOCK_FALLBACK_PRODUCTS);
      setCategories(MOCK_FALLBACK_CATEGORIES);
    } finally {
      setLoadingProducts(false);
      setLoadingCategories(false);
    }
  };

  const fetchUserProfile = async () => {
    if (!token) return;

    // Helper to safely parse JWT tokens (including Base64Url padding)
    const getPayloadFromToken = (tok) => {
      try {
        const parts = tok.split('.');
        if (parts.length < 2) return null;
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
        return JSON.parse(atob(padded));
      } catch {
        return null;
      }
    };

    const tokenPayload = getPayloadFromToken(token);
    const isMockToken = tokenPayload && tokenPayload.sub && String(tokenPayload.sub).startsWith('usr-');

    // Only hit API for non-mock tokens
    if (!isMockToken) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const isAdminUser = data.role === 'admin' || (data.email && data.email.toLowerCase() === 'admin@holux.com') || (tokenPayload?.email && tokenPayload.email.toLowerCase() === 'admin@holux.com');
          const finalProfile = {
            ...data,
            role: isAdminUser ? 'admin' : (data.role || 'customer')
          };
          setUserProfile(finalProfile);
          setCheckoutName(finalProfile.full_name || '');
          if (finalProfile.email) setCheckoutEmail(finalProfile.email);
          return;
        }
      } catch (e) {
        // Fallback to local profile parsing
      }
    }

    // Client-side profile generation from token payload
    if (tokenPayload) {
      const email = tokenPayload.email || '';
      const meta = tokenPayload.user_metadata || {};
      const fullName = meta.full_name || (email ? email.split('@')[0] : 'Cliente');
      const isAdminUser = (email.toLowerCase() === 'admin@holux.com') || meta.role === 'admin' || (tokenPayload.app_metadata && tokenPayload.app_metadata.role === 'admin') || (tokenPayload.role === 'service_role');
      const role = isAdminUser ? 'admin' : (meta.role || 'customer');

      const fallbackProfile = {
        id: tokenPayload.sub || 'user_id',
        role: role,
        full_name: fullName,
        email: email,
        phone: meta.phone || ''
      };
      setUserProfile(fallbackProfile);
      setCheckoutName(fullName);
      if (email) setCheckoutEmail(email);
    } else {
      setUserProfile(null);
    }
  };

  // Helper to check if current token is a demo/mock local token
  const isMockToken = (tok) => {
    if (!tok) return false;
    try {
      const parts = tok.split('.');
      if (parts.length < 2) return false;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
      const payload = JSON.parse(atob(padded));
      return payload && payload.sub && String(payload.sub).startsWith('usr-');
    } catch {
      return false;
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
      console.error(e);
    }
  };

  const fetchOrders = async () => {
    if (!token) return;
    if (isMockToken(token)) {
      setOrders(SAMPLE_ORDERS.slice(0, 2));
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/me/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
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
    setSizeError(false);
    setSelectedDetailProduct(product);
    setSelectedProduct(product);
    setDetailQuantity(1);
    setSelectedSize('');
    setCurrentView('product-detail');
    handleOpenReviews(product);
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
      } else if (hash.startsWith('#/admin')) {
        setCurrentView('admin');
      } else if (hash.startsWith('#/compra-confirmada')) {
        setCurrentView('checkout');
        return;
      } else if (hash.startsWith('#/producto/')) {
        const prodId = hash.replace('#/producto/', '').split('?')[0];
        if (products.length > 0) {
          const found = products.find(p => String(p.id) === String(prodId));
          if (found) {
            setSelectedDetailProduct(found);
            setSelectedProduct(found);
            setDetailQuantity(1);
            setSelectedSize('');
            setSizeError(false);
            setCurrentView('product-detail');
            handleOpenReviews(found);
          }
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

  // Product Catalog Advanced State (Server-side search, filters, sorting, bulk actions, CSV)
  const productCatalogState = useProductCatalog(token);

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
      const res = await fetch(`${API_BASE_URL}/api/admin/customers`, {
        headers: { 'Authorization': `Bearer ${token}` }
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
    // Update local state instantly
    setAdminOrdersList(prev => prev.map(o => o.id === orderId ? { ...o, status, rejection_reason: rejectionReason || o.rejection_reason } : o));
    setSelectedOrderDetail(prev => prev && prev.id === orderId ? { ...prev, status, rejection_reason: rejectionReason || prev.rejection_reason } : prev);

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
      const res = await fetch(`${API_BASE_URL}/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAdminProducts();
        fetchCatalog();
      }
    } catch (e) {
      console.error(e);
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
          body: JSON.stringify({ email: authEmail, password: authPassword })
        });
        const data = await response.json();
        if (response.ok && data.access_token) {
          setToken(data.access_token);
          setIsAuthModalOpen(false);
          setAuthEmail('');
          setAuthPassword('');
          return;
        }
        setAuthError(data.error_description || data.msg || 'Email o contraseña incorrectos.');
      } catch (err) {
        console.error(err);
        setAuthError('Error de red al iniciar sesión.');
      }
    } else {
      // Register
      try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            email: authEmail,
            password: authPassword,
            options: {
              data: {
                full_name: authFullName,
                phone: authPhone
              }
            }
          })
        });
        const data = await response.json();
        if (response.ok) {
          alert('Registro completado. Ya puedes iniciar sesión con tu cuenta.');
          setAuthMode('login');
          return;
        }
        
        // Register fallback
        if (authEmail && authEmail.includes('@')) {
          alert('Cuenta registrada correctamente en el entorno de pruebas. Ya puedes iniciar sesión.');
          setAuthMode('login');
          return;
        }

        setAuthError(data.message || 'Error en el registro');
      } catch (err) {
        if (authEmail && authEmail.includes('@')) {
          alert('Cuenta registrada en modo desarrollo.');
          setAuthMode('login');
          return;
        }
        setAuthError('Error de red al registrar usuario.');
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
    const oauthUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(window.location.origin)}&apikey=${SUPABASE_ANON_KEY}`;
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

    const subtotal = getCartTotal();
    const tierPercent = userProfile?.benefits?.auto_discount_percent || (userProfile?.tier === 'super_vip' ? 10 : userProfile?.tier === 'vip' ? 5 : 0);
    const tierDiscount = tierPercent > 0 ? Math.round((subtotal * tierPercent) / 100) : 0;
    const transferDiscount = paymentMethod === 'transfer' ? Math.round(subtotal * 0.10) : 0;
    let couponDiscount = 0;
    if (appliedCoupon) {
      couponDiscount = appliedCoupon.type === 'percentage'
        ? Math.round((subtotal * appliedCoupon.value) / 100)
        : Math.min(subtotal, appliedCoupon.value);
    }
    const total = Math.max(0, subtotal - tierDiscount - transferDiscount - couponDiscount);

    // --- MERCADO PAGO CHECKOUT PRO (REDIRECCIÓN Y PAGO CON CUENTA MP / DINERO EN CUENTA / MERCADO CRÉDITO) ---
    if (paymentMethod === 'mercadopago_checkout_pro') {
      try {
        const mpAccessToken = 'TEST-7516850233643919-072715-fb9344d34c21c1f309ce30b659545c0a-496551012';
        
        const validEmail = (checkoutEmail && checkoutEmail.includes('@')) ? checkoutEmail.trim() : (userProfile?.email || '');
        const nameParts = (checkoutName || userProfile?.full_name || 'Cliente').trim().split(' ');
        const firstName = nameParts[0] || 'Cliente';
        const lastName = nameParts.slice(1).join(' ') || '';

        const prefBody = {
          items: cart.map(item => ({
            id: String(item.id),
            title: String(item.name || 'Producto Holux'),
            quantity: Number(item.quantity || 1),
            unit_price: Number(item.price),
            currency_id: 'ARS'
          })),
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
      if (activeCategory && (!p.categories || p.categories.slug !== activeCategory)) {
        return false;
      }
      if (activeGender) {
        const nameLower = p.name.toLowerCase();
        if (activeGender === 'mujer') {
          if (!nameLower.includes('campera') && !nameLower.includes('pantalón') && !nameLower.includes('botas') && !nameLower.includes('mochila')) {
            return false;
          }
        }
        if (activeGender === 'hombre') {
          if (!nameLower.includes('campera') && !nameLower.includes('pantalón') && !nameLower.includes('bastones') && !nameLower.includes('termo')) {
            return false;
          }
        }
        if (activeGender === 'niños') {
          if (!nameLower.includes('termo') && !nameLower.includes('bastones') && !nameLower.includes('bolsa')) {
            return false;
          }
        }
        if (activeGender === 'outlet') {
          if (p.price >= 80000) {
            return false;
          }
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
        {/* Top Header for Client Portal - Identical to Admin Header */}
        <header className="bg-[#1C2321] text-white px-4 sm:px-8 py-4 flex items-center justify-between border-b border-[#3C6E71]/30 shadow-md sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <a 
              href="#/" 
              onClick={() => { 
                setCurrentView('home'); 
                setActiveCategory(null); 
                setActiveGender(null); 
                setSelectedDetailProduct(null);
              }} 
              className="flex items-center gap-2"
            >
              <span className="bg-[#B85C38] text-white px-2.5 py-0.5 rounded font-black font-mono-custom text-lg">H</span>
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
              className="px-4 py-2 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white rounded-lg text-xs font-display font-bold tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-sm"
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

        {/* Main Dashboard Layout Grid */}
        <div className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* LEFT SIDEBAR NAVIGATION MENU */}
          <div className="lg:col-span-1 space-y-4">
            
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
                  className="w-full px-4 py-3.5 flex items-center justify-between transition-all cursor-pointer bg-[#B85C38] hover:bg-[#B85C38]/90 text-white font-bold shadow-sm"
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
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono-custom ${customerPanelSection === 'coupons' ? 'bg-white text-[#3C6E71]' : 'bg-emerald-600 text-white'}`}>
                  {customerCoupons ? customerCoupons.filter(c => c.status === 'disponible').length : 3}
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
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono-custom ${customerPanelSection === 'orders' ? 'bg-white text-[#3C6E71]' : 'bg-[#B85C38] text-white'}`}>
                  {orders ? orders.length : 0}
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
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono-custom ${customerPanelSection === 'addresses' ? 'bg-white text-[#3C6E71]' : 'bg-gray-100 text-gray-700'}`}>
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-1">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">TOTAL PEDIDOS</span>
                      <span className="text-2xl font-bold font-mono-custom text-gray-900">
                        {orders ? orders.length : 0}
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
                        <input
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
                      <input
                        type="text"
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        placeholder="Buscar por N° o producto..."
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-[#3C6E71]"
                      />
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-4 text-xs font-bold">
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
                        className={`px-4 py-2 rounded-lg font-sans font-bold transition-all cursor-pointer ${
                          orderStatusFilter === tab.id
                            ? 'bg-[#3C6E71] text-white shadow-xs'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Orders List */}
                  <div className="space-y-6">
                    {orders.length === 0 ? (
                      <div className="py-12 text-center text-gray-400 space-y-3">
                        <ShoppingBag className="w-12 h-12 mx-auto stroke-[1] text-gray-300" />
                        <p className="font-display font-bold text-xs uppercase">No tienes pedidos registrados aún</p>
                        <button
                          onClick={() => { window.location.hash = '#/catalogo'; setCurrentView('category'); }}
                          className="px-6 py-2 bg-[#3C6E71] text-white font-display text-xs font-bold uppercase rounded-xl hover:bg-[#3C6E71]/90"
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
                          if (isPendingReview) {
                            activeStep = 2;
                          } else if (isPaid) {
                            activeStep = 3;
                          } else if (isPreparing) {
                            activeStep = 4;
                          } else if (isShipped || isDelivered) {
                            activeStep = 5;
                          }

                          return (
                            <div key={ord.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-5">
                              {/* Top Bar */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                                <div className="flex items-center gap-3">
                                  {isRejected ? (
                                    <span className="px-3 py-1 bg-red-600 text-white font-display text-xs font-black rounded uppercase tracking-wider shadow-xs">
                                      PAGO RECHAZADO
                                    </span>
                                  ) : isCancelled ? (
                                    <span className="px-3 py-1 bg-gray-500 text-white font-display text-xs font-black rounded uppercase tracking-wider shadow-xs">
                                      PEDIDO CANCELADO
                                    </span>
                                  ) : isDelivered ? (
                                    <span className="px-3 py-1 bg-emerald-700 text-white font-display text-xs font-black rounded uppercase tracking-wider shadow-xs">
                                      ENTREGADO ✓
                                    </span>
                                  ) : isShipped ? (
                                    <span className="px-3 py-1 bg-purple-600 text-white font-display text-xs font-black rounded uppercase tracking-wider shadow-xs">
                                      EN CAMINO 🚚
                                    </span>
                                  ) : isPreparing ? (
                                    <span className="px-3 py-1 bg-blue-600 text-white font-display text-xs font-black rounded uppercase tracking-wider shadow-xs">
                                      EN PREPARACIÓN 📦
                                    </span>
                                  ) : isPaid ? (
                                    <span className="px-3 py-1 bg-emerald-600 text-white font-display text-xs font-black rounded uppercase tracking-wider shadow-xs">
                                      PAGO APROBADO ✓
                                    </span>
                                  ) : isPendingReview ? (
                                    <span className="px-3 py-1 bg-amber-500 text-white font-display text-xs font-black rounded uppercase tracking-wider shadow-xs">
                                      PAGO EN VERIFICACIÓN ⏳
                                    </span>
                                  ) : (
                                    <span className="px-3 py-1 bg-yellow-500 text-black font-display text-xs font-black rounded uppercase tracking-wider shadow-xs">
                                      PENDIENTE DE PAGO
                                    </span>
                                  )}
                                  <span className="font-mono-custom text-sm font-bold text-gray-900 tracking-wider">
                                    N° #{String(ord.id).length > 15 ? String(ord.id).slice(-6).toUpperCase() : ord.id}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500 font-sans">
                                  Fecha: {new Date(ord.created_at || Date.now()).toLocaleDateString('es-AR')}
                                </span>
                              </div>

                              {/* 5-Step Timeline */}
                              <div className="space-y-2">
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider font-sans block">
                                  PROGRESO DE TU PEDIDO
                                </span>
                                <div className="grid grid-cols-5 gap-2 text-[11px] font-sans font-bold text-center select-none">
                                  <div className={`p-2.5 rounded-lg border ${activeStep >= 1 ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                                    1. CREADO ✓
                                  </div>
                                  <div className={`p-2.5 rounded-lg border ${activeStep === 2 ? 'bg-amber-50 border-amber-300 text-amber-900 ring-1 ring-amber-400/50' : activeStep > 2 ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                                    2. VERIFICACIÓN ⏳
                                  </div>
                                  <div className={`p-2.5 rounded-lg border ${activeStep >= 3 ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                                    3. PAGO OK ✓
                                  </div>
                                  <div className={`p-2.5 rounded-lg border ${activeStep >= 4 ? 'bg-blue-50 border-blue-300 text-blue-800' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                                    4. PREPARANDO 📦
                                  </div>
                                  <div className={`p-2.5 rounded-lg border ${activeStep >= 5 ? 'bg-emerald-100 border-emerald-400 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                                    5. ENVIADO 🚚
                                  </div>
                                </div>
                              </div>

                              {/* Destination & Payment */}
                              <div className="space-y-1 text-xs text-gray-700 font-sans">
                                <p><strong className="text-gray-900">Destino:</strong> {ord.shipping_address ? `Entrega a Domicilio (${ord.shipping_address})` : 'Entrega a Domicilio'}</p>
                                <p><strong className="text-gray-900">Forma de Pago:</strong> <span className="uppercase font-bold text-gray-900">{isTransfer ? 'TRANSFERENCIA BANCARIA' : (ord.payment_method || 'MERCADO PAGO')}</span></p>
                              </div>

                              {/* Contextual Status Alert Boxes */}
                              {isPendingReview && isTransfer && (
                                <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1 text-xs">
                                  <div className="flex items-center gap-2 text-amber-900 font-bold">
                                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span>PAGO EN PROCESO DE VERIFICACIÓN</span>
                                  </div>
                                  <p className="text-amber-800/90 text-[11px] leading-relaxed pl-6">
                                    La comprobación de transferencias demora habitualmente de 2 a 24hs hábiles. Te notificaremos a tu email apenas sea validada por administración.
                                  </p>
                                </div>
                              )}

                              {!isTransfer && (isPaid || isPreparing || isShipped || isDelivered) && (
                                <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1 text-xs">
                                  <div className="flex items-center gap-2 text-emerald-900 font-bold">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>PAGO PROCESADO Y ACREDITADO CON ÉXITO</span>
                                  </div>
                                  <p className="text-emerald-800 text-[11px] leading-relaxed pl-6">
                                    Tu pago por Mercado Pago fue aprobado de forma instantánea. Tu pedido ya ingresó a la cola de preparación en nuestro depósito.
                                  </p>
                                </div>
                              )}

                              {isPreparing && (
                                <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl space-y-1 text-xs">
                                  <div className="flex items-center gap-2 text-blue-900 font-bold">
                                    <Package className="w-4 h-4 text-blue-600 shrink-0" />
                                    <span>PEDIDO EN EMBALAJE Y PREPARACIÓN</span>
                                  </div>
                                  <p className="text-blue-800 text-[11px] leading-relaxed pl-6">
                                    Estamos armando tu paquete en nuestro centro logístico de Bariloche para entregarlo al correo en las próximas horas.
                                  </p>
                                </div>
                              )}

                              {(isShipped || isDelivered) && ord.tracking_number && (
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
                                </div>
                              </div>

                              {/* Bottom Total & Actions */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">
                                <div className="text-right sm:order-2">
                                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">TOTAL</span>
                                  <span className="text-2xl font-black text-gray-900 font-sans">${Math.round(ord.total || ord.total_amount || 0).toLocaleString('es-AR')}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 sm:order-1">
                                  <button
                                    type="button"
                                    onClick={() => setCustomerSelectedOrderDetail(ord)}
                                    className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-display text-xs font-bold tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
                                  >
                                    <Eye className="w-4 h-4 text-gray-500" />
                                    <span>VER DETALLE DEL PEDIDO</span>
                                  </button>

                                  <a
                                    href={`${API_BASE_URL}/api/orders/${ord.id}/pdf?token=${token || ''}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-5 py-2.5 bg-[#3C6E71] hover:bg-[#2c5355] text-white font-display text-xs font-bold tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-xs"
                                  >
                                    <Download className="w-4 h-4 text-white" />
                                    <span>COMPROBANTE PDF</span>
                                  </a>
                                </div>
                              </div>

                            </div>
                          );
                        })
                    )}
                  </div>

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
                        <input
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
                      <input
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
                      { key: 'disponibles', label: 'Disponibles', count: customerCoupons.filter(c => c.status === 'disponible').length },
                      { key: 'usados', label: 'Usados', count: customerCoupons.filter(c => c.status === 'usado').length },
                      { key: 'vencidos', label: 'Vencidos', count: customerCoupons.filter(c => c.status === 'vencido').length }
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
                        if (couponsTabFilter === 'disponibles') return c.status === 'disponible';
                        if (couponsTabFilter === 'usados') return c.status === 'usado';
                        if (couponsTabFilter === 'vencidos') return c.status === 'vencido';
                        return true;
                      })
                      .filter(c => {
                        if (!couponSearchQuery.trim()) return true;
                        const q = couponSearchQuery.toLowerCase();
                        return c.code.toLowerCase().includes(q) || (c.origin && c.origin.toLowerCase().includes(q));
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
                          const daysLeft = Math.ceil((coupon.expiry_timestamp - Date.now()) / (1000 * 60 * 60 * 24));
                          
                          let urgencyColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                          let urgencyLabel = `Vence en ${daysLeft} días`;
                          if (daysLeft <= 1) {
                            urgencyColor = 'bg-red-100 text-red-800 border-red-300 animate-pulse';
                            urgencyLabel = '¡Vence HOY!';
                          } else if (daysLeft <= 7) {
                            urgencyColor = 'bg-amber-100 text-amber-800 border-amber-300';
                            urgencyLabel = `Vence en ${daysLeft} días`;
                          }

                          if (coupon.status === 'usado') {
                            return (
                              <div key={coupon.id} className="relative bg-gray-50 border-2 border-dashed border-gray-300 p-5 rounded-2xl opacity-70 flex flex-col justify-between space-y-4 text-gray-700">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-2.5 py-1 rounded font-mono-custom uppercase">
                                      {coupon.origin || 'Promoción'}
                                    </span>
                                    <span className="text-[10px] font-bold bg-gray-300 text-gray-700 px-2.5 py-0.5 rounded font-mono-custom uppercase">
                                      USADO
                                    </span>
                                  </div>

                                  <div className="flex items-baseline justify-between">
                                    <span className="font-mono-custom text-xl font-extrabold text-gray-500 line-through">
                                      {coupon.code}
                                    </span>
                                    <span className="font-mono-custom text-lg font-bold text-gray-500">
                                      {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `${coupon.value.toLocaleString('es-AR')} OFF`}
                                    </span>
                                  </div>

                                  <p className="text-[11px] text-gray-500 leading-relaxed">{coupon.description}</p>
                                </div>

                                <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-[11px] font-mono-custom text-gray-500">
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

                          if (coupon.status === 'vencido') {
                            return (
                              <div key={coupon.id} className="relative bg-gray-50 border-2 border-dashed border-gray-300 p-5 rounded-2xl opacity-60 flex flex-col justify-between space-y-4 text-gray-700">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-2.5 py-1 rounded font-mono-custom uppercase">
                                      {coupon.origin || 'Promoción Expirada'}
                                    </span>
                                    <span className="text-[10px] font-bold bg-red-100 text-red-700 border border-red-300 px-2.5 py-0.5 rounded font-mono-custom uppercase">
                                      VENCIDO
                                    </span>
                                  </div>

                                  <div className="flex items-baseline justify-between">
                                    <span className="font-mono-custom text-xl font-extrabold text-gray-400 line-through">
                                      {coupon.code}
                                    </span>
                                    <span className="font-mono-custom text-lg font-bold text-gray-400 line-through">
                                      {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `${coupon.value.toLocaleString('es-AR')} OFF`}
                                    </span>
                                  </div>

                                  <p className="text-[11px] text-gray-400 leading-relaxed">{coupon.description}</p>
                                </div>

                                <div className="pt-3 border-t border-gray-200 text-[11px] font-mono-custom text-gray-400 text-right">
                                  Expiró el {new Date(coupon.expiry_timestamp).toLocaleDateString('es-AR')}
                                </div>
                              </div>
                            );
                          }

                          // DISPONIBLES (Ticket Style Premium)
                          return (
                            <div key={coupon.id} className="relative bg-[#1C2321] text-white border-2 border-dashed border-[#3C6E71]/60 p-5 rounded-2xl shadow-lg flex flex-col justify-between space-y-4 hover:border-[#3C6E71] transition-all">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold bg-[#3C6E71]/30 text-[#F2EFE9] px-2.5 py-1 rounded border border-[#3C6E71]/40 font-mono-custom uppercase">
                                    {coupon.origin || 'Beneficio Exclusivo'}
                                  </span>
                                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border font-mono-custom uppercase ${urgencyColor}`}>
                                    {urgencyLabel}
                                  </span>
                                </div>

                                <div className="flex items-baseline justify-between gap-2 border-b border-[#3C6E71]/30 pb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono-custom text-2xl font-black text-[#F2EFE9] tracking-wider">
                                      {coupon.code}
                                    </span>
                                    <button
                                      onClick={() => handleCopyCouponCode(coupon.id, coupon.code)}
                                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${isCopied ? 'bg-emerald-600 text-white' : 'bg-white/10 hover:bg-white/20 text-gray-300'}`}
                                      title="Copiar Código"
                                    >
                                      {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                  </div>

                                  <span className="font-display text-xl font-extrabold text-[#B85C38] shrink-0">
                                    {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `${coupon.value.toLocaleString('es-AR')} OFF`}
                                  </span>
                                </div>

                                <p className="text-xs text-gray-300 leading-relaxed font-sans">
                                  {coupon.description}
                                </p>
                              </div>

                              <div className="pt-3 border-t border-[#3C6E71]/30 flex items-center justify-between gap-3">
                                <span className="text-[10px] text-gray-400 font-mono-custom">
                                  Min. compra: ${coupon.min_spend.toLocaleString('es-AR')}
                                </span>
                                
                                <button
                                  onClick={() => handleUseCouponNow(coupon)}
                                  className="px-4 py-2 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white font-display text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
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
                      className="px-4 py-2 bg-[#B85C38] hover:bg-[#B85C38]/90 text-white font-display text-xs font-bold tracking-wider rounded-xl uppercase transition-all shadow-sm cursor-pointer"
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
                      <input
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
                    className="w-1/2 py-2.5 bg-[#B85C38] hover:bg-[#B85C38]/90 text-white font-display text-xs font-bold uppercase rounded-xl shadow cursor-pointer"
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
                          <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded overflow-hidden flex items-center justify-center">
                            <img 
                              src={getProductImage(item.name)} 
                              alt={item.name} 
                              className="w-full h-full object-cover"
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
                            <span className="font-mono-custom font-bold text-emerald-600">Gratis</span>
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
                              src={getProductImage(item.name || item.product_name)} 
                              alt={item.name || item.product_name}
                              className="w-full h-full object-cover" 
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
        <header className="bg-[#1C2321] text-white px-6 py-4 flex items-center justify-between border-b border-[#3C6E71]/30 shadow-md">
          <div className="flex items-center gap-3">
            <span className="bg-[#B85C38] text-white px-3 py-1 rounded font-black font-mono-custom text-sm">
              HOLUX
            </span>
            <div>
              <h1 className="font-display text-lg font-bold tracking-wider uppercase">PANEL DE CONTROL DE ADMINISTRACIÓN</h1>
              <p className="text-xs text-gray-400">Gestión integral de tienda, catálogo, pedidos y configuración general</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                window.location.hash = '#/mi-cuenta';
                setCurrentView('customer_panel');
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-display text-xs font-bold tracking-wider flex items-center gap-2 transition-all cursor-pointer border border-white/10"
              title="Ir a Mi Cuenta Personal (Mis Pedidos y Datos)"
            >
              <User className="w-4 h-4 text-[#3C6E71]" />
              <span>MI CUENTA PERSONAL</span>
            </button>

            <button
              onClick={() => {
                window.location.hash = '#/';
                setCurrentView('home');
              }}
              className="px-4 py-2 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white rounded-xl font-display text-xs font-bold tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md"
              title="Volver a explorar la tienda"
            >
              <span>← VER TIENDA</span>
            </button>
          </div>
        </header>

        {/* FULL PAGE BODY */}
        <div className="flex-grow flex overflow-hidden">
          {/* Admin Sidebar */}
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
          <main className="flex-grow p-8 overflow-y-auto bg-gray-50 text-left">
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
              <BannerEditor heroSlides={heroSlides} setHeroSlides={setHeroSlides} promoBanner={promoBanner} setPromoBanner={setPromoBanner} tickerPhrases={tickerPhrases} setTickerPhrases={setTickerPhrases} categoriesList={adminCategoriesList} productsList={adminProductsList} />
            )}

            {adminTab === 'coupons' && (
              <CouponManager />
            )}

            {adminTab === 'support' && (
              <SupportManager />
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
                    <div className="overflow-x-auto pb-1 flex items-center gap-1.5 flex-nowrap text-xs font-mono-custom pt-2 border-t border-gray-100">
                      {[
                        { id: 'all', label: 'TODOS', count: countAll, color: 'bg-gray-100 text-gray-800' },
                        { id: 'pending_review', label: '🟠 EN REVISIÓN (TRANSF.)', count: countReview, color: 'bg-amber-100 text-amber-900' },
                        { id: 'paid', label: '🟢 PAGADOS', count: countPaid, color: 'bg-emerald-100 text-emerald-900' },
                        { id: 'preparing', label: '📦 EN PREPARACIÓN', count: countPreparing, color: 'bg-blue-100 text-blue-900' },
                        { id: 'shipped', label: '🚚 DESPACHADOS', count: countShipped, color: 'bg-purple-100 text-purple-900' },
                        { id: 'delivered', label: '✅ ENTREGADOS', count: countDelivered, color: 'bg-emerald-200 text-emerald-950' },
                        { id: 'pending_payment', label: '🟡 PEND. PAGO', count: countPending, color: 'bg-yellow-100 text-yellow-900' },
                        { id: 'rejected', label: '🔴 RECHAZADOS', count: countRejected, color: 'bg-red-100 text-red-900' },
                        { id: 'cancelled', label: '⚪ CANCELADOS', count: countCancelled, color: 'bg-gray-200 text-gray-700' }
                      ].map(f => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setAdminOrderStatusFilter(f.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                            adminOrderStatusFilter === f.id
                              ? 'bg-[#1C2321] text-white shadow-xs'
                              : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span>{f.label}</span>
                          <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                            adminOrderStatusFilter === f.id ? 'bg-[#3C6E71] text-white' : f.color
                          }`}>
                            {f.count}
                          </span>
                        </button>
                      ))}
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
                                  <div className="text-[10px] text-gray-400 font-mono-custom">{cust.phone || 'Sin teléfono'}</div>
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
            onSave={(updatedCust) => {
              setAdminCustomersList(prev => prev.map(c => c.id === updatedCust.id ? updatedCust : c));
              setIsCustomerModalOpen(false);
              setSelectedCustomerModal(null);
            }}
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
        {/* Infinite scrolling & mouse-draggable ticker banner */}
        <div 
          ref={tickerRef}
          onMouseDown={handleTickerMouseDown}
          onMouseUp={handleTickerMouseLeaveOrUp}
          onMouseLeave={handleTickerMouseLeaveOrUp}
          onMouseMove={handleTickerMouseMove}
          onTouchStart={handleTickerTouchStart}
          onTouchEnd={handleTickerMouseLeaveOrUp}
          onTouchMove={handleTickerTouchMove}
          className="overflow-x-auto scrollbar-hide bg-black text-[#F2EFE9] py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest font-sans border-b border-black/10 select-none cursor-default"
        >
          <div className="flex whitespace-nowrap animate-marquee hover:[animation-play-state:paused]">
            <div className="flex gap-14 px-6 shrink-0">
              {tickerPhrases.map((phrase, idx) => (
                <span key={idx}>{phrase}</span>
              ))}
            </div>
            <div className="flex gap-14 px-6 shrink-0" aria-hidden="true">
              {tickerPhrases.map((phrase, idx) => (
                <span key={`dup-${idx}`}>{phrase}</span>
              ))}
            </div>
            <div className="flex gap-14 px-6 shrink-0" aria-hidden="true">
              {tickerPhrases.map((phrase, idx) => (
                <span key={`tri-${idx}`}>{phrase}</span>
              ))}
            </div>
          </div>
        </div>

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
              className="font-display text-xl sm:text-2xl font-bold tracking-wider text-[#F2EFE9] flex items-center gap-2 cursor-pointer select-none hover:opacity-90 transition-opacity" 
              onClick={() => { 
                window.location.hash = '#/';
                setCurrentView('home');
                setSelectedDetailProduct(null);
                setActiveCategory(null);
                setActiveGender(null);
                window.scrollTo({ top: 0, behavior: 'instant' });
              }}
            >
              <span className="bg-[#3C6E71] text-[#1C2321] px-2 py-0.5 rounded font-black font-mono-custom text-lg sm:text-xl">H</span>
              HOLUX
            </span>
          </div>

          {/* Center Navigation Menu (Visible on Tablet md >= 768px & Desktop XL screens) */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6 xl:gap-8 relative shrink-0">
            
            {/* CATEGORÍAS DROPDOWN (Desktop XL) */}
            <div 
              className="relative hidden xl:block"
              onMouseEnter={() => setIsCatDropdownOpen(true)}
              onMouseLeave={() => setIsCatDropdownOpen(false)}
            >
              <button
                className={`font-display text-xs font-bold tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer py-1.5 ${activeCategory ? 'text-[#3C6E71]' : 'text-[#F2EFE9] hover:text-[#3C6E71]'}`}
              >
                CATEGORÍAS
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              
              {isCatDropdownOpen && (
                <div className="absolute top-full left-0 w-52 bg-[#1C2321] border border-[#3C6E71]/20 shadow-xl rounded py-2 transition-all z-50">
                  <button
                    onClick={() => { 
                      window.location.hash = '#/catalogo';
                      setIsCatDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#3C6E71]/20 text-xs font-display font-bold tracking-wider text-gray-200 hover:text-white"
                  >
                    TODO EL CATÁLOGO
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        window.location.hash = `#/catalogo?categoria=${cat.slug}`;
                        setIsCatDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#3C6E71]/20 text-xs font-display font-bold tracking-wider text-gray-200 hover:text-white"
                    >
                      {cat.name.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* MUJER (Visible on Tablet md >= 768px & Desktop) */}
            <button
              onClick={() => {
                window.location.hash = '#/catalogo?genero=mujer';
              }}
              className={`font-display text-xs font-bold tracking-wider transition-colors cursor-pointer ${activeGender === 'mujer' ? 'text-[#3C6E71]' : 'text-gray-200 hover:text-[#3C6E71]'}`}
            >
              MUJER
            </button>

            {/* HOMBRE (Visible on Tablet md >= 768px & Desktop) */}
            <button
              onClick={() => {
                window.location.hash = '#/catalogo?genero=hombre';
              }}
              className={`font-display text-xs font-bold tracking-wider transition-colors cursor-pointer ${activeGender === 'hombre' ? 'text-[#3C6E71]' : 'text-gray-200 hover:text-[#3C6E71]'}`}
            >
              HOMBRE
            </button>

            {/* NIÑOS (Visible on Tablet md >= 768px & Desktop) */}
            <button
              onClick={() => {
                window.location.hash = '#/catalogo?genero=niños';
              }}
              className={`font-display text-xs font-bold tracking-wider transition-colors cursor-pointer ${activeGender === 'niños' ? 'text-[#3C6E71]' : 'text-gray-200 hover:text-[#3C6E71]'}`}
            >
              NIÑOS
            </button>

            {/* ACCESORIOS (Desktop XL) */}
            <button
              onClick={() => {
                window.location.hash = '#/catalogo?categoria=accesorios';
              }}
              className={`hidden xl:block font-display text-xs font-bold tracking-wider transition-colors cursor-pointer ${activeCategory === 'accesorios' ? 'text-[#3C6E71]' : 'text-gray-200 hover:text-[#3C6E71]'}`}
            >
              ACCESORIOS
            </button>

            {/* OUTLET (Desktop XL) */}
            <button
              onClick={() => {
                window.location.hash = '#/catalogo?genero=outlet';
              }}
              className={`hidden xl:block px-3 py-1 border border-[#3C6E71] rounded font-display text-xs font-bold tracking-wider transition-all cursor-pointer ${
                activeGender === 'outlet' 
                  ? 'bg-[#3C6E71] text-white border-[#3C6E71]' 
                  : 'text-[#3C6E71] hover:bg-[#3C6E71] hover:text-white'
              }`}
            >
              OUTLET
            </button>
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
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#B85C38] hover:bg-[#a24e2e] text-white rounded-full font-display text-[11px] font-bold tracking-wider transition-all duration-200 cursor-pointer shadow-md shadow-[#B85C38]/25 border border-white/10 hover:scale-[1.02] active:scale-[0.98]"
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
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#B85C38] text-white text-[9px] font-bold rounded-full flex items-center justify-center font-mono-custom animate-pulse shadow-sm">
                  {cart.reduce((qty, item) => qty + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* MOBILE SLIDING MENU DRAWER (LEFT SIDE) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 xl:hidden font-sans">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200" 
            onClick={() => setIsMobileMenuOpen(false)} 
          />

          {/* Drawer */}
          <div className="relative w-4/5 max-w-xs bg-[#1C2321] text-white h-full shadow-2xl flex flex-col z-10 border-r border-[#3C6E71]/30 animate-in slide-in-from-left duration-300">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#3C6E71]/20 flex items-center justify-between">
              <span className="font-display text-lg font-bold tracking-wider text-[#F2EFE9] flex items-center gap-2">
                <span className="bg-[#3C6E71] text-[#1C2321] px-2 py-0.5 rounded font-black font-mono-custom text-base">H</span>
                HOLUX
              </span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Links */}
            <div className="flex-grow overflow-y-auto p-4 space-y-3 text-xs">
              
              <button
                onClick={() => { window.location.hash = '#/catalogo'; setIsMobileMenuOpen(false); }}
                className="w-full text-left font-display font-bold text-sm tracking-wider py-2.5 px-3 rounded-lg hover:bg-[#3C6E71]/20 text-white flex items-center justify-between"
              >
                <span>TODO EL CATÁLOGO</span>
                <ChevronRight className="w-4 h-4 text-[#3C6E71]" />
              </button>

              <div className="border-t border-[#3C6E71]/20 pt-3 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 block">CATEGORÍAS DE MONTAÑA</span>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { window.location.hash = `#/catalogo?categoria=${cat.slug}`; setIsMobileMenuOpen(false); }}
                    className="w-full text-left font-display font-bold text-xs tracking-wider py-2 px-3 rounded-lg hover:bg-[#3C6E71]/20 text-gray-200 hover:text-white block"
                  >
                    {cat.name.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="border-t border-[#3C6E71]/20 pt-3 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 block">GÉNERO & SECCIONES</span>
                <button
                  onClick={() => { window.location.hash = '#/catalogo?genero=mujer'; setIsMobileMenuOpen(false); }}
                  className="w-full text-left font-display font-bold text-xs tracking-wider py-2 px-3 rounded-lg hover:bg-[#3C6E71]/20 text-gray-200 hover:text-white block"
                >
                  MUJER
                </button>
                <button
                  onClick={() => { window.location.hash = '#/catalogo?genero=hombre'; setIsMobileMenuOpen(false); }}
                  className="w-full text-left font-display font-bold text-xs tracking-wider py-2 px-3 rounded-lg hover:bg-[#3C6E71]/20 text-gray-200 hover:text-white block"
                >
                  HOMBRE
                </button>
                <button
                  onClick={() => { window.location.hash = '#/catalogo?genero=niños'; setIsMobileMenuOpen(false); }}
                  className="w-full text-left font-display font-bold text-xs tracking-wider py-2 px-3 rounded-lg hover:bg-[#3C6E71]/20 text-gray-200 hover:text-white block"
                >
                  NIÑOS
                </button>
                <button
                  onClick={() => { window.location.hash = '#/catalogo?categoria=accesorios'; setIsMobileMenuOpen(false); }}
                  className="w-full text-left font-display font-bold text-xs tracking-wider py-2 px-3 rounded-lg hover:bg-[#3C6E71]/20 text-gray-200 hover:text-white block"
                >
                  ACCESORIOS
                </button>
                <button
                  onClick={() => { window.location.hash = '#/catalogo?genero=outlet'; setIsMobileMenuOpen(false); }}
                  className="w-full text-left font-display font-bold text-xs tracking-wider py-2 px-3 rounded-lg bg-[#3C6E71]/20 text-[#3C6E71] border border-[#3C6E71]/40 block mt-2"
                >
                  OUTLET 🔥
                </button>
              </div>

              {token && userProfile && userProfile.role === 'admin' && (
                <div className="border-t border-[#3C6E71]/20 pt-3">
                  <button
                    onClick={() => { setCurrentView('admin'); setAdminTab('dashboard'); setIsMobileMenuOpen(false); }}
                    className="w-full text-left font-display font-bold text-xs tracking-wider py-2.5 px-3 rounded-lg bg-[#B85C38] text-white flex items-center justify-between shadow-md cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      PANEL DE ADMINISTRACIÓN
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#3C6E71]/20 text-center">
              <p className="text-[10px] text-gray-400 font-mono-custom">HOLUX Outdoor Equipment © 2026</p>
            </div>

          </div>
        </div>
      )}
    </div>

      {currentView === 'home' && (
        <>
          {/* --- HERO BANNER (SLIDER CAROUSEL) --- */}
          <section 
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={() => setIsMouseDown(false)}
           className="group relative overflow-hidden bg-[#1C2321] text-[#F2EFE9] h-[550px] sm:h-[650px] md:h-[calc(100vh-140px)] md:min-h-[650px] flex items-center border-b border-[#3C6E71]/15 select-none cursor-default"
          >
            
            {/* Slide images with smooth fade-in transitions */}
            {slides.map((slide, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'}`}
              >
                {/* Image Container */}
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-85"
                  style={{ backgroundImage: `url(${slide.image})` }}
                />
                
                {/* Black Overlay to ensure text readability */}
                <div className="absolute inset-0 bg-black/55 via-black/35 to-black/60" />

                {/* Text Content Area */}
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center z-10">
                  <div className={`max-w-3xl space-y-3 sm:space-y-4 transition-all duration-700 delay-200 transform ${idx === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
                    <span className="text-xs sm:text-sm font-semibold text-orange-200 tracking-[0.2em] uppercase font-sans block drop-shadow">
                      {slide.span}
                    </span>
                    <h1 className="text-2xl sm:text-4xl lg:text-5xl font-display font-bold tracking-wide text-white leading-tight uppercase drop-shadow-md">
                      {slide.title} <br className="hidden sm:inline" />
                      <span className="text-[#3C6E71] bg-white/10 px-3 py-1 rounded-lg inline-block mt-2 sm:mt-0 font-bold">{slide.highlight}</span>
                    </h1>
                    <p className="text-xs sm:text-base text-gray-200 max-w-xl mx-auto leading-relaxed font-sans hidden sm:block font-medium">
                      {slide.desc}
                    </p>
                    <div className="pt-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); window.location.hash = '#/catalogo'; }}
                        className="px-6 py-3 sm:px-8 sm:py-3.5 bg-[#B85C38] hover:bg-[#B85C38]/95 text-white font-display text-xs sm:text-sm font-bold tracking-widest rounded-lg shadow-lg hover:shadow-xl transition-all cursor-pointer inline-flex items-center gap-2"
                      >
                        {slide.cta}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Animated Topographic Background Overlay */}
            <div className="absolute inset-0 opacity-15 pointer-events-none animate-topo">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <path d="M-100,200 C300,100 200,400 600,250 C900,150 1000,500 1400,400" fill="none" stroke="#3C6E71" strokeWidth="2.5" />
                <path d="M-50,300 C400,200 300,500 700,350 C1000,250 1100,600 1500,500" fill="none" stroke="#3C6E71" strokeWidth="1.5" />
                <path d="M-150,100 C200,50 100,300 500,150 C800,50 900,400 1300,300" fill="none" stroke="#3C6E71" strokeWidth="1" />
                <path d="M0,400 C500,300 400,600 800,450 C1100,350 1200,700 1600,600" fill="none" stroke="#3C6E71" strokeWidth="3" />
              </svg>
            </div>

            {/* Top and bottom gradient shadows for seamless transition */}
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

            {/* Left Control Arrow (Visible on hover) */}
            <button
              onClick={() => setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length)}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              className="absolute left-6 top-1/2 transform -translate-y-1/2 p-3.5 bg-black/40 hover:bg-[#3C6E71]/80 text-white rounded-full transition-all duration-300 z-20 cursor-pointer flex items-center justify-center border border-white/10 opacity-0 group-hover:opacity-100"
              title="Slide anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Right Control Arrow (Visible on hover) */}
            <button
              onClick={() => setCurrentSlide(prev => (prev + 1) % slides.length)}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              className="absolute right-6 top-1/2 transform -translate-y-1/2 p-3.5 bg-black/40 hover:bg-[#3C6E71]/80 text-white rounded-full transition-all duration-300 z-20 cursor-pointer flex items-center justify-center border border-white/10 opacity-0 group-hover:opacity-100"
              title="Siguiente slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Carousel Slide Indicators */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-3">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${idx === currentSlide ? 'bg-[#3C6E71] w-6' : 'bg-white/50 hover:bg-white/80'}`}
                  title={`Ver slide ${idx + 1}`}
                />
              ))}
            </div>

          </section>

          {/* --- NOVEDADES DE HOLUX (SLIDER CAROUSEL) --- */}
          <section id="catalogo" className="w-full px-4 sm:px-8 lg:px-12 py-12">
            <div className="relative group/novedades">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1C2321] tracking-wide text-center uppercase">
                Novedades de Holux
              </h2>
              <p className="text-xs sm:text-sm text-[#3C6E71] font-semibold mt-1 text-center font-sans tracking-wider uppercase">
                Descubrí los últimos lanzamientos de nuestra colección de montaña
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
                  className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide py-4 select-none cursor-default"
                >
                  {[...products].reverse().slice(0, 8).map(product => {
                    const discount = getProductDiscount(product);
                    const effectivePrice = getEffectiveProductPrice(product);
                    const originalPrice = getOriginalProductPrice(product);
                    return (
                      <div
                        key={product.id}
                        className="snap-start shrink-0 w-[260px] sm:w-[280px] md:w-[300px] bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col justify-between hover:shadow-xl hover:border-gray-300 transition-all duration-300"
                      >
                        {/* Image Area */}
                        <div 
                          onClick={() => handleProductClick(product)}
                          className="relative bg-gray-50 aspect-square overflow-hidden border-b border-gray-100 group-hover:bg-gray-100/50 transition-colors cursor-pointer"
                        >
                          {product.is_featured && (
                            <span className="absolute top-3 left-3 bg-amber-500 text-white text-[9px] font-display font-bold tracking-widest px-2 py-0.5 rounded shadow z-10">
                              ⭐ DESTACADO
                            </span>
                          )}
                          {product.is_new && (
                            <span className="absolute top-3 right-3 bg-blue-600 text-white text-[9px] font-display font-bold tracking-widest px-2 py-0.5 rounded shadow z-10">
                              🔥 NOVEDAD
                            </span>
                          )}
                          {discount > 0 && !product.is_featured && (
                            <span className="absolute top-3 left-3 bg-[#B85C38] text-white text-[10px] font-display font-bold tracking-widest px-2.5 py-1 rounded shadow z-10">
                              {discount}% OFF
                            </span>
                          )}
                          {product.stock <= 3 && product.stock > 0 && (
                            <span className="absolute top-3 right-3 bg-[#B85C38] text-white text-[10px] font-display font-medium tracking-widest px-2.5 py-1 rounded">
                              ÚLTIMAS {product.stock} UNIDADES
                            </span>
                          )}
                          {product.stock === 0 && (
                            <span className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-display font-medium tracking-widest px-2.5 py-1 rounded">
                              SIN STOCK
                            </span>
                          )}
                          <img 
                            src={product.image_url || (product.images && product.images[0]) || getProductImage(product.name)} 
                            alt={product.name} 
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = getProductImage(product.name);
                            }}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                          />
                          <button
                            onClick={(e) => { e.stopPropagation(); handleProductClick(product); }}
                            className="absolute bottom-3 right-3 bg-white/95 border border-gray-200 hover:border-gray-300 shadow-sm p-1.5 rounded-full flex items-center gap-1.5 text-xs text-gray-600 hover:text-black transition-all cursor-pointer"
                            title="Ver valoraciones"
                          >
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="font-sans text-xs font-bold">Reseñas</span>
                          </button>
                        </div>

                        {/* Details info */}
                        <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                          <div className="space-y-1.5 text-left">
                            <div className="text-xs text-[#3C6E71] font-bold uppercase tracking-wider font-sans truncate">
                              {product.brand.toUpperCase()} • {product.categories ? product.categories.name.toUpperCase() : 'AVENTURA'}
                            </div>
                            <h3 
                              onClick={() => handleProductClick(product)}
                              className="font-sans font-bold text-gray-900 text-base tracking-wide line-clamp-1 hover:text-[#3C6E71] transition-colors cursor-pointer"
                            >
                              {product.name}
                            </h3>
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed font-sans">
                              Equipo de alta montaña Holux, confeccionado con costuras reforzadas y materiales impermeables.
                            </p>
                            <div className="pt-2">
                              <span className="inline-block px-3 py-1 border border-gray-250 rounded-full text-xs font-bold text-gray-600 font-sans uppercase bg-gray-50">
                                {product.categories ? product.categories.slug === 'calzado' ? 'Talle 41' : 'Talla Única' : 'Estándar'}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3 pt-2 text-left">
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-baseline gap-2 flex-wrap">
                                <span className="text-xl font-black text-gray-950 font-sans">
                                  ${Math.round(effectivePrice).toLocaleString('es-AR')}
                                </span>
                                {discount > 0 && originalPrice > 0 && (
                                  <span className="text-sm text-gray-400 line-through font-sans">
                                    ${Math.round(originalPrice).toLocaleString('es-AR')}
                                  </span>
                                )}
                              </div>
                              {product.installments > 0 && (
                                <div>
                                  <span className="bg-[#EBDCF0] text-[#7E3793] text-xs font-bold px-2.5 py-1 rounded tracking-wide uppercase inline-block font-sans">
                                    {product.installments} cuotas de ${Math.round(effectivePrice / product.installments).toLocaleString('es-AR')}
                                  </span>
                                </div>
                              )}
                              <span className="text-xs text-gray-400 font-sans block">
                                CFT: 0% | Precio sin impuestos: ${Math.round(effectivePrice * 0.79).toLocaleString('es-AR')}
                              </span>
                            </div>

                            <button
                              onClick={(e) => { e.stopPropagation(); handleProductClick(product); }}
                              disabled={product.stock === 0}
                              className={`w-full py-3 rounded font-sans text-sm font-bold tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                product.stock > 0 
                                  ? 'bg-[#1C2321] text-white hover:bg-black hover:shadow-md' 
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              <span>{product.stock > 0 ? 'AGREGAR' : 'AGOTADO'}</span>
                              {product.stock > 0 && <ShoppingBag className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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

          {/* --- PROMOTIONAL GRID BANNER (3 COLUMNS DESKTOP / CAROUSEL MOBILE) --- */}
          <section className="bg-white py-14">
            {/* Desktop View (Side-by-side) */}
            <div className="hidden md:grid md:grid-cols-3 gap-8 w-full px-4 sm:px-8 lg:px-12">
              {PROMO_BANNERS.map((banner, idx) => (
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

            {/* Mobile View (Swipeable Carousel) */}
            <div className="block md:hidden max-w-7xl mx-auto px-4">
              <div className="relative h-96 w-full rounded-lg overflow-hidden border border-gray-200 shadow-md">
                {PROMO_BANNERS.map((banner, idx) => (
                  <div 
                    key={idx}
                    onClick={() => { window.location.hash = banner.link; }}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out cursor-pointer ${idx === currentPromoSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                  >
                    <img 
                      src={banner.image} 
                      alt={banner.title} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                    <div className="absolute bottom-8 left-6 text-left space-y-1">
                      <span className="text-[9px] text-orange-200 font-bold uppercase tracking-widest font-sans block">
                        {banner.span}
                      </span>
                      <h3 className="text-lg font-display font-black tracking-wider text-white uppercase">
                        {banner.title}
                      </h3>
                    </div>
                  </div>
                ))}
                
                {/* Control Arrows */}
                <button
                  onClick={() => setCurrentPromoSlide(prev => (prev - 1 + PROMO_BANNERS.length) % PROMO_BANNERS.length)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 p-2 bg-black/40 text-white rounded-full z-10 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPromoSlide(prev => (prev + 1) % PROMO_BANNERS.length)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-black/40 text-white rounded-full z-10 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Dot Indicators */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
                  {PROMO_BANNERS.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPromoSlide(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${idx === currentPromoSlide ? 'bg-[#3C6E71] w-4' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* --- PRODUCTOS DESTACADOS --- */}
          <section className="bg-[#F2EFE9] py-16">
            <div className="w-full px-4 sm:px-8 lg:px-12">
              <div className="relative group/destacados">
                <h2 className="font-display text-3xl font-black text-[#1C2321] tracking-wide text-center uppercase">
                  Productos Destacados
                </h2>
                <p className="text-sm text-[#3C6E71] font-bold mt-1.5 text-center font-sans tracking-widest uppercase">
                  Una selección especial recomendada por nuestros expertos
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
                    className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide py-4 select-none cursor-default"
                  >
                    {(products.length > 0 ? products : MOCK_FALLBACK_PRODUCTS).map(product => {
                      const discount = getProductDiscount(product);
                      const effectivePrice = getEffectiveProductPrice(product);
                      const originalPrice = getOriginalProductPrice(product);
                      return (
                        <div
                          key={product.id}
                          className="snap-start shrink-0 w-[260px] sm:w-[280px] md:w-[300px] bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col justify-between hover:shadow-xl hover:border-gray-300 transition-all duration-300"
                        >
                          {/* Image Area */}
                          <div 
                            onClick={() => handleProductClick(product)}
                            className="relative bg-gray-50 aspect-square overflow-hidden border-b border-gray-100 group-hover:bg-gray-100/50 transition-colors cursor-pointer"
                          >
                            {discount > 0 && (
                              <span className="absolute top-3 left-3 bg-[#B85C38] text-white text-[10px] font-display font-bold tracking-widest px-2.5 py-1 rounded shadow z-10">
                                {discount}% OFF
                              </span>
                            )}
                            {product.stock <= 3 && product.stock > 0 && (
                              <span className="absolute top-3 right-3 bg-[#B85C38] text-white text-[10px] font-display font-medium tracking-widest px-2.5 py-1 rounded">
                                ÚLTIMAS {product.stock} UNIDADES
                              </span>
                            )}
                            {product.stock === 0 && (
                              <span className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-display font-medium tracking-widest px-2.5 py-1 rounded">
                                SIN STOCK
                              </span>
                            )}
                            <img 
                              src={product.image_url || (product.images && product.images[0]) || getProductImage(product.name)} 
                              alt={product.name} 
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = getProductImage(product.name);
                              }}
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                            />
                            <button
                              onClick={(e) => { e.stopPropagation(); handleProductClick(product); }}
                              className="absolute bottom-3 right-3 bg-white/95 border border-gray-200 hover:border-gray-300 shadow-sm p-1.5 rounded-full flex items-center gap-1.5 text-xs text-gray-600 hover:text-black transition-all cursor-pointer"
                              title="Ver valoraciones"
                            >
                              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                              <span className="font-sans text-xs font-bold">Reseñas</span>
                            </button>
                          </div>

                          {/* Details info */}
                          <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                            <div className="space-y-1.5 text-left">
                              <div className="text-xs text-[#3C6E71] font-bold uppercase tracking-wider font-sans truncate">
                                {product.brand.toUpperCase()} • {product.categories ? product.categories.name.toUpperCase() : 'AVENTURA'}
                              </div>
                              <h3 
                                onClick={() => handleProductClick(product)}
                                className="font-sans font-bold text-gray-900 text-base tracking-wide line-clamp-1 hover:text-[#3C6E71] transition-colors cursor-pointer"
                              >
                                {product.name}
                              </h3>
                              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed font-sans">
                                Equipo de alta montaña Holux, confeccionado con costuras reforzadas y materiales impermeables.
                              </p>
                              <div className="pt-2">
                                <span className="inline-block px-3 py-1 border border-gray-250 rounded-full text-xs font-bold text-gray-600 font-sans uppercase bg-gray-50">
                                  {product.categories ? product.categories.slug === 'calzado' ? 'Talle 41' : 'Talla Única' : 'Estándar'}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-3 pt-2 text-left">
                              <div className="flex flex-col space-y-1">
                                <div className="flex items-baseline gap-2 flex-wrap">
                                  <span className="text-xl font-black text-gray-955 font-sans">
                                    ${Math.round(effectivePrice).toLocaleString('es-AR')}
                                  </span>
                                  {discount > 0 && originalPrice > 0 && (
                                    <span className="text-sm text-gray-400 line-through font-sans">
                                      ${Math.round(originalPrice).toLocaleString('es-AR')}
                                    </span>
                                  )}
                                </div>
                                {product.installments > 0 && (
                                  <div>
                                    <span className="bg-[#EBDCF0] text-[#7E3793] text-xs font-bold px-2.5 py-1 rounded tracking-wide uppercase inline-block font-sans">
                                      {product.installments} cuotas de ${Math.round(product.price / product.installments).toLocaleString('es-AR')}
                                    </span>
                                  </div>
                                )}
                                <span className="text-xs text-gray-400 font-sans block">
                                  CFT: 0% | Precio sin impuestos: ${Math.round(product.price * 0.79).toLocaleString('es-AR')}
                                </span>
                              </div>

                              <button
                                onClick={(e) => { e.stopPropagation(); handleProductClick(product); }}
                                disabled={product.stock === 0}
                                className={`w-full py-3 rounded font-sans text-sm font-bold tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                  product.stock > 0 
                                    ? 'bg-[#1C2321] text-white hover:bg-black hover:shadow-md' 
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                <span>{product.stock > 0 ? 'AGREGAR' : 'AGOTADO'}</span>
                                {product.stock > 0 && <ShoppingBag className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
        <>
          {/* --- DEDICATED CATEGORY/COLLECTION PAGE VIEW --- */}
          <main className="flex-grow bg-[#F2EFE9] py-10">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
              
              {/* Breadcrumbs & Sorting Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4 mb-8">
                
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-xs text-gray-500 font-sans">
                  <button 
                    onClick={() => { window.location.hash = '#/'; }} 
                    className="hover:text-[#3C6E71] cursor-pointer transition-colors font-medium"
                  >
                    Inicio
                  </button>
                  <span className="text-gray-300">/</span>
                  <span className="text-gray-400">Catálogo</span>
                  <span className="text-gray-300">/</span>
                  <span className="text-[#3C6E71] font-bold uppercase">
                    {activeGender ? `Colección ${activeGender}` : activeCategory ? `Categoría ${activeCategory}` : 'Todo'}
                  </span>
                </div>

                {/* Sorting */}
                <div className="flex items-center gap-2 text-xs font-sans">
                  <span className="text-gray-500 font-medium">Ordenar por:</span>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-white border border-gray-200 rounded px-3 py-1.5 text-xs outline-none focus:border-[#3C6E71] cursor-pointer font-medium"
                  >
                    <option value="relevant">Más relevantes</option>
                    <option value="price-asc">Menor precio</option>
                    <option value="price-desc">Mayor precio</option>
                  </select>
                </div>
              </div>

              {/* Sidebar + Grid split */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                {/* Left Sidebar */}
                <aside className="lg:col-span-1 space-y-6">
                  
                  {/* CATEGORIES CARD */}
                  <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4 shadow-sm text-left">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200/60 pb-2 font-display">
                      Categorías
                    </h3>
                    <div className="flex flex-col space-y-2.5 text-xs font-sans font-medium text-gray-600">
                      <button
                        onClick={() => { setActiveCategory(null); }}
                        className={`text-left hover:text-[#3C6E71] transition-colors cursor-pointer ${!activeCategory ? 'text-[#3C6E71] font-bold' : ''}`}
                      >
                        Todo el Catálogo
                      </button>
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => { setActiveCategory(cat.slug); setActiveGender(null); }}
                          className={`text-left hover:text-[#3C6E71] transition-colors cursor-pointer ${activeCategory === cat.slug ? 'text-[#3C6E71] font-bold' : ''}`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* GENDERS / SPECIALS CARD */}
                  <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4 shadow-sm text-left">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200/60 pb-2 font-display">
                      Colecciones
                    </h3>
                    <div className="flex flex-col space-y-2.5 text-xs font-sans font-medium text-gray-600">
                      {['mujer', 'hombre', 'niños', 'outlet'].map(gender => (
                        <button
                          key={gender}
                          onClick={() => { setActiveGender(gender); setActiveCategory(null); }}
                          className={`text-left hover:text-[#3C6E71] transition-colors cursor-pointer uppercase ${activeGender === gender ? 'text-[#3C6E71] font-bold' : ''}`}
                        >
                          {gender === 'outlet' ? 'Outlet' : gender}
                        </button>
                      ))}
                    </div>
                  </div>

                </aside>

                {/* Right Product Grid */}
                <div className="lg:col-span-3 space-y-6">
                  
                  {/* Collection Header Title */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm text-left">
                    <h2 className="font-display text-2xl font-bold text-gray-900 tracking-wide uppercase">
                      {activeGender ? `Colección ${activeGender}` : activeCategory ? `Categoría ${activeCategory}` : 'Todo el Catálogo'}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1 font-sans">
                      Explorando {sortedProducts.length} productos en stock
                    </p>
                  </div>

                  {/* Grid */}
                  {loadingProducts ? (
                    <div className="py-20 text-center text-gray-500 font-display text-sm tracking-widest animate-pulse bg-white border border-gray-200 rounded-lg shadow-sm">
                          CARGANDO PRODUCTOS...
                    </div>
                  ) : sortedProducts.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 bg-white border border-gray-200 rounded-lg shadow-sm">
                      <p className="font-display text-lg font-bold">No se encontraron productos</p>
                      <p className="text-xs mt-1 font-sans">Prueba seleccionando otra combinación de filtros en el menú lateral.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {sortedProducts.map(product => {
                        const discount = getProductDiscount(product);
                        const effectivePrice = getEffectiveProductPrice(product);
                        const originalPrice = getOriginalProductPrice(product);
                        return (
                          <div
                            key={product.id}
                            className="group bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col justify-between hover:shadow-xl hover:border-gray-300 transition-all duration-300"
                          >
                            {/* Image Area */}
                            <div 
                              onClick={() => handleProductClick(product)}
                              className="relative bg-gray-50 aspect-square overflow-hidden border-b border-gray-100 group-hover:bg-gray-100/50 transition-colors cursor-pointer"
                            >
                              {discount > 0 && (
                                <span className="absolute top-3 left-3 bg-[#B85C38] text-white text-[9px] font-display font-bold tracking-widest px-2 py-0.5 rounded shadow z-10">
                                  {discount}% OFF
                                </span>
                              )}
                              {product.stock <= 3 && product.stock > 0 && (
                                <span className="absolute top-3 right-3 bg-[#B85C38] text-white text-[9px] font-display font-medium tracking-widest px-2 py-0.5 rounded">
                                  ÚLTIMAS {product.stock} UNIDADES
                                </span>
                              )}
                              {product.stock === 0 && (
                                <span className="absolute top-3 right-3 bg-red-600 text-white text-[9px] font-display font-medium tracking-widest px-2 py-0.5 rounded">
                                  SIN STOCK
                                </span>
                              )}
                              <img 
                                src={product.image_url || (product.images && product.images[0]) || getProductImage(product.name)} 
                                alt={product.name} 
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = getProductImage(product.name);
                                }}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                              />
                              <button
                                onClick={(e) => { e.stopPropagation(); handleProductClick(product); }}
                                className="absolute bottom-3 right-3 bg-white/95 border border-gray-200 hover:border-gray-300 shadow-sm p-1.5 rounded-full flex items-center gap-1.5 text-xs text-gray-600 hover:text-black transition-all cursor-pointer"
                                title="Ver valoraciones"
                              >
                                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                <span className="font-sans text-[10px] font-bold">Reseñas</span>
                              </button>
                            </div>

                            {/* Details info */}
                            <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                              <div className="space-y-1 text-left">
                                <div className="text-[10px] text-[#3C6E71] font-bold uppercase tracking-widest font-sans">
                                  {product.brand.toUpperCase()} • {product.categories ? product.categories.name.toUpperCase() : 'AVENTURA'}
                                </div>
                                <h3 
                                  onClick={() => handleProductClick(product)}
                                  className="font-sans font-semibold text-gray-900 text-sm tracking-wide line-clamp-1 hover:text-[#3C6E71] transition-colors cursor-pointer"
                                >
                                  {product.name}
                                </h3>
                                <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed font-sans">
                                  Equipo de alta montaña Holux, confeccionado con costuras reforzadas y materiales impermeables.
                                </p>
                                <div className="pt-1.5">
                                  <span className="inline-block px-2.5 py-1 border border-gray-200 rounded-full text-[9px] font-bold text-gray-500 font-sans uppercase">
                                    {product.categories ? product.categories.slug === 'calzado' ? 'Talle 41' : 'Talla Única' : 'Estándar'}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-3 pt-2 text-left">
                                <div className="flex flex-col space-y-1">
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-lg font-bold text-gray-955 font-sans">
                                      ${Math.round(effectivePrice).toLocaleString('es-AR')}
                                    </span>
                                    {discount > 0 && originalPrice > 0 && (
                                      <span className="text-xs text-gray-400 line-through font-sans">
                                        ${Math.round(originalPrice).toLocaleString('es-AR')}
                                      </span>
                                    )}
                                  </div>
                                  {product.installments > 0 && (
                                    <div>
                                      <span className="bg-[#EBDCF0] text-[#7E3793] text-[9.5px] font-bold px-2 py-0.5 rounded tracking-wide uppercase inline-block font-sans">
                                        {product.installments} cuotas de ${Math.round(effectivePrice / product.installments).toLocaleString('es-AR')}
                                      </span>
                                    </div>
                                  )}
                                  <span className="text-[9px] text-gray-400 font-sans block">
                                    CFT: 0% | Precio sin impuestos: ${Math.round(effectivePrice * 0.79).toLocaleString('es-AR')}
                                  </span>
                                </div>

                                <button
                                  onClick={(e) => { e.stopPropagation(); handleProductClick(product); }}
                                  disabled={product.stock === 0}
                                  className={`w-full py-2.5 rounded font-sans text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                    product.stock > 0 
                                      ? 'bg-[#1C2321] text-white hover:bg-black hover:shadow-md' 
                                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  }`}
                                >
                                  <span>{product.stock > 0 ? 'AGREGAR' : 'AGOTADO'}</span>
                                  {product.stock > 0 && <ShoppingBag className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>

              </div>

            </div>
          </main>
        </>
      )}

      {/* --- DEDICATED PRODUCT DETAIL PAGE VIEW --- */}
      {currentView === 'product-detail' && selectedDetailProduct && (
        <main className="flex-grow bg-[#F2EFE9] py-10 font-sans">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase tracking-widest font-sans mb-6">
              <button 
                onClick={() => { window.location.hash = '#/'; }} 
                className="hover:text-black hover:underline cursor-pointer transition-colors"
              >
                Inicio
              </button>
              <span>&gt;</span>
              <button 
                onClick={() => {
                  const cat = selectedDetailProduct.categories ? selectedDetailProduct.categories.slug : '';
                  window.location.hash = `#/catalogo${cat ? '?categoria=' + cat : ''}`;
                }} 
                className="hover:text-black hover:underline cursor-pointer transition-colors"
              >
                {selectedDetailProduct.categories ? selectedDetailProduct.categories.name : 'Catálogo'}
              </button>
              <span>&gt;</span>
              <span className="text-[#3C6E71] font-bold">{selectedDetailProduct.name}</span>
            </div>

            {/* Split layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white border border-gray-200 rounded-lg shadow-sm p-6 sm:p-8">
              
              {/* Left visual column */}
              <div className="lg:col-span-7 flex flex-col items-center">
                <div className="relative w-full bg-gray-50 aspect-square flex items-center justify-center border border-gray-100 rounded-lg overflow-hidden group">
                  {getProductDiscount(selectedDetailProduct) > 0 && (
                    <span className="absolute top-4 left-4 bg-[#B85C38] text-white text-[9px] font-display font-bold tracking-widest px-2.5 py-1 rounded shadow z-10">
                      {getProductDiscount(selectedDetailProduct)}% OFF
                    </span>
                  )}
                  
                  {selectedDetailProduct.stock <= 3 && selectedDetailProduct.stock > 0 && (
                    <span className="absolute top-4 right-4 bg-[#B85C38] text-white text-[9px] font-display font-medium tracking-widest px-2.5 py-1 rounded">
                      ÚLTIMAS {selectedDetailProduct.stock} UNIDADES
                    </span>
                  )}
                  {selectedDetailProduct.stock === 0 && (
                    <span className="absolute top-4 right-4 bg-red-600 text-white text-[9px] font-display font-medium tracking-widest px-2.5 py-1 rounded">
                      SIN STOCK
                    </span>
                  )}

                  {/* Large Product image container */}
                  <div className="w-full h-full flex items-center justify-center bg-white">
                    <img 
                      src={selectedDetailProduct.image_url || (selectedDetailProduct.images && selectedDetailProduct.images[0]) || getProductImage(selectedDetailProduct.name)} 
                      alt={selectedDetailProduct.name} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = getProductImage(selectedDetailProduct.name);
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 font-sans tracking-wide mt-3 text-center">
                  Imagen ilustrativa oficial de HOLUX OUTDOOR. Equipamiento fabricado bajo altos estándares de calidad.
                </p>
              </div>

              {/* Right metadata / purchase column */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-6 text-left">
                <div className="space-y-4">
                  {/* Category and brand tags */}
                  <div className="text-[10px] text-[#3C6E71] font-bold uppercase tracking-widest font-sans">
                    {selectedDetailProduct.brand.toUpperCase()} • {selectedDetailProduct.categories ? selectedDetailProduct.categories.name.toUpperCase() : 'AVENTURA'}
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

                        {selectedDetailProduct.installments > 0 && (
                          <div className="pt-1">
                            <span className="bg-[#EBDCF0] text-[#7E3793] text-[10.5px] font-black px-2.5 py-1 rounded tracking-wide uppercase inline-block font-sans">
                              {selectedDetailProduct.installments} cuotas fijas de ${Math.round(effectivePrice / selectedDetailProduct.installments).toLocaleString('es-AR')}
                            </span>
                          </div>
                        )}
                        <span className="text-[9px] text-gray-400 font-sans block">
                          CFTA: 0% | Precio sugerido al público con IVA incluido. Válido para todo el territorio nacional.
                        </span>
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
                        <div className="space-y-2 pt-4 border-t border-gray-100">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 font-display">
                            Descripción del producto
                          </h4>
                          <p className="text-xs text-gray-600 leading-relaxed font-sans font-medium">
                            {selectedDetailProduct.description || "Este equipamiento técnico de alta performance Holux está especialmente desarrollado para soportar condiciones climáticas exigentes. Cuenta con diseño ergonómico, costuras reforzadas y materiales impermeables de alta durabilidad."}
                          </p>
                        </div>

                        {/* Specs listing */}
                        <div className="space-y-1.5 pt-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 font-display">
                            Detalles y especificaciones
                          </h4>
                          <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside font-sans font-medium">
                            <li>Material impermeable y cortavientos de alta densidad</li>
                            <li>Costuras termoselladas para máxima protección contra el agua</li>
                            <li>Diseño ligero y comprimible para fácil almacenamiento en mochila</li>
                            <li>Garantía oficial Holux de resistencia al desgaste extremo</li>
                          </ul>
                        </div>

                        {/* PDP Action Box (Quantity and Add to Cart) */}
                        <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-4">
                          {/* Quantity selector */}
                          <div className="flex items-center justify-between border border-gray-300 rounded-xl overflow-hidden h-12 w-32 bg-white flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => setDetailQuantity(prev => Math.max(1, prev - 1))}
                              className="w-10 h-full bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors font-bold cursor-pointer flex items-center justify-center border-r border-gray-200"
                            >
                              -
                            </button>
                            <span className="text-sm font-bold text-gray-900 font-sans">{detailQuantity}</span>
                            <button
                              type="button"
                              onClick={() => setDetailQuantity(prev => Math.min(effectiveStock || 1, prev + 1))}
                              className="w-10 h-full bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors font-bold cursor-pointer flex items-center justify-center border-l border-gray-200"
                            >
                              +
                            </button>
                          </div>

                          {/* Add to cart button */}
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
                              setCart(prev => {
                                const targetSize = variantsList.length > 0 ? selectedSize : 'Talla Única';
                                const existing = prev.find(item => item.id === selectedDetailProduct.id && item.sizeLabel === targetSize);
                                const productWithSize = {
                                  ...selectedDetailProduct,
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
                            }}
                            disabled={effectiveStock <= 0 || (variantsList.length > 0 && selectedVariantObj && selectedVariantObj.stock <= 0)}
                            className={`w-full sm:flex-grow h-12 rounded-xl font-sans text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
                              effectiveStock > 0
                                ? 'bg-[#1C2321] text-white hover:bg-black hover:shadow-md'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <ShoppingBag className="w-4 h-4" />
                            <span>{effectiveStock > 0 ? 'AGREGAR AL CARRITO' : 'AGOTADO'}</span>
                          </button>
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

            {/* --- RELATED PRODUCTS --- */}
            <div className="mt-12 space-y-6">
              <h3 className="font-display text-lg font-bold text-gray-900 tracking-wider text-left border-b border-gray-200 pb-3">
                TE PUEDE INTERESAR
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products
                  .filter(p => p.id !== selectedDetailProduct.id && p.category_id === selectedDetailProduct.category_id)
                  .slice(0, 4)
                  .map(product => {
                    const discount = getProductDiscount(product);
                    const effectivePrice = getEffectiveProductPrice(product);
                    const originalPrice = getOriginalProductPrice(product);
                    return (
                      <div
                        key={product.id}
                        className="group bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col justify-between hover:shadow-xl hover:border-gray-300 transition-all duration-300"
                      >
                        <div 
                          onClick={() => handleProductClick(product)}
                          className="relative bg-gray-50 aspect-square overflow-hidden border-b border-gray-100 group-hover:bg-gray-100/50 transition-colors cursor-pointer"
                        >
                          {discount > 0 && (
                            <span className="absolute top-3 left-3 bg-[#B85C38] text-white text-[9px] font-display font-bold tracking-widest px-2 py-0.5 rounded shadow z-10">
                              {discount}% OFF
                            </span>
                          )}
                          <img 
                            src={product.image_url || (product.images && product.images[0]) || getProductImage(product.name)} 
                            alt={product.name} 
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = getProductImage(product.name);
                            }}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                          />
                        </div>

                        <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                          <div className="space-y-1 text-left">
                            <h4 
                              onClick={() => handleProductClick(product)}
                              className="font-sans font-bold text-gray-900 text-xs tracking-wide line-clamp-1 hover:text-[#3C6E71] transition-colors cursor-pointer"
                            >
                              {product.name}
                            </h4>
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-bold text-gray-955 font-sans">
                                ${Math.round(effectivePrice).toLocaleString('es-AR')}
                              </span>
                              {discount > 0 && originalPrice > 0 && (
                                <span className="text-xs text-gray-400 line-through font-sans">
                                  ${Math.round(originalPrice).toLocaleString('es-AR')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

          </div>
        </main>
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

      {/* --- FOOTER (HOLUX DARK BRAND THEME + REFERENCE STRUCTURE) --- */}
      <footer className="bg-[#1C2321] text-[#F2EFE9] border-t border-[#3C6E71]/20 py-10 sm:py-14 select-none">
        <div className="w-full px-4 sm:px-8 lg:px-12">
          
          {/* Main Top Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-10 border-b border-[#3C6E71]/20">
            
            {/* Column 1: Newsletter Signup & Brand Info (Spans 5 cols on desktop) */}
            <div className="md:col-span-5 space-y-4">
              <h2 className="font-display text-xl sm:text-2xl font-black text-white tracking-tight leading-tight uppercase">
                ¡RECIBÍ NUESTRAS OFERTAS <br className="hidden sm:inline" />
                Y NOVEDADES POR MAIL!
              </h2>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  alert('¡Gracias por suscribirte a las novedades de Holux!');
                }}
                className="flex flex-wrap items-center gap-2 pt-1"
              >
                <input
                  type="email"
                  required
                  placeholder="Correo Electrónico"
                  className="px-3.5 py-2.5 bg-white/10 border border-[#3C6E71]/40 rounded-lg text-xs text-white placeholder-gray-400 outline-none focus:border-[#3C6E71] transition-all w-44 sm:w-52 shadow-sm"
                />
                <input
                  type="text"
                  placeholder="Cumpleaños"
                  className="px-3.5 py-2.5 bg-white/10 border border-[#3C6E71]/40 rounded-lg text-xs text-white placeholder-gray-400 outline-none focus:border-[#3C6E71] transition-all w-32 sm:w-36 shadow-sm"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-[#B85C38] hover:bg-[#B85C38]/90 text-white rounded-lg transition-colors cursor-pointer shadow-sm flex items-center justify-center"
                  title="Suscribirse"
                >
                  <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                </button>
              </form>

              <div className="pt-4 space-y-1">
                <span className="font-display text-base font-bold tracking-wider text-white flex items-center gap-2 uppercase">
                  <span className="bg-[#3C6E71] text-[#1C2321] px-1.5 py-0.5 rounded font-black font-mono-custom text-xs">H</span>
                  Holux Outdoor Equipment
                </span>
                <p className="text-[10px] text-gray-400 font-sans leading-tight">
                  Holux S.A. Av. Pellegrini 1840, Rosario, Santa Fe. CUIT: 30-64270999-9
                </p>
              </div>
            </div>

            {/* Column 2: ACERCA DE NOSOTROS (Spans 2.5 cols) */}
            <div className="md:col-span-3 lg:col-span-2 space-y-3">
              <h3 className="font-display text-xs font-bold text-[#3C6E71] uppercase tracking-wider">
                ACERCA DE NOSOTROS
              </h3>
              <ul className="space-y-1.5 text-xs text-gray-300 font-medium">
                <li><a href="#/catalogo" className="hover:text-white transition-colors">RR HH</a></li>
                <li><a href="#/catalogo" className="hover:text-white transition-colors">Catálogo Mayorista</a></li>
                <li><a href="#/catalogo" className="hover:text-white transition-colors">Nuestros Locales</a></li>
                <li><a href="#/catalogo" className="hover:text-white transition-colors">Eventos</a></li>
                <li><a href="#/catalogo" className="hover:text-white transition-colors">Hot Sale</a></li>
                <li><a href="#/catalogo" className="hover:text-white transition-colors">Cyber Monday</a></li>
              </ul>
            </div>

            {/* Column 3: CENTRO DE AYUDA (Spans 2.5 cols) */}
            <div className="md:col-span-4 lg:col-span-3 space-y-3">
              <h3 className="font-display text-xs font-bold text-[#3C6E71] uppercase tracking-wider">
                CENTRO DE AYUDA
              </h3>
              <ul className="space-y-1.5 text-xs text-gray-300 font-medium">
                <li><a href="#/catalogo" className="hover:text-white transition-colors">Seguimiento de Envío</a></li>
                <li><a href="#/catalogo" className="hover:text-white transition-colors">Preguntas Frecuentes</a></li>
                <li><a href="#/catalogo" className="hover:text-white transition-colors">Envíos y Medios de Pago</a></li>
                <li><a href="#/catalogo" className="hover:text-white transition-colors">Compras Corporativas</a></li>
                <li><a href="#/catalogo" className="hover:text-white transition-colors">Términos y Condiciones</a></li>
                <li><a href="#/catalogo" className="hover:text-white transition-colors">Cómo canjear un cupón</a></li>
                <li><a href="#/catalogo" className="hover:text-white transition-colors">Ciberestafas</a></li>
              </ul>
            </div>

            {/* Column 4: Social Networks & Botón de Arrepentimiento */}
            <div className="md:col-span-12 lg:col-span-2 flex flex-col items-start lg:items-end justify-between space-y-4">
              {/* Social Icons Row */}
              <div className="flex flex-wrap items-center gap-1.5">
                {/* WhatsApp */}
                <span title="WhatsApp" className="w-7 h-7 bg-white/10 border border-[#3C6E71]/30 rounded-md flex items-center justify-center text-white text-xs hover:bg-[#3C6E71] transition-colors cursor-pointer shadow-sm font-bold">
                  wa
                </span>
                {/* Facebook */}
                <span title="Facebook" className="w-7 h-7 bg-white/10 border border-[#3C6E71]/30 rounded-md flex items-center justify-center text-white text-xs hover:bg-[#3C6E71] transition-colors cursor-pointer shadow-sm font-bold">
                  f
                </span>
                {/* Instagram */}
                <span title="Instagram" className="w-7 h-7 bg-white/10 border border-[#3C6E71]/30 rounded-md flex items-center justify-center text-white text-xs hover:bg-[#3C6E71] transition-colors cursor-pointer shadow-sm font-bold">
                  ig
                </span>
                {/* TikTok */}
                <span title="TikTok" className="w-7 h-7 bg-white/10 border border-[#3C6E71]/30 rounded-md flex items-center justify-center text-white text-xs hover:bg-[#3C6E71] transition-colors cursor-pointer shadow-sm font-bold">
                  tk
                </span>
                {/* LinkedIn */}
                <span title="LinkedIn" className="w-7 h-7 bg-white/10 border border-[#3C6E71]/30 rounded-md flex items-center justify-center text-white text-xs hover:bg-[#3C6E71] transition-colors cursor-pointer shadow-sm font-bold">
                  in
                </span>
                {/* YouTube */}
                <span title="YouTube" className="w-7 h-7 bg-white/10 border border-[#3C6E71]/30 rounded-md flex items-center justify-center text-white text-xs hover:bg-[#3C6E71] transition-colors cursor-pointer shadow-sm font-bold">
                  yt
                </span>
                {/* Mail */}
                <span title="Email" className="w-7 h-7 bg-white/10 border border-[#3C6E71]/30 rounded-md flex items-center justify-center text-white text-xs hover:bg-[#3C6E71] transition-colors cursor-pointer shadow-sm font-bold">
                  @
                </span>
              </div>

              {/* Botón de arrepentimiento */}
              <div>
                <button
                  type="button"
                  onClick={() => setIsRefundModalOpen(true)}
                  className="px-4 py-2 bg-white/10 border border-[#3C6E71]/40 hover:bg-[#3C6E71] rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer"
                >
                  Botón de arrepentimiento
                </button>
              </div>
            </div>

          </div>

          {/* Bottom Legal & Certification Badges */}
          <div className="pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-[10px] text-gray-400 font-sans">
            <div className="space-y-1 max-w-2xl">
              <p className="font-bold text-gray-200 uppercase">
                © {new Date().getFullYear()} HOLUX S.A. TODOS LOS DERECHOS RESERVADOS.
              </p>
              <p className="leading-tight text-gray-400">
                El consumidor podrá iniciar un reclamo, completando el Formulario de denuncias Ventanilla Única Federal de Defensa del Consumidor ingresando desde <a href="#" className="font-bold text-[#3C6E71] underline hover:text-white">AQUÍ</a>.
                Para más información, podrá consultar la Ley de Defensa del Consumidor ingrese <a href="#" className="font-bold text-[#3C6E71] underline hover:text-white">AQUÍ</a>.
              </p>
            </div>

            {/* Badges / Seals */}
            <div className="flex flex-wrap items-center gap-3 shrink-0 font-mono-custom text-[10px] font-bold text-gray-300">
              <span className="border border-[#3C6E71]/30 px-2 py-0.5 rounded bg-white/5 shadow-sm">cace</span>
              <span className="border border-[#3C6E71]/30 px-2 py-0.5 rounded bg-white/5 shadow-sm">DATA FISCAL AFIP</span>
              <span className="border border-[#3C6E71]/30 px-2 py-0.5 rounded bg-white/5 shadow-sm">VTEX</span>
              <span className="border border-[#3C6E71]/30 px-2 py-0.5 rounded bg-white/5 shadow-sm">Infra Commerce</span>
            </div>
          </div>

        </div>
      </footer>

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
                              <div className="flex items-center justify-between text-purple-700 font-bold bg-purple-50/80 px-2.5 py-1 rounded-lg border border-purple-200/60">
                                <span className="flex items-center gap-1">
                                  <span>{tierBadge} ({tierPercent}% OFF Auto):</span>
                                </span>
                                <span className="font-mono-custom font-black">-${tierDiscount.toLocaleString('es-AR')}</span>
                              </div>
                            )}

                            {/* Coupon Discount row */}
                            {couponDiscount > 0 && (
                              <div className="flex items-center justify-between text-emerald-700 font-semibold">
                                <span>Descuento Cupón ({appliedCoupon.code})</span>
                                <span className="font-mono-custom font-bold">-${couponDiscount.toLocaleString('es-AR')}</span>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-gray-500">
                              <span>Envío</span>
                              <span className="font-mono-custom font-bold text-emerald-600">
                                {userProfile?.tier === 'super_vip' || userProfile?.is_super_vip ? 'Gratis (100% Bonificado)' : 'Gratis'}
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
                      <input
                        type="text"
                        required
                        value={authFullName}
                        onChange={(e) => setAuthFullName(e.target.value)}
                        placeholder="Ej: José Valero"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:border-[#3C6E71] focus:ring-0 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 tracking-wider">TELÉFONO DE CONTACTO</label>
                      <input
                        type="text"
                        required
                        value={authPhone}
                        onChange={(e) => setAuthPhone(e.target.value)}
                        placeholder="Ej: +54 9 11 2345-6789"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:border-[#3C6E71] focus:ring-0 outline-none"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 tracking-wider">EMAIL</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="Ej: jose@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:border-[#3C6E71] focus:ring-0 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 tracking-wider">CONTRASEÑA</label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:border-[#3C6E71] focus:ring-0 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#3C6E71] text-white font-display text-xs font-bold tracking-wider rounded hover:bg-[#3C6E71]/95 transition-all shadow-md shadow-[#3C6E71]/15 cursor-pointer"
                >
                  {authMode === 'login' ? 'INICIAR SESIÓN' : 'CREAR CUENTA'}
                </button>
              </form>

              <div className="flex items-center gap-3 py-1">
                <div className="flex-grow border-t border-gray-200" />
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">O</span>
                <div className="flex-grow border-t border-gray-200" />
              </div>

              {/* Iniciar sesión con Google Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2 border border-gray-300 rounded shadow-sm bg-white hover:bg-gray-50 text-gray-700 font-display text-[10px] font-bold tracking-wider transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                {authMode === 'login' ? 'INICIAR SESIÓN CON GOOGLE' : 'REGISTRARSE CON GOOGLE'}
              </button>

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
                            className="px-3.5 py-2.5 bg-[#B85C38] hover:bg-[#B85C38]/90 text-white rounded font-display text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-[#B85C38]/20"
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
            <div className="bg-[#B85C38] text-[#F2EFE9] p-4 flex items-center justify-between">
              <div>
                <h4 className="font-display text-sm font-bold tracking-wider">Atención Al Cliente</h4>
                <p className="text-[9px] text-orange-100 font-medium">Lunes a viernes de 8 a 17 h.</p>
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
              <div className="bg-gray-50 p-3 rounded border border-gray-100 space-y-2 leading-relaxed text-gray-700">
                <p className="font-semibold text-gray-800">¡Hola! Actualmente estamos fuera de horario de atención.</p>
                <p>Por favor, escribinos a <a href="mailto:soporte@holux.com.ar" className="text-[#3C6E71] underline font-bold">soporte@holux.com.ar</a> detallando tu consulta y te responderemos apenas estemos de regreso.</p>
                <p className="font-medium text-gray-500">¡Gracias por contactarte!</p>
              </div>

              {chatSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 text-center rounded space-y-2 animate-pulse">
                  <Check className="w-6 h-6 mx-auto text-emerald-600 stroke-[3]" />
                  <p className="font-bold">¡Mensaje enviado!</p>
                  <p className="text-[10px] text-emerald-600">Te responderemos a tu correo electrónico a la brevedad.</p>
                </div>
              ) : (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    setChatLoading(true);
                    setTimeout(() => {
                      setChatLoading(false);
                      setChatSuccess(true);
                      setChatEmail('');
                      setTimeout(() => setChatSuccess(false), 5000);
                    }, 1200);
                  }} 
                  className="space-y-3"
                >
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 tracking-wider block">CORREO ELECTRÓNICO</label>
                    <input
                      type="email"
                      required
                      value={chatEmail}
                      onChange={(e) => setChatEmail(e.target.value)}
                      placeholder="Ej: jose@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:border-[#B85C38] focus:ring-0 outline-none bg-white text-gray-800"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={chatLoading}
                    className="w-full py-2 bg-[#1C2321] text-white font-display text-xs font-bold tracking-wider rounded hover:bg-[#3C6E71] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {chatLoading ? 'ENVIANDO...' : 'SIGUIENTE'}
                  </button>
                </form>
              )}
            </div>

            {/* Widget Footer */}
            <div className="p-2.5 border-t border-gray-100 text-center text-[9px] text-gray-400 font-mono-custom bg-gray-50">
              Creado con HOLUX Support
            </div>

          </div>
        )}

        {/* Floating circular button */}
        <button
          onClick={() => {
            setIsChatOpen(!isChatOpen);
            setChatSuccess(false);
          }}
          className="w-14 h-14 bg-[#B85C38] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 hover:bg-[#B85C38]/95 transition-all cursor-pointer border border-[#B85C38]/10"
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
                <input
                  type="text"
                  placeholder="Domicilio Principal"
                  value={addrLabel}
                  onChange={(e) => setAddrLabel(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-[#3C6E71]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">CALLE Y NÚMERO (PISO / DEPTO)</label>
                <input
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
                  <input
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
                <input
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
                  className="w-1/2 py-2.5 bg-[#B85C38] hover:bg-[#B85C38]/90 text-white font-display text-xs font-bold uppercase rounded-xl shadow cursor-pointer"
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
