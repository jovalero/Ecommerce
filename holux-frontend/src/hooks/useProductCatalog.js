import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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

  // Data State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    current_page: 1,
    per_page: 10,
    last_page: 1,
    from: 0,
    to: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState([]);

  // Debounce search input (~350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when category or stock filter changes
  useEffect(() => {
    setPage(1);
  }, [category, stockFilter]);

  // Fetch categories for the filter dropdown
  const fetchCategories = useCallback(async () => {
    try {
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
    } catch (e) {
      console.error("Failed to load categories:", e);
    }
  }, [token]);

  // Fetch products with server-side filters & pagination
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (category && category !== 'all') params.append('categoria', category);
      if (stockFilter && stockFilter !== 'all') params.append('stock', stockFilter);
      if (sort) params.append('sort', sort);
      if (order) params.append('order', order);
      params.append('page', page.toString());
      params.append('per_page', perPage.toString());

      const res = await fetch(`${API_BASE}/api/admin/productos?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Error al cargar catálogo`);
      }

      const json = await res.json();
      setProducts(json.data || []);
      setPagination({
        total: json.total || 0,
        current_page: json.current_page || 1,
        per_page: json.per_page || 10,
        last_page: json.last_page || 1,
        from: json.from || 0,
        to: json.to || 0,
      });
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, debouncedSearch, category, stockFilter, sort, order, page, perPage]);

  // Initial load and trigger on query changes
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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

  // Export CSV
  const handleExportCSV = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/productos/export`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      if (!res.ok) throw new Error('Error al exportar CSV');
      const blob = await res.blob();
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
    clearSelection,
    clearFilters,
    executeBulkPrice,
    executeBulkCategory,
    executeBulkDelete,
    handleExportCSV,
    handleImportCSV,
  };
}
