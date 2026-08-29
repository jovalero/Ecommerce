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
import { productsMetadata } from '../../config/productsMetadata';
import { resolveProductImage } from '../../utils/bannerStorage';

const TOP_PERFUME_BRANDS = [
  'Antonio Banderas',
  'Carolina Herrera',
  'Dior',
  'Paco Rabanne',
  'Versace',
  'Chanel',
  'Giorgio Armani',
  'Tom Ford',
  'Jean Paul Gaultier',
  'Yves Saint Laurent',
  'Calvin Klein',
  'Dolce & Gabbana',
  'Givenchy',
  'Hugo Boss',
  'Lancôme',
  'Lattafa',
  'Montblanc',
  'Ralph Lauren',
  'Armaf',
  'Afnan',
  'Creed',
  'Azzaro',
  'Bvlgari',
  'Guerlain',
  'Narciso Rodriguez',
  'Prada',
  'Valentino'
];

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
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 200000 });
  const [userPriceMax, setUserPriceMax] = useState(200000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState(() => {
    try {
      const hash = window.location.hash || '';
      const params = new URLSearchParams(hash.split('?')[1] || '');
      const sUrl = params.get('sort_by') || params.get('orden');
      if (sUrl) return sUrl;
      const saved = sessionStorage.getItem('holux_catalog_sort');
      if (saved) return saved;
    } catch {}
    return 'relevant';
  });
  const [gridColumns, setGridColumns] = useState(4); // 4 or 3
  const [page, setPage] = useState(() => {
    try {
      const hash = window.location.hash || '';
      const params = new URLSearchParams(hash.split('?')[1] || '');
      const pUrl = params.get('page') || params.get('pagina');
      if (pUrl && Number(pUrl) > 0) return Number(pUrl);
      const saved = sessionStorage.getItem('holux_catalog_page');
      if (saved && Number(saved) > 0) return Number(saved);
    } catch {}
    return 1;
  });
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
    brands: true,
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
      let catsOk = false;
      try {
        const res = await fetch(`${API_BASE_URL}/api/categories`);
        if (res.ok) {
          const data = await res.json();
          const cats = Array.isArray(data) ? data : (data.data || []);
          if (cats.length > 0) {
            setAvailableCategories(cats);
            catsOk = true;
          }
        }
      } catch (err) {}

      if (!catsOk) {
        try {
          const supaUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fmbhcfsrsfkglmvgbnlm.supabase.co';
          const supaKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_aAzQcAqCATpYDGBVRNJRQQ_1CKarnEb';
          const supaRes = await fetch(`${supaUrl}/rest/v1/categories?select=*`, {
            headers: { 'apikey': supaKey, 'Authorization': `Bearer ${supaKey}` }
          });
          if (supaRes.ok) {
            const data = await supaRes.json();
            if (Array.isArray(data) && data.length > 0) {
              setAvailableCategories(data);
            }
          }
        } catch (supaErr) {
          console.error("Error fetching categories from Supabase:", supaErr);
        }
      }
    };
    fetchCats();
  }, [API_BASE_URL]);

  // Persist page and sort to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('holux_catalog_page', String(page));
    } catch {}
  }, [page]);

  useEffect(() => {
    try {
      sessionStorage.setItem('holux_catalog_sort', sortBy);
    } catch {}
  }, [sortBy]);

  // Synchronize when initialCategory or initialCollection props change from URL
  useEffect(() => {
    if (initialCategory) {
      setSelectedCategories(prev => {
        if (prev.length === 1 && prev[0] === initialCategory) return prev;
        setPage(1);
        return [initialCategory];
      });
      setSelectedCollections([]);
    }
  }, [initialCategory]);

  useEffect(() => {
    if (initialCollection) {
      setSelectedCollections(prev => {
        if (prev.length === 1 && prev[0] === initialCollection) return prev;
        setPage(1);
        return [initialCollection];
      });
      setSelectedCategories([]);
    }
  }, [initialCollection]);

  // --- FETCH PRODUCTS SERVER-SIDE WITH SUPABASE DIRECT CLOUD FALLBACK ---
  const fetchProductsServer = async () => {
    setLoading(true);
    let loadedFromApi = false;

    try {
      const params = new URLSearchParams();
      if (selectedCategories.length > 0) {
        params.append('categories', selectedCategories.join(','));
      }
      if (selectedCollections.length > 0) {
        params.append('collections', selectedCollections.join(','));
      }
      if (selectedBrands.length > 0) {
        params.append('brands', selectedBrands.join(','));
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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${API_BASE_URL}/api/products?${params.toString()}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const result = await res.json();
        const prods = result.data || [];
        if (prods.length > 0 || (result.total === 0 && (selectedCategories.length > 0 || searchQuery.trim()))) {
          setProducts(prods);
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
          loadedFromApi = true;
        }
      }
    } catch (err) {}

    // Fallback directly to Supabase cloud database if API didn't respond
    if (!loadedFromApi) {
      try {
        const supaUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fmbhcfsrsfkglmvgbnlm.supabase.co';
        const supaKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_aAzQcAqCATpYDGBVRNJRQQ_1CKarnEb';
        
        const supaRes = await fetch(`${supaUrl}/rest/v1/products?select=*,categories(id,name,slug)&order=created_at.desc`, {
          headers: { 'apikey': supaKey, 'Authorization': `Bearer ${supaKey}` }
        });

        if (supaRes.ok) {
          const allProds = await supaRes.json();
          if (Array.isArray(allProds)) {
            const enrichProd = (p) => {
              const meta = productsMetadata[p.id] || {};
              const resolveImg = resolveProductImage;
              const images = (Array.isArray(p.images) && p.images.length > 0)
                ? p.images.map(resolveImg).filter(Boolean)
                : (Array.isArray(meta.images) ? meta.images.map(resolveImg).filter(Boolean) : (p.image_url ? [resolveImg(p.image_url)] : []));
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

            let filtered = allProds.map(enrichProd);

            // 1. Category Filter
            if (selectedCategories.length > 0) {
              filtered = filtered.filter(p => {
                const catSlug = (p.categories?.slug || '').toLowerCase();
                const catName = (p.categories?.name || '').toLowerCase();
                const pCatId = p.category_id || p.categories?.id || '';
                return selectedCategories.some(sel => {
                  const selLow = String(sel).toLowerCase();
                  return selLow === catSlug || selLow === pCatId || catName.includes(selLow);
                });
              });
            }

            // 2. Collection / Gender Filter
            if (selectedCollections.length > 0) {
              filtered = filtered.filter(p => {
                const pGender = (p.gender || p.collection || '').toLowerCase();
                const pName = (p.name || '').toLowerCase();
                const catName = (p.categories?.name || '').toLowerCase();
                return selectedCollections.some(col => {
                  const c = String(col).toLowerCase();
                  if (c === 'outlet') return Number(p.offer_price) > 0 || Number(p.discount_percent) > 0;
                  return pGender.includes(c) || pName.includes(c) || catName.includes(c);
                });
              });
            }

            // 3. Brand Filter
            if (selectedBrands.length > 0) {
              filtered = filtered.filter(p => {
                const pBrand = (p.brand || '').toLowerCase();
                const pName = (p.name || '').toLowerCase();
                return selectedBrands.some(b => {
                  const bLow = String(b).toLowerCase();
                  return pBrand === bLow || pName.includes(bLow);
                });
              });
            }

            // 4. In Stock Filter
            if (inStockOnly) {
              filtered = filtered.filter(p => Number(p.stock) > 0);
            }

            // 5. Max Price Filter
            if (userPriceMax > 0 && userPriceMax < priceRange.max) {
              filtered = filtered.filter(p => {
                const effective = Number(p.offer_price) > 0 ? Number(p.offer_price) : Number(p.price);
                return effective <= userPriceMax;
              });
            }

            // 6. Search Query
            if (searchQuery.trim()) {
              const q = searchQuery.toLowerCase().trim();
              filtered = filtered.filter(p => 
                (p.name && p.name.toLowerCase().includes(q)) ||
                (p.brand && p.brand.toLowerCase().includes(q)) ||
                (p.description && p.description.toLowerCase().includes(q))
              );
            }

            // 7. Sort
            if (sortBy === 'price_asc' || sortBy === 'price-asc') {
              filtered.sort((a, b) => {
                const priceA = Number(a.offer_price && a.offer_price > 0 ? a.offer_price : a.price) || 0;
                const priceB = Number(b.offer_price && b.offer_price > 0 ? b.offer_price : b.price) || 0;
                return priceA - priceB;
              });
            } else if (sortBy === 'price_desc' || sortBy === 'price-desc') {
              filtered.sort((a, b) => {
                const priceA = Number(a.offer_price && a.offer_price > 0 ? a.offer_price : a.price) || 0;
                const priceB = Number(b.offer_price && b.offer_price > 0 ? b.offer_price : b.price) || 0;
                return priceB - priceA;
              });
            } else if (sortBy === 'newest') {
              filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
            } else if (sortBy === 'name_asc' || sortBy === 'name-asc') {
              filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            } else if (sortBy === 'name_desc' || sortBy === 'name-desc') {
              filtered.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
            }

            // Pagination
            const total = filtered.length;
            const last = Math.max(1, Math.ceil(total / perPage));
            const start = (page - 1) * perPage;
            const paginated = filtered.slice(start, start + perPage);

            setProducts(paginated);
            setTotalProducts(total);
            setLastPage(last);
            setFromItem(total > 0 ? start + 1 : 0);
            setToItem(Math.min(start + perPage, total));
          }
        }
      } catch (supaErr) {
        console.error("Error loading products from Supabase fallback:", supaErr);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchProductsServer();
  }, [
    selectedCategories, 
    selectedCollections, 
    selectedBrands,
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

  // Handle Brand Toggle
  const handleToggleBrand = (brand) => {
    setPage(1);
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
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
    setSelectedBrands([]);
    setSelectedSizes([]);
    setUserPriceMax(priceRange.max || 150000);
    setInStockOnly(false);
    setSortBy('relevant');
    setPage(1);
  };

  const hasActiveFilters = 
    selectedCategories.length > 0 || 
    selectedCollections.length > 0 || 
    selectedBrands.length > 0 || 
    selectedSizes.length > 0 || 
    userPriceMax < (priceRange.max || 150000) || 
    inStockOnly;

  // Scroll to top of grid & window when page changes
  const gridTopRef = useRef(null);

  const scrollToTop = () => {
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    } catch (e) {
      window.scrollTo(0, 0);
    }
    if (gridTopRef.current) {
      gridTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    scrollToTop();
  };

  useEffect(() => {
    scrollToTop();
  }, [page]);

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

              {selectedBrands.map(br => (
                <span key={br} className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-[#3C6E71] border border-[#3C6E71]/30 rounded-full font-bold text-[11px]">
                  Marca: {br}
                  <button type="button" onClick={() => handleToggleBrand(br)} className="hover:text-red-500 cursor-pointer ml-0.5">
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

              {/* 3. MARCAS */}
              <div className="border-b border-gray-100 pb-5">
                <button
                  type="button"
                  onClick={() => toggleAccordion('brands')}
                  className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-900 font-display cursor-pointer hover:text-[#3C6E71] transition-colors select-none"
                >
                  <span>Marcas</span>
                  {accordionOpen.brands ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                </button>

                {accordionOpen.brands && (
                  <div className="mt-3.5 space-y-2 text-xs font-sans">
                    <div className="space-y-2">
                      {(showAllBrands ? TOP_PERFUME_BRANDS : TOP_PERFUME_BRANDS.slice(0, 5)).map(brand => {
                        const isChecked = selectedBrands.includes(brand);
                        return (
                          <label
                            key={brand}
                            className="flex items-center gap-2.5 cursor-pointer text-gray-700 hover:text-black py-0.5 select-none transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleBrand(brand)}
                              className="w-4 h-4 rounded text-[#3C6E71] focus:ring-[#3C6E71] cursor-pointer accent-[#3C6E71]"
                            />
                            <span className={isChecked ? 'font-bold text-[#3C6E71]' : 'font-normal'}>
                              {brand}
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    {TOP_PERFUME_BRANDS.length > 5 && (
                      <button
                        type="button"
                        onClick={() => setShowAllBrands(!showAllBrands)}
                        className="text-[11px] font-bold text-[#3C6E71] hover:text-[#2b5153] flex items-center gap-1 transition-colors cursor-pointer pt-1.5 select-none"
                      >
                        <span>{showAllBrands ? 'Ver menos' : 'Ver más marcas'}</span>
                        {showAllBrands ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 4. TALLE / VARIANTES */}
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
              /* GRID RESPONSIVE: 2 COLUMNAS EN CELULAR, 3 EN TABLET, 4 EN DESKTOP */
              <div className={`grid grid-cols-2 sm:grid-cols-3 ${gridColumns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-2.5 sm:gap-4 md:gap-6 w-full`}>
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

            {/* --- PAGINADOR INTELIGENTE RESPONSIVE --- */}
            {lastPage > 1 && (() => {
              const getPaginationPages = (current, total) => {
                if (total <= 7) {
                  return Array.from({ length: total }, (_, i) => i + 1);
                }
                if (current <= 3) {
                  return [1, 2, 3, 4, '...', total];
                }
                if (current >= total - 2) {
                  return [1, '...', total - 3, total - 2, total - 1, total];
                }
                return [1, '...', current - 1, current, current + 1, '...', total];
              };

              const pagesList = getPaginationPages(page, lastPage);

              return (
                <div className="bg-white border border-gray-200/90 rounded-2xl p-3 sm:p-5 shadow-xs flex items-center justify-between gap-2 flex-wrap">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                    className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                      page <= 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800 active:scale-95'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Anterior</span>
                  </button>

                  <div className="flex items-center gap-1 sm:gap-1.5 justify-center flex-wrap">
                    {pagesList.map((p, idx) => {
                      if (p === '...') {
                        return (
                          <span key={`dots-${idx}`} className="w-6 sm:w-8 text-center text-gray-400 font-bold font-mono-custom text-xs select-none">
                            ...
                          </span>
                        );
                      }
                      const isCurrent = page === p;
                      return (
                        <button
                          key={`page-${p}`}
                          type="button"
                          onClick={() => handlePageChange(p)}
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-bold font-mono-custom transition-all cursor-pointer flex items-center justify-center ${
                            isCurrent
                              ? 'bg-[#1C2321] text-white shadow-sm ring-2 ring-[#1C2321]/20 scale-105'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 active:scale-95'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    disabled={page >= lastPage}
                    onClick={() => handlePageChange(page + 1)}
                    className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                      page >= lastPage
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                        : 'bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white shadow-sm active:scale-95'
                    }`}
                  >
                    <span className="hidden sm:inline">Siguiente</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })()}

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

              {/* Ordenar por mobile */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-gray-900 font-display uppercase">Ordenar por</span>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                    className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl pl-3.5 pr-8 py-2.5 text-xs font-bold text-gray-800 outline-none focus:border-[#3C6E71]"
                  >
                    <option value="relevant">Más relevantes</option>
                    <option value="price_asc">Menor precio</option>
                    <option value="price_desc">Mayor precio</option>
                    <option value="newest">Más recientes</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
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

              {/* Marcas mobile */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-gray-900 font-display uppercase">Marcas</span>
                <div className="space-y-1.5">
                  {(showAllBrands ? TOP_PERFUME_BRANDS : TOP_PERFUME_BRANDS.slice(0, 5)).map(brand => (
                    <label key={brand} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand)}
                        onChange={() => handleToggleBrand(brand)}
                        className="rounded text-[#3C6E71] accent-[#3C6E71]"
                      />
                      <span>{brand}</span>
                    </label>
                  ))}
                </div>
                {TOP_PERFUME_BRANDS.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setShowAllBrands(!showAllBrands)}
                    className="text-[11px] font-bold text-[#3C6E71] flex items-center gap-1 cursor-pointer pt-1"
                  >
                    <span>{showAllBrands ? 'Ver menos' : 'Ver más marcas'}</span>
                    {showAllBrands ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
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