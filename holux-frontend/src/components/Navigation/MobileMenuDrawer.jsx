import React from 'react';
import {
  X,
  ChevronRight,
  User,
  Grid,
  Truck,
  HelpCircle,
  MapPin,
  FileText,
  Shield
} from 'lucide-react';

export default function MobileMenuDrawer({
  isOpen,
  onClose,
  token,
  userProfile,
  categories = [],
  headerNavItems = [],
  setCurrentView,
  setIsAuthModalOpen,
  setAuthMode,
  setAdminTab
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 font-sans">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose} 
      />

      {/* Drawer */}
      <div className="relative w-4/5 max-w-sm bg-[#1C2321] text-white h-full shadow-2xl flex flex-col z-10 border-r border-[#3C6E71]/30 animate-in slide-in-from-left duration-300">
        
        {/* Drawer Header with User Profile / Login */}
        <div className="p-4 border-b border-[#3C6E71]/20 flex items-center justify-between bg-black/40">
          <span 
            className="font-display text-lg font-bold tracking-wider text-[#F2EFE9] flex items-center gap-2 cursor-pointer"
            onClick={() => {
              window.location.hash = '#/';
              if (setCurrentView) setCurrentView('home');
              onClose();
            }}
          >
            <img src="/holuxlogo.png" alt="HOLUX" className="h-6 w-auto object-contain brightness-0 invert" />
            <span>HOLUX</span>
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
            title="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Quick Bar in Drawer */}
        <div className="p-3.5 bg-[#3C6E71]/15 border-b border-[#3C6E71]/20">
          {token && userProfile ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-[#3C6E71] text-white font-bold font-display flex items-center justify-center text-xs shrink-0">
                  {userProfile.full_name?.charAt(0).toUpperCase() || 'C'}
                </div>
                <div className="overflow-hidden">
                  <p className="font-display text-xs font-bold text-white truncate">{userProfile.full_name || 'Mi Cuenta'}</p>
                  <p className="text-[10px] text-[#3C6E71] font-mono-custom truncate">{userProfile.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  window.location.hash = '#/mi-cuenta';
                  if (setCurrentView) setCurrentView('customer_panel');
                  onClose();
                }}
                className="px-2.5 py-1 bg-white/10 hover:bg-[#3C6E71] text-white rounded text-[10px] font-display font-bold uppercase tracking-wider shrink-0 transition-colors cursor-pointer"
              >
                Ver Panel
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                if (setIsAuthModalOpen) setIsAuthModalOpen(true);
                if (setAuthMode) setAuthMode('login');
                onClose();
              }}
              className="w-full py-2 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white rounded-lg font-display text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span>INICIAR SESIÓN / REGISTRO</span>
            </button>
          )}
        </div>

        {/* Drawer Links Scrollable */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4 text-xs">
          
          {/* Catalogo General */}
          <button
            onClick={() => { 
              window.location.hash = '#/catalogo'; 
              if (setCurrentView) setCurrentView('category');
              onClose(); 
            }}
            className="w-full text-left font-display font-bold text-xs tracking-wider py-2.5 px-3 rounded-xl bg-white/10 hover:bg-[#3C6E71]/30 text-white flex items-center justify-between shadow-xs border border-white/10 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Grid className="w-4 h-4 text-[#3C6E71]" />
              <span>TODO EL CATÁLOGO</span>
            </span>
            <ChevronRight className="w-4 h-4 text-[#3C6E71]" />
          </button>

          {/* Categorías y Enlaces de Navegación Configurados */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#3C6E71] uppercase tracking-widest px-3 block">
              MENÚ Y CATEGORÍAS
            </span>
            <div className="space-y-0.5">
              {(headerNavItems && headerNavItems.length > 0
                ? headerNavItems.filter(item => item.isVisible !== false && item.device !== 'desktop' && !item.isButton && item.type !== 'special')
                : categories
              ).map((item, idx) => {
                const link = item.link || (item.slug ? `#/catalogo?categoria=${item.slug}` : '#/catalogo');
                const label = item.label || item.name;
                return (
                  <button
                    key={item.id || idx}
                    onClick={() => { 
                      window.location.hash = link; 
                      if (setCurrentView) setCurrentView('category');
                      onClose(); 
                    }}
                    className="w-full text-left font-display font-bold text-xs tracking-wider py-2 px-3 rounded-lg hover:bg-[#3C6E71]/20 text-gray-200 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>{label.toUpperCase()}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Secciones Especiales / Botones Destacados */}
          {headerNavItems && headerNavItems.some(item => (item.isButton || item.type === 'special') && item.isVisible !== false && item.device !== 'desktop') ? (
            headerNavItems.filter(item => (item.isButton || item.type === 'special') && item.isVisible !== false && item.device !== 'desktop').map(btn => (
              <div key={btn.id} className="border-t border-[#3C6E71]/20 pt-2">
                <button
                  onClick={() => { 
                    window.location.hash = btn.link || '#/catalogo?genero=outlet'; 
                    if (setCurrentView) setCurrentView('category');
                    onClose(); 
                  }}
                  className="w-full text-left font-display font-bold text-xs tracking-wider py-2 px-3 rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center justify-between cursor-pointer"
                >
                  <span>{btn.label.toUpperCase()}</span>
                  <span className="text-[10px] bg-[#B85C38] text-white px-2 py-0.5 rounded font-bold">HOT 🔥</span>
                </button>
              </div>
            ))
          ) : (
            <div className="border-t border-[#3C6E71]/20 pt-2">
              <button
                onClick={() => { 
                  window.location.hash = '#/catalogo?genero=outlet'; 
                  if (setCurrentView) setCurrentView('category');
                  onClose(); 
                }}
                className="w-full text-left font-display font-bold text-xs tracking-wider py-2 px-3 rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center justify-between cursor-pointer"
              >
                <span>OUTLET & OFERTAS</span>
                <span className="text-[10px] bg-[#B85C38] text-white px-2 py-0.5 rounded font-bold">HOT 🔥</span>
              </button>
            </div>
          )}

          {/* Centro de Ayuda & Enlaces Legales */}
          <div className="border-t border-[#3C6E71]/20 pt-3 space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 block">
              CENTRO DE AYUDA
            </span>
            <div className="space-y-0.5">
              <button
                onClick={() => { 
                  window.location.hash = '#/info/seguimiento'; 
                  if (setCurrentView) setCurrentView('info_page');
                  onClose(); 
                }}
                className="w-full text-left py-1.5 px-3 text-xs text-gray-300 hover:text-white flex items-center gap-2 cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5 text-[#3C6E71]" />
                <span>Seguimiento de Envío</span>
              </button>
              <button
                onClick={() => { 
                  window.location.hash = '#/info/faq'; 
                  if (setCurrentView) setCurrentView('info_page');
                  onClose(); 
                }}
                className="w-full text-left py-1.5 px-3 text-xs text-gray-300 hover:text-white flex items-center gap-2 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#3C6E71]" />
                <span>Preguntas Frecuentes</span>
              </button>
              <button
                onClick={() => { 
                  window.location.hash = '#/info/locales'; 
                  if (setCurrentView) setCurrentView('info_page');
                  onClose(); 
                }}
                className="w-full text-left py-1.5 px-3 text-xs text-gray-300 hover:text-white flex items-center gap-2 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-[#3C6E71]" />
                <span>Nuestros Locales</span>
              </button>
              <button
                onClick={() => { 
                  window.location.hash = '#/info/terminos'; 
                  if (setCurrentView) setCurrentView('info_page');
                  onClose(); 
                }}
                className="w-full text-left py-1.5 px-3 text-xs text-gray-300 hover:text-white flex items-center gap-2 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-[#3C6E71]" />
                <span>Términos y Condiciones</span>
              </button>
            </div>
          </div>

          {/* Acceso Admin si corresponde */}
          {token && userProfile && userProfile.role === 'admin' && (
            <div className="border-t border-[#3C6E71]/20 pt-3">
              <button
                onClick={() => { 
                  if (setCurrentView) setCurrentView('admin'); 
                  if (setAdminTab) setAdminTab('dashboard'); 
                  onClose(); 
                }}
                className="w-full text-left font-display font-bold text-xs tracking-wider py-2.5 px-3 rounded-lg bg-black hover:bg-neutral-800 text-white flex items-center justify-between shadow-md cursor-pointer border border-white/10"
              >
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#3C6E71]" />
                  <span>PANEL DE ADMINISTRACIÓN</span>
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

        {/* Drawer Footer */}
        <div className="p-3.5 border-t border-[#3C6E71]/20 text-center bg-black/40">
          <p className="text-[10px] text-gray-400 font-mono-custom">HOLUX Outdoor Equipment © 2026</p>
        </div>

      </div>
    </div>
  );
}
