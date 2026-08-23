import React from 'react';
import { 
  Home, 
  ChevronRight, 
  TrendingUp, 
  ShoppingBag, 
  Box, 
  Edit2, 
  Gift, 
  Grid, 
  Users, 
  MessageSquare, 
  Star, 
  Lock,
  Truck 
} from 'lucide-react';

const TAB_METADATA = {
  dashboard: { label: 'Dashboard Analítica', icon: TrendingUp },
  orders: { label: 'Gestión de Pedidos', icon: ShoppingBag },
  products: { label: 'Catálogo y Stock', icon: Box },
  banners: { label: 'Editor de Banners', icon: Edit2 },
  coupons: { label: 'Cupones & Promos', icon: Gift },
  categories: { label: 'Categorías de Producto', icon: Grid },
  customers: { label: 'Clientes & VIP', icon: Users },
  support: { label: 'Soporte & Tickets', icon: MessageSquare },
  reviews: { label: 'Moderación de Reseñas', icon: Star },
  shipping: { label: 'Logística y Envíos', icon: Truck },
  settings: { label: 'Configuración General', icon: Lock },
};

export default function Breadcrumbs({
  adminTab = 'dashboard',
  onNavigateTab,
  activeDetail = null,
  onClearDetail = null,
}) {
  const currentTabInfo = TAB_METADATA[adminTab] || { label: 'Panel de Control', icon: Home };
  const TabIcon = currentTabInfo.icon;

  return (
    <nav 
      aria-label="Breadcrumb" 
      className="mb-6 flex items-center flex-wrap gap-2 text-xs text-gray-500 font-sans select-none"
    >
      {/* Level 1: Root / Panel de Control */}
      <button
        type="button"
        onClick={() => {
          if (onClearDetail) onClearDetail();
          if (onNavigateTab) onNavigateTab('dashboard');
        }}
        className={`inline-flex items-center gap-1.5 font-medium transition-colors cursor-pointer rounded-lg px-2 py-1 -ml-2 ${
          adminTab === 'dashboard' && !activeDetail
            ? 'text-gray-900 font-bold bg-gray-200/60'
            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
        }`}
        title="Ir al Dashboard Principal"
      >
        <Home className="w-3.5 h-3.5 text-gray-500" />
        <span>Panel Admin</span>
      </button>

      {/* Separator */}
      <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />

      {/* Level 2: Active Section */}
      <button
        type="button"
        disabled={adminTab === 'dashboard' && !activeDetail}
        onClick={() => {
          if (onClearDetail) onClearDetail();
          if (onNavigateTab) onNavigateTab(adminTab);
        }}
        className={`inline-flex items-center gap-1.5 font-medium transition-colors rounded-lg px-2 py-1 ${
          !activeDetail && adminTab !== 'dashboard'
            ? 'text-[#3C6E71] font-bold bg-[#3C6E71]/10 border border-[#3C6E71]/20 cursor-default'
            : activeDetail
            ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer'
            : 'text-gray-500 cursor-default'
        }`}
      >
        <TabIcon className="w-3.5 h-3.5 text-current flex-shrink-0" />
        <span>{currentTabInfo.label}</span>
      </button>

      {/* Level 3: Sub-view / Active Detail or Modal (if open) */}
      {activeDetail && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span 
            className="inline-flex items-center gap-1.5 font-bold text-[#3C6E71] bg-[#3C6E71]/10 border border-[#3C6E71]/20 px-2.5 py-1 rounded-lg truncate max-w-xs"
            title={typeof activeDetail === 'string' ? activeDetail : ''}
          >
            {activeDetail}
          </span>
        </>
      )}
    </nav>
  );
}
