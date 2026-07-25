import React, { useState } from 'react';
import { Tag, Plus, Trash2, CheckCircle2, DollarSign, Percent, Truck } from 'lucide-react';

export default function CouponManager() {
  const [coupons, setCoupons] = useState([
    { id: 1, code: 'HOLUX10', type: 'percent', value: 10, minPurchase: 50000, maxUses: 100, usedCount: 14, active: true },
    { id: 2, code: 'BIENVENIDA5000', type: 'fixed', value: 5000, minPurchase: 40000, maxUses: 50, usedCount: 8, active: true },
    { id: 3, code: 'ENVIOGRATIS', type: 'free_shipping', value: 0, minPurchase: 80000, maxUses: 200, usedCount: 42, active: true },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [code, setCode] = useState('');
  const [type, setType] = useState('percent');
  const [value, setValue] = useState(15);
  const [minPurchase, setMinPurchase] = useState(60000);
  const [maxUses, setMaxUses] = useState(50);

  const handleCreateCoupon = (e) => {
    e.preventDefault();
    const newCoupon = {
      id: Date.now(),
      code: code.toUpperCase().trim(),
      type,
      value: parseFloat(value),
      minPurchase: parseFloat(minPurchase),
      maxUses: parseInt(maxUses),
      usedCount: 0,
      active: true
    };

    setCoupons([newCoupon, ...coupons]);
    setIsAdding(false);
    setCode('');
  };

  const handleDeleteCoupon = (id) => {
    setCoupons(coupons.filter(c => c.id !== id));
  };

  const toggleCouponStatus = (id) => {
    setCoupons(coupons.map(c => c.id === id ? { ...c, active: !c.active } : c));
  };

  return (
    <div className="space-y-6 text-left font-sans">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-display font-black text-gray-900 uppercase tracking-wide">
            CUPONES DE DESCUENTO Y PROMOCIONES
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Crea códigos de descuento por porcentaje, monto fijo o envío bonificado con límites de uso.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-[#3C6E71] text-white font-display text-xs font-bold tracking-wider rounded-lg shadow hover:bg-[#3C6E71]/90 flex items-center gap-2 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          CREAR CUPÓN
        </button>
      </div>

      {isAdding && (
        <div className="bg-gray-50 border border-gray-300 rounded-xl p-6 space-y-4">
          <h3 className="font-display text-sm font-bold tracking-wider text-gray-900 uppercase border-b border-gray-200 pb-3">
            NUEVO CUPÓN PROMOCIONAL
          </h3>

          <form onSubmit={handleCreateCoupon} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">CÓDIGO DEL CUPÓN</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: HOLUXPATAGONIA"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs font-mono-custom font-bold text-gray-900 focus:border-[#3C6E71] outline-none uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">TIPO DE DESCUENTO</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs font-bold text-gray-900 focus:border-[#3C6E71] outline-none"
                >
                  <option value="percent">Porcentaje (%)</option>
                  <option value="fixed">Monto Fijo ($)</option>
                  <option value="free_shipping">Envío Gratis</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {type !== 'free_shipping' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">VALOR DEL DESCUENTO</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs font-bold text-gray-900 focus:border-[#3C6E71] outline-none"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">COMPRA MÍNIMA ($)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={minPurchase}
                  onChange={(e) => setMinPurchase(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs font-bold text-gray-900 focus:border-[#3C6E71] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">LÍMITE DE USOS</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs font-bold text-gray-900 focus:border-[#3C6E71] outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#3C6E71] text-white font-display text-xs font-bold tracking-wider rounded shadow cursor-pointer"
              >
                GUARDAR CUPÓN
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded text-xs font-bold cursor-pointer"
              >
                CANCELAR
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {coupons.map((coupon) => (
          <div key={coupon.id} className={`p-4 border rounded-xl space-y-3 transition-all ${coupon.active ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-100 border-gray-300 opacity-60'}`}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#3C6E71]" />
                <span className="font-mono-custom text-sm font-black text-gray-900 tracking-wider">
                  {coupon.code}
                </span>
              </div>
              
              <button
                onClick={() => toggleCouponStatus(coupon.id)}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono-custom cursor-pointer border ${coupon.active ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-gray-200 text-gray-700 border-gray-300'}`}
              >
                {coupon.active ? 'ACTIVO' : 'INACTIVO'}
              </button>
            </div>

            <div className="text-xs space-y-1 text-gray-600">
              <p>
                <strong>Beneficio:</strong> {coupon.type === 'percent' ? `${coupon.value}% de Descuento` : coupon.type === 'fixed' ? `$${coupon.value.toLocaleString('es-AR')} OFF` : 'Envío Bonificado'}
              </p>
              <p>
                <strong>Compra Mínima:</strong> ARS ${coupon.minPurchase.toLocaleString('es-AR')}
              </p>
              <p className="font-mono-custom text-[11px] text-gray-400">
                Usos: {coupon.usedCount} / {coupon.maxUses}
              </p>
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-2">
              <button
                onClick={() => handleDeleteCoupon(coupon.id)}
                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
