import React from 'react';
import { X, Lock, Shield } from 'lucide-react';
import { SmoothInput } from '../Common/SmoothInput';

export default function AuthModal({
  isOpen,
  onClose,
  authMode,
  setAuthMode,
  authError,
  authFullName,
  setAuthFullName,
  authPhone,
  setAuthPhone,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  onSubmit,
  onGoogleLogin
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-gray-100 text-left relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1">
          <div className="inline-flex p-3 bg-gray-100 rounded-full text-[#3C6E71] mb-2">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-display font-black text-xl text-gray-900 uppercase">
            {authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h3>
          <p className="text-xs text-gray-500 font-sans">
            {authMode === 'login' ? 'Accede a tus pedidos y beneficios exclusivos' : 'Súmate a la comunidad de montaña Holux'}
          </p>
        </div>

        {authError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
            {authError}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4 text-xs font-sans">
          {authMode === 'register' && (
            <>
              <div>
                <label className="block text-gray-700 font-bold mb-1">Nombre Completo</label>
                <SmoothInput
                  type="text"
                  required
                  value={authFullName}
                  onChange={(e) => setAuthFullName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#3C6E71]"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-1">Teléfono</label>
                <SmoothInput
                  type="tel"
                  value={authPhone}
                  onChange={(e) => setAuthPhone(e.target.value)}
                  placeholder="Ej: 341 555-1234"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#3C6E71]"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-gray-700 font-bold mb-1">Correo Electrónico</label>
            <SmoothInput
              type="email"
              required
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#3C6E71]"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Contraseña</label>
            <SmoothInput
              type="password"
              required
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#3C6E71]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#1C2321] hover:bg-[#3C6E71] text-white font-display text-xs font-bold tracking-wider rounded-lg shadow transition-all cursor-pointer"
          >
            {authMode === 'login' ? 'INGRESAR' : 'REGISTRARME'}
          </button>
        </form>

        <div className="pt-2 border-t border-gray-100 text-center space-y-3">

          <p className="text-xs text-gray-500">
            {authMode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button
              type="button"
              onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); }}
              className="text-[#3C6E71] font-bold hover:underline cursor-pointer"
            >
              {authMode === 'login' ? 'Registrate aquí' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
