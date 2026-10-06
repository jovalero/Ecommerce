import { useState, useEffect, useCallback, useMemo } from 'react';

import { API_BASE_URL as API_BASE, SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/api';
import { productsMetadata } from '../config/productsMetadata';
import { resolveProductImage } from '../utils/bannerStorage';

export const enrichAdminProduct = (p) => {
  if (!p || typeof p !== 'object') return p;
  const meta = productsMetadata[p.id] || {};
  const resolveImg = resolveProductImage;
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
    image_url,
    images
  };
};

export function useProductCatalog(token) {
  // Filters and Query State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState('10');

  // Master Data State
  const [rawProducts, setRawProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState([]);

  // Debounce search input (~250ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when category or stock filter changes
  useEffect(() => {
    setPage(1);
  }, [category, stockFilter]);

  // Fetch categories for the filter dropdown
  const fetchCategories = useCallback(async () => {
    try {
      let loaded = false;
      // 1. Direct Supabase REST API (instant)
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=*&order=name.asc`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCategories(data);
            loaded = true;
          }
        }
      } catch (e) {
        console.warn("Direct Supabase categories fetch warning:", e);
      }

      // 2. Fallback to backend API
      if (!loaded && token && token !== 'null' && token !== 'undefined') {
        const res = await fetch(`${API_BASE}/api/admin/categorias`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          }
        });
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      }
    } catch (e) {
      console.error("Failed to load categories:", e);
    }
  }, [token]);

  // Fetch full products list (Fast Direct Supabase First, Laravel API Fallback)
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let loaded = false;

      // 1. Fetch Direct from Supabase REST API (< 100ms response time)
      try {
        const supaRes = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*,categories(id,name,slug)&order=created_at.desc`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });
        if (supaRes.ok) {
          const data = await supaRes.json();
          if (Array.isArray(data) && data.length > 0) {
            setRawProducts(data.map(enrichAdminProduct));
            loaded = true;
          }
        }
      } catch (e) {
        console.warn("Direct Supabase admin products fetch warning:", e);
      }

      // 2. Fallback to Laravel Backend API
      if (!loaded && token && token !== 'null' && token !== 'undefined') {
        const res = await fetch(`${API_BASE}/api/admin/productos?per_page=all`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          }
        });
        if (res.ok) {
          const json = await res.json();
          const items = json.data || (Array.isArray(json) ? json : []);
          if (Array.isArray(items) && items.length > 0) {
            setRawProducts(items.map(enrichAdminProduct));
            loaded = true;
          }
        }
      }
    } catch (err) {
      console.error("Error fetching admin products:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initial load
  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [fetchCategories, fetchProducts]);

  // High-performance In-Memory Filtering and Sorting (0ms response time)
  const filteredAndSortedProducts = useMemo(() => {
    let list = [...rawProducts];

    // 1. Search Query
    const q = (debouncedSearch || search || '').trim().toLowerCase();
    if (q) {
      list = list.filter(p => {
        const name = (p.name || '').toLowerCase();
        const brand = (p.brand || '').toLowerCase();
        const catName = (p.categories?.name || p.category_name || '').toLowerCase();
        const tags = Array.isArray(p.tags) ? p.tags.join(' ').toLowerCase() : String(p.tags || '').toLowerCase();
        return name.includes(q) || brand.includes(q) || catName.includes(q) || tags.includes(q);
      });
    }

    // 2. Category Filter
    if (category && category !== 'all') {
      const isOffers = ['offers', 'ofertas', 'outlet', 'descuentos'].includes(category);
      if (isOffers) {
        list = list.filter(p => {
          const price = Number(p.price) || 0;
          const offerPrice = Number(p.offer_price) || 0;
          const discount = Number(p.discount_percent) || 0;
          return (offerPrice > 0 && offerPrice < price) || discount > 0;
        });
      } else {
        list = list.filter(p => {
          const catId = p.category_id || p.categories?.id;
          const catSlug = p.categories?.slug || p.category_slug;
          return String(catId) === String(category) || catSlug === category;
        });
      }
    }

    // 3. Stock Status Filter
    if (stockFilter && stockFilter !== 'all') {
      list = list.filter(p => {
        const st = Number(p.stock) || 0;
        if (stockFilter === 'saludable') return st > 5;
        if (stockFilter === 'critico') return st >= 1 && st <= 5;
        if (stockFilter === 'agotado') return st <= 0;
        return true;
      });
    }

    // 4. Sorting
    list.sort((a, b) => {
      let valA = a[sort];
      let valB = b[sort];

      if (sort === 'category') {
        valA = a.categories?.name || a.category_name || '';
        valB = b.categories?.name || b.category_name || '';
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return order === 'asc' ? valA - valB : valB - valA;
      }
      const strA = String(valA || '').toLowerCase();
      const strB = String(valB || '').toLowerCase();
      return order === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });

    return list;
  }, [rawProducts, debouncedSearch, search, category, stockFilter, sort, order]);

  // Instant In-Memory Pagination
  const total = filteredAndSortedProducts.length;
  const isAll = perPage === 'all';
  const perPageNum = isAll ? Math.max(1, total) : (parseInt(perPage, 10) || 10);
  const lastPage = isAll ? 1 : Math.max(1, Math.ceil(total / perPageNum));
  const currentPage = isAll ? 1 : Math.min(Math.max(1, page), lastPage);
  const offset = isAll ? 0 : (currentPage - 1) * perPageNum;
  const products = isAll ? filteredAndSortedProducts : filteredAndSortedProducts.slice(offset, offset + perPageNum);
  const from = total > 0 ? (isAll ? 1 : offset + 1) : 0;
  const to = isAll ? total : Math.min(offset + perPageNum, total);

  const pagination = {
    total,
    current_page: currentPage,
    per_page: isAll ? total : perPageNum,
    last_page: lastPage,
    from,
    to,
  };

  // Sorting Handler
  const handleSort = (field) => {
    if (sort === field) {
      setOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(field);
      setOrder(field === 'name' ? 'asc' : 'desc');
    }
    setPage(1);
  };

  // Selection Handlers
  const toggleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (visibleIds) => {
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      const merged = Array.from(new Set([...selectedIds, ...visibleIds]));
      setSelectedIds(merged);
    }
  };

  const selectAllEntireCatalog = () => {
    const allIds = filteredAndSortedProducts.map(p => p.id);
    setSelectedIds(allIds);
  };

  const clearSelection = () => setSelectedIds([]);

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setCategory('all');
    setStockFilter('all');
    setSort('created_at');
    setOrder('desc');
    setPage(1);
    setPerPage('10');
  };

  // Bulk Price Action (Supports custom items array or formula)
  const executeBulkPrice = async (itemsOrType, value) => {
    try {
      const payload = Array.isArray(itemsOrType)
        ? { items: itemsOrType }
        : { ids: selectedIds, type: itemsOrType, value: Number(value) };

      const res = await fetch(`${API_BASE}/api/admin/productos/bulk-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error en ajuste masivo');
      clearSelection();
      fetchProducts();
      return json;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Bulk Category Action
  const executeBulkCategory = async (categoryId) => {
    if (selectedIds.length === 0 || !categoryId) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/productos/bulk-categoria`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ids: selectedIds,
          category_id: categoryId,
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error en cambio de categoría');
      clearSelection();
      fetchProducts();
      return json;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Bulk Installments Action
  const executeBulkInstallments = async (installmentsCount) => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/productos/bulk-cuotas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ids: selectedIds,
          installments: Number(installmentsCount) || 0,
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al configurar cuotas');
      clearSelection();
      fetchProducts();
      return json;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Bulk Delete Action
  const executeBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/productos/bulk-delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ids: selectedIds,
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al eliminar productos');
      clearSelection();
      fetchProducts();
      return json;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Single Product Delete
  const deleteSingleProduct = async (id) => {
    try {
      if (token && token !== 'null' && token !== 'undefined') {
        await fetch(`${API_BASE}/api/admin/products/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          }
        });
      }
      setRawProducts(prev => prev.filter(p => String(p.id) !== String(id)));
      return true;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Export CSV (High speed client-side generation)
  const handleExportCSV = async () => {
    try {
      const headers = ['ID', 'Nombre', 'Marca', 'Categoría', 'Precio', 'Precio Oferta', 'Descuento %', 'Stock', 'SKU', 'Estado'];
      const rows = filteredAndSortedProducts.map(p => [
        `"${p.id || ''}"`,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${(p.brand || '').replace(/"/g, '""')}"`,
        `"${(p.categories?.name || p.category_name || '').replace(/"/g, '""')}"`,
        p.price || 0,
        p.offer_price || '',
        p.discount_percent || 0,
        p.stock || 0,
        `"${p.sku || ''}"`,
        p.is_active !== false ? 'Activo' : 'Inactivo'
      ]);

      const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `catalogo_holux_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('No se pudo exportar el catálogo.');
    }
  };

  // Import CSV (Preview or Final Execution)
  const handleImportCSV = async (file, previewOnly = false) => {
    const formData = new FormData();
    formData.append('file', file);
    if (previewOnly) {
      formData.append('preview_only', 'true');
    }

    const res = await fetch(`${API_BASE}/api/admin/productos/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body: formData,
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Error en el procesamiento del CSV');
    if (!previewOnly) {
      fetchProducts();
    }
    return json;
  };

  return {
    // State
    search,
    setSearch,
    debouncedSearch,
    category,
    setCategory,
    stockFilter,
    setStockFilter,
    sort,
    order,
    page,
    setPage,
    perPage,
    setPerPage,
    products,
    categories,
    pagination,
    loading,
    error,
    selectedIds,
    // Methods
    fetchProducts,
    handleSort,
    toggleSelectOne,
    toggleSelectAll,
    selectAllEntireCatalog,
    clearSelection,
    clearFilters,
    executeBulkPrice,
    executeBulkCategory,
    executeBulkInstallments,
    executeBulkDelete,
    deleteSingleProduct,
    handleExportCSV,
    handleImportCSV,
  };
}
