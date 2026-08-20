import React from 'react';
import { X, MapPin } from 'lucide-react';
import { SmoothInput } from '../Common/SmoothInput';

export default function AddressModal({
  isOpen,
  onClose,
  editingAddress,
  addrLabel,
  setAddrLabel,
  addrStreet,
  setAddrStreet,
  addrCity,
  setAddrCity,
  addrProvince,
  setAddrProvince,
  addrPostalCode,
  setAddrPostalCode,
  addrIsDefault,
  setAddrIsDefault,
  onSubmit
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-gray-100 text-left relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="p-2 bg-emerald-50 text-[#3C6E71] rounded-lg">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-black text-lg text-gray-900 uppercase">
              {editingAddress ? 'Editar Dirección' : 'Nueva Dirección de Envío'}
            </h3>
            <p className="text-xs text-gray-500">Completa tus datos para entregas de Andreani</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs font-sans">
          <div>
            <label className="block text-gray-700 font-bold mb-1">Nombre / Identificador</label>
            <SmoothInput
              type="text"
              required
              value={addrLabel}
              onChange={(e) => setAddrLabel(e.target.value)}
              placeholder="Ej: Casa, Trabajo, Depósito"
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#3C6E71]"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Calle y Altura (y piso/depto)</label>
            <SmoothInput
              type="text"
              required
              value={addrStreet}
              onChange={(e) => setAddrStreet(e.target.value)}
              placeholder="Ej: Av. Corrientes 1234, 4B"
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#3C6E71]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-bold mb-1">Ciudad</label>
              <SmoothInput
                type="text"
                required
                value={addrCity}
                onChange={(e) => setAddrCity(e.target.value)}
                placeholder="Ej: Rosario"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#3C6E71]"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-1">Código Postal</label>
              <SmoothInput
                type="text"
                required
                value={addrPostalCode}
                onChange={(e) => setAddrPostalCode(e.target.value)}
                placeholder="Ej: 2000"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#3C6E71]"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Provincia</label>
            <select
              value={addrProvince}
              onChange={(e) => setAddrProvince(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#3C6E71] cursor-pointer"
            >
              <option value="Santa Fe">Santa Fe</option>
              <option value="Buenos Aires">Buenos Aires</option>
              <option value="CABA">Ciudad Autónoma de Buenos Aires</option>
              <option value="Córdoba">Córdoba</option>
              <option value="Mendoza">Mendoza</option>
              <option value="Río Negro">Río Negro</option>
              <option value="Neuquén">Neuquén</option>
              <option value="Chubut">Chubut</option>
              <option value="Santa Cruz">Santa Cruz</option>
              <option value="Tierra del Fuego">Tierra del Fuego</option>
              <option value="Salta">Salta</option>
              <option value="Jujuy">Jujuy</option>
              <option value="Tucumán">Tucumán</option>
              <option value="Entre Ríos">Entre Ríos</option>
            </select>
          </div>

          <label className="flex items-center gap-2 pt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={addrIsDefault}
              onChange={(e) => setAddrIsDefault(e.target.checked)}
              className="w-4 h-4 rounded text-[#3C6E71] focus:ring-[#3C6E71]"
            />
            <span className="text-gray-700 font-bold">Establecer como dirección predeterminada</span>
          </label>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 border border-gray-300 text-gray-700 font-display text-xs font-bold rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              className="w-1/2 py-2.5 bg-[#1C2321] hover:bg-[#3C6E71] text-white font-display text-xs font-bold rounded-lg shadow transition-colors cursor-pointer"
            >
              GUARDAR
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
