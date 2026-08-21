import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  MapPin, 
  Calendar, 
  Flame, 
  Zap, 
  Truck, 
  HelpCircle, 
  CreditCard, 
  Briefcase, 
  FileText, 
  Ticket, 
  ShieldAlert, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  CheckCircle2, 
  Clock, 
  Phone, 
  ArrowRight,
  ShieldCheck,
  Package,
  Sparkles
} from 'lucide-react';

const INFO_PAGES = [
  // Grupo 1: Acerca de Nosotros
  { id: 'rrhh', title: 'Recursos Humanos', group: 'Acerca de Nosotros', icon: Users },
  { id: 'mayorista', title: 'Catálogo Mayorista', group: 'Acerca de Nosotros', icon: Building2 },
  { id: 'locales', title: 'Nuestros Locales', group: 'Acerca de Nosotros', icon: MapPin },
  { id: 'eventos', title: 'Eventos y Clínicas', group: 'Acerca de Nosotros', icon: Calendar },
  { id: 'hotsale', title: 'Hot Sale', group: 'Acerca de Nosotros', icon: Flame },
  { id: 'cybermonday', title: 'Cyber Monday', group: 'Acerca de Nosotros', icon: Zap },
  
  // Grupo 2: Centro de Ayuda
  { id: 'seguimiento', title: 'Seguimiento de Envío', group: 'Centro de Ayuda', icon: Truck },
  { id: 'faq', title: 'Preguntas Frecuentes', group: 'Centro de Ayuda', icon: HelpCircle },
  { id: 'envios-pagos', title: 'Envíos y Pagos', group: 'Centro de Ayuda', icon: CreditCard },
  { id: 'corporativas', title: 'Compras Corporativas', group: 'Centro de Ayuda', icon: Briefcase },
  { id: 'terminos', title: 'Términos y Condiciones', group: 'Centro de Ayuda', icon: FileText },
  { id: 'cupones', title: 'Cómo Canjear un Cupón', group: 'Centro de Ayuda', icon: Ticket },
  { id: 'ciberestafas', title: 'Prevención de Ciberestafas', group: 'Centro de Ayuda', icon: ShieldAlert },
];

export default function InfoPagesView({ initialPage = 'terminos', onNavigateHome, onNavigateCatalog }) {
  const [activePage, setActivePage] = useState(initialPage);
  const [trackingCode, setTrackingCode] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [openFaq, setOpenFaq] = useState({ 0: true });

  // Sync activePage with prop or hash
  useEffect(() => {
    if (initialPage) {
      setActivePage(initialPage);
    }
  }, [initialPage]);

  // Handle Tracking Search Simulation
  const handleTrackingSearch = (e) => {
    e.preventDefault();
    if (!trackingCode.trim()) return;
    setTrackingLoading(true);
    setTrackingResult(null);

    setTimeout(() => {
      setTrackingLoading(false);
      setTrackingResult({
        code: trackingCode.toUpperCase(),
        courier: 'Andreani Express / Holux Logística',
        status: 'En tránsito hacia el centro de distribución regional',
        origin: 'Centro de Distribución Central (Rosario, Santa Fe)',
        destination: 'Domicilio del comprador',
        estimatedDelivery: '2 a 4 días hábiles',
        steps: [
          { title: 'Pedido recibido y empaquetado', date: 'Ayer 14:30 hs', done: true },
          { title: 'Despachado en sucursal de origen', date: 'Hoy 09:15 hs', done: true },
          { title: 'En viaje a centro de distribución de destino', date: 'En curso', done: true, current: true },
          { title: 'En reparto al domicilio', date: 'Pendiente', done: false },
          { title: 'Entregado', date: 'Pendiente', done: false }
        ]
      });
    }, 800);
  };

  const toggleFaq = (idx) => {
    setOpenFaq(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const currentPageObj = INFO_PAGES.find(p => p.id === activePage) || INFO_PAGES[0];

  return (
    <div className="bg-[#F8F7F5] min-h-screen py-6 sm:py-10 text-gray-900 text-left font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 font-medium overflow-x-auto pb-1">
          <button 
            type="button" 
            onClick={onNavigateHome || (() => { window.location.hash = '#/'; })}
            className="hover:text-[#3C6E71] cursor-pointer transition-colors"
          >
            Inicio
          </button>
          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-gray-400" />
          <span className="text-gray-400">Información</span>
          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-gray-400" />
          <span className="font-bold text-[#1C2321]">{currentPageObj.title}</span>
        </nav>

        {/* Main Grid: Sidebar + Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* ======================================================== */}
          {/* SIDEBAR NAVIGATION                                       */}
          {/* ======================================================== */}
          <aside className="lg:col-span-4 xl:col-span-3 bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-5">
            <div>
              <h2 className="font-display text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2.5">
                Centro de Información
              </h2>
            </div>

            {/* Grupo 1: Acerca de Nosotros */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#3C6E71] uppercase tracking-wider block px-2.5 py-1">
                Acerca de Nosotros
              </span>
              <div className="space-y-0.5">
                {INFO_PAGES.filter(p => p.group === 'Acerca de Nosotros').map(page => {
                  const Icon = page.icon;
                  const isActive = activePage === page.id;
                  return (
                    <button
                      key={page.id}
                      type="button"
                      onClick={() => {
                        setActivePage(page.id);
                        window.location.hash = `#/info/${page.id}`;
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                        isActive 
                          ? 'bg-[#1C2321] text-white shadow-xs' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#3C6E71]' : 'text-gray-400'}`} />
                      <span>{page.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grupo 2: Centro de Ayuda & Legales */}
            <div className="space-y-1 pt-2 border-t border-gray-100">
              <span className="text-[10px] font-bold text-[#3C6E71] uppercase tracking-wider block px-2.5 py-1">
                Centro de Ayuda & Legales
              </span>
              <div className="space-y-0.5">
                {INFO_PAGES.filter(p => p.group === 'Centro de Ayuda').map(page => {
                  const Icon = page.icon;
                  const isActive = activePage === page.id;
                  return (
                    <button
                      key={page.id}
                      type="button"
                      onClick={() => {
                        setActivePage(page.id);
                        window.location.hash = `#/info/${page.id}`;
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                        isActive 
                          ? 'bg-[#1C2321] text-white shadow-xs' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#3C6E71]' : 'text-gray-400'}`} />
                      <span>{page.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contact Card in Sidebar */}
            <div className="bg-[#1C2321] text-white rounded-xl p-4 space-y-2 mt-4">
              <span className="text-[10px] font-bold text-orange-200 uppercase tracking-widest block">
                ¿Necesitás Asistencia?
              </span>
              <p className="text-[11px] text-gray-300 leading-tight">
                Nuestro equipo de atención al cliente está disponible de Lunes a Viernes de 9 a 18 hs.
              </p>
              <a 
                href="https://wa.me/" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:underline pt-1"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Contactar por WhatsApp</span>
              </a>
            </div>

          </aside>

          {/* ======================================================== */}
          {/* MAIN PAGE CONTENT                                        */}
          {/* ======================================================== */}
          <main className="lg:col-span-8 xl:col-span-9 bg-white border border-gray-200/90 rounded-2xl p-6 sm:p-8 md:p-10 shadow-xs space-y-8">
            
            {/* 1. RECURSOS HUMANOS (RR HH) */}
            {activePage === 'rrhh' && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-[#3C6E71] uppercase tracking-widest">Trabajá con nosotros</span>
                  <h1 className="font-display text-2xl sm:text-3xl font-black text-gray-900 uppercase mt-1">
                    Recursos Humanos Holux
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                    En Holux buscamos personas apasionadas por la naturaleza, el montañismo y la excelencia en indumentaria técnica. Si te gustan los desafíos y querés sumarte a un equipo dinámico con presencia nacional, queremos conocerte.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-1">
                    <span className="text-xs font-bold text-gray-900 block">🏔️ Cultura Outdoor</span>
                    <p className="text-[11px] text-gray-500">Descuentos exclusivos en equipamiento y salidas de montaña periódicas.</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-1">
                    <span className="text-xs font-bold text-gray-900 block">🚀 Crecimiento Continuo</span>
                    <p className="text-[11px] text-gray-500">Capacitaciones técnicas de producto, liderazgo y desarrollo profesional.</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-1">
                    <span className="text-xs font-bold text-gray-900 block">🤝 Clima Colaborativo</span>
                    <p className="text-[11px] text-gray-500">Ambiente de trabajo inclusivo, federal y enfocado en objetivos.</p>
                  </div>
                </div>

                {/* Formulario de Postulación */}
                <div className="bg-[#F8F7F5] border border-gray-200 rounded-2xl p-5 sm:p-6 space-y-4">
                  <h3 className="font-display text-base font-bold text-gray-900 uppercase">
                    Envianos tu Currículum Vitae
                  </h3>
                  {contactSuccess ? (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-2.5 text-xs font-bold">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>¡CV recibido con éxito! Nuestro equipo de RR HH se pondrá en contacto si tu perfil se ajusta a una vacante.</span>
                    </div>
                  ) : (
                    <form onSubmit={(e) => { e.preventDefault(); setContactSuccess(true); }} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-gray-700 block mb-1">Nombre Completo *</label>
                          <input required type="text" placeholder="Ej: Juan Pérez" className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs outline-none focus:border-[#3C6E71]" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-700 block mb-1">Correo Electrónico *</label>
                          <input required type="email" placeholder="correo@ejemplo.com" className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs outline-none focus:border-[#3C6E71]" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-gray-700 block mb-1">Área de Interés</label>
                          <select className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs outline-none focus:border-[#3C6E71]">
                            <option>Ventas y Atención al Cliente en Locales</option>
                            <option>Diseño y Desarrollo de Producto</option>
                            <option>Logística y Depósito</option>
                            <option>Marketing y E-Commerce</option>
                            <option>Administración y Finanzas</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-700 block mb-1">Teléfono / WhatsApp *</label>
                          <input required type="tel" placeholder="+54 9 11 1234-5678" className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs outline-none focus:border-[#3C6E71]" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Mensaje o Enlace a tu LinkedIn / CV</label>
                        <textarea rows="3" placeholder="Contanos brevemente sobre tu experiencia y por qué te gustaría unirte a Holux..." className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs outline-none focus:border-[#3C6E71]"></textarea>
                      </div>
                      <button type="submit" className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md transition-all">
                        Enviar Postulación
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* 2. CATÁLOGO MAYORISTA */}
            {activePage === 'mayorista' && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-[#3C6E71] uppercase tracking-widest">Canal B2B & Distribuidores</span>
                  <h1 className="font-display text-2xl sm:text-3xl font-black text-gray-900 uppercase mt-1">
                    Ventas Mayoristas Holux
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                    Sumá los productos líderes de indumentaria y equipo de montaña a tu local comercial o casa de camping. Brindamos precios diferenciales por volumen, envíos consolidados y material publicitario oficial.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center space-y-2">
                    <Package className="w-6 h-6 text-[#3C6E71] mx-auto" />
                    <h4 className="text-xs font-bold text-gray-900 uppercase">Mínimo de Compra</h4>
                    <p className="text-[11px] text-gray-500">Mínimo accesible de 10 prendas o equipos surtidos por pedido.</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center space-y-2">
                    <Truck className="w-6 h-6 text-[#3C6E71] mx-auto" />
                    <h4 className="text-xs font-bold text-gray-900 uppercase">Envíos a Todo el País</h4>
                    <p className="text-[11px] text-gray-500">Despacho por expresos y transportes con tarifas corporativas bonificadas.</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center space-y-2">
                    <CreditCard className="w-6 h-6 text-[#3C6E71] mx-auto" />
                    <h4 className="text-xs font-bold text-gray-900 uppercase">Condiciones de Pago</h4>
                    <p className="text-[11px] text-gray-500">Transferencia bancaria con descuento comercial o cheques e-Check.</p>
                  </div>
                </div>

                <div className="bg-[#1C2321] text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="space-y-1 text-center sm:text-left">
                    <h3 className="font-display text-lg font-bold uppercase tracking-wide">
                      ¿Querés recibir la lista de precios mayorista?
                    </h3>
                    <p className="text-xs text-gray-300">
                      Contactate directamente con un ejecutivo de cuentas mayoristas de Holux.
                    </p>
                  </div>
                  <a
                    href="https://wa.me/?text=Hola%2C+quisiera+solicitar+el+cat%C3%A1logo+y+lista+de+precios+mayorista+de+Holux."
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-3 bg-[#3C6E71] hover:bg-[#3C6E71]/80 text-white rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 transition-all shadow-md"
                  >
                    Solicitar Lista Mayorista
                  </a>
                </div>
              </div>
            )}

            {/* 3. NUESTROS LOCALES */}
            {activePage === 'locales' && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-[#3C6E71] uppercase tracking-widest">Tiendas Oficiales</span>
                  <h1 className="font-display text-2xl sm:text-3xl font-black text-gray-900 uppercase mt-1">
                    Nuestros Locales y Sucursales
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                    Vení a conocer y probar todo el equipamiento técnico de montaña en nuestras tiendas oficiales. Asesoramiento personalizado por guías y montañistas homologados.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Local 1: Rosario */}
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="bg-[#3C6E71]/15 text-[#3C6E71] text-[10px] font-bold px-2 py-0.5 rounded uppercase">Casa Central & Flagship</span>
                      <span className="text-emerald-700 text-[10px] font-bold flex items-center gap-1">● Abierto hoy</span>
                    </div>
                    <h3 className="font-display text-base font-bold text-gray-900">Holux Flagship Store Rosario</h3>
                    <p className="text-xs text-gray-600 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[#3C6E71] shrink-0 mt-0.5" />
                      <span>Av. Pellegrini 1840, Rosario, Santa Fe (S2000BTT)</span>
                    </p>
                    <p className="text-xs text-gray-600 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#3C6E71] shrink-0" />
                      <span>Lunes a Sábados de 9:00 a 20:00 hs</span>
                    </p>
                    <p className="text-xs text-gray-600 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#3C6E71] shrink-0" />
                      <span>+54 341 482-9000</span>
                    </p>
                  </div>

                  {/* Local 2: Bariloche */}
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Mountain Hub Patagonia</span>
                      <span className="text-emerald-700 text-[10px] font-bold flex items-center gap-1">● Abierto hoy</span>
                    </div>
                    <h3 className="font-display text-base font-bold text-gray-900">Holux Bariloche Mountain Base</h3>
                    <p className="text-xs text-gray-600 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[#3C6E71] shrink-0 mt-0.5" />
                      <span>Mitre 450, San Carlos de Bariloche, Río Negro</span>
                    </p>
                    <p className="text-xs text-gray-600 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#3C6E71] shrink-0" />
                      <span>Todos los días de 9:30 a 21:00 hs</span>
                    </p>
                    <p className="text-xs text-gray-600 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#3C6E71] shrink-0" />
                      <span>+54 294 443-1288</span>
                    </p>
                  </div>

                  {/* Local 3: Buenos Aires */}
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="bg-gray-200 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Showroom CABA</span>
                      <span className="text-emerald-700 text-[10px] font-bold flex items-center gap-1">● Abierto hoy</span>
                    </div>
                    <h3 className="font-display text-base font-bold text-gray-900">Holux Palermo Outdoor Store</h3>
                    <p className="text-xs text-gray-600 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[#3C6E71] shrink-0 mt-0.5" />
                      <span>Honduras 4820, Palermo Soho, CABA</span>
                    </p>
                    <p className="text-xs text-gray-600 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#3C6E71] shrink-0" />
                      <span>Lunes a Sábados de 10:00 a 20:00 hs</span>
                    </p>
                    <p className="text-xs text-gray-600 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#3C6E71] shrink-0" />
                      <span>+54 11 4772-9100</span>
                    </p>
                  </div>

                  {/* Local 4: Mendoza */}
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="bg-gray-200 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Punto Aconcagua</span>
                      <span className="text-emerald-700 text-[10px] font-bold flex items-center gap-1">● Abierto hoy</span>
                    </div>
                    <h3 className="font-display text-base font-bold text-gray-900">Holux Mendoza Andes</h3>
                    <p className="text-xs text-gray-600 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[#3C6E71] shrink-0 mt-0.5" />
                      <span>Av. San Martín 1120, Mendoza Capital</span>
                    </p>
                    <p className="text-xs text-gray-600 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#3C6E71] shrink-0" />
                      <span>Lunes a Viernes de 9:00 a 19:30 hs</span>
                    </p>
                    <p className="text-xs text-gray-600 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#3C6E71] shrink-0" />
                      <span>+54 261 423-8877</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. EVENTOS Y CLÍNICAS */}
            {activePage === 'eventos' && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-[#3C6E71] uppercase tracking-widest">Comunidad & Montañismo</span>
                  <h1 className="font-display text-2xl sm:text-3xl font-black text-gray-900 uppercase mt-1">
                    Eventos, Travesías y Clínicas
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                    Participá en nuestras charlas técnicas, clínicas de seguridad en alta montaña y salidas de trekking guiadas por profesionales.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded uppercase">Próximo Evento</span>
                      <h3 className="font-display text-base font-bold text-gray-900">Clínica de Vestimenta por Capas y Aislamiento Térmico</h3>
                      <p className="text-xs text-gray-500">Sede Rosario • 15 de Septiembre • 18:30 hs • Cupos Limitados (Gratuito)</p>
                    </div>
                    <button onClick={() => alert('¡Inscripción registrada con éxito! Te esperamos.')} className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 cursor-pointer">
                      Inscribirme
                    </button>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">Travesía Guiada</span>
                      <h3 className="font-display text-base font-bold text-gray-900">Trekking Cerro Tronador & Refugio Otto Meiling</h3>
                      <p className="text-xs text-gray-500">Bariloche • 3 Días / 2 Noches • Nivel Intermedio • Guías AAGM</p>
                    </div>
                    <button onClick={() => alert('¡Información enviada por email!')} className="px-4 py-2 bg-[#3C6E71] hover:bg-[#3C6E71]/80 text-white rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 cursor-pointer">
                      Más Información
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 5. HOT SALE & CYBER MONDAY */}
            {(activePage === 'hotsale' || activePage === 'cybermonday') && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">Ofertas Exclusivas Oficiales</span>
                  <h1 className="font-display text-2xl sm:text-3xl font-black text-gray-900 uppercase mt-1">
                    {activePage === 'hotsale' ? 'Hot Sale Holux' : 'Cyber Monday Holux'}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                    Aprovechá hasta 40% OFF en indumentaria técnica, carpas y accesorios de montaña seleccionados. Hasta 6 cuotas fijas sin interés y 15% OFF pagando con transferencia bancaria.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-[#1C2321] to-[#2C3531] text-white rounded-2xl p-6 sm:p-8 space-y-4">
                  <span className="text-[10px] font-bold text-orange-300 uppercase tracking-widest block">
                    🔥 Beneficios de la temporada
                  </span>
                  <h2 className="text-xl sm:text-2xl font-display font-black uppercase">
                    Equipamiento de alta montaña con descuento directo
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                      <span className="text-lg font-black text-white block">HASTA 40% OFF</span>
                      <span className="text-[10px] text-gray-300">En productos seleccionados</span>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                      <span className="text-lg font-black text-white block">6 CUOTAS</span>
                      <span className="text-[10px] text-gray-300">Sin interés con tarjetas bancarias</span>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                      <span className="text-lg font-black text-white block">ENVÍO GRATIS</span>
                      <span className="text-[10px] text-gray-300">En compras superiores a $120.000</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button 
                      onClick={onNavigateCatalog || (() => { window.location.hash = '#/catalogo'; })}
                      className="px-6 py-3 bg-[#3C6E71] hover:bg-[#3C6E71]/80 text-white rounded-xl text-xs font-bold font-display uppercase tracking-wider cursor-pointer transition-all shadow-lg inline-flex items-center gap-2"
                    >
                      <span>Ver Ofertas en el Catálogo</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 6. SEGUIMIENTO DE ENVÍO */}
            {activePage === 'seguimiento' && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-[#3C6E71] uppercase tracking-widest">Logística & Envíos</span>
                  <h1 className="font-display text-2xl sm:text-3xl font-black text-gray-900 uppercase mt-1">
                    Seguimiento de tu Envío en Tiempo Real
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                    Ingresá el número de seguimiento (Tracking ID) que recibiste en el email de confirmación de despacho para conocer el estado exacto de tu paquete.
                  </p>
                </div>

                {/* Formulario de Tracking */}
                <form onSubmit={handleTrackingSearch} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={trackingCode}
                      onChange={(e) => setTrackingCode(e.target.value)}
                      placeholder="Ej: HLX-948201 / 34000012891901"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono-custom font-bold outline-none focus:border-[#3C6E71] focus:ring-2 focus:ring-[#3C6E71]/20 uppercase"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={trackingLoading}
                    className="px-6 py-3 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {trackingLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Consultando...</span>
                      </>
                    ) : (
                      <>
                        <span>Rastrear Paquete</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Resultado de Tracking */}
                {trackingResult && (
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-6 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-200 pb-4">
                      <div>
                        <span className="text-[10px] font-bold text-[#3C6E71] uppercase tracking-wider">Código de Envío</span>
                        <h3 className="font-mono-custom text-base font-black text-gray-900">{trackingResult.code}</h3>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Empresa</span>
                        <p className="text-xs font-bold text-gray-800">{trackingResult.courier}</p>
                      </div>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl flex items-center gap-3">
                      <Truck className="w-6 h-6 text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-700">Estado Actual</span>
                        <span className="text-xs font-bold">{trackingResult.status}</span>
                      </div>
                    </div>

                    {/* Timeline de Pasos */}
                    <div className="space-y-4 pt-2">
                      <h4 className="text-xs font-bold text-gray-900 uppercase">Historial del Envío</h4>
                      <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                        {trackingResult.steps.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-3.5 relative">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                              step.current 
                                ? 'bg-[#3C6E71] text-white ring-4 ring-[#3C6E71]/20' 
                                : step.done 
                                  ? 'bg-emerald-500 text-white' 
                                  : 'bg-gray-200 text-gray-400'
                            }`}>
                              {step.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                            </div>
                            <div className="text-left">
                              <p className={`text-xs font-bold ${step.current ? 'text-[#3C6E71]' : step.done ? 'text-gray-900' : 'text-gray-400'}`}>
                                {step.title}
                              </p>
                              <span className="text-[10px] text-gray-400 font-sans block">{step.date}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 7. PREGUNTAS FRECUENTES (FAQ) */}
            {activePage === 'faq' && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-[#3C6E71] uppercase tracking-widest">Ayuda & Soporte</span>
                  <h1 className="font-display text-2xl sm:text-3xl font-black text-gray-900 uppercase mt-1">
                    Preguntas Frecuentes (FAQ)
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                    Encontrá respuestas rápidas a las consultas más habituales sobre compras, envíos, métodos de pago y garantías.
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      q: '¿Cómo realizo una compra en la tienda online?',
                      a: 'Navegá por nuestro catálogo, seleccioná el producto, talle o color deseado y hacé clic en "COMPRAR" o "AGREGAR AL CARRITO". Luego ingresá al carrito, completá tus datos de entrega y elegí tu medio de pago favorito.'
                    },
                    {
                      q: '¿Cuáles son los medios de pago disponibles?',
                      a: 'Aceptamos tarjetas de crédito y débito (Visa, Mastercard, Cabal, American Express) con hasta 6 cuotas sin interés a través de Mercado Pago, y ofrecemos un 15% de descuento adicional pagando mediante transferencia bancaria directa.'
                    },
                    {
                      q: '¿Cuáles son los tiempos y costos de entrega?',
                      a: 'Realizamos envíos a todo el territorio argentino mediante Andreani y Correo Argentino. El tiempo estimado es de 2 a 5 días hábiles según la localidad. Las compras superiores al monto mínimo cuentan con Envío Gratis.'
                    },
                    {
                      q: '¿Cómo funciona el cambio o devolución de un producto?',
                      a: 'Tenés 30 días corridos desde recibido el producto para solicitar un cambio de talle o modelo sin costo de logística por defecto de fábrica. El producto debe conservar sus etiquetas originales y encontrarse sin uso.'
                    },
                    {
                      q: '¿Qué garantía tienen los productos Holux?',
                      a: 'Todos nuestros equipos e indumentaria técnica cuentan con Garantía Oficial Holux de 6 meses contra defectos de fabricación en costuras, cierres termosellados y membranas impermeables.'
                    },
                    {
                      q: '¿Cómo solicito el Botón de Arrepentimiento?',
                      a: 'De acuerdo al Art. 34 de la Ley 24.240, podés revocar la compra dentro de los 10 días corridos de haberla recibido haciendo clic en el "Botón de Arrepentimiento" ubicado en el pie de página de nuestro sitio.'
                    }
                  ].map((faq, idx) => {
                    const isOpen = !!openFaq[idx];
                    return (
                      <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden transition-all">
                        <button
                          type="button"
                          onClick={() => toggleFaq(idx)}
                          className="w-full p-4 text-left font-display font-bold text-xs sm:text-sm text-gray-900 flex items-center justify-between gap-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer select-none"
                        >
                          <span>{faq.q}</span>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-[#3C6E71] shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                        </button>
                        {isOpen && (
                          <div className="p-4 bg-white text-xs text-gray-600 leading-relaxed font-sans border-t border-gray-100">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 8. ENVÍOS Y MEDIOS DE PAGO */}
            {activePage === 'envios-pagos' && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-[#3C6E71] uppercase tracking-widest">Información de Compra</span>
                  <h1 className="font-display text-2xl sm:text-3xl font-black text-gray-900 uppercase mt-1">
                    Envíos y Medios de Pago
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                    Conocé todas las opciones de entrega y financiación disponibles para que disfrutes de tu equipamiento de montaña en cualquier punto del país.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-display text-sm font-bold text-gray-900 uppercase">Medios de Pago Aceptados</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-[#3C6E71]" />
                        <h4 className="text-xs font-bold text-gray-900 uppercase">Tarjetas & Cuotas</h4>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Hasta 6 cuotas fijas sin interés con tarjetas de crédito bancarias Visa, Mastercard, American Express y Cabal procesadas con seguridad cifrada por Mercado Pago.
                      </p>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-emerald-600" />
                        <h4 className="text-xs font-bold text-gray-900 uppercase">15% OFF por Transferencia</h4>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Descuento directo del 15% abonando por transferencia bancaria directa (CBU / CVU). Recibirás los datos bancarios al confirmar tu pedido.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <h3 className="font-display text-sm font-bold text-gray-900 uppercase">Modalidades de Envío</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Truck className="w-5 h-5 text-[#3C6E71]" />
                        <h4 className="text-xs font-bold text-gray-900 uppercase">Envío a Domicilio</h4>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Entrega directa en la puerta de tu casa a través de Andreani o Correo Argentino con código de seguimiento en tiempo real.
                      </p>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-[#3C6E71]" />
                        <h4 className="text-xs font-bold text-gray-900 uppercase">Retiro en Sucursal</h4>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Retiro gratuito en nuestras tiendas oficiales de Rosario, Bariloche, Buenos Aires y Mendoza, o en sucursales de correo de todo el país.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 9. COMPRAS CORPORATIVAS */}
            {activePage === 'corporativas' && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-[#3C6E71] uppercase tracking-widest">División Empresas & Institucional</span>
                  <h1 className="font-display text-2xl sm:text-3xl font-black text-gray-900 uppercase mt-1">
                    Compras Corporativas e Indumentaria Técnica
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                    Equipamos empresas de minería, petróleo, energía, brigadas de rescate, clubes de montaña y eventos corporativos con indumentaria técnica personalizada con logo institucional.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 text-center">
                    <ShieldCheck className="w-6 h-6 text-[#3C6E71] mx-auto" />
                    <h4 className="text-xs font-bold text-gray-900 uppercase">Homologación y Normas</h4>
                    <p className="text-[11px] text-gray-500">Materiales ignífugos, impermeables y con protección UV certificados.</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 text-center">
                    <Briefcase className="w-6 h-6 text-[#3C6E71] mx-auto" />
                    <h4 className="text-xs font-bold text-gray-900 uppercase">Bordado & Estampado</h4>
                    <p className="text-[11px] text-gray-500">Personalización con bordados termosellados de alta resistencia.</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 text-center">
                    <FileText className="w-6 h-6 text-[#3C6E71] mx-auto" />
                    <h4 className="text-xs font-bold text-gray-900 uppercase">Factura A & Crédito</h4>
                    <p className="text-[11px] text-gray-500">Emisión de Factura A con IVA discriminado y plazos de pago corporativos.</p>
                  </div>
                </div>

                <div className="bg-[#F8F7F5] border border-gray-200 rounded-2xl p-6 space-y-3">
                  <h3 className="font-display text-base font-bold text-gray-900 uppercase">
                    Solicitá cotización para tu empresa
                  </h3>
                  <p className="text-xs text-gray-600">
                    Escribinos a <strong className="text-gray-900">corporativo@holux.com.ar</strong> o contactá a un asesor institucional indicando la cantidad de unidades y modelos de interés.
                  </p>
                </div>
              </div>
            )}

            {/* 10. TÉRMINOS Y CONDICIONES (LEGALES) */}
            {activePage === 'terminos' && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-[#3C6E71] uppercase tracking-widest">Marco Legal & Normativo</span>
                  <h1 className="font-display text-2xl sm:text-3xl font-black text-gray-900 uppercase mt-1">
                    Términos y Condiciones de Uso
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                    Bienvenido a Holux Outdoor Equipment. Al acceder y realizar compras en nuestro sitio web, usted acepta los siguientes términos y condiciones de acuerdo con la legislación argentina vigente (Leyes N° 24.240, 25.326 y 27.743).
                  </p>
                </div>

                <div className="space-y-4 text-xs text-gray-600 leading-relaxed font-sans divide-y divide-gray-100">
                  <div className="pt-3 space-y-1.5">
                    <h3 className="font-display font-bold text-sm text-gray-900 uppercase">1. Titularidad del Sitio</h3>
                    <p>El sitio web es operado por HOLUX S.A., con CUIT 30-64270999-9, con domicilio legal en Av. Pellegrini 1840, Rosario, Provincia de Santa Fe, República Argentina.</p>
                  </div>

                  <div className="pt-3 space-y-1.5">
                    <h3 className="font-display font-bold text-sm text-gray-900 uppercase">2. Precios y Transparencia Fiscal (Ley N° 27.743)</h3>
                    <p>Todos los precios publicados en el sitio están expresados en Pesos Argentinos ($ ARS) e incluyen el Impuesto al Valor Agregado (IVA 21%). En cumplimiento de la Ley N° 27.743 de Transparencia Fiscal al Consumidor, se discrimina en cada producto el precio sin impuestos y el porcentaje impositivo correspondiente.</p>
                  </div>

                  <div className="pt-3 space-y-1.5">
                    <h3 className="font-display font-bold text-sm text-gray-900 uppercase">3. Derecho de Revocación / Arrepentimiento (Art. 34 Ley N° 24.240)</h3>
                    <p>El consumidor tiene derecho a revocar la aceptación del contrato de compra dentro del plazo de DIEZ (10) días corridos contados a partir de la fecha de entrega del producto o de la celebración del contrato, lo último que ocurra, mediante el "Botón de Arrepentimiento" disponible en el sitio web sin costo alguno.</p>
                  </div>

                  <div className="pt-3 space-y-1.5">
                    <h3 className="font-display font-bold text-sm text-gray-900 uppercase">4. Protección de Datos Personales (Ley N° 25.326)</h3>
                    <p>Los datos suministrados por los usuarios son tratados de manera confidencial y con las debidas medidas de seguridad técnica. El titular de los datos personales tiene la facultad de ejercer el derecho de acceso, rectificación y supresión de los mismos de forma gratuita enviando un correo a contacto@holux.com.ar.</p>
                  </div>

                  <div className="pt-3 space-y-1.5">
                    <h3 className="font-display font-bold text-sm text-gray-900 uppercase">5. Garantía Legal de Productos</h3>
                    <p>De conformidad con el Art. 11 de la Ley 24.240, todos los productos nuevos gozan de una garantía legal mínima de 6 meses contra cualquier vicio o defecto de fabricación.</p>
                  </div>
                </div>
              </div>
            )}

            {/* 11. CÓMO CANJEAR UN CUPÓN */}
            {activePage === 'cupones' && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-[#3C6E71] uppercase tracking-widest">Guía de Ahorro</span>
                  <h1 className="font-display text-2xl sm:text-3xl font-black text-gray-900 uppercase mt-1">
                    Cómo Canjear tu Cupón de Descuento
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                    Si contás con un código promocional o cupón de descuento Holux, seguí estos simples pasos para aplicarlo en tu compra.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-2">
                    <div className="w-7 h-7 bg-[#1C2321] text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <h4 className="text-xs font-bold text-gray-900 uppercase">Elegí tus productos</h4>
                    <p className="text-[11px] text-gray-500">Agregá al carrito los artículos de montaña que quieras comprar.</p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-2">
                    <div className="w-7 h-7 bg-[#1C2321] text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <h4 className="text-xs font-bold text-gray-900 uppercase">Ingresá al Checkout</h4>
                    <p className="text-[11px] text-gray-500">En la pantalla de pago encontrarás el campo "¿Tenés un cupón de descuento?".</p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-2">
                    <div className="w-7 h-7 bg-[#1C2321] text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <h4 className="text-xs font-bold text-gray-900 uppercase">Aplicá y Ahorrá</h4>
                    <p className="text-[11px] text-gray-500">Escribí tu código (ej: HOLUX10) y hacé clic en "APLICAR" para ver el descuento reflejado al instante.</p>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-center gap-3">
                  <Ticket className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span><strong>Tip de Ahorro:</strong> Los cupones son acumulables con las 6 cuotas sin interés en todo el sitio web.</span>
                </div>
              </div>
            )}

            {/* 12. PREVENCIÓN DE CIBERESTAFAS */}
            {activePage === 'ciberestafas' && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">Seguridad Informática & Compras Seguras</span>
                  <h1 className="font-display text-2xl sm:text-3xl font-black text-gray-900 uppercase mt-1">
                    Prevención de Ciberestafas y Phishing
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                    Tu seguridad es nuestra prioridad. Te compartimos las pautas clave para verificar que estás operando en los canales oficiales de Holux Outdoor Equipment.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-1.5">
                    <h4 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>1. Dominio Web Oficial Seguro</span>
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Verificá siempre que la URL en la barra del navegador comience con <strong>https://</strong> y el candado de seguridad activo. Nunca realices compras en sitios no oficiales o enlaces sospechosos recibidos por redes sociales.
                    </p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-1.5">
                    <h4 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>2. Correos Electrónicos Oficiales</span>
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Nuestras comunicaciones oficiales siempre provienen de direcciones terminadas en <strong>@holux.com.ar</strong>. Nunca te solicitaremos contraseñas, códigos de verificación de WhatsApp o datos bancarios por email.
                    </p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-1.5">
                    <h4 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>3. Pagos Únicamente en Plataforma Oficial</span>
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Todos los pagos se realizan dentro del checkout seguro de la web (Mercado Pago o CBU oficial de Holux S.A.). Nunca te pediremos que transfieras dinero a cuentas de personas particulares no autorizadas.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </main>

        </div>

      </div>
    </div>
  );
}
