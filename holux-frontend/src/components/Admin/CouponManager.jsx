import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, CheckCircle2, DollarSign, Percent, Truck, Gift, Star, Crown, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export default function CouponManager({ token }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [code, setCode] = useState('');
  const [type, setType] = useState('percentage');
  const [value, setValue] = useState(15);
  const [minPurchase, setMinPurchase] = useState(30000);
  const [allowedTier, setAllowedTier] = useState('all'); // 'all' | 'vip' | 'super_vip'
  const [maxUses, setMaxUses] = useState(100);
  const [origin, setOrigin] = useState('Promoción Admin 🏷️');
  const [description, setDescription] = useState('Descuento especial creado por administración.');
  const [daysValid, setDaysValid] = useState(14);

  const fetchCoupons = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/coupons`, {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('holux_auth_token')}`,
          'Accept': 'application/json',
        }
      });
      if (!res.ok) throw new Error('Error al cargar cupones del servidor.');
      const data = await res.json();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al conectar con la API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [token]);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/coupons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('holux_auth_token')}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          code: code.toUpperCase().trim(),
          type: type === 'percent' ? 'percentage' : type,
          value: parseFloat(value),
          min_spend: parseFloat(minPurchase),
          allowed_tier: allowedTier,
          origin: origin || 'Promoción Admin 🏷️',
          description: description || 'Descuento especial de tienda.',
          max_uses: parseInt(maxUses),
          daysValid: parseInt(daysValid)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al crear cupón.');

      setIsAdding(false);
      setCode('');
      setValue(15);
      fetchCoupons();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al crear cupón.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este cupón?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/coupons/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('holux_auth_token')}`,
          'Accept': 'application/json',
        }
      });
      if (res.ok) {
        setCoupons(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleCouponStatus = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/coupons/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('holux_auth_token')}`,
          'Accept': 'application/json',
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(prev => prev.map(c => c.id === id ? { ...c, active: data.coupon.active } : c));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 text-left font-sans animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-display font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#3C6E71]" />
            GESTIÓN DE CUPONES Y BENEFICIOS
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Creá promociones generales o cupones exclusivos para clientes VIP y Super VIP.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2.5 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white font-display text-xs font-bold tracking-wider rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          CREAR NUEVO CUPÓN
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* New Coupon Modal / Form */}
      {isAdding && (
        <div className="bg-white border border-gray-300 rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in zoom-in duration-150">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-display text-sm font-bold tracking-wider text-gray-900 uppercase flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#3C6E71]" />
              NUEVO CUPÓN PROMOCIONAL
            </h3>
            <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xs">
              ✕
            </button>
          </div>

          <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
            {/* Audience Tier Selector */}
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2">
              <label className="text-[11px] font-bold text-gray-800 uppercase tracking-wider block">
                🎯 Audiencia / Segmento Permitido:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => { setAllowedTier('all'); setOrigin('Promoción General 🏷️'); }}
                  className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    allowedTier === 'all'
                      ? 'bg-[#3C6E71] text-white border-[#3C6E71] shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  👥 Público General (Todos)
                </button>

                <button
                  type="button"
                  onClick={() => { setAllowedTier('vip'); setOrigin('Exclusivo VIP ⭐'); }}
                  className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    allowedTier === 'vip'
                      ? 'bg-amber-500 text-gray-900 border-amber-500 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  ⭐ Clientes VIP & Super VIP
                </button>

                <button
                  type="button"
                  onClick={() => { setAllowedTier('super_vip'); setOrigin('Exclusivo Super VIP 👑'); }}
                  className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    allowedTier === 'super_vip'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  👑 Exclusivo SUPER VIP
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">CÓDIGO DEL CUPÓN</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: HOLUXSUMMER"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono-custom font-bold text-gray-900 focus:border-[#3C6E71] outline-none uppercase tracking-wider"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">TIPO DE DESCUENTO</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-900 focus:border-[#3C6E71] outline-none cursor-pointer"
                >
                  <option value="percentage">Porcentaje (%)</option>
                  <option value="fixed">Monto Fijo ($)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">VALOR DEL DESCUENTO</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-900 focus:border-[#3C6E71] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">COMPRA MÍNIMA ($)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={minPurchase}
                  onChange={(e) => setMinPurchase(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-900 focus:border-[#3C6E71] outline-none"
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
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-900 focus:border-[#3C6E71] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">DÍAS DE VALIDEZ</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={daysValid}
                  onChange={(e) => setDaysValid(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-900 focus:border-[#3C6E71] outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">DESCRIPCIÓN / CONDICIONES</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Válido en compras mayores a $30.000 en indumentaria."
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:border-[#3C6E71] outline-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white font-display text-xs font-bold tracking-wider rounded-xl shadow cursor-pointer"
              >
                {isSubmitting ? 'GUARDANDO...' : 'GUARDAR Y PUBLICAR CUPÓN'}
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-xs font-bold cursor-pointer hover:bg-gray-50"
              >
                CANCELAR
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons Grid */}
      {loading ? (
        <div className="p-12 text-center text-gray-400">
          <div className="w-8 h-8 border-3 border-[#3C6E71] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs">Cargando cupones...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coupons.map((coupon) => {
            const tier = coupon.allowed_tier || 'all';
            return (
              <div
                key={coupon.id}
                className={`p-4 border rounded-2xl space-y-3 transition-all ${
                  coupon.active
                    ? tier === 'super_vip'
                      ? 'bg-purple-50/40 border-purple-200 shadow-sm'
                      : tier === 'vip'
                      ? 'bg-amber-50/30 border-amber-200 shadow-sm'
                      : 'bg-white border-gray-200 shadow-sm'
                    : 'bg-gray-100 border-gray-300 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Tag className={`w-4 h-4 ${tier === 'super_vip' ? 'text-purple-600' : tier === 'vip' ? 'text-amber-600' : 'text-[#3C6E71]'}`} />
                    <span className="font-mono-custom text-sm font-black text-gray-900 tracking-wider">
                      {coupon.code}
                    </span>
                    
                    {/* Tier badge */}
                    {tier === 'super_vip' && (
                      <span className="text-[9px] font-black bg-purple-600 text-white px-2 py-0.5 rounded-full font-mono-custom flex items-center gap-1 shadow-sm">
                        <Crown className="w-3 h-3" />
                        SUPER VIP 👑
                      </span>
                    )}
                    {tier === 'vip' && (
                      <span className="text-[9px] font-black bg-amber-500 text-gray-900 px-2 py-0.5 rounded-full font-mono-custom flex items-center gap-1 shadow-sm">
                        <Star className="w-3 h-3" />
                        VIP ⭐
                      </span>
                    )}
                    {tier === 'all' && (
                      <span className="text-[9px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-mono-custom">
                        TODOS 👥
                      </span>
                    )}
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
                    <strong>Beneficio:</strong> {coupon.type === 'percentage' || coupon.type === 'percent' ? `${coupon.value}% de Descuento` : `$${coupon.value.toLocaleString('es-AR')} OFF`}
                  </p>
                  <p>
                    <strong>Compra Mínima:</strong> ARS ${(coupon.min_spend || coupon.minPurchase || 0).toLocaleString('es-AR')}
                  </p>
                  <p className="text-[11px] text-gray-500">{coupon.description}</p>
                </div>

                <div className="flex justify-between items-center border-t border-gray-100 pt-2 text-[10px] text-gray-400 font-mono-custom">
                  <span>Usos: {coupon.used_count || 0} / {coupon.max_uses || 100}</span>
                  <button
                    onClick={() => handleDeleteCoupon(coupon.id)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ELIMINAR</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
