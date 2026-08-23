import React from 'react';
import {
  Shield,
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Users,
  Star,
  Image,
  Tag,
  MessageSquare,
  Settings,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Check,
  Search,
  ChevronRight,
  TrendingUp,
  Download,
  AlertCircle
} from 'lucide-react';
import { SmoothInput } from '../Common/SmoothInput';
import DashboardCharts from './DashboardCharts';
import BannerEditor from './BannerEditor';
import CouponManager from './CouponManager';
import SupportManager from './SupportManager';
import StoreSettings from './StoreSettings';
import ProductEditModal from './ProductEditModal';
import CustomerEditModal from './CustomerEditModal';
import { getOrderStatusInfo, parseOrderItems, formatMoney, formatDate } from '../../utils/orderConstants';

export default function AdminDashboard({
  token,
  userProfile,
  adminTab,
  setAdminTab,
  setCurrentView,
  setIsAuthModalOpen,
  setAuthMode,
  handleLogout,
  adminStats,
  adminProductsList = [],
  products = [],
  adminOrdersList = [],
  isAdminOrdersLoading,
  adminOrderSearchQuery,
  setAdminOrderSearchQuery,
  adminOrderStatusFilter,
  setAdminOrderStatusFilter,
  onSelectOrder,
  onOpenReceiptLightbox,
  onPrintOrder,
  onUpdateStatus,
  onOpenRejectionModal,
  heroSlides,
  setHeroSlides,
  promoBanner,
  setPromoBanner,
  tickerPhrases,
  setTickerPhrases,
  adminCategoriesList = [],
  selectedProductModal,
  setSelectedProductModal,
  isProductModalOpen,
  setIsProductModalOpen,
  handleSaveProductModal,
  handleDeleteProduct,
  getProductImage,
  categories = [],
  editingCategory,
  setEditingCategory,
  catName,
  setCatName,
  catSlug,
  setCatSlug,
  handleSaveCategory,
  handleDeleteCategory,
  adminCustomersList = [],
  setAdminCustomersList,
  selectedCustomerModal,
  setSelectedCustomerModal,
  isCustomerModalOpen,
  setIsCustomerModalOpen,
  adminReviewsList = [],
  API_BASE_URL
}) {
  const filteredOrders = adminOrdersList.filter(ord => {
    if (adminOrderStatusFilter !== 'all' && ord.status !== adminOrderStatusFilter) return false;
    if (adminOrderSearchQuery.trim()) {
      const q = adminOrderSearchQuery.toLowerCase();
      const idMatch = String(ord.id).toLowerCase().includes(q);
      const nameMatch = (ord.customer_name || '').toLowerCase().includes(q);
      const emailMatch = (ord.customer_email || '').toLowerCase().includes(q);
      return idMatch || nameMatch || emailMatch;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F4F4F9] text-gray-900 font-sans text-left">
      {/* Admin Header */}
      <header className="bg-[#1C2321] text-white border-b border-[#3C6E71]/20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { window.location.hash = '#/'; setCurrentView('home'); }}
              className="flex items-center gap-2.5 group cursor-pointer"
            >
              <img src="/holuxlogo.png" alt="HOLUX" className="h-8 w-auto object-contain brightness-0 invert" />
              <span className="font-display font-black text-lg tracking-widest text-white">
                HOLUX
              </span>
              <span className="font-display font-bold text-xs tracking-widest text-gray-400 pl-2 border-l border-white/20">
                PANEL ADMINISTRADOR
              </span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => { window.location.hash = '#/mi-cuenta'; setCurrentView('customer_panel'); }}
              className="text-xs text-gray-300 hover:text-white font-bold transition-colors cursor-pointer"
            >
              MI CUENTA
            </button>
            <button
              onClick={() => { window.location.hash = '#/'; setCurrentView('home'); }}
              className="text-xs text-gray-300 hover:text-white font-bold transition-colors cursor-pointer"
            >
              VOLVER A LA TIENDA
            </button>
            <button
              onClick={handleLogout}
              className="p-2 bg-white/10 hover:bg-red-500/20 text-gray-300 hover:text-red-300 rounded-full transition-colors cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar */}
          <aside className="lg:col-span-3 space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-2">
              <nav className="space-y-1 text-xs font-bold">
                {[
                  { id: 'dashboard', label: 'Dashboard & Estadísticas', icon: LayoutDashboard },
                  { id: 'orders', label: 'Gestión de Pedidos', icon: ShoppingBag, count: adminOrdersList.length },
                  { id: 'products', label: 'Catálogo de Productos', icon: Package, count: adminProductsList.length || products.length },
                  { id: 'categories', label: 'Categorías', icon: Layers },
                  { id: 'customers', label: 'Base de Clientes', icon: Users, count: adminCustomersList.length },
                  { id: 'reviews', label: 'Moderación de Reseñas', icon: Star },
                  { id: 'banners', label: 'Banners y Promociones', icon: Image },
                  { id: 'coupons', label: 'Cupones de Descuento', icon: Tag },
                  { id: 'support', label: 'Atención al Cliente', icon: MessageSquare },
                  { id: 'settings', label: 'Ajustes del Sistema', icon: Settings }
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = adminTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setAdminTab(tab.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-[#1C2321] text-white shadow-xs' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#3C6E71]' : 'text-gray-400'}`} />
                        <span>{tab.label}</span>
                      </div>
                      {tab.count !== undefined && tab.count > 0 && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isActive ? 'bg-[#3C6E71] text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Content Area */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* DASHBOARD TAB */}
            {adminTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-1">
                    <span className="text-xs text-gray-500 font-bold uppercase">Ventas Totales</span>
                    <h3 className="text-2xl font-black text-gray-900">
                      {formatMoney(adminStats?.total_revenue || 0)}
                    </h3>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-1">
                    <span className="text-xs text-gray-500 font-bold uppercase">Pedidos Totales</span>
                    <h3 className="text-2xl font-black text-gray-900">
                      {adminStats?.total_orders || adminOrdersList.length}
                    </h3>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-1">
                    <span className="text-xs text-gray-500 font-bold uppercase">Productos Activos</span>
                    <h3 className="text-2xl font-black text-gray-900">
                      {adminProductsList.length || products.length}
                    </h3>
                  </div>
                </div>

                <DashboardCharts stats={adminStats} orders={adminOrdersList} />
              </div>
            )}

            {/* ORDERS TAB */}
            {adminTab === 'orders' && (
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="font-display font-bold text-lg text-gray-900 uppercase">Gestión de Pedidos</h3>
                    <p className="text-xs text-gray-500">Moderación de pagos por transferencia y control de despachos</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <SmoothInput
                        type="text"
                        value={adminOrderSearchQuery}
                        onChange={(e) => setAdminOrderSearchQuery(e.target.value)}
                        placeholder="Buscar por cliente o ID..."
                        className="pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#3C6E71]"
                      />
                    </div>
                    <select
                      value={adminOrderStatusFilter}
                      onChange={(e) => setAdminOrderStatusFilter(e.target.value)}
                      className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-[#3C6E71] cursor-pointer"
                    >
                      <option value="all">Todos los estados</option>
                      <option value="pending_review">En Revisión (Transferencia)</option>
                      <option value="paid">Pagados</option>
                      <option value="preparing">En Preparación</option>
                      <option value="shipped">Despachados</option>
                      <option value="delivered">Entregados</option>
                      <option value="rejected">Rechazados</option>
                    </select>
                  </div>
                </div>

                {isAdminOrdersLoading ? (
                  <div className="py-12 text-center text-gray-400 space-y-2">
                    <div className="w-8 h-8 border-2 border-[#3C6E71] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-bold uppercase">Cargando pedidos...</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 space-y-2">
                    <ShoppingBag className="w-12 h-12 mx-auto stroke-[1]" />
                    <p className="text-xs font-bold uppercase">No se encontraron pedidos</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-gray-700">
                      <thead className="bg-gray-50 uppercase font-bold text-gray-900 text-[11px] border-b border-gray-200">
                        <tr>
                          <th className="p-3">ID / Fecha</th>
                          <th className="p-3">Cliente</th>
                          <th className="p-3">Medio de Pago</th>
                          <th className="p-3">Estado</th>
                          <th className="p-3">Total</th>
                          <th className="p-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium">
                        {filteredOrders.map(ord => {
                          const stInfo = getOrderStatusInfo(ord.status);
                          return (
                            <tr key={ord.id} className="hover:bg-gray-50/80 transition-colors">
                              <td className="p-3">
                                <span className="font-bold text-gray-900 font-mono-custom block">
                                  #{String(ord.id).slice(-8).toUpperCase()}
                                </span>
                                <span className="text-[10px] text-gray-400 font-sans">
                                  {formatDate(ord.created_at)}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className="font-bold text-gray-900 block">{ord.customer_name || 'Particular'}</span>
                                <span className="text-[10px] text-gray-400 block">{ord.customer_email || '-'}</span>
                              </td>
                              <td className="p-3 uppercase text-[11px]">
                                {ord.payment_method === 'transfer' ? 'Transferencia' : 'Mercado Pago'}
                                {ord.receipt_url && (
                                  <button
                                    onClick={() => onOpenReceiptLightbox(ord.receipt_url)}
                                    className="block text-[10px] text-[#3C6E71] font-bold hover:underline mt-0.5 cursor-pointer"
                                  >
                                    Ver comprobante
                                  </button>
                                )}
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${stInfo.badgeClass}`}>
                                  {stInfo.label}
                                </span>
                              </td>
                              <td className="p-3 font-bold text-gray-900">
                                {formatMoney(ord.total_amount || ord.total || 0)}
                              </td>
                              <td className="p-3 text-right space-x-2">
                                <button
                                  onClick={() => onSelectOrder(ord)}
                                  className="px-3 py-1.5 bg-[#1C2321] hover:bg-[#3C6E71] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                >
                                  GESTIONAR
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* PRODUCTS TAB */}
            {adminTab === 'products' && (
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="font-display font-bold text-lg text-gray-900 uppercase">Catálogo de Productos</h3>
                    <p className="text-xs text-gray-500">Alta, baja y modificación de stock y precios</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedProductModal(null);
                      setIsProductModalOpen(true);
                    }}
                    className="px-4 py-2 bg-[#1C2321] hover:bg-[#3C6E71] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>NUEVO PRODUCTO</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {(adminProductsList.length > 0 ? adminProductsList : products).map(prod => (
                    <div key={prod.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                      <img
                        src={prod.image_url || getProductImage(prod.name)}
                        alt={prod.name}
                        className="w-full aspect-square object-cover rounded-lg bg-white border border-gray-150"
                      />
                      <div>
                        <h4 className="font-bold text-xs text-gray-900 line-clamp-1">{prod.name}</h4>
                        <span className="text-[11px] text-gray-500 block">{formatMoney(prod.price)} • Stock: {prod.stock}</span>
                      </div>
                      <div className="pt-2 flex gap-2 border-t border-gray-200/60">
                        <button
                          onClick={() => {
                            setSelectedProductModal(prod);
                            setIsProductModalOpen(true);
                          }}
                          className="flex-1 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-100 cursor-pointer text-center"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CATEGORIES TAB */}
            {adminTab === 'categories' && (
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-6">
                <div className="border-b border-gray-100 pb-4">
                  <h3 className="font-display font-bold text-lg text-gray-900 uppercase">Gestión de Categorías</h3>
                  <p className="text-xs text-gray-500">Crea y organiza las categorías de navegación de la tienda</p>
                </div>

                <form onSubmit={handleSaveCategory} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
                  <h4 className="text-xs font-bold text-gray-800 uppercase">
                    {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <SmoothInput
                      type="text"
                      required
                      value={catName}
                      onChange={(e) => {
                        setCatName(e.target.value);
                        if (!editingCategory) setCatSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                      }}
                      placeholder="Nombre (ej: Mochilas)"
                      className="p-2.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-[#3C6E71]"
                    />
                    <SmoothInput
                      type="text"
                      required
                      value={catSlug}
                      onChange={(e) => setCatSlug(e.target.value)}
                      placeholder="Slug (ej: mochilas)"
                      className="p-2.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-[#3C6E71]"
                    />
                  </div>
                  <div className="flex gap-2">
                    {editingCategory && (
                      <button
                        type="button"
                        onClick={() => { setEditingCategory(null); setCatName(''); setCatSlug(''); }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-100 cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-6 py-2 bg-[#1C2321] hover:bg-[#3C6E71] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      {editingCategory ? 'Actualizar' : 'Crear Categoría'}
                    </button>
                  </div>
                </form>

                <div className="divide-y divide-gray-100">
                  {(adminCategoriesList.length > 0 ? adminCategoriesList : categories).map(cat => (
                    <div key={cat.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-gray-900">{cat.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono-custom block">/{cat.slug}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditingCategory(cat); setCatName(cat.name); setCatSlug(cat.slug); }}
                          className="p-1.5 text-[#3C6E71] hover:bg-gray-100 rounded cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1.5 text-red-600 hover:bg-gray-100 rounded cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CUSTOMERS TAB */}
            {adminTab === 'customers' && (
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-6">
                <div className="border-b border-gray-100 pb-4">
                  <h3 className="font-display font-bold text-lg text-gray-900 uppercase">Base de Clientes</h3>
                  <p className="text-xs text-gray-500">Usuarios registrados e historial de actividad</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {adminCustomersList.map((cust, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-gray-900">{cust.full_name || 'Usuario'}</span>
                        <span className="text-[10px] text-gray-400 block">{cust.email}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 uppercase">
                        {cust.role || 'Cliente'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* REVIEWS TAB */}
            {adminTab === 'reviews' && (
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-6">
                <div className="border-b border-gray-100 pb-4">
                  <h3 className="font-display font-bold text-lg text-gray-900 uppercase">Moderación de Reseñas</h3>
                  <p className="text-xs text-gray-500">Opiniones y calificaciones enviadas por usuarios</p>
                </div>
                <div className="space-y-3">
                  {adminReviewsList.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No hay reseñas pendientes de moderación.</p>
                  ) : (
                    adminReviewsList.map((rev, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">{rev.user_name || 'Cliente'}</span>
                          <span className="text-amber-500 font-bold">{rev.rating} ★</span>
                        </div>
                        <p className="text-gray-600">{rev.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* BANNERS TAB */}
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
                API_BASE_URL={API_BASE_URL}
              />
            )}

            {/* COUPONS TAB */}
            {adminTab === 'coupons' && <CouponManager />}

            {/* SUPPORT TAB */}
            {adminTab === 'support' && <SupportManager />}

            {/* SETTINGS TAB */}
            {adminTab === 'settings' && <StoreSettings />}

          </div>
        </div>
      </main>

      {/* Product Edit Modal */}
      {isProductModalOpen && (
        <ProductEditModal
          product={selectedProductModal}
          onClose={() => {
            setIsProductModalOpen(false);
            setSelectedProductModal(null);
          }}
          onSave={handleSaveProductModal}
          categories={categories}
        />
      )}

      {/* Customer Edit Modal */}
      {isCustomerModalOpen && selectedCustomerModal && (
        <CustomerEditModal
          customer={selectedCustomerModal}
          onClose={() => {
            setIsCustomerModalOpen(false);
            setSelectedCustomerModal(null);
          }}
          onSave={() => {
            setIsCustomerModalOpen(false);
            setSelectedCustomerModal(null);
          }}
        />
      )}
    </div>
  );
}
