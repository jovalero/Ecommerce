import React, { useState, useEffect, useRef } from 'react';
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
  ChevronDown
} from 'lucide-react';

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fmbhcfsrsfkglmvgbnlm.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_aAzQcAqCATpYDGBVRNJRQQ_1CKarnEb';

// Product Discount Config (customize which items are on sale and their percentage)
const DISCOUNT_MAP = {
  'Campera Cortavientos Fitz Roy': 35,
  'Botas de Trekking Tronador': 15,
  'Bolsa de Dormir Alpamayo -10°C': 20
};

const getProductDiscount = (productName) => {
  return DISCOUNT_MAP[productName] || 0;
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
  if (cleanName.includes('bolsa de dormir') || cleanName.includes('sleeping')) {
    return 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=600&auto=format&fit=crop&q=80';
  }
  if (cleanName.includes('bota') || cleanName.includes('calzado') || cleanName.includes('zapatilla') || cleanName.includes('sandalia')) {
    return 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=600&auto=format&fit=crop&q=80';
  }
  if (cleanName.includes('mochila')) {
    return 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80';
  }
  if (cleanName.includes('bastón') || cleanName.includes('bastones')) {
    return 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=600&auto=format&fit=crop&q=80';
  }
  if (cleanName.includes('termo') || cleanName.includes('botella') || cleanName.includes('anafe')) {
    return 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=600&auto=format&fit=crop&q=80';
  }
  if (cleanName.includes('linterna') || cleanName.includes('frontal')) {
    return 'https://images.unsplash.com/photo-1554189097-ffe88e99897e?w=600&auto=format&fit=crop&q=80';
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
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'category'
  const [sortBy, setSortBy] = useState('relevant'); // 'relevant' | 'price-asc' | 'price-desc'
  const [selectedDetailProduct, setSelectedDetailProduct] = useState(null);
  const [detailQuantity, setDetailQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [sizeError, setSizeError] = useState(false);

  // Cart
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('holux_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState(null);

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

  // Client Profile Drawer
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileTab, setProfileTab] = useState('info'); // 'info' | 'addresses' | 'orders'
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // Address form
  const [editingAddress, setEditingAddress] = useState(null);
  const [addrLabel, setAddrLabel] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrProvince, setAddrProvince] = useState('');
  const [addrPostalCode, setAddrPostalCode] = useState('');
  const [addrIsDefault, setAddrIsDefault] = useState(false);

  // Admin Panel Modal
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminTab, setAdminTab] = useState('dashboard'); // 'dashboard' | 'orders' | 'products' | 'categories' | 'customers' | 'reviews'
  
  // Admin Data states
  const [adminStats, setAdminStats] = useState(null);
  const [adminOrdersList, setAdminOrdersList] = useState([]);
  const [adminProductsList, setAdminProductsList] = useState([]);
  const [adminCategoriesList, setAdminCategoriesList] = useState([]);
  const [adminCustomersList, setAdminCustomersList] = useState([]);
  const [adminReviewsList, setAdminReviewsList] = useState([]);

  // Product reviews modal
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

  const fetchCatalog = async () => {
    setLoadingProducts(true);
    setLoadingCategories(true);
    try {
      const resCat = await fetch(`${API_BASE_URL}/api/categories`);
      if (resCat.ok) {
        const data = await resCat.json();
        setCategories(data);
      }
      const resProd = await fetch(`${API_BASE_URL}/api/products`);
      if (resProd.ok) {
        const data = await resProd.json();
        setProducts(data);
      }
    } catch (e) {
      console.error("Error loading catalog", e);
    } finally {
      setLoadingProducts(false);
      setLoadingCategories(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
        // Autofill checkout details
        setCheckoutName(data.full_name || '');
        // Supabase Auth stores email but it's not directly in public.profiles unless we pass it
        // We'll read from client orders or leave email empty for user confirmation
      } else {
        // Token invalid or expired
        setToken(null);
      }
    } catch (e) {
      console.error(e);
      setToken(null);
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

  // Trigger when profile tab switches
  useEffect(() => {
    if (isProfileOpen) {
      if (profileTab === 'addresses') fetchAddresses();
      if (profileTab === 'orders') fetchOrders();
    }
  }, [profileTab, isProfileOpen]);

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
    if (!token || !confirm('¿Estás seguro de eliminar esta dirección?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/me/addresses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAddresses();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelOrder = async (id) => {
    if (!token || !confirm('¿Seguro de cancelar este pedido? Se devolverá el stock.')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/me/orders/${id}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchOrders();
        fetchCatalog(); // Refresh stock in catalog
      }
    } catch (e) {
      console.error(e);
    }
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
    setSizeError(false);
    window.location.hash = `#/producto/${product.id}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '' || hash === '#/' || hash === '#') {
        setCurrentView('home');
        setSelectedDetailProduct(null);
      } else if (hash.startsWith('#/catalogo')) {
        const params = new URLSearchParams(hash.split('?')[1] || '');
        const cat = params.get('categoria');
        const gen = params.get('genero');
        setActiveCategory(cat || null);
        setActiveGender(gen || null);
        setCurrentView('category');
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
    if (products.length > 0) {
      handleHashChange();
    }
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [products]);

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
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminOrdersList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminProductsList(data);
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
        setAdminCategoriesList(data);
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
        setAdminCustomersList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminReviews = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/reviews`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminReviewsList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Sync admin tabs with data fetching
  useEffect(() => {
    if (isAdminOpen) {
      if (adminTab === 'dashboard') fetchAdminStats();
      if (adminTab === 'orders') fetchAdminOrders();
      if (adminTab === 'products') {
        fetchAdminProducts();
        fetchAdminCategories();
      }
      if (adminTab === 'categories') fetchAdminCategories();
      if (adminTab === 'customers') fetchAdminCustomers();
      if (adminTab === 'reviews') fetchAdminReviews();
    }
  }, [adminTab, isAdminOpen]);

  // Update order status (Admin)
  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchAdminOrders();
      }
    } catch (err) {
      console.error(err);
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
        if (!response.ok) {
          setAuthError(data.error_description || 'Credenciales incorrectas');
          return;
        }
        setToken(data.access_token);
        setIsAuthModalOpen(false);
        setAuthEmail('');
        setAuthPassword('');
      } catch (err) {
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
        if (!response.ok) {
          setAuthError(data.message || 'Error en el registro');
          return;
        }
        alert('Registro completado. Por favor, confirma tu cuenta en tu correo electrónico.');
        setAuthMode('login');
      } catch (err) {
        setAuthError('Error de red al registrar usuario.');
      }
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUserProfile(null);
    setIsProfileOpen(false);
    setIsAdminOpen(false);
    localStorage.removeItem('user_token');
    alert('Sesión cerrada correctamente');
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
      return [...prev, { ...product, sizeLabel: defaultSize, quantity: 1 }];
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

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const payload = {
      customer_name: checkoutName,
      customer_email: checkoutEmail,
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
      if (res.ok) {
        setCheckoutSuccess(data.order);
        setCart([]);
        fetchCatalog(); // Refresh catalog stock levels
      } else {
        alert(data.message || 'Error al procesar la compra. Revisa el stock de los productos.');
      }
    } catch (err) {
      alert('Error de red al procesar el checkout.');
    }
  };

  // --- FILTERS ---
  const filteredProducts = products.filter(p => {
    // 1. Category filter
    if (activeCategory && (!p.categories || p.categories.slug !== activeCategory)) {
      return false;
    }

    // 2. Gender / Outlet mock filter
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

    // 3. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = p.name.toLowerCase().includes(q);
      const brandMatch = p.brand.toLowerCase().includes(q);
      const catMatch = p.categories && p.categories.name.toLowerCase().includes(q);
      if (!nameMatch && !brandMatch && !catMatch) {
        return false;
      }
    }

    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') {
      return a.price - b.price;
    }
    if (sortBy === 'price-desc') {
      return b.price - a.price;
    }
    return 0;
  });

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-[#3C6E71] selection:text-white">
      
      {/* Sticky top wrapper containing both the ticker and the header */}
      <div className="sticky top-0 z-40 flex flex-col">
        {/* Infinite scrolling ticker banner */}
        <div className="overflow-hidden bg-black text-[#F2EFE9] py-2 text-xs sm:text-sm font-black uppercase tracking-wider font-sans border-b border-black/10 select-none">
          <div className="flex whitespace-nowrap animate-marquee">
            <div className="flex gap-16 px-8 shrink-0">
              <span>| ENVÍO GRATIS EN COMPRAS MAYORES A $150.000</span>
              <span>| ¡HASTA 6 CUOTAS SIN INTERÉS!</span>
              <span>| GARANTÍA OFICIAL HOLUX EN TODAS TUS EXPEDICIONES</span>
              <span>| 15% OFF PAGANDO CON TRANSFERENCIA BANCARIA</span>
              <span>| ENVÍO GRATIS EN COMPRAS MAYORES A $150.000</span>
              <span>| ¡HASTA 6 CUOTAS SIN INTERÉS!</span>
              <span>| GARANTÍA OFICIAL HOLUX EN TODAS TUS EXPEDICIONES</span>
              <span>| 15% OFF PAGANDO CON TRANSFERENCIA BANCARIA</span>
            </div>
            <div className="flex gap-16 px-8 shrink-0" aria-hidden="true">
              <span>| ENVÍO GRATIS EN COMPRAS MAYORES A $150.000</span>
              <span>| ¡HASTA 6 CUOTAS SIN INTERÉS!</span>
              <span>| GARANTÍA OFICIAL HOLUX EN TODAS TUS EXPEDICIONES</span>
              <span>| 15% OFF PAGANDO CON TRANSFERENCIA BANCARIA</span>
              <span>| ENVÍO GRATIS EN COMPRAS MAYORES A $150.000</span>
              <span>| ¡HASTA 6 CUOTAS SIN INTERÉS!</span>
              <span>| GARANTÍA OFICIAL HOLUX EN TODAS TUS EXPEDICIONES</span>
              <span>| 15% OFF PAGANDO CON TRANSFERENCIA BANCARIA</span>
            </div>
          </div>
        </div>

        {/* --- HEADER --- */}
        <header className="bg-[#1C2321] text-white border-b border-[#3C6E71]/20 shadow-md">
        <div className="w-full px-4 sm:px-8 lg:px-12 h-16 sm:h-20 flex items-center justify-between relative">
          
          {/* Logo Left */}
          <div className="flex items-center">
            <span 
              className="font-display text-3xl sm:text-4xl font-black tracking-wider text-[#F2EFE9] flex items-center gap-3 cursor-pointer select-none" 
              onClick={() => { 
                window.location.hash = '#/';
              }}
            >
              <span className="bg-[#3C6E71] text-[#1C2321] px-3 py-1 rounded-md font-black font-mono-custom text-2xl sm:text-3xl">H</span>
              HOLUX
            </span>
          </div>

          {/* Center Navigation Menu */}
          <nav className="hidden lg:flex items-center gap-12 relative">
            
            {/* CATEGORÍAS DROPDOWN */}
            <div 
              className="relative"
              onMouseEnter={() => setIsCatDropdownOpen(true)}
              onMouseLeave={() => setIsCatDropdownOpen(false)}
            >
              <button
                className={`font-display text-sm sm:text-base font-bold tracking-widest flex items-center gap-2 transition-colors cursor-pointer py-2 ${activeCategory ? 'text-[#3C6E71]' : 'text-[#F2EFE9] hover:text-[#3C6E71]'}`}
              >
                CATEGORÍAS
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {isCatDropdownOpen && (
                <div className="absolute top-full left-0 w-56 bg-[#1C2321] border border-[#3C6E71]/20 shadow-xl rounded py-3 transition-all z-50">
                  <button
                    onClick={() => { 
                      window.location.hash = '#/catalogo';
                      setIsCatDropdownOpen(false);
                    }}
                    className="w-full text-left px-5 py-2.5 hover:bg-[#3C6E71]/20 text-sm font-display font-bold tracking-wider text-gray-200 hover:text-white"
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
                      className="w-full text-left px-5 py-2.5 hover:bg-[#3C6E71]/20 text-sm font-display font-bold tracking-wider text-gray-200 hover:text-white"
                    >
                      {cat.name.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* MUJER */}
            <button
              onClick={() => {
                window.location.hash = '#/catalogo?genero=mujer';
              }}
              className={`font-display text-sm sm:text-base font-bold tracking-widest transition-colors cursor-pointer ${activeGender === 'mujer' ? 'text-[#3C6E71]' : 'text-gray-200 hover:text-[#3C6E71]'}`}
            >
              MUJER
            </button>

            {/* HOMBRE */}
            <button
              onClick={() => {
                window.location.hash = '#/catalogo?genero=hombre';
              }}
              className={`font-display text-sm sm:text-base font-bold tracking-widest transition-colors cursor-pointer ${activeGender === 'hombre' ? 'text-[#3C6E71]' : 'text-gray-200 hover:text-[#3C6E71]'}`}
            >
              HOMBRE
            </button>

            {/* NIÑOS */}
            <button
              onClick={() => {
                window.location.hash = '#/catalogo?genero=niños';
              }}
              className={`font-display text-sm sm:text-base font-bold tracking-widest transition-colors cursor-pointer ${activeGender === 'niños' ? 'text-[#3C6E71]' : 'text-gray-200 hover:text-[#3C6E71]'}`}
            >
              NIÑOS
            </button>

            {/* ACCESORIOS */}
            <button
              onClick={() => {
                window.location.hash = '#/catalogo?categoria=accesorios';
              }}
              className={`font-display text-sm sm:text-base font-bold tracking-widest transition-colors cursor-pointer ${activeCategory === 'accesorios' ? 'text-[#3C6E71]' : 'text-gray-200 hover:text-[#3C6E71]'}`}
            >
              ACCESORIOS
            </button>

            {/* OUTLET */}
            <button
              onClick={() => {
                window.location.hash = '#/catalogo?genero=outlet';
              }}
              className={`px-4 py-2 border-2 border-[#3C6E71] rounded-md font-display text-sm font-bold tracking-widest transition-all cursor-pointer ${
                activeGender === 'outlet' 
                  ? 'bg-[#3C6E71] text-white border-[#3C6E71]' 
                  : 'text-[#3C6E71] hover:bg-[#3C6E71] hover:text-white'
              }`}
            >
              OUTLET
            </button>
          </nav>

          {/* Right Icons section */}
          <div className="flex items-center gap-5">
            
            {/* Search (Lupa) */}
            <div className="flex items-center gap-2">
              {isSearchOpen && (
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar equipo..."
                  className="bg-white/10 text-white placeholder-gray-400 border border-[#3C6E71]/50 rounded-full px-4 py-2 text-sm sm:text-base outline-none focus:border-[#3C6E71] transition-all w-44 sm:w-64"
                  autoFocus
                />
              )}
              <button
                onClick={() => {
                  setIsSearchOpen(!isSearchOpen);
                  if (isSearchOpen) setSearchQuery('');
                }}
                className="p-3 rounded-full hover:bg-white/10 transition-colors text-white cursor-pointer"
                title="Buscar productos"
              >
                {isSearchOpen ? <X className="w-7 h-7 text-red-400" /> : <Search className="w-7 h-7 text-[#F2EFE9]" />}
              </button>
            </div>

            {/* Admin trigger */}
            {userProfile && userProfile.role === 'admin' && (
              <button
                onClick={() => { setIsAdminOpen(true); setAdminTab('dashboard'); }}
                className="hidden sm:flex items-center gap-2.5 px-4 py-2 bg-[#B85C38] text-white rounded font-display text-sm font-bold tracking-wider hover:bg-[#B85C38]/90 transition-all shadow-md shadow-[#B85C38]/20"
              >
                <Shield className="w-5 h-5" />
                PANEL ADMIN
              </button>
            )}

            {/* User Profile trigger */}
            {token ? (
              <button
                onClick={() => { setIsProfileOpen(true); setProfileTab('info'); }}
                className="flex items-center gap-2 p-2.5 rounded-full hover:bg-white/10 transition-colors text-[#F2EFE9]"
                title="Mi Cuenta"
              >
                <User className="w-7 h-7 text-[#3C6E71]" />
                <span className="text-sm font-bold hidden sm:inline truncate max-w-[120px]">
                  {userProfile ? userProfile.full_name : 'Cargando...'}
                </span>
              </button>
            ) : (
              <button
                onClick={() => { setIsAuthModalOpen(true); setAuthMode('login'); }}
                className="flex items-center gap-2 p-2.5 rounded-full hover:bg-white/10 transition-colors text-white"
                title="Ingresar"
              >
                <User className="w-7 h-7 text-[#F2EFE9]" />
              </button>
            )}

            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-3 bg-[#3C6E71]/10 rounded-full hover:bg-[#3C6E71]/20 transition-all text-white border border-[#3C6E71]/35 cursor-pointer"
            >
              <ShoppingBag className="w-7 h-7 text-[#F2EFE9]" />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-[#B85C38] text-white text-xs font-bold rounded-full flex items-center justify-center font-mono-custom animate-pulse">
                  {cart.reduce((qty, item) => qty + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>

        </div>
      </header>
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
           className="group relative overflow-hidden bg-[#1C2321] text-[#F2EFE9] h-[550px] sm:h-[650px] md:h-[calc(100vh-140px)] md:min-h-[650px] flex items-center border-b border-[#3C6E71]/15 select-none cursor-grab active:cursor-grabbing"
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
                  <div className={`max-w-4xl space-y-4 sm:space-y-6 transition-all duration-700 delay-200 transform ${idx === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
                    <span className="text-sm sm:text-lg font-bold text-orange-200 tracking-[0.3em] uppercase font-sans block drop-shadow">
                      {slide.span}
                    </span>
                    <h1 className="text-3xl sm:text-6xl lg:text-7xl font-display font-black tracking-wider text-white leading-tight uppercase drop-shadow-md">
                      {slide.title} <br className="hidden sm:inline" />
                      <span className="text-[#3C6E71] bg-white/10 px-4 py-1.5 rounded-lg inline-block mt-3 sm:mt-0 font-black">{slide.highlight}</span>
                    </h1>
                    <p className="text-base sm:text-xl text-gray-200 max-w-2xl mx-auto leading-relaxed font-sans hidden sm:block font-medium">
                      {slide.desc}
                    </p>
                    <div className="pt-4">
                      <button 
                        onClick={(e) => { e.stopPropagation(); window.location.hash = '#/catalogo'; }}
                        className="px-10 py-4 sm:px-12 sm:py-5 bg-[#B85C38] hover:bg-[#B85C38]/95 text-white font-display text-sm sm:text-lg font-black tracking-widest rounded-lg shadow-xl hover:shadow-2xl transition-all cursor-pointer inline-flex items-center gap-3"
                      >
                        {slide.cta}
                        <ChevronRight className="w-6 h-6" />
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
              <h2 className="font-display text-3xl font-black text-[#1C2321] tracking-wide text-center uppercase">
                Novedades de Holux
              </h2>
              <p className="text-sm text-[#3C6E71] font-bold mt-1.5 text-center font-sans tracking-widest uppercase">
                Descubrí los últimos lanzamientos de nuestra colección de montaña
              </p>
              
              {/* Desktop Slider Wrapper */}
              <div className="hidden sm:block relative mt-8 px-0 sm:px-12">
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
                  className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide py-4"
                >
                  {[...products].reverse().slice(0, 8).map(product => {
                    const discount = getProductDiscount(product.name);
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
                            src={getProductImage(product.name)} 
                            alt={product.name} 
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
                                  ${Math.round(product.price).toLocaleString('es-AR')}
                                </span>
                                {discount > 0 && (
                                  <span className="text-sm text-gray-400 line-through font-sans">
                                    ${Math.round(product.price * (1 + discount / 100)).toLocaleString('es-AR')}
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
                  onClick={() => scrollContainer(novedadesRef, 'right')}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 p-2 bg-[#1C2321]/80 hover:bg-[#3C6E71] text-white rounded-full transition-all duration-300 z-10 cursor-pointer shadow border border-white/5 opacity-0 group-hover/novedades:opacity-100 hidden sm:block"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Single Card View (with side arrows) */}
              {products.length > 0 && (() => {
                const novedadesMobileList = [...products].reverse().slice(0, 8);
                const len = novedadesMobileList.length || 1;
                const activeIdx = currentNovedadesMobileIdx % len;
                const product = novedadesMobileList[activeIdx];
                if (!product) return null;
                const discount = getProductDiscount(product.name);
                return (
                  <div className="block sm:hidden relative max-w-[320px] mx-auto px-8 mt-6">
                    {/* Left Arrow */}
                    <button
                      onClick={() => {
                        const prevIdx = (activeIdx - 1 + len) % len;
                        setCurrentNovedadesMobileIdx(prevIdx);
                      }}
                      className="absolute left-0 top-[40%] transform -translate-y-1/2 text-black hover:text-[#3C6E71] p-1 cursor-pointer transition-colors"
                    >
                      <ChevronLeft className="w-7 h-7 stroke-[2.5]" />
                    </button>

                    {/* Product Card */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col justify-between shadow hover:shadow-md transition-all duration-300">
                      {/* Image Area */}
                      <div 
                        onClick={() => handleProductClick(product)}
                        className="relative bg-gray-50 aspect-square overflow-hidden border-b border-gray-100 cursor-pointer"
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
                          src={getProductImage(product.name)} 
                          alt={product.name} 
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>

                      {/* Details info */}
                      <div className="p-5 flex-grow flex flex-col justify-between space-y-3">
                        <div className="space-y-1.5 text-left">
                          <div className="text-xs text-gray-500 font-bold uppercase tracking-widest font-sans">
                            {product.brand.toUpperCase()}
                          </div>
                          <h3 
                            onClick={() => handleProductClick(product)}
                            className="font-sans font-bold text-gray-900 text-sm tracking-wide line-clamp-2 hover:text-[#3C6E71] transition-colors cursor-pointer"
                          >
                            {product.name}
                          </h3>
                          <div className="flex items-baseline gap-2 pt-1">
                            <span className="text-base font-black text-gray-900 font-sans">
                              ${Math.round(product.price).toLocaleString('es-AR')}
                            </span>
                            {discount > 0 && (
                              <span className="text-xs text-gray-400 line-through font-sans">
                                ${Math.round(product.price * (1 + discount / 100)).toLocaleString('es-AR')}
                              </span>
                            )}
                          </div>
                          {product.installments > 0 && (
                            <div className="text-xs text-[#7E3793] font-bold font-sans">
                              {product.installments} cuotas de ${Math.round(product.price / product.installments).toLocaleString('es-AR')}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={(e) => { e.stopPropagation(); handleProductClick(product); }}
                          disabled={product.stock === 0}
                          className={`w-full py-3 rounded font-sans text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            product.stock > 0 
                              ? 'bg-[#1C2321] text-white hover:bg-black' 
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          AGREGAR AL CARRITO
                        </button>
                      </div>
                    </div>

                    {/* Right Arrow */}
                    <button
                      onClick={() => {
                        const nextIdx = (activeIdx + 1) % len;
                        setCurrentNovedadesMobileIdx(nextIdx);
                      }}
                      className="absolute right-0 top-[40%] transform -translate-y-1/2 text-black hover:text-[#3C6E71] p-1 cursor-pointer transition-colors"
                    >
                      <ChevronRight className="w-7 h-7 stroke-[2.5]" />
                    </button>
                  </div>
                );
              })()}

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
                  <div className="absolute bottom-10 left-10 text-left space-y-3 z-10 pr-6">
                    <span className="text-xs sm:text-sm text-orange-200 font-bold uppercase tracking-widest font-sans block drop-shadow">
                      {banner.span}
                    </span>
                    <h3 className="text-3xl sm:text-5xl font-display font-black tracking-wider text-white uppercase drop-shadow-lg">
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

                {/* Desktop Slider Wrapper */}
                <div className="hidden sm:block relative mt-8 px-0 sm:px-12">
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
                    className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide py-4"
                  >
                    {products.slice(4, 12).map(product => {
                      const discount = getProductDiscount(product.name);
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
                              src={getProductImage(product.name)} 
                              alt={product.name} 
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
                                    ${Math.round(product.price).toLocaleString('es-AR')}
                                  </span>
                                  {discount > 0 && (
                                    <span className="text-sm text-gray-400 line-through font-sans">
                                      ${Math.round(product.price * (1 + discount / 100)).toLocaleString('es-AR')}
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
                        const discount = getProductDiscount(product.name);
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
                                src={getProductImage(product.name)} 
                                alt={product.name} 
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
                                      ${Math.round(product.price).toLocaleString('es-AR')}
                                    </span>
                                    {discount > 0 && (
                                      <span className="text-xs text-gray-400 line-through font-sans">
                                        ${Math.round(product.price * (1 + discount / 100)).toLocaleString('es-AR')}
                                      </span>
                                    )}
                                  </div>
                                  {product.installments > 0 && (
                                    <div>
                                      <span className="bg-[#EBDCF0] text-[#7E3793] text-[9.5px] font-bold px-2 py-0.5 rounded tracking-wide uppercase inline-block font-sans">
                                        {product.installments} cuotas de ${Math.round(product.price / product.installments).toLocaleString('es-AR')}
                                      </span>
                                    </div>
                                  )}
                                  <span className="text-[9px] text-gray-400 font-sans block">
                                    CFT: 0% | Precio sin impuestos: ${Math.round(product.price * 0.79).toLocaleString('es-AR')}
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
                  {getProductDiscount(selectedDetailProduct.name) > 0 && (
                    <span className="absolute top-4 left-4 bg-[#B85C38] text-white text-[9px] font-display font-bold tracking-widest px-2.5 py-1 rounded shadow z-10">
                      {getProductDiscount(selectedDetailProduct.name)}% OFF
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
                      src={getProductImage(selectedDetailProduct.name)} 
                      alt={selectedDetailProduct.name} 
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
                  <div className="pt-2 border-t border-gray-100 flex flex-col space-y-1">
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-black text-gray-955 font-sans">
                        ${Math.round(selectedDetailProduct.price).toLocaleString('es-AR')}
                      </span>
                      {getProductDiscount(selectedDetailProduct.name) > 0 && (
                        <span className="text-sm text-gray-400 line-through font-sans">
                          ${Math.round(selectedDetailProduct.price * (1 + getProductDiscount(selectedDetailProduct.name) / 100)).toLocaleString('es-AR')}
                        </span>
                      )}
                    </div>

                    {selectedDetailProduct.installments > 0 && (
                      <div className="pt-1">
                        <span className="bg-[#EBDCF0] text-[#7E3793] text-[10.5px] font-black px-2.5 py-1 rounded tracking-wide uppercase inline-block font-sans">
                          {selectedDetailProduct.installments} cuotas fijas de ${Math.round(selectedDetailProduct.price / selectedDetailProduct.installments).toLocaleString('es-AR')}
                        </span>
                      </div>
                    )}
                    <span className="text-[9px] text-gray-400 font-sans block">
                      CFTA: 0% | Precio sugerido al público con IVA incluido. Válido para todo el territorio nacional.
                    </span>
                  </div>

                  {/* Size selection (Adidas / Nike style layout!) */}
                  {selectedDetailProduct.categories && (selectedDetailProduct.categories.slug === 'calzado' || selectedDetailProduct.categories.slug === 'trekking') ? (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900 uppercase tracking-wider font-display">
                          Seleccionar Talle / Talla
                        </span>
                        <span className="text-xs text-gray-400 hover:text-black underline cursor-pointer font-sans">
                          Guía de talles
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        {selectedDetailProduct.categories.slug === 'calzado' ? (
                          ['39', '40', '41', '42', '43'].map(size => (
                            <button
                              key={size}
                              onClick={() => { setSelectedSize(size); setSizeError(false); }}
                              className={`py-2.5 text-xs font-bold tracking-wider rounded border text-center transition-all cursor-pointer ${
                                selectedSize === size
                                  ? 'border-black bg-black text-white font-extrabold'
                                  : 'border-gray-200 hover:border-gray-400 text-gray-700 bg-white'
                              }`}
                            >
                              {size}
                            </button>
                          ))
                        ) : (
                          ['S', 'M', 'L', 'XL'].map(size => (
                            <button
                              key={size}
                              onClick={() => { setSelectedSize(size); setSizeError(false); }}
                              className={`py-2.5 text-xs font-bold tracking-wider rounded border text-center transition-all cursor-pointer ${
                                selectedSize === size
                                  ? 'border-black bg-black text-white font-extrabold'
                                  : 'border-gray-200 hover:border-gray-400 text-gray-700 bg-white'
                              }`}
                            >
                              {size}
                            </button>
                          ))
                        )}
                      </div>
                      {sizeError && (
                        <p className="text-red-500 font-sans text-xs font-bold pt-1 flex items-center gap-1 animate-pulse">
                          ⚠️ Por favor, selecciona un talle antes de agregar al carrito.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="pt-2">
                      <span className="text-xs text-gray-500 font-sans font-semibold">
                        Talla: Única (Disponible)
                      </span>
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
                </div>

                {/* PDP Action Box (Quantity and Add to Cart) */}
                <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-4">
                  
                  {/* Quantity selector */}
                  <div className="flex items-center justify-between border border-gray-300 rounded overflow-hidden h-12 w-32 bg-white flex-shrink-0">
                    <button
                      onClick={() => setDetailQuantity(prev => Math.max(1, prev - 1))}
                      className="w-10 h-full bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors font-bold cursor-pointer flex items-center justify-center border-r border-gray-200"
                    >
                      -
                    </button>
                    <span className="text-sm font-bold text-gray-900 font-sans">{detailQuantity}</span>
                    <button
                      onClick={() => setDetailQuantity(prev => Math.min(selectedDetailProduct.stock, prev + 1))}
                      className="w-10 h-full bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors font-bold cursor-pointer flex items-center justify-center border-l border-gray-200"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to cart */}
                  <button
                    onClick={() => {
                      if (selectedDetailProduct.stock === 0) return;
                      const requiresSize = selectedDetailProduct.categories && 
                        (selectedDetailProduct.categories.slug === 'calzado' || selectedDetailProduct.categories.slug === 'trekking');
                      if (requiresSize && !selectedSize) {
                        setSizeError(true);
                        return;
                      }
                      setSizeError(false);
                      setCart(prev => {
                        const targetSize = requiresSize ? selectedSize : 'Talla Única';
                        const existing = prev.find(item => item.id === selectedDetailProduct.id && item.sizeLabel === targetSize);
                        const productWithSize = {
                          ...selectedDetailProduct,
                          sizeLabel: targetSize
                        };
                        if (existing) {
                          const newQty = Math.min(selectedDetailProduct.stock, existing.quantity + detailQuantity);
                          return prev.map(item => 
                            (item.id === selectedDetailProduct.id && item.sizeLabel === targetSize)
                              ? { ...item, quantity: newQty } 
                              : item
                          );
                        }
                        return [...prev, { ...productWithSize, quantity: detailQuantity }];
                      });
                    }}
                    disabled={selectedDetailProduct.stock === 0}
                    className={`w-full sm:flex-grow h-12 rounded font-sans text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
                      selectedDetailProduct.stock > 0
                        ? 'bg-[#1C2321] text-white hover:bg-black hover:shadow-md'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{selectedDetailProduct.stock > 0 ? 'AGREGAR AL CARRITO' : 'AGOTADO'}</span>
                  </button>
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
                    const discount = getProductDiscount(product.name);
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
                            src={getProductImage(product.name)} 
                            alt={product.name} 
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
                                ${Math.round(product.price).toLocaleString('es-AR')}
                              </span>
                              {discount > 0 && (
                                <span className="text-xs text-gray-400 line-through font-sans">
                                  ${Math.round(product.price * (1 + discount / 100)).toLocaleString('es-AR')}
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

      {/* --- PROMO BANNER --- */}
      <section className="bg-black text-white py-10 sm:py-12 border-t border-b border-white/10">
        <div className="w-full px-4 sm:px-8 lg:px-12 text-center space-y-6">
          <div>
            <span className="font-display text-sm sm:text-base font-black tracking-widest bg-white/10 text-white px-5 py-2 rounded-full uppercase">
              PROMOCIÓN DE TEMPORADA
            </span>
          </div>
          
          <h2 className="font-display text-3xl sm:text-5xl font-black tracking-wider text-white">
            6 CUOTAS SIN INTERÉS EN TODO EL CATÁLOGO
          </h2>
          
          <p className="text-base sm:text-lg max-w-3xl mx-auto text-gray-300 leading-relaxed font-sans font-medium">
            Equípate hoy mismo y paga en cómodas cuotas fijas sin interés. Realizamos envíos de forma rápida a todo el territorio nacional.
          </p>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-[#1C2321] text-gray-200 border-t border-[#3C6E71]/20 py-10 sm:py-12 mt-auto">
        <div className="w-full px-4 sm:px-8 lg:px-12 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-6">
            <span className="font-display text-3xl sm:text-4xl font-black tracking-wider text-[#F2EFE9] flex items-center gap-3">
              <span className="bg-[#3C6E71] text-[#1C2321] px-3 py-1 rounded font-black font-mono-custom text-2xl sm:text-3xl">H</span>
              HOLUX
            </span>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-md font-medium">
              Tienda oficial de indumentaria y equipamiento outdoor de alta performance. Fabricado para soportar el clima de montaña.
            </p>
          </div>
          <div>
            <h4 className="font-display text-lg sm:text-xl font-black text-white tracking-widest mb-6">CATEGORÍAS</h4>
            <ul className="space-y-3 text-sm sm:text-base text-gray-300 font-medium">
              {categories.map(cat => (
                <li key={cat.id}>
                  <button 
                    onClick={() => { 
                      setActiveCategory(cat.slug); 
                      setActiveGender(null);
                      setCurrentView('category');
                      window.scrollTo(0, 0); 
                    }} 
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-display text-lg sm:text-xl font-black text-white tracking-widest mb-6">DESARROLLO DE API</h4>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-medium">
              Laravel 13 API Backend + Supabase Auth + PostgREST integration.
            </p>
            <div className="mt-8 pt-6 border-t border-gray-800 text-xs sm:text-sm text-gray-400 font-mono-custom font-bold">
              © {new Date().getFullYear()} HOLUX STORE. Todos los derechos reservados.
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
                                src={getProductImage(item.name)} 
                                alt={item.name} 
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
                    <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-6">
                      <div className="flex items-center justify-between text-gray-900">
                        <span className="font-display text-sm font-bold tracking-wider">TOTAL ESTIMADO</span>
                        <span className="font-sans text-xl font-bold">
                          ${Math.round(getCartTotal()).toLocaleString('es-AR')}
                        </span>
                      </div>

                      {/* Checkout form */}
                      <form onSubmit={handleCheckout} className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 tracking-wider block">NOMBRE COMPLETO</label>
                          <input
                            type="text"
                            required
                            value={checkoutName}
                            onChange={(e) => setCheckoutName(e.target.value)}
                            placeholder="Ej: José Valero"
                            className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:border-[#3C6E71] focus:ring-0 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 tracking-wider block">EMAIL DE CONTACTO</label>
                          <input
                            type="email"
                            required
                            value={checkoutEmail}
                            onChange={(e) => setCheckoutEmail(e.target.value)}
                            placeholder="Ej: jose@example.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:border-[#3C6E71] focus:ring-0 outline-none"
                          />
                        </div>
                        
                        <button
                          type="submit"
                          className="w-full py-3 bg-[#3C6E71] text-white font-display text-xs font-bold tracking-wider rounded hover:bg-[#3C6E71]/95 transition-all shadow-md shadow-[#3C6E71]/20 mt-3 cursor-pointer"
                        >
                          CONFIRMAR COMPRA
                        </button>
                      </form>
                    </div>
                  )}
                </>
              )}
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

      {/* --- ADMIN MODAL PANEL --- */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAdminOpen(false)} />
          
          <div className="relative w-full max-w-5xl bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-200 flex flex-col h-[90vh]">
            
            {/* Header */}
            <div className="bg-[#1C2321] text-white p-5 flex items-center justify-between border-b border-[#3C6E71]/20">
              <div className="flex items-center gap-2">
                <span className="bg-[#B85C38] text-white px-2 py-0.5 rounded font-black font-mono-custom text-xs">A</span>
                <h2 className="font-display text-lg font-bold tracking-wider">PANEL DE CONTROL DE ADMINISTRACIÓN</h2>
              </div>
              <button onClick={() => setIsAdminOpen(false)} className="p-1 hover:bg-white/10 rounded transition-colors cursor-pointer text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-grow flex overflow-hidden">
              {/* Admin Sidebar */}
              <aside className="w-48 bg-gray-50 border-r border-gray-200 p-4 space-y-2 overflow-y-auto hidden sm:block">
                {[
                  { id: 'dashboard', label: 'DASHBOARD', icon: TrendingUp },
                  { id: 'orders', label: 'PEDIDOS', icon: ShoppingBag },
                  { id: 'products', label: 'PRODUCTOS', icon: Box },
                  { id: 'categories', label: 'CATEGORÍAS', icon: Grid },
                  { id: 'customers', label: 'CLIENTES', icon: Users },
                  { id: 'reviews', label: 'MODERAR RESEÑAS', icon: MessageSquare }
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setAdminTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left font-display text-xs font-bold tracking-wider transition-all cursor-pointer ${adminTab === item.id ? 'bg-[#3C6E71] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
              </aside>

              {/* Admin Main content */}
              <main className="flex-grow p-6 overflow-y-auto bg-white">
                
                {/* 1. ADMIN DASHBOARD */}
                {adminTab === 'dashboard' && adminStats && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="p-5 bg-gray-50 border border-gray-200 rounded-lg space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase font-display">FACTURACIÓN GLOBAL</span>
                        <div className="text-xl font-bold font-mono-custom text-gray-900">
                          ARS {adminStats.total_revenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="p-5 bg-gray-50 border border-gray-200 rounded-lg space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase font-display">ÓRDENES COMPLETADAS</span>
                        <div className="text-xl font-bold font-mono-custom text-[#3C6E71]">
                          {adminStats.orders_by_status.completed || 0}
                        </div>
                      </div>
                      <div className="p-5 bg-gray-50 border border-gray-200 rounded-lg space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase font-display">ÓRDENES PENDIENTES</span>
                        <div className="text-xl font-bold font-mono-custom text-amber-600">
                          {adminStats.orders_by_status.pending || 0}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      {/* Top Products */}
                      <div className="border border-gray-200 rounded-lg p-5 bg-white space-y-4">
                        <h4 className="font-display text-sm font-bold text-gray-800 tracking-wider uppercase border-b border-gray-100 pb-2">
                          MÁS VENDIDOS
                        </h4>
                        <div className="space-y-3">
                          {adminStats.top_selling_products.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-4">No hay datos de ventas.</p>
                          ) : (
                            adminStats.top_selling_products.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs">
                                <div>
                                  <span className="font-bold text-gray-700">{item.product_name}</span>
                                  <span className="text-[10px] text-gray-400 ml-2 font-mono-custom">({item.product_brand})</span>
                                </div>
                                <span className="bg-[#3C6E71]/10 text-[#3C6E71] px-2 py-0.5 rounded font-mono-custom font-bold">
                                  {item.units_sold} uds.
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Orders by status breakdown */}
                      <div className="border border-gray-200 rounded-lg p-5 bg-white space-y-4">
                        <h4 className="font-display text-sm font-bold text-gray-800 tracking-wider uppercase border-b border-gray-100 pb-2">
                          ESTADOS DE PEDIDOS
                        </h4>
                        <div className="space-y-3">
                          {Object.entries(adminStats.orders_by_status).map(([status, count]) => (
                            <div key={status} className="flex justify-between items-center text-xs">
                              <span className="font-display font-medium text-gray-600 tracking-wider uppercase">{status}</span>
                              <span className="font-mono-custom font-bold text-gray-800">{count} pedidos</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. ADMIN ORDERS LIST */}
                {adminTab === 'orders' && (
                  <div className="space-y-4">
                    <h3 className="font-display text-sm font-bold text-gray-800 tracking-wider uppercase border-b border-gray-100 pb-2">
                      GESTIÓN GLOBAL DE PEDIDOS
                    </h3>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border border-gray-200 rounded">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-widest font-display text-[9px]">
                            <th className="p-3">ID / Fecha</th>
                            <th className="p-3">Cliente</th>
                            <th className="p-3">Total</th>
                            <th className="p-3">Estado</th>
                            <th className="p-3 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-gray-700">
                          {adminOrdersList.map(order => (
                            <tr key={order.id} className="hover:bg-gray-50/50">
                              <td className="p-3 font-mono-custom">
                                <span className="font-bold select-all">{order.id.slice(0, 8)}...</span>
                                <div className="text-[10px] text-gray-400 mt-0.5">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="font-bold text-gray-800">{order.customer_name}</div>
                                <div className="text-[10px] text-gray-400 font-mono-custom">{order.customer_email}</div>
                              </td>
                              <td className="p-3 font-mono-custom font-bold text-gray-800">
                                ARS {order.total.toLocaleString()}
                              </td>
                              <td className="p-3">
                                <select
                                  value={order.status}
                                  onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                  className="px-2 py-1 bg-white border border-gray-300 rounded text-[10px] font-display font-medium outline-none focus:border-[#3C6E71] cursor-pointer"
                                >
                                  <option value="pending">PENDING</option>
                                  <option value="processing">PROCESSING</option>
                                  <option value="completed">COMPLETED</option>
                                  <option value="cancelled">CANCELLED</option>
                                </select>
                              </td>
                              <td className="p-3 text-right">
                                <a
                                  href={`${API_BASE_URL}/api/admin/orders/${order.id}/ticket?token=${token}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-[#3C6E71]/10 text-[#3C6E71] rounded text-[9px] font-display font-bold tracking-wider hover:bg-[#3C6E71]/20 transition-all"
                                >
                                  <Download className="w-3 h-3" />
                                  PDF
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3. ADMIN PRODUCTS CRUD */}
                {adminTab === 'products' && (
                  <div className="space-y-6">
                    {/* Add Product Form */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                      <h4 className="text-xs font-bold tracking-wider text-gray-700 uppercase font-display mb-4">
                        {editingProduct ? 'EDITAR PRODUCTO CATALOGO' : 'AÑADIR NUEVO PRODUCTO'}
                      </h4>

                      <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-500 tracking-wider">NOMBRE PRODUCTO</label>
                            <input
                              type="text"
                              required
                              value={prodName}
                              onChange={(e) => setProdName(e.target.value)}
                              placeholder="Ej: Campera Fitz Roy"
                              className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:border-[#3C6E71] outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-500 tracking-wider">MARCA</label>
                            <input
                              type="text"
                              required
                              value={prodBrand}
                              onChange={(e) => setProdBrand(e.target.value)}
                              placeholder="Ej: Holux Gear"
                              className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:border-[#3C6E71] outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-500 tracking-wider">CATEGORÍA</label>
                            <select
                              required
                              value={prodCategoryId}
                              onChange={(e) => setProdCategoryId(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-gray-300 rounded bg-white focus:border-[#3C6E71] outline-none"
                            >
                              <option value="">Seleccionar...</option>
                              {adminCategoriesList.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-500 tracking-wider">PRECIO (ARS)</label>
                            <input
                              type="number"
                              required
                              min="0"
                              step="0.01"
                              value={prodPrice}
                              onChange={(e) => setProdPrice(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:border-[#3C6E71] outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-500 tracking-wider">CUOTAS SIN INTERÉS</label>
                            <input
                              type="number"
                              required
                              min="0"
                              value={prodInstallments}
                              onChange={(e) => setProdInstallments(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:border-[#3C6E71] outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-500 tracking-wider">ICONO VECTORIAL</label>
                            <input
                              type="text"
                              required
                              value={prodIcon}
                              onChange={(e) => setProdIcon(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:border-[#3C6E71] outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-500 tracking-wider">STOCK DISPONIBLE</label>
                            <input
                              type="number"
                              required
                              min="0"
                              value={prodStock}
                              onChange={(e) => setProdStock(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:border-[#3C6E71] outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {editingProduct && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProduct(null);
                                setProdName('');
                                setProdBrand('');
                                setProdCategoryId('');
                                setProdPrice(0);
                                setProdInstallments(6);
                                setProdIcon('Box');
                                setProdStock(10);
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
                            {editingProduct ? 'EDITAR PRODUCTO' : 'CREAR PRODUCTO'}
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Products list table */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-gray-500 tracking-wider uppercase font-display border-b border-gray-100 pb-2">
                        LISTADO DE PRODUCTOS ACTIVO
                      </h4>
                      
                      <div className="overflow-x-auto text-xs">
                        <table className="w-full text-left border border-gray-200">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-widest font-display text-[9px]">
                              <th className="p-3">Producto / Marca</th>
                              <th className="p-3">Categoría</th>
                              <th className="p-3">Precio</th>
                              <th className="p-3">Stock</th>
                              <th className="p-3 text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 text-gray-700">
                            {adminProductsList.map(prod => (
                              <tr key={prod.id} className="hover:bg-gray-50/50">
                                <td className="p-3">
                                  <span className="font-bold text-gray-800">{prod.name}</span>
                                  <div className="text-[10px] text-gray-400">{prod.brand}</div>
                                </td>
                                <td className="p-3">{prod.categories?.name || 'Unknown'}</td>
                                <td className="p-3 font-mono-custom font-bold">ARS {prod.price.toLocaleString()}</td>
                                <td className="p-3 font-mono-custom">{prod.stock} uds.</td>
                                <td className="p-3 text-right space-x-2">
                                  <button
                                    onClick={() => {
                                      setEditingProduct(prod);
                                      setProdName(prod.name);
                                      setProdBrand(prod.brand);
                                      setProdCategoryId(prod.category_id);
                                      setProdPrice(prod.price);
                                      setProdInstallments(prod.installments);
                                      setProdIcon(prod.icon);
                                      setProdStock(prod.stock);
                                    }}
                                    className="p-1 text-gray-500 hover:text-black hover:bg-gray-50 rounded transition-colors cursor-pointer inline-block"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(prod.id)}
                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer inline-block"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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

                {/* 4. ADMIN CATEGORIES CRUD */}
                {adminTab === 'categories' && (
                  <div className="space-y-6">
                    {/* Add Category Form */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                      <h4 className="text-xs font-bold tracking-wider text-gray-700 uppercase font-display mb-4">
                        {editingCategory ? 'EDITAR CATEGORÍA' : 'CREAR NUEVA CATEGORÍA'}
                      </h4>

                      <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-500 tracking-wider">NOMBRE CATEGORÍA</label>
                            <input
                              type="text"
                              required
                              value={catName}
                              onChange={(e) => setCatName(e.target.value)}
                              placeholder="Ej: Camping"
                              className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:border-[#3C6E71] outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-500 tracking-wider">SLUG (URL)</label>
                            <input
                              type="text"
                              required
                              value={catSlug}
                              onChange={(e) => setCatSlug(e.target.value)}
                              placeholder="Ej: camping"
                              className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:border-[#3C6E71] outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {editingCategory && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCategory(null);
                                setCatName('');
                                setCatSlug('');
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
                            {editingCategory ? 'EDITAR CATEGORÍA' : 'CREAR CATEGORÍA'}
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Categories Table */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-gray-500 tracking-wider uppercase font-display border-b border-gray-100 pb-2">
                        LISTADO DE CATEGORÍAS
                      </h4>

                      <div className="overflow-x-auto text-xs border border-gray-200">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-widest font-display text-[9px]">
                              <th className="p-3">Nombre</th>
                              <th className="p-3">Slug / URL</th>
                              <th className="p-3 text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 text-gray-700">
                            {adminCategoriesList.map(cat => (
                              <tr key={cat.id} className="hover:bg-gray-50/50">
                                <td className="p-3 font-bold text-gray-800">{cat.name}</td>
                                <td className="p-3 font-mono-custom">{cat.slug}</td>
                                <td className="p-3 text-right space-x-2">
                                  <button
                                    onClick={() => {
                                      setEditingCategory(cat);
                                      setCatName(cat.name);
                                      setCatSlug(cat.slug);
                                    }}
                                    className="p-1 text-gray-500 hover:text-black hover:bg-gray-50 rounded transition-colors cursor-pointer inline-block"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCategory(cat.id)}
                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer inline-block"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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

                {/* 5. ADMIN CUSTOMERS MANAGEMENT */}
                {adminTab === 'customers' && (
                  <div className="space-y-6">
                    {/* Promote Admin Form */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                      <h4 className="text-xs font-bold tracking-wider text-gray-700 uppercase font-display mb-3">
                        PROMOVER NUEVO ADMINISTRADOR
                      </h4>

                      <form onSubmit={handlePromoteAdmin} className="flex gap-3 text-xs items-end">
                        <div className="space-y-1 flex-grow">
                          <label className="text-[9px] font-bold text-gray-500 tracking-wider">UUID DE USUARIO DE SUPABASE</label>
                          <input
                            type="text"
                            required
                            value={promoteUserId}
                            onChange={(e) => setPromoteUserId(e.target.value)}
                            placeholder="Ej: f4d156e7-1234-5678-..."
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:border-[#3C6E71] outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-[#B85C38] text-white rounded font-display font-bold tracking-wider hover:bg-[#B85C38]/95 transition-all shadow-md shadow-[#B85C38]/10 cursor-pointer"
                        >
                          PROMOVER
                        </button>
                      </form>
                    </div>

                    {/* Customers Table */}
                    <div className="space-y-2 text-xs">
                      <h4 className="text-[10px] font-bold text-gray-500 tracking-wider uppercase font-display border-b border-gray-100 pb-2">
                        LISTADO DE CLIENTES REGISTRADOS
                      </h4>

                      <div className="overflow-x-auto border border-gray-200">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-widest font-display text-[9px]">
                              <th className="p-3">Cliente / ID</th>
                              <th className="p-3">Contacto</th>
                              <th className="p-3">Rol</th>
                              <th className="p-3">Estado Cuenta</th>
                              <th className="p-3 text-right">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 text-gray-700">
                            {adminCustomersList.map(cust => (
                              <tr key={cust.id} className="hover:bg-gray-50/50">
                                <td className="p-3">
                                  <div className="font-bold text-gray-800">{cust.full_name}</div>
                                  <div className="text-[9px] text-gray-400 font-mono-custom select-all">{cust.id}</div>
                                </td>
                                <td className="p-3">
                                  <div className="font-mono-custom">{cust.phone || 'Sin teléfono'}</div>
                                </td>
                                <td className="p-3 font-display font-bold tracking-wider text-[10px] text-gray-600">
                                  {cust.role.toUpperCase()}
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded font-display font-bold text-[9px] ${cust.active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                    {cust.active ? 'ACTIVO' : 'BLOQUEADO'}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => handleToggleCustomerActive(cust.id, cust.active)}
                                    className={`px-3 py-1 border rounded text-[9px] font-display font-bold tracking-wider transition-all cursor-pointer ${
                                      cust.active
                                        ? 'border-red-200 text-red-600 hover:bg-red-50'
                                        : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                    }`}
                                  >
                                    {cust.active ? 'BLOQUEAR' : 'ACTIVAR'}
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

                {/* 6. ADMIN REVIEWS MODERATION */}
                {adminTab === 'reviews' && (
                  <div className="space-y-4">
                    <h3 className="font-display text-sm font-bold text-gray-800 tracking-wider uppercase border-b border-gray-100 pb-2">
                      MODERACIÓN DE COMENTARIOS Y RESEÑAS
                    </h3>

                    <div className="overflow-x-auto text-xs border border-gray-200">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-widest font-display text-[9px]">
                            <th className="p-3">Producto</th>
                            <th className="p-3">Cliente</th>
                            <th className="p-3">Rating / Comentario</th>
                            <th className="p-3">Moderado</th>
                            <th className="p-3 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-gray-700">
                          {adminReviewsList.map(rev => (
                            <tr key={rev.id} className="hover:bg-gray-50/50">
                              <td className="p-3 font-bold text-gray-800">{rev.products?.name}</td>
                              <td className="p-3">{rev.profiles?.full_name}</td>
                              <td className="p-3 space-y-1">
                                <div className="flex items-center text-yellow-400">
                                  {Array.from({ length: rev.rating }).map((_, i) => (
                                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                                  ))}
                                </div>
                                <p className="italic text-gray-600 font-serif">"{rev.comment}"</p>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded font-display font-bold text-[9px] ${rev.approved ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                  {rev.approved ? 'APROBADO' : 'PENDIENTE'}
                                </span>
                              </td>
                              <td className="p-3 text-right space-x-2">
                                {!rev.approved ? (
                                  <button
                                    onClick={() => handleModerateReview(rev.id, true)}
                                    className="p-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 rounded text-[9px] font-display font-bold tracking-wider transition-all cursor-pointer inline-block"
                                  >
                                    APROBAR
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleModerateReview(rev.id, false)}
                                    className="p-1.5 bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 rounded text-[9px] font-display font-bold tracking-wider transition-all cursor-pointer inline-block"
                                  >
                                    RECHAZAR
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteReview(rev.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-all cursor-pointer inline-block"
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
                )}
              </main>
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

      </div>

    </div>
  );
}
