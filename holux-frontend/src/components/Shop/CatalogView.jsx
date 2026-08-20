import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  X, 
  SlidersHorizontal,
  Layers,
  LayoutGrid,
  Grid2X2
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
  onNavigateHome,
  favorites: propFavorites,
  onToggleFavorite: propOnToggleFavorite
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
  const [gridColumns, setGridColumns] = useState(4); // 4 or 3
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

  const activeFavorites = propFavorites !== undefined ? propFavorites : favorites;
  const activeToggleFavorite = propOnToggleFavorite || handleToggleFavorite;

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
      return col === 'outlet' ? 'Outlet' : col.charAt(0).toUpperCase() + col.slice(1);
    }
    if (selectedCategories.length === 1) {
      const found = availableCategories.find(c => c.slug === selectedCategories[0]);
      return found ? found.name : selectedCategories[0];
    }
    if (selectedCategories.length > 1) {
      return 'Catálogo Filtrado';
    }
    return 'Catálogo completo';
  }, [selectedCollections, selectedCategories, availableCategories]);

  return (
    <main className="flex-grow bg-[#F5F4F0] min-h-screen py-6 sm:py-8 text-left" ref={gridTopRef}>
      <div className="max-w-[1720px] mx-auto px-3 sm:px-5 lg:px-6 space-y-6">
        
        {/* --- BREADCRUMBS & CABECERA DEL CATÁLOGO (ESTILO OUTDOOR PREMIUM) --- */}
        <div className="relative overflow-hidden bg-white border border-gray-200/90 rounded-2xl px-5 sm:px-7 py-5 shadow-xs space-y-4">
          
          {/* Decorative Watermark Logo (Rotated 90 degrees and mirrored to form Z shape) */}
          <img 
            src="/holuxlogo.png" 
            alt="" 
            className="absolute -right-4 sm:right-4 lg:right-8 top-1/2 -translate-y-1/2 w-32 sm:w-40 lg:w-48 opacity-[0.06] pointer-events-none select-none z-0 object-contain rotate-90 -scale-x-100 transform"
          />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Breadcrumbs & Title */}
            <div className="space-y-2">
              <nav className="flex items-center gap-2 text-xs text-gray-500 font-sans">
                <button 
                  type="button"
                  onClick={onNavigateHome}
                  className="hover:text-[#3C6E71] cursor-pointer transition-colors font-medium"
                >
                  Inicio
                </button>
                <ChevronRight className="w-3 h-3 text-gray-400" />
                <span className={pageTitle !== 'Catálogo completo' ? 'text-gray-500 font-medium' : 'text-[#3C6E71] font-bold'}>
                  Catálogo
                </span>
                {pageTitle !== 'Catálogo completo' && (
                  <>
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                    <span className="text-[#3C6E71] font-bold uppercase truncate max-w-[200px]">
                      {pageTitle}
                    </span>
                  </>
                )}
              </nav>

              <div className="flex items-center gap-3.5 pt-0.5">
                <h1 className="font-display text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">
                  {pageTitle}
                </h1>
                <span className="inline-flex items-center gap-1.5 text-xs font-sans font-bold bg-[#3C6E71]/10 text-[#3C6E71] border border-[#3C6E71]/20 px-3 py-0.5 rounded-full">
                  {totalProducts} {totalProducts === 1 ? 'producto' : 'productos'}
                </span>
              </div>
            </div>

            {/* Right Controls: Grid Toggle & Sort */}
            <div className="flex items-center justify-between md:justify-end gap-3.5 flex-wrap">
              
              {/* Mobile Filter Button */}
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold font-sans flex items-center gap-2 cursor-pointer transition-colors border border-gray-200"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#3C6E71]" />
                <span>Filtros {hasActiveFilters && '(Activos)'}</span>
              </button>

              {/* Grid Toggle (Desktop/Tablet) */}
              <div className="hidden sm:flex items-center gap-1 bg-gray-100/90 p-1 rounded-xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setGridColumns(4)}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${gridColumns === 4 ? 'bg-white text-[#1C2321] shadow-xs font-bold' : 'text-gray-400 hover:text-gray-700'}`}
                  title="Vista 4 columnas"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setGridColumns(3)}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${gridColumns === 3 ? 'bg-white text-[#1C2321] shadow-xs font-bold' : 'text-gray-400 hover:text-gray-700'}`}
                  title="Vista 3 columnas"
                >
                  <Grid2X2 className="w-4 h-4" />
                </button>
              </div>

              {/* Sorting Dropdown */}
              <div className="flex items-center gap-2 text-xs font-sans">
                <span className="text-gray-500 font-medium whitespace-nowrap hidden sm:inline">Ordenar por:</span>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                    className="appearance-none bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl pl-3.5 pr-8 py-2 text-xs font-bold text-gray-800 outline-none focus:border-[#3C6E71] focus:ring-2 focus:ring-[#3C6E71]/20 cursor-pointer transition-all shadow-2xs"
                  >
                    <option value="relevant">Más relevantes</option>
                    <option value="price_asc">Menor precio</option>
                    <option value="price_desc">Mayor precio</option>
                    <option value="newest">Más recientes</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Active Filter Chips (Only shown when filters are selected) */}
          {hasActiveFilters && (
            <div className="relative z-10 pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap text-xs">
              <span className="text-gray-400 font-medium text-[11px] uppercase tracking-wider font-display mr-1">Filtros aplicados:</span>
              
              {selectedCollections.map(col => (
                <span key={col} className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-800 border border-gray-200 rounded-full font-bold text-[11px]">
                  Colección: {col.charAt(0).toUpperCase() + col.slice(1)}
                  <button type="button" onClick={() => handleToggleCollection(col)} className="hover:text-red-500 cursor-pointer ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {selectedSizes.map(sz => (
                <span key={sz} className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-800 border border-gray-200 rounded-full font-bold text-[11px]">
                  Talle: {sz}
                  <button type="button" onClick={() => handleToggleSize(sz)} className="hover:text-red-500 cursor-pointer ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {userPriceMax < priceRange.max && (
                <span key="price" className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-800 border border-gray-200 rounded-full font-bold text-[11px]">
                  Hasta ${userPriceMax.toLocaleString('es-AR')}
                  <button type="button" onClick={() => setUserPriceMax(priceRange.max)} className="hover:text-red-500 cursor-pointer ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {inStockOnly && (
                <span key="stock" className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold text-[11px]">
                  En stock
                  <button type="button" onClick={() => setInStockOnly(false)} className="hover:text-red-500 cursor-pointer ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleClearFilters}
                className="text-[11px] font-bold text-[#1C2321] hover:underline ml-auto cursor-pointer flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpiar todos</span>
              </button>
            </div>
          )}
        </div>

        {/* --- MAIN LAYOUT: SIDEBAR (FILTROS) + GRID DE 4 COLUMNAS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          
          {/* ========================================================== */}
          {/* 1. SIDEBAR DE FILTROS (DESKTOP)                            */}
          {/* ========================================================== */}
          <aside className="hidden lg:block lg:col-span-3 xl:col-span-3 2xl:col-span-2 space-y-4">
            <div className="bg-white border border-gray-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
              
              {/* Header de Filtros */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#3C6E71]" />
                  <h2 className="font-display text-xs font-extrabold uppercase tracking-wider text-gray-900">
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

              {/* 1. CATEGORÍA */}
              <div className="border-b border-gray-100 pb-5">
                <button
                  type="button"
                  onClick={() => toggleAccordion('categories')}
                  className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-900 font-display cursor-pointer hover:text-[#3C6E71] transition-colors select-none"
                >
                  <span>Categoría</span>
                  {accordionOpen.categories ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                </button>

                {accordionOpen.categories && (
                  <div className="mt-3.5 space-y-2.5 text-xs font-sans">
                    {availableCategories.map(cat => {
                      const isChecked = selectedCategories.includes(cat.slug);
                      return (
                        <label
                          key={cat.id}
                          className="flex items-center gap-2.5 cursor-pointer text-gray-700 hover:text-black py-0.5 select-none transition-colors"
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

              {/* 2. COLECCIÓN */}
              <div className="border-b border-gray-100 pb-5">
                <button
                  type="button"
                  onClick={() => toggleAccordion('collections')}
                  className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-900 font-display cursor-pointer hover:text-[#3C6E71] transition-colors select-none"
                >
                  <span>Colección</span>
                  {accordionOpen.collections ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                </button>

                {accordionOpen.collections && (
                  <div className="mt-3.5 space-y-2.5 text-xs font-sans">
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
                          className="flex items-center gap-2.5 cursor-pointer text-gray-700 hover:text-black py-0.5 select-none transition-colors"
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

              {/* 3. TALLE / VARIANTES */}
              <div className="border-b border-gray-100 pb-5">
                <button
                  type="button"
                  onClick={() => toggleAccordion('sizes')}
                  className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-900 font-display cursor-pointer hover:text-[#3C6E71] transition-colors select-none"
                >
                  <span>Talle / Variantes</span>
                  {accordionOpen.sizes ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                </button>

                {accordionOpen.sizes && (
                  <div className="mt-3.5">
                    {availableSizes.length === 0 ? (
                      <p className="text-[11px] text-gray-400 italic">No hay variantes cargadas.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {availableSizes.map(size => {
                          const isSelected = selectedSizes.includes(size);
                          return (
                            <button
                              key={size}
                              type="button"
                              onClick={() => handleToggleSize(size)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono-custom transition-all cursor-pointer border ${
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

              {/* 4. PRECIO MÁXIMO */}
              <div className="border-b border-gray-100 pb-5">
                <button
                  type="button"
                  onClick={() => toggleAccordion('price')}
                  className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-900 font-display cursor-pointer hover:text-[#3C6E71] transition-colors select-none"
                >
                  <span>Precio Máximo</span>
                  {accordionOpen.price ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                </button>

                {accordionOpen.price && (
                  <div className="mt-3.5 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold font-mono-custom text-gray-800">
                      <span>${priceRange.min?.toLocaleString('es-AR')}</span>
                      <span className="text-[#3C6E71] bg-[#3C6E71]/10 px-2 py-0.5 rounded-md font-bold">
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

              {/* 5. DISPONIBILIDAD */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion('stock')}
                  className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-900 font-display cursor-pointer hover:text-[#3C6E71] transition-colors select-none"
                >
                  <span>Disponibilidad</span>
                  {accordionOpen.stock ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                </button>

                {accordionOpen.stock && (
                  <div className="mt-3.5 text-xs font-sans">
                    <label className="flex items-center gap-2.5 cursor-pointer text-gray-700 hover:text-black select-none transition-colors">
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
          {/* 2. PRODUCT GRID                                            */}
          {/* ========================================================== */}
          <div className="lg:col-span-9 xl:col-span-9 2xl:col-span-10 space-y-6">
            
            {/* Grid Container */}
            {loading ? (
              <div className="py-24 text-center bg-white border border-gray-200/90 rounded-2xl shadow-xs animate-pulse space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-[#3C6E71] border-t-transparent animate-spin mx-auto"></div>
                <p className="font-display text-xs font-bold uppercase tracking-widest text-gray-500">
                  Cargando productos de la colección...
                </p>
              </div>
            ) : products.length === 0 ? (
              <div className="py-20 text-center bg-white border border-gray-200/90 rounded-2xl shadow-xs p-8 space-y-3">
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
              /* GRID DINÁMICO: 4 o 3 COLUMNAS EN DESKTOP, 2 EN TABLET, 1 EN MOBILE */
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridColumns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-5 sm:gap-6 w-full`}>
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isFavorite={activeFavorites.some(id => String(id) === String(product.id))}
                    onToggleFavorite={activeToggleFavorite}
                    onProductClick={onProductClick}
                    onAddToCart={onAddToCart}
                    onBuyNow={onBuyNow}
                  />
                ))}
              </div>
            )}

            {/* --- PAGINADOR REAL --- */}
            {lastPage > 1 && (
              <div className="bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                    page <= 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>

                <div className="flex items-center gap-1.5 overflow-x-auto">
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
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
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

      {/* --- DRAWER MOBILE DE FILTROS --- */}
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