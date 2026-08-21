import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function Footer({ onOpenRefundModal }) {
  return (
    <footer className="bg-[#1C2321] text-[#F2EFE9] border-t border-[#3C6E71]/20 pt-10 pb-24 sm:py-14 select-none w-full text-left font-sans">
      <div className="w-full px-4 sm:px-8 lg:px-12">
        
        {/* Main Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-10 border-b border-[#3C6E71]/20">
          
          {/* Column 1: Newsletter Signup & Brand Info */}
          <div className="md:col-span-12 lg:col-span-5 space-y-4">
            <h2 className="font-display text-lg sm:text-2xl font-black text-white tracking-tight leading-tight uppercase">
              ¡RECIBÍ NUESTRAS OFERTAS <br className="hidden sm:inline" />
              Y NOVEDADES POR MAIL!
            </h2>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                alert('¡Gracias por suscribirte a las novedades de Holux!');
              }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 max-w-lg"
            >
              <input
                type="email"
                required
                placeholder="Correo Electrónico"
                className="px-3.5 py-2.5 bg-white/10 border border-[#3C6E71]/40 rounded-lg text-xs text-white placeholder-gray-400 outline-none focus:border-[#3C6E71] transition-all flex-1 shadow-sm"
              />
              <input
                type="text"
                placeholder="Cumpleaños (DD/MM)"
                className="px-3.5 py-2.5 bg-white/10 border border-[#3C6E71]/40 rounded-lg text-xs text-white placeholder-gray-400 outline-none focus:border-[#3C6E71] transition-all w-full sm:w-36 shadow-sm"
              />
              <button
                type="submit"
                className="py-2.5 px-4 bg-black hover:bg-neutral-800 text-white rounded-lg transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1 border border-white/20 text-xs font-bold font-display uppercase tracking-wider shrink-0"
                title="Suscribirse"
              >
                <span>SUSCRIBIRME</span>
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>

            <div className="pt-2 space-y-1">
              <span className="font-display text-sm sm:text-base font-bold tracking-wider text-white flex items-center gap-2 uppercase">
                <img src="/holuxlogo.png" alt="HOLUX" className="h-5 w-auto object-contain brightness-0 invert" />
                <span>Holux Outdoor Equipment</span>
              </span>
              <p className="text-[10px] text-gray-400 font-sans leading-tight">
                Holux S.A. Av. Pellegrini 1840, Rosario, Santa Fe. CUIT: 30-64270999-9
              </p>
            </div>
          </div>

          {/* Column 2 & 3: Links (2-Column Grid on Mobile/Tablet for clean layout) */}
          <div className="md:col-span-7 lg:col-span-4 grid grid-cols-2 gap-6 sm:gap-8">
            {/* ACERCA DE NOSOTROS */}
            <div className="space-y-3">
              <h3 className="font-display text-xs font-bold text-[#3C6E71] uppercase tracking-wider">
                ACERCA DE NOSOTROS
              </h3>
              <ul className="space-y-2 text-xs text-gray-300 font-medium">
                <li><a href="#/info/rrhh" className="hover:text-white transition-colors block">RR HH</a></li>
                <li><a href="#/info/mayorista" className="hover:text-white transition-colors block">Catálogo Mayorista</a></li>
                <li><a href="#/info/locales" className="hover:text-white transition-colors block">Nuestros Locales</a></li>
                <li><a href="#/info/eventos" className="hover:text-white transition-colors block">Eventos</a></li>
                <li><a href="#/info/hotsale" className="hover:text-white transition-colors block">Hot Sale</a></li>
                <li><a href="#/info/cybermonday" className="hover:text-white transition-colors block">Cyber Monday</a></li>
              </ul>
            </div>

            {/* CENTRO DE AYUDA */}
            <div className="space-y-3">
              <h3 className="font-display text-xs font-bold text-[#3C6E71] uppercase tracking-wider">
                CENTRO DE AYUDA
              </h3>
              <ul className="space-y-2 text-xs text-gray-300 font-medium">
                <li><a href="#/info/seguimiento" className="hover:text-white transition-colors block">Seguimiento de Envío</a></li>
                <li><a href="#/info/faq" className="hover:text-white transition-colors block">Preguntas Frecuentes</a></li>
                <li><a href="#/info/envios-pagos" className="hover:text-white transition-colors block">Envíos y Pagos</a></li>
                <li><a href="#/info/corporativas" className="hover:text-white transition-colors block">Corporativas</a></li>
                <li><a href="#/info/terminos" className="hover:text-white transition-colors block">Términos</a></li>
                <li><a href="#/info/cupones" className="hover:text-white transition-colors block">Canjear Cupón</a></li>
                <li><a href="#/info/ciberestafas" className="hover:text-white transition-colors block">Ciberestafas</a></li>
              </ul>
            </div>
          </div>

          {/* Column 4: Social Networks & Botón de Arrepentimiento */}
          <div className="md:col-span-5 lg:col-span-3 flex flex-col items-start lg:items-end justify-between space-y-4">
            <div className="space-y-2.5 w-full lg:w-auto">
              <h3 className="font-display text-xs font-bold text-[#3C6E71] uppercase tracking-wider text-left lg:text-right">
                SEGUINOS EN REDES
              </h3>
              {/* Social Icons Row */}
              <div className="flex flex-wrap items-center gap-2">
                {/* WhatsApp */}
                <a href="https://wa.me/" target="_blank" rel="noreferrer" title="WhatsApp" className="w-8 h-8 bg-white/10 hover:bg-[#25D366] text-white rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm border border-white/10 hover:scale-105">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                </a>
                {/* Instagram */}
                <a href="https://instagram.com/" target="_blank" rel="noreferrer" title="Instagram" className="w-8 h-8 bg-white/10 hover:bg-[#E4405F] text-white rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm border border-white/10 hover:scale-105">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                {/* Facebook */}
                <a href="https://facebook.com/" target="_blank" rel="noreferrer" title="Facebook" className="w-8 h-8 bg-white/10 hover:bg-[#1877F2] text-white rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm border border-white/10 hover:scale-105">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                {/* TikTok */}
                <a href="https://tiktok.com/" target="_blank" rel="noreferrer" title="TikTok" className="w-8 h-8 bg-white/10 hover:bg-[#000000] text-white rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm border border-white/10 hover:scale-105">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                </a>
                {/* YouTube */}
                <a href="https://youtube.com/" target="_blank" rel="noreferrer" title="YouTube" className="w-8 h-8 bg-white/10 hover:bg-[#FF0000] text-white rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm border border-white/10 hover:scale-105">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              </div>
            </div>

            {/* Botón de arrepentimiento */}
            <div className="w-full lg:w-auto pt-1">
              <button
                type="button"
                onClick={onOpenRefundModal}
                className="w-full sm:w-auto px-4 py-2.5 bg-white/10 border border-[#3C6E71]/40 hover:bg-[#3C6E71] rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer text-center"
              >
                Botón de arrepentimiento
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Legal & Certification Badges */}
        <div className="pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-[10px] text-gray-400 font-sans">
          <div className="space-y-1 max-w-2xl">
            <p className="font-bold text-gray-200 uppercase">
              © {new Date().getFullYear()} HOLUX S.A. TODOS LOS DERECHOS RESERVADOS.
            </p>
            <p className="leading-tight text-gray-400">
              El consumidor podrá iniciar un reclamo, completando el Formulario de denuncias Ventanilla Única Federal de Defensa del Consumidor ingresando desde <a href="https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario" target="_blank" rel="noreferrer" className="font-bold text-[#3C6E71] underline hover:text-white">AQUÍ</a>.
              Para más información, podrá consultar la Ley de Defensa del Consumidor ingrese <a href="http://servicios.infoleg.gob.ar/infolegInternet/anexos/0-4999/638/texact.htm" target="_blank" rel="noreferrer" className="font-bold text-[#3C6E71] underline hover:text-white">AQUÍ</a>.
            </p>
          </div>

          {/* Badges / Legal Seals */}
          <div className="flex flex-wrap items-center gap-2 font-mono-custom text-[10px] font-bold text-gray-300">
            <a 
              href="https://www.afip.gob.ar" 
              target="_blank" 
              rel="noreferrer"
              className="border border-[#3C6E71]/40 px-2.5 py-1 rounded bg-[#3C6E71]/10 text-[#3C6E71] hover:bg-[#3C6E71]/20 hover:text-white transition-colors flex items-center gap-1.5 shadow-2xs"
              title="Formulario 960/D.M. - Data Fiscal AFIP (ARCA)"
            >
              <span>DATA FISCAL AFIP (ARCA)</span>
            </a>
            <span className="border border-white/10 px-2.5 py-1 rounded bg-white/5 text-gray-400">
              LEY 24.240 DEFENSA DEL CONSUMIDOR
            </span>
            <span className="border border-emerald-500/30 px-2.5 py-1 rounded bg-emerald-950/20 text-emerald-400 flex items-center gap-1">
              <span>🔒 SITIO SEGURO SSL 256-BIT</span>
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
