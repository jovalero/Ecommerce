import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  X, 
  Check, 
  SlidersHorizontal,
  Layers,
  Sparkles,
  ShoppingBag,
  Heart
} from 'lucide-react';
import ProductCard from './ProductCard';

export default function CatalogView({
  API_BASE_URL,
  token,
  initialCategory = null,
  initialCollection = null,
  searchQuery = '',
  onProductClick,
  onAddToCart,
  onBuyNow,
  onNavigateHome
}) {
  // --- STATE: FILTERS ---
  const [selectedCategories, setSelectedCategories] = useState(() => 
    initialCategory ? [initialCategory] : []
  );
  const [selectedCollections, setSelectedCollections] = useState(() => 
    initialCollection ? [initialCollection] : []
  );
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 200000 });
  const [userPriceMax, setUserPriceMax] = useState(200000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('relevant');
  const [page, setPage] = useState(1);
  const perPage = 12;

  // --- STATE: DATA & METADATA ---
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [fromItem, setFromItem] = useState(0);
  const [toItem, setToItem] = useState(0);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // --- STATE: COLLAPSIBLE ACCORDIONS ---
  const [accordionOpen, setAccordionOpen] = useState({
    categories: true,
    collections: true,
    sizes: true,
    price: true,
    stock: true
  });

  const toggleAccordion = (key) => {
    setAccordionOpen(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // --- STATE: FAVORITES ---
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('holux_guest_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync favorites with backend if token exists
  useEffect(() => {
    const fetchAndSyncFavorites = async () => {
      if (!token) return;

      // 1. Check if there are guest favorites in localStorage to sync
      let localFavs = [];
      try {
        const saved = localStorage.getItem('holux_guest_favorites');
        localFavs = saved ? JSON.parse(saved) : [];
      } catch {}

      if (localFavs.length > 0) {
        try {
          const syncRes = await fetch(`${API_BASE_URL}/api/favorites/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ product_ids: localFavs })
          });
          if (syncRes.ok) {
            const syncData = await syncRes.json();
            if (syncData.product_ids) {
              setFavorites(syncData.product_ids);
              // Clean localStorage ONLY AFTER SUCCESSFUL SERVER RESPONSE
              localStorage.removeItem('holux_guest_favorites');
            }
            return;
          }
        } catch (err) {
          console.error("Error syncing favorites:", err);
        }
      }

      // 2. Fetch logged in favorites
      try {
        const res = await fetch(`${API_BASE_URL}/api/favorites`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.product_ids) {
            setFavorites(data.product_ids);
          }
        }
      } catch (err) {
        console.error("Error fetching favorites:", err);
      }
    };

    fetchAndSyncFavorites();
  }, [token, API_BASE_URL]);

  const handleToggleFavorite = async (productId) => {
    const isCurrentlyFav = favorites.includes(productId);
    const updated = isCurrentlyFav
      ? favorites.filter(id => id !== productId)
      : [...favorites, productId];

    setFavorites(updated);

    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/favorites/toggle`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ product_id: productId })
        });
      } catch (err) {
        console.error("Failed to toggle favorite on server:", err);
      }
    } else {
      // Guest mode: persist in localStorage
      localStorage.setItem('holux_guest_favorites', JSON.stringify(updated));
    }
  };

  // --- FETCH CATEGORIES LIST ---
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/categories`);
        if (res.ok) {
          const data = await res.json();
          setAvailableCategories(data || []);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCats();
  }, [API_BASE_URL]);

  // Synchronize when initialCategory or initialCollection props change from URL
  useEffect(() => {
    if (initialCategory) {
      setSelectedCategories([initialCategory]);
      setSelectedCollections([]);
      setPage(1);
    }
  }, [initialCategory]);

  useEffect(() => {
    if (initialCollection) {
      setSelectedCollections([initialCollection]);
      setSelectedCategories([]);
      setPage(1);
    }
  }, [initialCollection]);

  // --- FETCH PRODUCTS SERVER-SIDE ---
  const fetchProductsServer = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategories.length > 0) {
        params.append('categories', selectedCategories.join(','));
      }
      if (selectedCollections.length > 0) {
        params.append('collections', selectedCollections.join(','));
      }
      if (selectedSizes.length > 0) {
        params.append('sizes', selectedSizes.join(','));
      }
      if (userPriceMax < priceRange.max) {
        params.append('max_price', userPriceMax);
      }
      if (inStockOnly) {
        params.append('in_stock', '1');
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      if (sortBy) {
        params.append('sort_by', sortBy);
      }
      params.append('page', page);
      params.append('per_page', perPage);

      const res = await fetch(`${API_BASE_URL}/api/products?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        setProducts(result.data || []);
        setTotalProducts(result.total || 0);
        setLastPage(result.last_page || 1);
        setFromItem(result.from || 0);
        setToItem(result.to || 0);

        if (result.price_range) {
          setPriceRange(result.price_range);
          if (userPriceMax === 200000 && result.price_range.max > 0) {
            setUserPriceMax(result.price_range.max);
          }
        }
        if (result.available_sizes) {
          setAvailableSizes(result.available_sizes);
        }
      }
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsServer();
  }, [
    selectedCategories, 
    selectedCollections, 
    selectedSizes, 
    userPriceMax, 
    inStockOnly, 
    sortBy, 
    page, 
    searchQuery
  ]);

  // Handle Category Toggle
  const handleToggleCategory = (slug) => {
    setPage(1);
    setSelectedCategories(prev => 
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  // Handle Collection Toggle
  const handleToggleCollection = (col) => {
    setPage(1);
    setSelectedCollections(prev => 
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  // Handle Size Chip Toggle
  const handleToggleSize = (size) => {
    setPage(1);
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  // Clear All Filters
  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSelectedCollections([]);
    setSelectedSizes([]);
    setUserPriceMax(priceRange.max || 150000);
    setInStockOnly(false);
    setSortBy('relevant');
    setPage(1);
  };

  const hasActiveFilters = 
    selectedCategories.length > 0 || 
    selectedCollections.length > 0 || 
    selectedSizes.length > 0 || 
    userPriceMax < (priceRange.max || 150000) || 
    inStockOnly;

  // Scroll to top of grid when page changes
  const gridTopRef = useRef(null);
  const handlePageChange = (newPage) => {
    setPage(newPage);
    if (gridTopRef.current) {
      gridTopRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Title calculation
  const pageTitle = useMemo(() => {
    if (selectedCollections.length === 1) {
      const col = selectedCollections[0];
      return col === 'outlet' ? 'Colección Outlet & Ofertas' : `Colección ${col.toUpperCase()}`;
    }
    if (selectedCategories.length === 1) {
      const found = availableCategories.find(c => c.slug === selectedCategories[0]);
      return found ? `Categoría ${found.name}` : `Categoría ${selectedCategories[0].toUpperCase()}`;
    }
    if (selectedCategories.length > 1) {
      return `Catálogo (${selectedCategories.length} categorías seleccionadas)`;
    }
    return 'Catálogo Completo de Productos';
  }, [selectedCollections, selectedCategories, availableCategories]);

  return (
    <main className="flex-grow bg-[#F5F4F0] min-h-screen py-8 text-left" ref={gridTopRef}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* --- BREADCRUMBS & TOP CONTROLS --- */}
        <div className="bg-white border border-gray-200/90 rounded-xl px-5 py-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Breadcrumbs & Title & Count */}
          <div className="flex items-center gap-2 text-xs font-sans flex-wrap">
            <button 
              type="button"
              onClick={onNavigateHome}
              className="text-gray-500 hover:text-[#3C6E71] cursor-pointer transition-colors font-medium"
            >
              Inicio
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-gray-400 font-medium">Catálogo</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-bold uppercase truncate max-w-[240px]">
              {pageTitle}
            </span>
            <span className="text-gray-300 hidden sm:inline">•</span>
            <span className="text-gray-500 font-medium hidden sm:inline">
              {totalProducts} productos
            </span>
          </div>

          {/* Right Top Actions (Count, Sort, Mobile Filter Button) */}
          <div className="flex items-center justify-between md:justify-end gap-3 flex-wrap">
            
            {/* Mobile Filter Trigger Button */}
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold font-sans flex items-center gap-1.5 cursor-pointer transition-colors border border-gray-200"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#3C6E71]" />
              <span>Filtros {hasActiveFilters && '(Activos)'}</span>
            </button>

            {/* Total count on small screens */}
            <span className="text-xs text-gray-500 font-sans sm:hidden">
              {totalProducts} prod.
            </span>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2 text-xs font-sans">
              <span className="text-gray-500 font-medium hidden sm:inline">Ordenar por:</span>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-800 outline-none focus:border-[#3C6E71] cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <option value="relevant">Más relevantes</option>
                <option value="price_asc">Menor precio</option>
                <option value="price_desc">Mayor precio</option>
                <option value="newest">Más recientes</option>
              </select>
            </div>
          </div>
        </div>

        {/* --- MAIN LAYOUT: SIDEBAR (FILTERS) + 4-COLUMN PRODUCT GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ========================================================== */}
          {/* 1. SIDEBAR (DESKTOP)                                       */}
          {/* ========================================================== */}
          <aside className="hidden lg:block lg:col-span-3 space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-5">
              
              {/* Sidebar Header & Clear Filters */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#3C6E71]" />
                  <h2 className="font-display text-xs font-black uppercase tracking-wider text-gray-900">
                    Filtros de Catálogo
                  </h2>
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Limpiar</span>
                  </button>
                )}
              </div>

              {/* 1. CATEGORÍA (CHECKBOX MÚLTIPLE DINÁMICO) */}
              <div className="border-b border-gray-100 pb-4">
                <button
                  type="button"
                  onClick={() => toggleAccordion('categories')}
                  className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-900 font-display cursor-pointer hover:text-[#3C6E71] transition-colors"
                >
                  <span>Categoría</span>
                  {accordionOpen.categories ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                </button>

                {accordionOpen.categories && (
                  <div className="mt-3 space-y-2 text-xs font-sans">
                    {availableCategories.map(cat => {
                      const isChecked = selectedCategories.includes(cat.slug);
                      return (
                        <label
                          key={cat.id}
                          className="flex items-center gap-2.5 cursor-pointer text-gray-700 hover:text-black py-0.5 select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleCategory(cat.slug)}
                            className="w-4 h-4 rounded text-[#3C6E71] focus:ring-[#3C6E71] cursor-pointer accent-[#3C6E71]"
                          />
                          <span className={isChecked ? 'font-bold text-[#3C6E71]' : 'font-normal'}>
                            {cat.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. COLECCIÓN (CHECKBOX MÚLTIPLE) */}
              <div className="border-b border-gray-100 pb-4">
                <button
                  type="button"
                  onClick={() => toggleAccordion('collections')}
                  className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-900 font-display cursor-pointer hover:text-[#3C6E71] transition-colors"
                >
                  <span>Colección</span>
                  {accordionOpen.collections ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                </button>

                {accordionOpen.collections && (
                  <div className="mt-3 space-y-2 text-xs font-sans">
                    {[
                      { key: 'mujer', label: 'Mujer' },
                      { key: 'hombre', label: 'Hombre' },
                      { key: 'niños', label: 'Niños' },
                      { key: 'outlet', label: 'Outlet' }
                    ].map(col => {
                      const isChecked = selectedCollections.includes(col.key);
                      return (
                        <label
                          key={col.key}
                          className="flex items-center gap-2.5 cursor-pointer text-gray-700 hover:text-black py-0.5 select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleCollection(col.key)}
                            className="w-4 h-4 rounded text-[#3C6E71] focus:ring-[#3C6E71] cursor-pointer accent-[#3C6E71]"
                          />
                          <span className={isChecked ? 'font-bold text-[#3C6E71]' : 'font-normal'}>
                            {col.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. TALLE (CHIPS INTERACTIVOS SELECCIONABLES) */}
              <div className="border-b border-gray-100 pb-4">
                <button
                  type="button"
                  onClick={() => toggleAccordion('sizes')}
                  className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-900 font-display cursor-pointer hover:text-[#3C6E71] transition-colors"
                >
                  <span>Talle / Variantes</span>
                  {accordionOpen.sizes ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                </button>

                {accordionOpen.sizes && (
                  <div className="mt-3">
                    {availableSizes.length === 0 ? (
                      <p className="text-[11px] text-gray-400 italic">No hay variantes cargadas en esta vista.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {availableSizes.map(size => {
                          const isSelected = selectedSizes.includes(size);
                          return (
                            <button
                              key={size}
                              type="button"
                              onClick={() => handleToggleSize(size)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono-custom transition-all cursor-pointer border ${
                                isSelected
                                  ? 'bg-[#1C2321] text-white border-[#1C2321] shadow-xs'
                                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 4. PRECIO (SLIDER DE RANGO DINÁMICO) */}
              <div className="border-b border-gray-100 pb-4">
                <button
                  type="button"
                  onClick={() => toggleAccordion('price')}
                  className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-900 font-display cursor-pointer hover:text-[#3C6E71] transition-colors"
                >
                  <span>Precio Máximo</span>
                  {accordionOpen.price ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                </button>

                {accordionOpen.price && (
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold font-mono-custom text-gray-800">
                      <span>${priceRange.min?.toLocaleString('es-AR')}</span>
                      <span className="text-[#3C6E71] bg-[#3C6E71]/10 px-2 py-0.5 rounded">
                        Hasta ${userPriceMax?.toLocaleString('es-AR')}
                      </span>
                    </div>

                    <input
                      type="range"
                      min={priceRange.min || 0}
                      max={priceRange.max || 150000}
                      step={1000}
                      value={userPriceMax}
                      onChange={(e) => { setUserPriceMax(Number(e.target.value)); setPage(1); }}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#3C6E71]"
                    />
                  </div>
                )}
              </div>

              {/* 5. DISPONIBILIDAD (SOLO EN STOCK) */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion('stock')}
                  className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-900 font-display cursor-pointer hover:text-[#3C6E71] transition-colors"
                >
                  <span>Disponibilidad</span>
                  {accordionOpen.stock ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                </button>

                {accordionOpen.stock && (
                  <div className="mt-3 text-xs font-sans">
                    <label className="flex items-center gap-2.5 cursor-pointer text-gray-700 hover:text-black select-none">
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={(e) => { setInStockOnly(e.target.checked); setPage(1); }}
                        className="w-4 h-4 rounded text-[#3C6E71] focus:ring-[#3C6E71] cursor-pointer accent-[#3C6E71]"
                      />
                      <span className={inStockOnly ? 'font-bold text-[#3C6E71]' : 'font-normal'}>
                        Solo productos en stock
                      </span>
                    </label>
                  </div>
                )}
              </div>

            </div>
          </aside>

          {/* ========================================================== */}
          {/* 2. PRODUCT GRID (4 COLUMNS DESKTOP, 2 TABLET, 1 MOBILE)   */}
          {/* ========================================================== */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* Active Filters Pill Bar (if any) */}
            {hasActiveFilters && (
              <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-xs flex items-center gap-2 flex-wrap text-xs">
                <span className="font-bold text-gray-500 font-sans">Filtros aplicados:</span>
                
                {selectedCategories.map(cat => (
                  <span key={cat} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-800 rounded-full font-bold text-[11px]">
                    Cat: {cat}
                    <button type="button" onClick={() => handleToggleCategory(cat)} className="hover:text-red-500 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {selectedCollections.map(col => (
                  <span key={col} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-800 rounded-full font-bold text-[11px]">
                    Colección: {col}
                    <button type="button" onClick={() => handleToggleCollection(col)} className="hover:text-red-500 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {selectedSizes.map(sz => (
                  <span key={sz} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-800 rounded-full font-bold text-[11px]">
                    Talle: {sz}
                    <button type="button" onClick={() => handleToggleSize(sz)} className="hover:text-red-500 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {inStockOnly && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold text-[11px]">
                    En stock
                    <button type="button" onClick={() => setInStockOnly(false)} className="hover:text-red-500 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-[11px] font-bold text-rose-600 hover:underline ml-auto cursor-pointer"
                >
                  Borrar todos
                </button>
              </div>
            )}

            {/* Grid Container */}
            {loading ? (
              <div className="py-24 text-center bg-white border border-gray-200 rounded-2xl shadow-xs animate-pulse space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-[#3C6E71] border-t-transparent animate-spin mx-auto"></div>
                <p className="font-display text-xs font-bold uppercase tracking-widest text-gray-500">
                  Cargando productos de la colección...
                </p>
              </div>
            ) : products.length === 0 ? (
              <div className="py-20 text-center bg-white border border-gray-200 rounded-2xl shadow-xs p-8 space-y-3">
                <Layers className="w-12 h-12 text-gray-300 mx-auto" />
                <h3 className="font-display text-base font-bold text-gray-800 uppercase">
                  No se encontraron productos con estos filtros
                </h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto font-sans">
                  Intenta cambiar los filtros seleccionados en el panel lateral o restablecer la búsqueda.
                </p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-5 py-2.5 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white rounded-xl text-xs font-bold font-display uppercase tracking-wider cursor-pointer shadow-md inline-block mt-2"
                >
                  Restablecer filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 w-full">
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isFavorite={favorites.includes(product.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onProductClick={onProductClick}
                    onAddToCart={onAddToCart}
                    onBuyNow={onBuyNow}
                  />
                ))}
              </div>
            )}

            {/* --- PAGINATOR CONTROLS --- */}
            {lastPage > 1 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold font-display uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                    page <= 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>

                <div className="flex items-center gap-1 overflow-x-auto">
                  {Array.from({ length: lastPage }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handlePageChange(p)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold font-mono-custom transition-all cursor-pointer ${
                        page === p
                          ? 'bg-[#1C2321] text-white shadow-sm'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={page >= lastPage}
                  onClick={() => handlePageChange(page + 1)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold font-display uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                    page >= lastPage
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white shadow-sm'
                  }`}
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* --- MOBILE FILTER DRAWER --- */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#3C6E71]" />
                  <h3 className="font-display text-sm font-bold text-gray-900 uppercase">
                    Filtros
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categorías mobile */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-gray-900 font-display uppercase">Categorías</span>
                <div className="space-y-1.5">
                  {availableCategories.map(cat => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.slug)}
                        onChange={() => handleToggleCategory(cat.slug)}
                        className="rounded text-[#3C6E71] accent-[#3C6E71]"
                      />
                      <span>{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Colecciones mobile */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-gray-900 font-display uppercase">Colección</span>
                <div className="space-y-1.5">
                  {['mujer', 'hombre', 'niños', 'outlet'].map(col => (
                    <label key={col} className="flex items-center gap-2 cursor-pointer uppercase">
                      <input
                        type="checkbox"
                        checked={selectedCollections.includes(col)}
                        onChange={() => handleToggleCollection(col)}
                        className="rounded text-[#3C6E71] accent-[#3C6E71]"
                      />
                      <span>{col}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Talles mobile */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-gray-900 font-display uppercase">Talles</span>
                <div className="flex flex-wrap gap-1.5">
                  {availableSizes.map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleToggleSize(size)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        selectedSizes.includes(size)
                          ? 'bg-[#1C2321] text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-2">
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full py-3 bg-[#3C6E71] text-white font-bold font-display uppercase rounded-xl tracking-wider cursor-pointer"
              >
                Ver {totalProducts} Productos
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="w-full py-2 bg-gray-100 text-gray-700 font-bold font-display uppercase rounded-xl text-xs cursor-pointer"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </main>
  );
}