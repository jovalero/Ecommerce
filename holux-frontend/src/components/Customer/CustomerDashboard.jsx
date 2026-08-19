import React, { useState } from 'react';
import {
  User,
  ShoppingBag,
  Tag,
  Star,
  MapPin,
  MessageSquare,
  Lock,
  LogOut,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Check,
  RotateCcw,
  Download,
  AlertCircle,
  Eye,
  Shield,
  Search,
  Clock,
  Truck,
  CheckCircle2,
  Settings,
  Package,
  FileText
} from 'lucide-react';
import { getOrderStatusInfo, parseOrderItems, formatMoney, formatDate } from '../../utils/orderConstants';

export default function CustomerDashboard({
  userProfile,
  setUserProfile,
  orders = [],
  customerCoupons = [],
  couponsTabFilter,
  setCouponsTabFilter,
  couponSearchQuery,
  setCouponSearchQuery,
  redeemInput,
  setRedeemInput,
  handleRedeemCouponSubmit,
  handleCopyCouponCode,
  copiedCouponId,
  handleUseCouponNow,
  customerReviewsList = [],
  setIsAddCustomerReviewModalOpen,
  addresses = [],
  setIsAddressModalOpen,
  setEditingAddress,
  setAddrLabel,
  setAddrStreet,
  setAddrCity,
  setAddrProvince,
  setAddrPostalCode,
  setAddrIsDefault,
  handleDeleteAddress,
  panelSupportMessages = [],
  panelSupportInput,
  setPanelSupportInput,
  handleSendPanelSupportMessage,
  accountSettings,
  setAccountSettings,
  handleSaveSettingsSubmit,
  settingsSavedMessage,
  orderStatusFilter,
  setOrderStatusFilter,
  orderSearchQuery,
  setOrderSearchQuery,
  customerPanelSection,
  setCustomerPanelSection,
  handleLogout,
  setCurrentView,
  setAdminTab,
  setIsCartOpen,
  setIsRefundModalOpen,
  setRefundOrderSelect,
  setCustomerSelectedOrderDetail,
  handleUpdateProfile,
  isUpdatingProfile,
  profileUpdateSuccess,
  API_BASE_URL,
  token
}) {
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'pending' | 'processing' | 'shipped' | 'completed'

  // Filter orders based on active tab and search query
  const filteredOrders = orders.filter(ord => {
    if (filterTab === 'pending') {
      if (ord.status !== 'pending_review' && ord.status !== 'created') return false;
    } else if (filterTab === 'processing') {
      if (ord.status !== 'paid' && ord.status !== 'preparing') return false;
    } else if (filterTab === 'shipped') {
      if (ord.status !== 'shipped') return false;
    } else if (filterTab === 'completed') {
      if (ord.status !== 'delivered') return false;
    }

    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase();
      const idMatch = String(ord.id).toLowerCase().includes(q);
      const nameMatch = (ord.customer_name || '').toLowerCase().includes(q);
      const addrMatch = (ord.shipping_address || '').toLowerCase().includes(q);
      const items = parseOrderItems(ord);
      const itemMatch = items.some(it => (it.name || '').toLowerCase().includes(q));
      return idMatch || nameMatch || addrMatch || itemMatch;
    }
    return true;
  });

  const isAdmin = userProfile?.role === 'admin' || userProfile?.email?.toLowerCase() === 'admin@holux.com';

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-gray-900 font-sans text-left py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1360px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================= LEFT SIDEBAR ================= */}
          <aside className="lg:col-span-3 space-y-4">
            
            {/* User Profile Card */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#3C6E71] text-white flex items-center justify-center font-bold text-xl font-display shadow-xs shrink-0">
                  {userProfile?.full_name?.charAt(0)?.toUpperCase() || userProfile?.email?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display font-black text-sm text-gray-900 tracking-wide uppercase truncate">
                    {userProfile?.full_name || (isAdmin ? 'ADMINISTRADOR HOLUX' : 'MI CUENTA')}
                  </h3>
                  <p className="text-xs text-gray-400 truncate font-sans">
                    {userProfile?.email || 'admin@holux.com'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs font-sans">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  ESTADO
                </span>
                <span className="px-3 py-1 bg-[#B85C38] text-white text-[10px] font-bold font-display rounded-full flex items-center gap-1.5 uppercase tracking-widest shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {isAdmin ? 'ADMINISTRADOR' : 'CLIENTE VERIFICADO'}
                </span>
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="space-y-2">
              
              {/* Admin Button if user is Admin */}
              {isAdmin && (
                <button
                  onClick={() => {
                    window.location.hash = '#/admin';
                    setCurrentView('admin');
                    setAdminTab('dashboard');
                  }}
                  className="w-full flex items-center justify-between p-3.5 bg-[#B85C38] hover:bg-[#a04e2e] text-white rounded-xl font-display font-bold text-xs tracking-wider transition-all duration-200 shadow-sm cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-white/90" />
                    <span>Panel de Administración</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/80" />
                </button>
              )}

              {/* Sidebar Menu Items */}
              <div className="bg-white border border-gray-200/80 rounded-2xl p-2 shadow-sm space-y-1 text-xs font-bold font-sans">
                
                {/* General */}
                <button
                  onClick={() => setCustomerPanelSection('general')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer ${
                    customerPanelSection === 'general'
                      ? 'bg-[#3C6E71] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User className={`w-4 h-4 ${customerPanelSection === 'general' ? 'text-white' : 'text-gray-400'}`} />
                    <span>General</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${customerPanelSection === 'general' ? 'text-white' : 'text-gray-300'}`} />
                </button>

                {/* Pedidos */}
                <button
                  onClick={() => setCustomerPanelSection('orders')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer ${
                    customerPanelSection === 'orders'
                      ? 'bg-[#3C6E71] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShoppingBag className={`w-4 h-4 ${customerPanelSection === 'orders' ? 'text-white' : 'text-gray-400'}`} />
                    <span>Pedidos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      customerPanelSection === 'orders' ? 'bg-white text-[#3C6E71]' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {orders.length}
                    </span>
                    <ChevronRight className={`w-4 h-4 ${customerPanelSection === 'orders' ? 'text-white' : 'text-gray-300'}`} />
                  </div>
                </button>

                {/* Cupones y Beneficios */}
                <button
                  onClick={() => setCustomerPanelSection('coupons')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer ${
                    customerPanelSection === 'coupons'
                      ? 'bg-[#3C6E71] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Tag className={`w-4 h-4 ${customerPanelSection === 'coupons' ? 'text-white' : 'text-gray-400'}`} />
                    <span>Cupones y Beneficios</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                      {customerCoupons.filter(c => c.status === 'disponible').length}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </button>

                {/* Valoraciones */}
                <button
                  onClick={() => setCustomerPanelSection('reviews')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer ${
                    customerPanelSection === 'reviews'
                      ? 'bg-[#3C6E71] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Star className={`w-4 h-4 ${customerPanelSection === 'reviews' ? 'text-white' : 'text-gray-400'}`} />
                    <span>Valoraciones</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>

                {/* Dirección de envío */}
                <button
                  onClick={() => setCustomerPanelSection('addresses')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer ${
                    customerPanelSection === 'addresses'
                      ? 'bg-[#3C6E71] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MapPin className={`w-4 h-4 ${customerPanelSection === 'addresses' ? 'text-white' : 'text-gray-400'}`} />
                    <span>Dirección de envío</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                      {addresses.length}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </button>

                {/* Centro de mensajes */}
                <button
                  onClick={() => setCustomerPanelSection('support')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer ${
                    customerPanelSection === 'support'
                      ? 'bg-[#3C6E71] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className={`w-4 h-4 ${customerPanelSection === 'support' ? 'text-white' : 'text-gray-400'}`} />
                    <span>Centro de mensajes</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>

                {/* Ajustes de cuenta */}
                <button
                  onClick={() => setCustomerPanelSection('settings')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer ${
                    customerPanelSection === 'settings'
                      ? 'bg-[#3C6E71] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Settings className={`w-4 h-4 ${customerPanelSection === 'settings' ? 'text-white' : 'text-gray-400'}`} />
                    <span>Ajustes de cuenta</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>

                {/* Cerrar Sesión */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer pt-2 font-bold"
                >
                  <LogOut className="w-4 h-4 text-red-600" />
                  <span>Cerrar Sesión</span>
                </button>

              </div>
            </div>
          </aside>

          {/* ================= MAIN CONTENT AREA ================= */}
          <section className="lg:col-span-9 space-y-6">
            
            {/* --- PEDIDOS SECTION (AS IN THE SCREENSHOT) --- */}
            {customerPanelSection === 'orders' && (
              <div className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                
                {/* Header & Search */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-[#3C6E71]/10 rounded-xl text-[#3C6E71]">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h2 className="font-display font-black text-xl text-gray-900 tracking-wide uppercase">
                      MIS PEDIDOS Y COMPRAS
                    </h2>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      placeholder="Buscar por N° o producto..."
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-xs font-sans outline-none focus:border-[#3C6E71] focus:bg-white transition-all placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Status Filter Tabs (Pills) */}
                <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-5 text-xs font-bold">
                  {[
                    { id: 'all', label: 'Ver todo' },
                    { id: 'pending', label: 'En Verificación / A pagar' },
                    { id: 'processing', label: 'Pagados / En Preparación' },
                    { id: 'shipped', label: 'Enviados' },
                    { id: 'completed', label: 'Completados' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setFilterTab(tab.id)}
                      className={`px-4 py-2 rounded-lg font-sans font-bold transition-all cursor-pointer ${
                        filterTab === tab.id
                          ? 'bg-[#3C6E71] text-white shadow-xs'
                          : 'bg-gray-100/80 hover:bg-gray-200/70 text-gray-600'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Orders List */}
                {filteredOrders.length === 0 ? (
                  <div className="py-16 text-center text-gray-400 space-y-3">
                    <ShoppingBag className="w-14 h-14 mx-auto stroke-[1] text-gray-300" />
                    <p className="font-display font-bold text-sm uppercase text-gray-500">
                      No hay pedidos registrados en esta sección
                    </p>
                    <button
                      onClick={() => { window.location.hash = '#/catalogo'; setCurrentView('category'); }}
                      className="px-6 py-2.5 bg-[#1C2321] hover:bg-[#3C6E71] text-white font-display text-xs font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                    >
                      Explorar Catálogo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredOrders.map(order => {
                      const totalAmount = order.total_amount || order.total || 0;
                      const orderCode = String(order.id).slice(-6).toUpperCase();
                      const isTransfer = order.payment_method === 'transfer' || order.receipt_url;
                      const isPendingReview = order.status === 'pending_review' || (order.status === 'created' && isTransfer);
                      const isPaid = order.status === 'paid';
                      const isPreparing = order.status === 'preparing';
                      const isShipped = order.status === 'shipped';
                      const isDelivered = order.status === 'delivered';

                      // Compute active step index for 5-step timeline
                      let activeStep = 1;
                      if (isPendingReview) activeStep = 2;
                      else if (isPaid) activeStep = 3;
                      else if (isPreparing) activeStep = 4;
                      else if (isShipped || isDelivered) activeStep = 5;

                      return (
                        <div
                          key={order.id}
                          className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-5 hover:border-gray-300 transition-colors"
                        >
                          {/* Order Card Top Bar */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-3">
                              {isPendingReview ? (
                                <span className="px-3 py-1 bg-amber-500 text-white font-display text-xs font-black rounded uppercase tracking-wider shadow-xs">
                                  PAGO EN VERIFICACIÓN
                                </span>
                              ) : isPaid ? (
                                <span className="px-3 py-1 bg-emerald-600 text-white font-display text-xs font-black rounded uppercase tracking-wider shadow-xs">
                                  PAGO APROBADO
                                </span>
                              ) : isPreparing ? (
                                <span className="px-3 py-1 bg-blue-600 text-white font-display text-xs font-black rounded uppercase tracking-wider shadow-xs">
                                  EN PREPARACIÓN
                                </span>
                              ) : isShipped ? (
                                <span className="px-3 py-1 bg-purple-600 text-white font-display text-xs font-black rounded uppercase tracking-wider shadow-xs">
                                  DESPACHADO
                                </span>
                              ) : isDelivered ? (
                                <span className="px-3 py-1 bg-emerald-700 text-white font-display text-xs font-black rounded uppercase tracking-wider shadow-xs">
                                  ENTREGADO
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-gray-500 text-white font-display text-xs font-black rounded uppercase tracking-wider shadow-xs">
                                  {order.status?.toUpperCase()}
                                </span>
                              )}

                              <span className="font-mono-custom text-sm font-bold text-gray-900 tracking-wider">
                                N° #{orderCode}
                              </span>
                            </div>

                            <span className="text-xs text-gray-500 font-sans">
                              Fecha: {formatDate(order.created_at || order.date)}
                            </span>
                          </div>

                          {/* 5-Step Order Progress Timeline */}
                          <div className="space-y-2">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider font-sans block">
                              PROGRESO DE TU PEDIDO
                            </span>
                            <div className="grid grid-cols-5 gap-2 text-[11px] font-sans font-bold text-center select-none">
                              
                              {/* Step 1: Creado */}
                              <div className={`p-2.5 rounded-lg border transition-all ${
                                activeStep >= 1 
                                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-800' 
                                  : 'bg-gray-50 border-gray-200 text-gray-400'
                              }`}>
                                1. CREADO ✓
                              </div>

                              {/* Step 2: Verificación */}
                              <div className={`p-2.5 rounded-lg border transition-all ${
                                activeStep === 2
                                  ? 'bg-amber-50 border-amber-300 text-amber-900 ring-1 ring-amber-400/50'
                                  : activeStep > 2
                                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-800'
                                    : 'bg-gray-50 border-gray-200 text-gray-400'
                              }`}>
                                2. VERIFICACIÓN ⏳
                              </div>

                              {/* Step 3: Pago OK */}
                              <div className={`p-2.5 rounded-lg border transition-all ${
                                activeStep >= 3 
                                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-800' 
                                  : 'bg-gray-50 border-gray-200 text-gray-400'
                              }`}>
                                3. PAGO OK ✓
                              </div>

                              {/* Step 4: Preparando */}
                              <div className={`p-2.5 rounded-lg border transition-all ${
                                activeStep >= 4 
                                  ? 'bg-blue-50 border-blue-300 text-blue-800' 
                                  : 'bg-gray-50 border-gray-200 text-gray-400'
                              }`}>
                                4. PREPARANDO 📦
                              </div>

                              {/* Step 5: Enviado */}
                              <div className={`p-2.5 rounded-lg border transition-all ${
                                activeStep >= 5 
                                  ? 'bg-emerald-100 border-emerald-400 text-emerald-900' 
                                  : 'bg-gray-50 border-gray-200 text-gray-400'
                              }`}>
                                5. ENVIADO 🚚
                              </div>

                            </div>
                          </div>

                          {/* Order Details & Summary Info */}
                          <div className="space-y-1.5 text-xs text-gray-700 font-sans">
                            <p>
                              <strong className="text-gray-900">Destino:</strong>{' '}
                              {order.shipping_address ? `Entrega a Domicilio (${order.shipping_address})` : 'Entrega a Domicilio'}
                            </p>
                            <p>
                              <strong className="text-gray-900">Forma de Pago:</strong>{' '}
                              <span className="uppercase font-bold text-gray-900">
                                {order.payment_method === 'transfer' ? 'TRANSFERENCIA BANCARIA' : 'MERCADO PAGO'}
                              </span>
                            </p>
                          </div>

                          {/* Yellow Warning Alert Box when pending verification */}
                          {isPendingReview && (
                            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1 text-xs">
                              <div className="flex items-center gap-2 text-amber-900 font-bold">
                                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>PAGO EN PROCESO DE VERIFICACIÓN</span>
                              </div>
                              <p className="text-amber-800/90 text-[11px] leading-relaxed pl-6">
                                La comprobación de transferencias demora habitualmente de 2 a 24hs hábiles. Te notificaremos a tu email apenas sea validada por administración.
                              </p>
                            </div>
                          )}

                          {/* Chronological Status History */}
                          <div className="space-y-2 pt-2 border-t border-gray-100">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider font-sans block">
                              HISTORIAL CRONOLÓGICO DE ESTADOS
                            </span>
                            <div className="space-y-2 text-xs font-sans">
                              <div className="flex items-center justify-between text-gray-600">
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                  <span>Pedido recibido</span>
                                </span>
                                <span className="text-gray-400 text-[11px]">
                                  {formatDate(order.created_at || order.date)} 01:37 p. m. hs
                                </span>
                              </div>

                              {isPendingReview && (
                                <div className="flex items-center justify-between text-gray-700 font-medium">
                                  <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    <span>Comprobante en verificación manual (24-48hs)</span>
                                  </span>
                                  <span className="text-amber-700 font-bold text-[11px]">
                                    En proceso
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Bottom Total and Actions Row */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">
                            
                            {/* Total on Right (or left depending on responsive) */}
                            <div className="text-right sm:order-2">
                              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
                                TOTAL
                              </span>
                              <span className="text-2xl font-black text-gray-900 font-sans">
                                {formatMoney(totalAmount)}
                              </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center gap-3 sm:order-1">
                              <button
                                onClick={() => setCustomerSelectedOrderDetail(order)}
                                className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-display text-xs font-bold tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
                              >
                                <Eye className="w-4 h-4 text-gray-500" />
                                <span>VER DETALLE DEL PEDIDO</span>
                              </button>

                              <a
                                href={`${API_BASE_URL}/api/orders/${order.id}/pdf?token=${token || ''}`}
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
                    })}
                  </div>
                )}

              </div>
            )}

            {/* --- GENERAL TAB --- */}
            {customerPanelSection === 'general' && (
              <div className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="border-b border-gray-100 pb-4">
                  <h2 className="font-display font-black text-xl text-gray-900 uppercase">
                    Resumen de Actividad
                  </h2>
                  <p className="text-xs text-gray-500">Vista rápida de tu cuenta en Holux Patagonia</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-150 space-y-1">
                    <span className="text-xs text-gray-500 font-bold uppercase">Pedidos Realizados</span>
                    <h3 className="text-3xl font-black text-gray-900">{orders.length}</h3>
                  </div>
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-150 space-y-1">
                    <span className="text-xs text-gray-500 font-bold uppercase">Cupones Disponibles</span>
                    <h3 className="text-3xl font-black text-emerald-600">
                      {customerCoupons.filter(c => c.status === 'disponible').length}
                    </h3>
                  </div>
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-150 space-y-1">
                    <span className="text-xs text-gray-500 font-bold uppercase">Direcciones Guardadas</span>
                    <h3 className="text-3xl font-black text-gray-900">{addresses.length}</h3>
                  </div>
                </div>
              </div>
            )}

            {/* --- CUPONES TAB --- */}
            {customerPanelSection === 'coupons' && (
              <div className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="border-b border-gray-100 pb-4">
                  <h2 className="font-display font-black text-xl text-gray-900 uppercase">
                    Cupones y Beneficios
                  </h2>
                  <p className="text-xs text-gray-500">Canjea tus códigos promocionales y accede a descuentos</p>
                </div>

                {/* Redeem Form */}
                <form onSubmit={handleRedeemCouponSubmit} className="flex gap-2 p-3 bg-gray-50 border border-gray-200 rounded-2xl">
                  <input
                    type="text"
                    value={redeemInput}
                    onChange={(e) => setRedeemInput(e.target.value)}
                    placeholder="Ingresa tu código promocional..."
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-[#3C6E71] font-mono-custom uppercase font-bold"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#3C6E71] hover:bg-[#2c5355] text-white font-display text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    CANJEAR
                  </button>
                </form>

                {/* Coupons Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {customerCoupons.length === 0 ? (
                    <div className="sm:col-span-2 py-12 text-center text-gray-400 space-y-2">
                      <Tag className="w-10 h-10 mx-auto stroke-[1]" />
                      <p className="text-xs font-bold uppercase">No tienes cupones en tu billetera</p>
                    </div>
                  ) : (
                    customerCoupons.map((c, idx) => (
                      <div key={idx} className="p-5 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 bg-white text-emerald-700 font-mono-custom text-xs font-bold rounded-lg border border-emerald-200">
                            {c.code}
                          </span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            c.status === 'disponible' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-500'
                          }`}>
                            {c.status?.toUpperCase() || 'DISPONIBLE'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{c.description}</p>
                        <div className="pt-3 flex items-center justify-between border-t border-gray-200/60">
                          <button
                            onClick={() => handleCopyCouponCode(c.id, c.code)}
                            className="text-xs font-bold text-[#3C6E71] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            {copiedCouponId === c.id ? '¡Copiado!' : 'Copiar Código'}
                          </button>
                          {c.status === 'disponible' && (
                            <button
                              onClick={() => handleUseCouponNow(c)}
                              className="px-3.5 py-1 bg-[#3C6E71] hover:bg-[#2c5355] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              USAR AHORA
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* --- VALORACIONES TAB --- */}
            {customerPanelSection === 'reviews' && (
              <div className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="font-display font-black text-xl text-gray-900 uppercase">Mis Valoraciones</h2>
                    <p className="text-xs text-gray-500">Opiniones y calificaciones que has enviado</p>
                  </div>
                  <button
                    onClick={() => setIsAddCustomerReviewModalOpen(true)}
                    className="px-4 py-2 bg-[#3C6E71] hover:bg-[#2c5355] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>VALORAR PRODUCTO</span>
                  </button>
                </div>

                {customerReviewsList.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 space-y-2">
                    <Star className="w-10 h-10 mx-auto stroke-[1]" />
                    <p className="text-xs font-bold uppercase">No has publicado opiniones aún</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customerReviewsList.map((rev, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs text-gray-900">{rev.productName}</h4>
                          <div className="flex text-amber-400">
                            {[1, 2, 3, 4, 5].map(st => (
                              <Star key={st} className={`w-3.5 h-3.5 ${st <= rev.rating ? 'fill-amber-400' : 'text-gray-200'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-gray-600">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* --- DIRECCIONES TAB --- */}
            {customerPanelSection === 'addresses' && (
              <div className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="font-display font-black text-xl text-gray-900 uppercase">Direcciones de Envío</h2>
                    <p className="text-xs text-gray-500">Tus destinos configurados para entregas de Andreani</p>
                  </div>
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
                    className="px-4 py-2 bg-[#3C6E71] hover:bg-[#2c5355] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>NUEVA DIRECCIÓN</span>
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 space-y-2">
                    <MapPin className="w-10 h-10 mx-auto stroke-[1]" />
                    <p className="text-xs font-bold uppercase">No tienes direcciones guardadas</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map(addr => (
                      <div key={addr.id} className="p-5 bg-gray-50 border border-gray-200 rounded-2xl space-y-2 relative">
                        {addr.is_default && (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                            PREDETERMINADA
                          </span>
                        )}
                        <h4 className="font-bold text-xs text-gray-900">{addr.label || 'Domicilio'}</h4>
                        <p className="text-xs text-gray-600">{addr.street}</p>
                        <p className="text-xs text-gray-500">{addr.city}, {addr.province} (CP {addr.postal_code})</p>
                        <div className="pt-3 flex gap-3 border-t border-gray-200/60">
                          <button
                            onClick={() => {
                              setEditingAddress(addr);
                              setAddrLabel(addr.label || '');
                              setAddrStreet(addr.street || '');
                              setAddrCity(addr.city || '');
                              setAddrProvince(addr.province || 'Santa Fe');
                              setAddrPostalCode(addr.postal_code || '');
                              setAddrIsDefault(addr.is_default || false);
                              setIsAddressModalOpen(true);
                            }}
                            className="text-xs font-bold text-[#3C6E71] hover:underline cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* --- SOPORTE TAB --- */}
            {customerPanelSection === 'support' && (
              <div className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="border-b border-gray-100 pb-4">
                  <h2 className="font-display font-black text-xl text-gray-900 uppercase">Centro de Mensajes</h2>
                  <p className="text-xs text-gray-500">Canal directo de soporte con nuestros asesores</p>
                </div>

                <div className="h-72 overflow-y-auto p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                  {panelSupportMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs p-3.5 rounded-2xl text-xs ${
                        msg.sender === 'user'
                          ? 'bg-[#3C6E71] text-white rounded-br-none'
                          : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-xs'
                      }`}>
                        <p>{msg.text}</p>
                        <span className="text-[9px] opacity-70 block text-right mt-1">{msg.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendPanelSupportMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={panelSupportInput}
                    onChange={(e) => setPanelSupportInput(e.target.value)}
                    placeholder="Escribe tu consulta aquí..."
                    className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#3C6E71] focus:bg-white"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#3C6E71] hover:bg-[#2c5355] text-white font-display text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    ENVIAR
                  </button>
                </form>
              </div>
            )}

            {/* --- AJUSTES TAB --- */}
            {customerPanelSection === 'settings' && (
              <div className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="border-b border-gray-100 pb-4">
                  <h2 className="font-display font-black text-xl text-gray-900 uppercase">Ajustes de Cuenta</h2>
                  <p className="text-xs text-gray-500">Datos personales y configuración de seguridad</p>
                </div>

                {profileUpdateSuccess && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold">
                    ¡Perfil actualizado correctamente!
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      value={userProfile?.full_name || ''}
                      onChange={(e) => setUserProfile({ ...userProfile, full_name: e.target.value })}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#3C6E71]"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Teléfono</label>
                    <input
                      type="tel"
                      value={userProfile?.phone || ''}
                      onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#3C6E71]"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Correo Electrónico (No editable)</label>
                    <input
                      type="email"
                      disabled
                      value={userProfile?.email || ''}
                      className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-400 cursor-not-allowed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="px-6 py-3 bg-[#3C6E71] hover:bg-[#2c5355] text-white font-display text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    {isUpdatingProfile ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
                  </button>
                </form>
              </div>
            )}

          </section>

        </div>
      </div>
    </div>
  );
}
