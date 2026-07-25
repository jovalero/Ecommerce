import React, { useState } from 'react';
import { X, User, Mail, Phone, Shield, Star, Save } from 'lucide-react';

export default function CustomerEditModal({ customer, onClose, onSave }) {
  const [fullName, setFullName] = useState(customer?.full_name || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [isVip, setIsVip] = useState(customer?.is_vip || false);
  const [status, setStatus] = useState(customer?.status || 'ACTIVO');
  const [notes, setNotes] = useState(customer?.notes || 'Cliente frecuente de indumentaria de montaña.');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...customer,
      full_name: fullName,
      email,
      phone,
      is_vip: isVip,
      status,
      notes
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans text-gray-900">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 z-10 animate-in fade-in zoom-in duration-200 text-xs">
        
        {/* Header */}
        <div className="bg-[#1C2321] text-white px-6 py-4 flex items-center justify-between border-b border-[#3C6E71]/30">
          <div className="flex items-center gap-3">
            <span className="bg-[#3C6E71] p-2 rounded-lg text-white font-bold">
              <User className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-display text-sm font-bold uppercase tracking-wider">
                EDITAR PERFIL DE CLIENTE: {customer?.full_name}
              </h3>
              <p className="text-[10px] text-gray-400">Modifica datos personales, estado VIP y notas internas</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded cursor-pointer text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-gray-50">
          
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Nombre Completo</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:border-[#3C6E71] outline-none font-bold text-gray-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Correo Electrónico</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:border-[#3C6E71] outline-none font-mono-custom"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Teléfono de Contacto</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:border-[#3C6E71] outline-none font-mono-custom"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Condición VIP</label>
              <button
                type="button"
                onClick={() => setIsVip(!isVip)}
                className={`w-full py-2 px-3 rounded-lg font-display font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${isVip ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-sm' : 'bg-gray-100 text-gray-600 border-gray-300'}`}
              >
                <Star className={`w-4 h-4 ${isVip ? 'fill-amber-500 text-amber-500' : ''}`} />
                {isVip ? 'CLIENTE VIP ACTIVADO' : 'ES CLIENTE ESTÁNDAR'}
              </button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Estado de la Cuenta</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:border-[#3C6E71] outline-none font-bold"
              >
                <option value="ACTIVO">ACTIVO (Permitido)</option>
                <option value="SUSPENDIDO">SUSPENDIDO (Bloqueado)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Notas Internas del Administrador</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles de atención preferencial, historial de reclamos, etc."
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:border-[#3C6E71] outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-display font-bold hover:bg-gray-100 cursor-pointer"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#3C6E71] text-white rounded-lg font-display font-bold hover:bg-[#3C6E71]/90 shadow flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              GUARDAR CAMBIOS
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
