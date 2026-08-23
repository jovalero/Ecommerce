import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Upload, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Edit2, 
  Copy, 
  Trash2, 
  CheckSquare, 
  Square, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Layers, 
  DollarSign, 
  Tag, 
  X,
  FileSpreadsheet,
  AlertTriangle,
  CreditCard,
  Eye
} from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

export default function ProductCatalogManager({
  catalog, // hook return object from useProductCatalog
  onEditProduct,
  onDuplicateProduct,
  onCreateProduct,
  onDeleteProductSingle
}) {
  const {
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
    handleExportCSV,
    handleImportCSV,
  } = catalog;

  // Modals Local State
  const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);
  const [editableProducts, setEditableProducts] = useState([]);
  const [quickPercent, setQuickPercent] = useState('');
  const [isBulkPriceSubmitting, setIsBulkPriceSubmitting] = useState(false);

  const [isBulkCategoryModalOpen, setIsBulkCategoryModalOpen] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState('');
  const [isBulkCategorySubmitting, setIsBulkCategorySubmitting] = useState(false);

  const [isBulkInstallmentsModalOpen, setIsBulkInstallmentsModalOpen] = useState(false);
  const [bulkInstallmentsVal, setBulkInstallmentsVal] = useState(0);
  const [isBulkInstallmentsSubmitting, setIsBulkInstallmentsSubmitting] = useState(false);

  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleteSubmitting, setIsBulkDeleteSubmitting] = useState(false);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  const visibleIds = products.map(p => p.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));
  const hasActiveFilters = Boolean(search || (category && category !== 'all') || (stockFilter && stockFilter !== 'all'));

  // Open Bulk Price Modal with selected products data
  const handleOpenBulkPriceModal = () => {
    const selected = products
      .filter(p => selectedIds.includes(p.id))
      .map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand || 'HOLUX',
        image_url: p.image_url || (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200',
        currentPrice: Number(p.price || 0),
        newPrice: Number(p.price || 0),
        offerPrice: Number(p.offer_price || 0),
      }));
    setEditableProducts(selected);
    setQuickPercent('');
    setIsBulkPriceModalOpen(true);
  };

  // Change individual product price in modal
  const handlePriceItemChange = (id, field, val) => {
    setEditableProducts(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: val };
      }
      return item;
    }));
  };

  // Apply quick percentage calculation to all selected items
  const handleApplyQuickPercent = (pct) => {
    const num = parseFloat(pct);
    if (isNaN(num)) return;
    setEditableProducts(prev => prev.map(item => {
      const calculated = Math.round(item.currentPrice * (1 + (num / 100)));
      return { ...item, newPrice: Math.max(0, calculated) };
    }));
  };

  // Submit custom bulk prices
  const handleBulkPriceSubmit = async (e) => {
    e.preventDefault();
    setIsBulkPriceSubmitting(true);
    try {
      const itemsPayload = editableProducts.map(p => ({
        id: p.id,
        price: Number(p.newPrice),
        offer_price: Number(p.offerPrice || 0),
      }));
      await executeBulkPrice(itemsPayload);
      setIsBulkPriceModalOpen(false);
    } catch (err) {
      alert(err.message || 'Error al guardar los nuevos precios.');
    } finally {
      setIsBulkPriceSubmitting(false);
    }
  };

  // Handler for bulk category submit
  const handleBulkCategorySubmit = async (e) => {
    e.preventDefault();
    if (!bulkCategoryId) return;
    setIsBulkCategorySubmitting(true);
    try {
      await executeBulkCategory(bulkCategoryId);
      setIsBulkCategoryModalOpen(false);
    } catch (err) {
      alert(err.message || 'Error al cambiar categoría.');
    } finally {
      setIsBulkCategorySubmitting(false);
    }
  };

  // Handler for bulk installments submit
  const handleBulkInstallmentsSubmit = async (e) => {
    e.preventDefault();
    setIsBulkInstallmentsSubmitting(true);
    try {
      await executeBulkInstallments(bulkInstallmentsVal);
      setIsBulkInstallmentsModalOpen(false);
    } catch (err) {
      alert(err.message || 'Error al configurar cuotas en lote.');
    } finally {
      setIsBulkInstallmentsSubmitting(false);
    }
  };

  // Handler for bulk delete submit
  const handleBulkDeleteSubmit = async () => {
    setIsBulkDeleteSubmitting(true);
    try {
      const res = await executeBulkDelete();
      setIsBulkDeleteModalOpen(false);
      if (res?.skipped_items?.length > 0) {
        alert(`Se eliminaron ${res.deleted_count} productos. ${res.skipped_count} productos no se eliminaron porque tienen compras asociadas.`);
      }
    } catch (err) {
      alert(err.message || 'Error al eliminar productos.');
    } finally {
      setIsBulkDeleteSubmitting(false);
    }
  };

  // Handler for file import selection
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setIsImporting(true);
    try {
      const previewData = await handleImportCSV(file, true);
      setImportPreview(previewData);
    } catch (err) {
      alert(err.message || 'Error al previsualizar el archivo CSV.');
      setImportFile(null);
      setImportPreview(null);
    } finally {
      setIsImporting(false);
    }
  };

  // Handler for confirming CSV import
  const handleConfirmImport = async () => {
    if (!importFile) return;
    setIsImporting(true);
    try {
      const res = await handleImportCSV(importFile, false);
      alert(`¡Importación finalizada con éxito! ${res.saved_count} productos procesados.`);
      setIsImportModalOpen(false);
      setImportFile(null);
      setImportPreview(null);
    } catch (err) {
      alert(err.message || 'Error al ejecutar la importación.');
    } finally {
      setIsImporting(false);
    }
  };

  // Helper for sort icon
  const renderSortIcon = (field) => {
    if (sort !== field) {
      return <ArrowUpDown className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return order === 'asc' 
      ? <ArrowUp className="w-3.5 h-3.5 text-[#3C6E71]" /> 
      : <ArrowDown className="w-3.5 h-3.5 text-[#3C6E71]" />;
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER ACTION BANNER */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold tracking-wider text-gray-900 uppercase font-display flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#3C6E71]" />
            GESTIÓN INTEGRAL DE CATÁLOGO Y STOCK
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Filtros en tiempo real, control de stock, acciones en lote y carga masiva por CSV.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Exportar CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 rounded-xl font-display text-xs font-bold tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:bg-gray-50"
            title="Descargar catálogo completo en formato CSV"
          >
            <Download className="w-4 h-4 text-[#3C6E71]" />
            <span>EXPORTAR CSV</span>
          </button>

          {/* Importar CSV */}
          <button
            type="button"
            onClick={() => {
              setImportFile(null);
              setImportPreview(null);
              setIsImportModalOpen(true);
            }}
            className="px-4 py-2.5 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 rounded-xl font-display text-xs font-bold tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:bg-gray-50"
            title="Importar o actualizar productos desde archivo CSV"
          >
            <Upload className="w-4 h-4 text-[#B85C38]" />
            <span>IMPORTAR CSV</span>
          </button>

          {/* Nuevo Producto */}
          <button
            type="button"
            onClick={onCreateProduct}
            className="px-5 py-2.5 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white rounded-xl font-display text-xs font-bold tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-[#3C6E71]/20"
          >
            <Plus className="w-4 h-4" />
            <span>NUEVO PRODUCTO</span>
          </button>
        </div>
      </div>

      {/* 2. FILTERS AND SEARCH BAR */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search input with Debounce */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, marca o etiqueta..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#3C6E71] focus:bg-white rounded-xl text-xs outline-none transition-all placeholder:text-gray-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#3C6E71] focus:bg-white rounded-xl text-xs font-medium text-gray-700 outline-none transition-all cursor-pointer"
            >
              <option value="all">Todas las categorías</option>
              <option value="offers" className="font-bold text-[#B85C38]">🔥 Solo en Oferta / Descuento</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.slug || cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Level Filter */}
          <div className="sm:col-span-3">
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#3C6E71] focus:bg-white rounded-xl text-xs font-medium text-gray-700 outline-none transition-all cursor-pointer"
            >
              <option value="all">Todos los niveles de stock</option>
              <option value="saludable">🟢 Stock Saludable (&gt; 5 uds)</option>
              <option value="critico">🟡 Stock Crítico (1 a 5 uds)</option>
              <option value="agotado">🔴 Agotados (0 uds)</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="sm:col-span-1 flex justify-end">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all cursor-pointer"
                title="Limpiar todos los filtros"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            ) : (
              <div className="p-2.5 opacity-0 pointer-events-none">
                <RefreshCw className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>

        {/* Active Filters Indicators */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 text-[11px]">
            <span className="text-gray-400 font-bold uppercase tracking-wider font-mono-custom text-[10px]">Filtros activos:</span>
            {search && (
              <span className="bg-[#3C6E71]/10 text-[#3C6E71] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                Búsqueda: "{search}"
                <button type="button" onClick={() => setSearch('')} className="hover:text-black cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            )}
            {category !== 'all' && (
              <span className="bg-purple-50 text-purple-700 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                Categoría: {category === 'offers' ? '🔥 Solo en Oferta / Descuento' : (categories.find(c => c.slug === category || c.id === category)?.name || category)}
                <button type="button" onClick={() => setCategory('all')} className="hover:text-black cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            )}
            {stockFilter !== 'all' && (
              <span className="bg-amber-50 text-amber-800 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                Stock: {stockFilter === 'saludable' ? 'Saludable (>5)' : stockFilter === 'critico' ? 'Crítico (1-5)' : 'Agotados (0)'}
                <button type="button" onClick={() => setStockFilter('all')} className="hover:text-black cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* 3. FLOATING BULK ACTIONS BAR (Light/Gray Theme) */}
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-20 bg-white/95 backdrop-blur-md text-gray-900 p-4 rounded-2xl shadow-lg border border-gray-200/90 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="bg-[#3C6E71]/10 text-[#3C6E71] border border-[#3C6E71]/20 font-mono-custom text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#3C6E71] animate-pulse"></span>
              {selectedIds.length} {selectedIds.length === 1 ? 'producto seleccionado' : 'productos seleccionados'}
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs text-gray-500 hover:text-gray-900 font-medium underline cursor-pointer transition-colors"
            >
              Deseleccionar todos
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Ajustar Precios */}
            <button
              type="button"
              onClick={handleOpenBulkPriceModal}
              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold font-display tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border border-gray-200 shadow-sm"
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>AJUSTAR PRECIOS</span>
            </button>

            {/* Cambiar Categoría */}
            <button
              type="button"
              onClick={() => {
                setBulkCategoryId(categories[0]?.id || '');
                setIsBulkCategoryModalOpen(true);
              }}
              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold font-display tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border border-gray-200 shadow-sm"
            >
              <Tag className="w-3.5 h-3.5 text-blue-600" />
              <span>CAMBIAR CATEGORÍA</span>
            </button>

            {/* Configurar Cuotas */}
            <button
              type="button"
              onClick={() => {
                setBulkInstallmentsVal(0);
                setIsBulkInstallmentsModalOpen(true);
              }}
              className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-xl text-xs font-bold font-display tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border border-purple-200 shadow-sm"
              title="Asignar o quitar cuotas fijas a los productos seleccionados"
            >
              <CreditCard className="w-3.5 h-3.5 text-purple-700" />
              <span>CONFIGURAR CUOTAS</span>
            </button>

            {/* Eliminar en lote */}
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold font-display tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-red-500/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ELIMINAR ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. PRODUCTS DATA TABLE */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xs font-bold tracking-wider text-gray-900 uppercase font-display">
            LISTADO DE PRODUCTOS ({pagination.total})
          </h3>

          <div className="flex items-center gap-3">
            {loading && (
              <span className="text-xs text-[#3C6E71] font-bold flex items-center gap-1.5 animate-pulse font-mono-custom">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Cargando...
              </span>
            )}
            <span className="text-xs text-gray-500 font-mono-custom">
              Mostrando {pagination.from} - {pagination.to} de {pagination.total}
            </span>
          </div>
        </div>

        {/* Global / Smart Selection Banner */}
        {selectedIds.length > 0 && selectedIds.length < pagination.total && (
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-center justify-between text-xs text-amber-900 font-medium">
            <span>
              Tenés seleccionados <strong>{selectedIds.length}</strong> productos de esta página.
            </span>
            <button
              type="button"
              onClick={selectAllEntireCatalog}
              className="text-amber-900 font-bold underline hover:text-black cursor-pointer font-sans"
            >
              Seleccionar los {pagination.total} productos de todo el catálogo
            </button>
          </div>
        )}
        {selectedIds.length >= pagination.total && pagination.total > 0 && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 flex items-center justify-between text-xs text-emerald-900 font-medium">
            <span>
              ✨ <strong>Los {pagination.total} productos de todo el catálogo están seleccionados.</strong>
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-emerald-800 font-bold underline hover:text-black cursor-pointer font-sans"
            >
              Deseleccionar todos
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 uppercase tracking-widest font-display text-[9px] select-none">
                {/* Select All Checkbox */}
                <th className="p-3.5 w-10 text-center">
                  <button
                    type="button"
                    onClick={() => toggleSelectAll(visibleIds)}
                    className="cursor-pointer text-gray-600 hover:text-black"
                    title={allVisibleSelected ? 'Deseleccionar todos' : 'Seleccionar visibles'}
                  >
                    {allVisibleSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#3C6E71]" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </th>
                <th className="p-3.5 w-16">Media</th>
                
                {/* Sortable: Nombre / Marca */}
                <th 
                  onClick={() => handleSort('name')}
                  className="p-3.5 cursor-pointer hover:bg-gray-100/70 transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Producto / Marca</span>
                    {renderSortIcon('name')}
                  </div>
                </th>

                {/* Sortable: Categoría */}
                <th 
                  onClick={() => handleSort('category')}
                  className="p-3.5 cursor-pointer hover:bg-gray-100/70 transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Categoría</span>
                    {renderSortIcon('category')}
                  </div>
                </th>

                {/* Sortable: Precio */}
                <th 
                  onClick={() => handleSort('price')}
                  className="p-3.5 cursor-pointer hover:bg-gray-100/70 transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Precio / Oferta</span>
                    {renderSortIcon('price')}
                  </div>
                </th>

                {/* Sortable: Stock */}
                <th 
                  onClick={() => handleSort('stock')}
                  className="p-3.5 cursor-pointer hover:bg-gray-100/70 transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Estado Stock</span>
                    {renderSortIcon('stock')}
                  </div>
                </th>

                <th className="p-3.5 text-right">Acciones ABM</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-gray-700">
              {products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                        <Layers className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-gray-800 font-display uppercase tracking-wide">
                        No se encontraron productos
                      </p>
                      <p className="text-xs text-gray-500">
                        Probá ajustando los términos de búsqueda o limpiá los filtros aplicados.
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="px-4 py-2 bg-[#3C6E71] text-white rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                        >
                          Limpiar Filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((prod) => {
                  const isSelected = selectedIds.includes(prod.id);
                  const st = Number(prod.stock || 0);
                  const isOutOfStock = st <= 0;
                  const isCriticalStock = st >= 1 && st <= 5;

                  return (
                    <tr 
                      key={prod.id} 
                      className={`hover:bg-gray-50/60 transition-colors ${isSelected ? 'bg-[#3C6E71]/5' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectOne(prod.id)}
                          className="cursor-pointer text-gray-600 hover:text-black"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#3C6E71]" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-300 hover:text-gray-500" />
                          )}
                        </button>
                      </td>

                      {/* Media Thumbnail */}
                      <td className="p-3.5">
                        <a
                          href={`/#/producto/${prod.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center relative shadow-sm hover:border-[#3C6E71] hover:ring-2 hover:ring-[#3C6E71]/20 transition-all block cursor-pointer group/thumb"
                          title="Ver en la tienda (abre en nueva pestaña)"
                        >
                          <img
                            src={prod.image_url || (prod.images && prod.images[0]) || 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200'}
                            alt={prod.name}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200';
                            }}
                            className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                          />
                          {prod.video_url && (
                            <span className="absolute bottom-0 right-0 bg-red-600 text-white px-1 rounded-tl text-[8px] font-bold" title="Tiene Video Demostrativo">
                              ▶
                            </span>
                          )}
                        </a>
                      </td>

                      {/* Name & Brand */}
                      <td className="p-3.5">
                        <a
                          href={`/#/producto/${prod.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-gray-900 text-xs hover:text-[#3C6E71] transition-colors cursor-pointer block"
                          title="Ver en la tienda (abre en nueva pestaña)"
                        >
                          {prod.name}
                        </a>
                        <div className="text-[10px] text-gray-400 font-mono-custom">{prod.brand || 'HOLUX'}</div>
                        {Array.isArray(prod.variants) && prod.variants.length > 0 && (
                          <div className="mt-1 flex items-center gap-1">
                            <span className="text-[9px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.2 rounded font-mono-custom font-semibold">
                              {prod.variants.length} {prod.variants.length === 1 ? 'talle' : 'talles'}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="p-3.5 font-mono-custom">
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px] font-medium border border-gray-200">
                          {prod.categories?.name || 'Trekking'}
                        </span>
                      </td>

                      {/* Price & Offer */}
                      <td className="p-3.5 font-mono-custom">
                        {(() => {
                          const basePrice = Number(prod.price || 0);
                          const offPrice = Number(prod.offer_price || 0);
                          const discPct = Number(prod.discount_percent || prod.discount || 0);
                          const origPrice = Number(prod.original_price || 0);

                          const isOffActive = (offPrice > 0 && offPrice < basePrice) || discPct > 0 || (origPrice > basePrice);
                          const effective = (offPrice > 0 && offPrice < basePrice) ? offPrice : (discPct > 0 ? Math.round(basePrice * (1 - discPct / 100)) : basePrice);
                          const pct = isOffActive ? (discPct > 0 ? discPct : (origPrice > basePrice ? Math.round(((origPrice - basePrice) / origPrice) * 100) : Math.round(((basePrice - offPrice) / basePrice) * 100))) : 0;

                          if (isOffActive) {
                            return (
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-emerald-700 text-xs">
                                    ARS ${Math.round(effective).toLocaleString('es-AR')}
                                  </span>
                                  <span className="bg-[#3C6E71] text-white text-[9.5px] font-semibold px-2 py-0.5 rounded-full font-sans shadow-2xs">
                                    {pct}%
                                  </span>
                                </div>
                                <div className="text-[10px] text-gray-400 line-through">
                                  ARS ${Math.round(origPrice > basePrice ? origPrice : basePrice).toLocaleString('es-AR')}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div className="font-bold text-gray-900 text-xs">
                              ARS ${Math.round(basePrice).toLocaleString('es-AR')}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Stock Badge */}
                      <td className="p-3.5 font-mono-custom">
                        {isOutOfStock ? (
                          <span className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Agotado (0 uds)
                          </span>
                        ) : isCriticalStock ? (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Crítico ({st} uds)
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {st} uds
                          </span>
                        )}
                      </td>

                      {/* ABM Actions */}
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {/* Ver en la Tienda */}
                        <a
                          href={`/#/producto/${prod.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-gray-100 hover:bg-[#3C6E71] hover:text-white text-gray-700 rounded-lg transition-colors cursor-pointer border border-gray-200 inline-flex items-center justify-center shadow-xs align-middle"
                          title="Ver producto en la tienda (abre en nueva pestaña)"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </a>

                        {/* Editar */}
                        <button
                          type="button"
                          onClick={() => onEditProduct(prod)}
                          className="px-2.5 py-1.5 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white rounded-lg font-display text-[10px] font-bold tracking-wider inline-flex items-center gap-1 transition-all cursor-pointer shadow-sm align-middle"
                          title="Editar producto"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>EDITAR</span>
                        </button>

                        {/* Duplicar */}
                        <button
                          type="button"
                          onClick={() => onDuplicateProduct(prod)}
                          className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-display text-[10px] font-bold tracking-wider inline-flex items-center gap-1 transition-all cursor-pointer border border-gray-200 align-middle"
                          title="Duplicar como nuevo producto"
                        >
                          <Copy className="w-3 h-3" />
                          <span>DUPLICAR</span>
                        </button>

                        {/* Eliminar Individual */}
                        <button
                          type="button"
                          onClick={() => onDeleteProductSingle(prod)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer border border-red-200 inline-flex items-center justify-center align-middle"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. PAGINATION CONTROLS */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Per Page Selector */}
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>Mostrar por página:</span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1 bg-white border border-gray-300 rounded-lg font-bold text-xs outline-none cursor-pointer"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="all">Todos</option>
            </select>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold font-display uppercase tracking-wider transition-all ${
                page <= 1
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100 cursor-pointer shadow-sm'
              }`}
            >
              Anterior
            </button>

            {/* Page number indicators */}
            {Array.from({ length: pagination.last_page || 1 }).map((_, i) => {
              const pageNum = i + 1;
              // Only display nearby pages if last_page > 7
              if (
                pagination.last_page > 7 &&
                pageNum !== 1 &&
                pageNum !== pagination.last_page &&
                Math.abs(pageNum - page) > 1
              ) {
                if (pageNum === 2 || pageNum === pagination.last_page - 1) {
                  return <span key={pageNum} className="px-1 text-gray-400">...</span>;
                }
                return null;
              }

              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold font-mono-custom transition-all cursor-pointer ${
                    page === pageNum
                      ? 'bg-[#3C6E71] text-white shadow-sm font-black'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={page >= pagination.last_page}
              onClick={() => setPage(prev => Math.min(pagination.last_page, prev + 1))}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold font-display uppercase tracking-wider transition-all ${
                page >= pagination.last_page
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100 cursor-pointer shadow-sm'
              }`}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* --- MODAL: INDIVIDUAL & BULK PRICE ADJUSTMENT --- */}
      {isBulkPriceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-gray-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-shrink-0">
              <div>
                <h3 className="font-display text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  AJUSTAR PRECIOS ({editableProducts.length} PRODUCTOS SELECCIONADOS)
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Editá el precio individual de cada producto o aplicá un cálculo porcentual a todos.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsBulkPriceModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Percentage Calculator Panel (Optional Assistant) */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
              <div className="text-xs space-y-0.5">
                <span className="font-bold text-gray-800 flex items-center gap-1.5 font-display text-[11px] uppercase">
                  ⚡ Cálculo rápido para todos:
                </span>
                <p className="text-[10px] text-gray-500">
                  Calcula el % sobre el precio actual y llena los casilleros para que los revises.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-28">
                  <input
                    type="number"
                    step="any"
                    value={quickPercent}
                    onChange={(e) => setQuickPercent(e.target.value)}
                    placeholder="Ej: 10 o -15"
                    className="w-full pl-2.5 pr-6 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono-custom font-bold outline-none focus:border-[#3C6E71]"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-[10px]">%</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleApplyQuickPercent(quickPercent)}
                  className="px-3 py-1.5 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white rounded-lg font-display text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer shadow-sm"
                >
                  Calcular
                </button>
              </div>
            </div>

            {/* Scrollable Products Price Table */}
            <form onSubmit={handleBulkPriceSubmit} className="flex-grow flex flex-col overflow-hidden space-y-4">
              <div className="overflow-y-auto pr-1 flex-grow divide-y divide-gray-100 border border-gray-100 rounded-xl bg-gray-50/40">
                {editableProducts.map((prod) => {
                  const curr = Number(prod.currentPrice || 0);
                  const next = Number(prod.newPrice || 0);
                  const diff = next - curr;
                  const diffPercent = curr > 0 ? ((diff / curr) * 100).toFixed(1) : 0;
                  const hasChanged = next !== curr;

                  return (
                    <div key={prod.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white transition-colors bg-white/70">
                      {/* Product Info & Thumbnail */}
                      <div className="flex items-center gap-3 min-w-0 flex-grow">
                        <div className="w-11 h-11 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 shadow-sm">
                          <img
                            src={prod.image_url}
                            alt={prod.name}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200';
                            }}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 text-xs truncate" title={prod.name}>
                            {prod.name}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono-custom mt-0.5">
                            <span>{prod.brand}</span>
                            <span>•</span>
                            <span className="text-gray-600 font-medium">
                              Actual: ARS ${curr.toLocaleString('es-AR')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Inputs: New Price & Optional Offer */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {/* New Price Input */}
                        <div className="space-y-1">
                          <div className="relative w-36">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-mono-custom font-bold text-xs">$</span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              required
                              value={prod.newPrice}
                              onChange={(e) => handlePriceItemChange(prod.id, 'newPrice', e.target.value)}
                              className={`w-full pl-6 pr-2.5 py-1.5 rounded-lg border font-mono-custom text-xs font-bold outline-none transition-all ${
                                hasChanged
                                  ? 'border-[#3C6E71] bg-[#3C6E71]/5 text-gray-900'
                                  : 'border-gray-300 bg-white text-gray-800'
                              }`}
                            />
                          </div>
                          {hasChanged && (
                            <span className={`text-[9px] font-mono-custom font-bold block text-right ${diff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {diff >= 0 ? `+${diffPercent}%` : `${diffPercent}%`} (${diff >= 0 ? `+` : ''}${diff.toLocaleString('es-AR')})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-gray-100 flex justify-between items-center flex-shrink-0">
                <span className="text-[11px] text-gray-500 font-mono-custom">
                  {editableProducts.filter(p => Number(p.newPrice) !== Number(p.currentPrice)).length} precios modificados
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBulkPriceModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-display font-bold uppercase text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isBulkPriceSubmitting}
                    className="px-5 py-2 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white rounded-xl font-display font-bold uppercase text-xs tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    {isBulkPriceSubmitting ? 'Guardando...' : `Guardar Precios (${editableProducts.length})`}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: BULK CATEGORY ASSIGNMENT --- */}
      {isBulkCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-display text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-600" />
                CAMBIAR CATEGORÍA ({selectedIds.length} PRODUCTOS)
              </h3>
              <button 
                type="button" 
                onClick={() => setIsBulkCategoryModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBulkCategorySubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-gray-700 block">Seleccionar nueva categoría:</label>
                <select
                  value={bulkCategoryId}
                  onChange={(e) => setBulkCategoryId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold text-gray-800 outline-none focus:border-[#3C6E71] focus:bg-white"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkCategoryModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-display font-bold uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isBulkCategorySubmitting}
                  className="px-5 py-2 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white rounded-xl font-display font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {isBulkCategorySubmitting ? 'Guardando...' : 'Reasignar Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: BULK INSTALLMENTS ASSIGNMENT --- */}
      {isBulkInstallmentsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="font-display text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Configurar Cuotas en Lote ({selectedIds.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkInstallmentsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBulkInstallmentsSubmit} className="space-y-4 text-xs text-left">
              <p className="text-gray-600">
                Seleccioná cuántas cuotas fijas mostrar en el cartel morado de los <strong>{selectedIds.length} productos seleccionados</strong>:
              </p>

              <div className="flex flex-wrap gap-2">
                {[
                  { label: '🚫 Sin Cuotas (0)', val: 0 },
                  { label: '3 Cuotas', val: 3 },
                  { label: '6 Cuotas', val: 6 },
                  { label: '9 Cuotas', val: 9 },
                  { label: '12 Cuotas', val: 12 }
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setBulkInstallmentsVal(opt.val)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold font-mono-custom cursor-pointer transition-all border ${
                      bulkInstallmentsVal === opt.val
                        ? 'bg-purple-700 text-white border-purple-800 shadow-sm'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-purple-50 hover:text-purple-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="font-bold text-gray-700 block">O ingresar número de cuotas:</label>
                <input
                  type="number"
                  min="0"
                  max="48"
                  value={bulkInstallmentsVal}
                  onChange={(e) => setBulkInstallmentsVal(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold font-mono-custom text-gray-900 outline-none focus:border-purple-600 focus:bg-white"
                  placeholder="0 para desactivar"
                />
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-[11px] text-purple-950 font-medium">
                {bulkInstallmentsVal > 0 ? (
                  <span>
                    ✨ Se activará el cartel de <strong>{bulkInstallmentsVal} cuotas fijas</strong> en los {selectedIds.length} productos seleccionados.
                  </span>
                ) : (
                  <span>
                    🚫 <strong>Sin cuotas fijas:</strong> Se ocultará el cartel de cuotas en los {selectedIds.length} productos seleccionados.
                  </span>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkInstallmentsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-display font-bold uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isBulkInstallmentsSubmitting}
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-display font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {isBulkInstallmentsSubmitting ? 'Aplicando...' : `Guardar Cuotas (${selectedIds.length})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: BULK DELETE CONFIRMATION --- */}
      {isBulkDeleteModalOpen && (
        <ConfirmationModal
          isOpen={isBulkDeleteModalOpen}
          title={`¿Eliminar ${selectedIds.length} productos seleccionados?`}
          message="Esta acción intentará eliminar todos los productos seleccionados. Aquellos que tengan compras o pedidos históricos asociados serán protegidos automáticamente."
          confirmText={isBulkDeleteSubmitting ? "Eliminando..." : "Sí, Eliminar Selección"}
          confirmColor="bg-red-600 hover:bg-red-700"
          onConfirm={handleBulkDeleteSubmit}
          onCancel={() => setIsBulkDeleteModalOpen(false)}
        />
      )}

      {/* --- MODAL: IMPORT CSV WITH PREVIEW --- */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 border border-gray-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#B85C38]" />
                <h3 className="font-display text-sm font-bold text-gray-900 uppercase tracking-wider">
                  IMPORTACIÓN MASIVA DE CATÁLOGO (CSV)
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsImportModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drop Zone */}
            <div className="border-2 border-dashed border-gray-300 hover:border-[#3C6E71] rounded-2xl p-6 text-center bg-gray-50/50 hover:bg-[#3C6E71]/5 transition-all">
              <input
                type="file"
                id="csv-file-input"
                accept=".csv,text/csv,text/plain"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="csv-file-input" className="cursor-pointer block space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#B85C38]/10 text-[#B85C38] flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="font-display font-bold text-xs text-gray-800">
                  {importFile ? importFile.name : 'SELECCIONÁ O ARRASTRÁ TU ARCHIVO CSV AQUÍ'}
                </p>
                <p className="text-[11px] text-gray-400">
                  Columnas admitidas: ID, Nombre, Marca, Categoria, Precio, Stock, Cuotas, Imagen_URL, Variantes_JSON.
                </p>
              </label>
            </div>

            {/* Loading Indicator during Preview */}
            {isImporting && !importPreview && (
              <div className="py-6 text-center text-xs text-[#3C6E71] font-bold flex items-center justify-center gap-2 font-mono-custom animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" /> Analizando y validando archivo CSV...
              </div>
            )}

            {/* Preview Summary */}
            {importPreview && (
              <div className="space-y-4 border-t border-gray-100 pt-4">
                <h4 className="font-display text-xs font-bold uppercase tracking-wider text-gray-800">
                  Resumen de Previsualización:
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                    <span className="text-xl font-bold text-emerald-800 font-mono-custom block">
                      {importPreview.to_create_count}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 font-display">A Crear (Nuevos)</span>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                    <span className="text-xl font-bold text-blue-800 font-mono-custom block">
                      {importPreview.to_update_count}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-blue-700 font-display">A Actualizar (Existentes)</span>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                    <span className="text-xl font-bold text-red-800 font-mono-custom block">
                      {importPreview.error_count}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-red-700 font-display">Con Error (Omitidos)</span>
                  </div>
                </div>

                {/* Errors list */}
                {importPreview.errors?.length > 0 && (
                  <div className="bg-red-50/60 border border-red-200 rounded-xl p-3 max-h-36 overflow-y-auto space-y-1 text-xs">
                    <span className="font-bold text-red-800 block text-[11px]">Errores detectados en filas:</span>
                    {importPreview.errors.map((err, idx) => (
                      <p key={idx} className="text-[11px] text-red-700 font-mono-custom">
                        • Fila {err.row}: {err.product ? `[${err.product}] ` : ''}{err.error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFile(null);
                  setImportPreview(null);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-display font-bold uppercase text-xs cursor-pointer"
              >
                Cancelar
              </button>

              {importPreview && (
                <button
                  type="button"
                  disabled={isImporting || (importPreview.to_create_count === 0 && importPreview.to_update_count === 0)}
                  onClick={handleConfirmImport}
                  className="px-5 py-2 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white rounded-xl font-display font-bold uppercase text-xs tracking-wider flex items-center gap-2 cursor-pointer shadow-md"
                >
                  {isImporting ? 'Procesando...' : `Confirmar e Importar (${importPreview.to_create_count + importPreview.to_update_count} Productos)`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
