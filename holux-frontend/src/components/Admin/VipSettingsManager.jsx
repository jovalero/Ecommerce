import React, { useState, useEffect } from 'react';
import { Shield, Star, Crown, DollarSign, Truck, MessageSquare, Check, Save, Sparkles, AlertCircle } from 'lucide-react';

export default function VipSettingsManager({ token, apiBaseUrl }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Load VIP settings from backend API
  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/vip-settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });
      if (!res.ok) throw new Error('Error al cargar la configuración de beneficios.');
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [token]);

  const handleUpdate = (tier, field, val) => {
    setSettings(prev => ({
      ...prev,
      [tier]: {
        ...prev[tier],
        [field]: val
      }
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/vip-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al guardar la configuración.');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al guardar configuración.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-500 font-sans shadow-sm">
        <div className="w-8 h-8 border-3 border-[#3C6E71] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-bold font-display uppercase tracking-wider text-gray-700">Cargando configuración de beneficios...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-red-600 font-sans shadow-sm">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p className="text-xs font-bold">{error || 'No se pudo cargar la configuración.'}</p>
        <button onClick={fetchSettings} className="mt-3 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold cursor-pointer">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-[#1C2321] to-[#2A3430] rounded-2xl p-5 text-white shadow-md border border-[#3C6E71]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-amber-400/20 text-amber-300 rounded-xl border border-amber-400/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold tracking-wider uppercase flex items-center gap-2">
              <span>CONFIGURACIÓN DE PRIVILEGIOS & MEMBRESÍAS</span>
              <span className="bg-amber-400 text-gray-900 text-[10px] px-2 py-0.5 rounded font-black font-mono-custom">VIP & SUPER VIP</span>
            </h3>
            <p className="text-xs text-gray-300 mt-0.5 font-sans">
              Definí los descuentos automáticos, beneficios de envío y atención prioritaria para cada categoría de cliente.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white rounded-xl font-display text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex-shrink-0"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Guardando...</span>
            </>
          ) : savedSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>¡Guardado con éxito!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Guardar Configuración</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: 2 Cards (VIP & SUPER VIP) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ========================================================================= */}
        {/* CARD 1: NIVEL VIP ⭐ */}
        {/* ========================================================================= */}
        <div className="bg-white border border-amber-200/80 rounded-2xl p-6 shadow-sm space-y-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/50 rounded-full blur-2xl pointer-events-none"></div>

          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl border border-amber-300/60 font-bold">
                <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
              </div>
              <div>
                <h4 className="font-display text-sm font-bold text-gray-900 uppercase tracking-wider">
                  NIVEL VIP ⭐ (Preferencial)
                </h4>
                <p className="text-[11px] text-gray-500 font-sans">
                  Para clientes recurrentes y compradores frecuentes.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold rounded-lg font-mono-custom">
              {settings.vip.badge || '⭐ VIP'}
            </span>
          </div>

          {/* Fields */}
          <div className="space-y-4 text-xs font-sans">
            {/* Auto Discount */}
            <div className="space-y-1.5 bg-gray-50/60 p-3.5 rounded-xl border border-gray-200/60">
              <label className="font-bold text-gray-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  Descuento Automático en Carrito (%):
                </span>
                <span className="text-[11px] text-[#3C6E71] font-mono-custom font-bold">
                  {settings.vip.auto_discount_percent}% OFF
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.vip.auto_discount_percent}
                  onChange={(e) => handleUpdate('vip', 'auto_discount_percent', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono-custom font-bold outline-none focus:border-[#3C6E71]"
                  placeholder="0 (desactivado)"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold font-mono-custom text-xs">%</span>
              </div>
              <p className="text-[10px] text-gray-500">Se aplica directo a todos los productos del carrito sin pedir cupón.</p>
            </div>

            {/* Shipping Benefit */}
            <div className="space-y-2 bg-gray-50/60 p-3.5 rounded-xl border border-gray-200/60">
              <label className="font-bold text-gray-800 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                Beneficio en Costo de Envío:
              </label>
              <select
                value={settings.vip.shipping_benefit}
                onChange={(e) => handleUpdate('vip', 'shipping_benefit', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium outline-none focus:border-[#3C6E71] cursor-pointer"
              >
                <option value="standard">Tarifa Estándar (Sin bonificación de flete)</option>
                <option value="free_above_amount">Envío 100% GRATIS a partir de un monto mínimo</option>
                <option value="percent_discount">Descuento porcentual en el costo de envío (ej. 50% OFF)</option>
                <option value="always_free">Envío 100% GRATIS siempre (Sin mínimo)</option>
              </select>

              {settings.vip.shipping_benefit === 'free_above_amount' && (
                <div className="pt-2">
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Monto mínimo de compra para Envío Gratis ($):</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={settings.vip.shipping_free_min_amount}
                    onChange={(e) => handleUpdate('vip', 'shipping_free_min_amount', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono-custom font-bold outline-none focus:border-[#3C6E71]"
                    placeholder="Ej: 40000"
                  />
                </div>
              )}

              {settings.vip.shipping_benefit === 'percent_discount' && (
                <div className="pt-2">
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">% de Descuento en el flete de envío:</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.vip.shipping_discount_percent}
                    onChange={(e) => handleUpdate('vip', 'shipping_discount_percent', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono-custom font-bold outline-none focus:border-[#3C6E71]"
                    placeholder="Ej: 50"
                  />
                </div>
              )}
            </div>

            {/* Checkbox Privileges */}
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.vip.priority_dispatch}
                  onChange={(e) => handleUpdate('vip', 'priority_dispatch', e.target.checked)}
                  className="rounded text-[#3C6E71] focus:ring-[#3C6E71] w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-gray-800 font-medium">
                  ⚡ Despacho Prioritario en Almacén (Embalaje preferencial)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.vip.priority_support}
                  onChange={(e) => handleUpdate('vip', 'priority_support', e.target.checked)}
                  className="rounded text-[#3C6E71] focus:ring-[#3C6E71] w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-gray-800 font-medium">
                  🎫 Cola de Tickets de Soporte Prioritaria
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.vip.exclusive_coupons}
                  onChange={(e) => handleUpdate('vip', 'exclusive_coupons', e.target.checked)}
                  className="rounded text-[#3C6E71] focus:ring-[#3C6E71] w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-gray-800 font-medium">
                  🎟️ Habilitar canje de Cupones Exclusivos VIP
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CARD 2: NIVEL SUPER VIP 👑 */}
        {/* ========================================================================= */}
        <div className="bg-white border border-purple-300 rounded-2xl p-6 shadow-sm space-y-5 relative overflow-hidden ring-1 ring-purple-100">
          <div className="absolute top-0 right-0 w-36 h-36 bg-purple-100/60 rounded-full blur-2xl pointer-events-none"></div>

          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl border border-purple-300 font-bold">
                <Crown className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-display text-sm font-bold text-gray-900 uppercase tracking-wider">
                  NIVEL SUPER VIP 👑 (Élite)
                </h4>
                <p className="text-[11px] text-gray-500 font-sans">
                  Máxima categoría para clientes de alto volumen y embajadores.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-900 text-[10px] font-bold rounded-lg font-mono-custom">
              {settings.super_vip.badge || '👑 SUPER VIP'}
            </span>
          </div>

          {/* Fields */}
          <div className="space-y-4 text-xs font-sans">
            {/* Auto Discount */}
            <div className="space-y-1.5 bg-purple-50/40 p-3.5 rounded-xl border border-purple-200/50">
              <label className="font-bold text-gray-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  Descuento Automático en Carrito (%):
                </span>
                <span className="text-[11px] text-purple-700 font-mono-custom font-bold">
                  {settings.super_vip.auto_discount_percent}% OFF
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.super_vip.auto_discount_percent}
                  onChange={(e) => handleUpdate('super_vip', 'auto_discount_percent', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono-custom font-bold outline-none focus:border-purple-600"
                  placeholder="Ej: 10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold font-mono-custom text-xs">%</span>
              </div>
              <p className="text-[10px] text-gray-500">Descuento institucional aplicado automáticamente a todas sus compras.</p>
            </div>

            {/* Shipping Benefit */}
            <div className="space-y-2 bg-purple-50/40 p-3.5 rounded-xl border border-purple-200/50">
              <label className="font-bold text-gray-800 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                Beneficio en Costo de Envío:
              </label>
              <select
                value={settings.super_vip.shipping_benefit}
                onChange={(e) => handleUpdate('super_vip', 'shipping_benefit', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium outline-none focus:border-purple-600 cursor-pointer"
              >
                <option value="always_free">Envío 100% GRATIS SIEMPRE (Sin mínimo de compra)</option>
                <option value="free_above_amount">Envío 100% GRATIS a partir de un monto mínimo</option>
                <option value="percent_discount">Descuento porcentual en el envío</option>
                <option value="standard">Tarifa Estándar</option>
              </select>

              {settings.super_vip.shipping_benefit === 'free_above_amount' && (
                <div className="pt-2">
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Monto mínimo de compra ($):</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={settings.super_vip.shipping_free_min_amount}
                    onChange={(e) => handleUpdate('super_vip', 'shipping_free_min_amount', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono-custom font-bold outline-none focus:border-purple-600"
                  />
                </div>
              )}
            </div>

            {/* WhatsApp Direct Line */}
            <div className="space-y-2 bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200/60">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.super_vip.whatsapp_direct}
                  onChange={(e) => handleUpdate('super_vip', 'whatsapp_direct', e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-600 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  Botón de Contacto Directo WhatsApp VIP en su Perfil
                </span>
              </label>

              {settings.super_vip.whatsapp_direct && (
                <div className="pt-1.5">
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Número de WhatsApp de Atención VIP:</label>
                  <input
                    type="text"
                    value={settings.super_vip.whatsapp_number || ''}
                    onChange={(e) => handleUpdate('super_vip', 'whatsapp_number', e.target.value)}
                    placeholder="Ej: +5491112345678"
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono-custom font-bold outline-none focus:border-emerald-600"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    Aparecerá en el panel "Mi Cuenta" del cliente para iniciar chat directo con atención preferencial.
                  </p>
                </div>
              )}
            </div>

            {/* Checkbox Privileges */}
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.super_vip.priority_dispatch}
                  onChange={(e) => handleUpdate('super_vip', 'priority_dispatch', e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-600 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-gray-800 font-bold">
                  ⚡ DESPACHO EXPRESS MÁXIMA PRIORIDAD (Etiqueta destacada en Pedidos)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.super_vip.exclusive_coupons}
                  onChange={(e) => handleUpdate('super_vip', 'exclusive_coupons', e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-600 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-gray-800 font-medium">
                  👑 Habilitar Cupones Exclusivos VIP y Super VIP
                </span>
              </label>
            </div>
          </div>
        </div>

      </div>
    </form>
  );
}
