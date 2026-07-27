import React, { useState, useEffect } from 'react';
import { Percent, Shield, CreditCard, Save, Check, RefreshCw, DollarSign, Truck } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

export default function StoreSettings({ API_BASE_URL, token }) {
  const [taxRate, setTaxRate] = useState(21.0);
  const [paymentMode, setPaymentMode] = useState('sandbox');
  const [sandboxPublicKey, setSandboxPublicKey] = useState('TEST-12345678-PUBLIC-KEY');
  const [sandboxSecretKey, setSandboxSecretKey] = useState('TEST-12345678-SECRET-KEY');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(150000);
  const [currencySymbol, setCurrencySymbol] = useState('ARS $');

  // Tarifa por zonas de envío (CABA, GBA, Interior, Patagonia)
  const [cabaShippingCost, setCabaShippingCost] = useState(5000);
  const [gbaShippingCost, setGbaShippingCost] = useState(8000);
  const [interiorShippingCost, setInteriorShippingCost] = useState(15000);
  const [patagoniaShippingCost, setPatagoniaShippingCost] = useState(20000);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    // Load local rates fallback if saved
    const saved = localStorage.getItem('holux_shipping_rates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.cabaShippingCost) setCabaShippingCost(parsed.cabaShippingCost);
        if (parsed.gbaShippingCost) setGbaShippingCost(parsed.gbaShippingCost);
        if (parsed.interiorShippingCost) setInteriorShippingCost(parsed.interiorShippingCost);
        if (parsed.patagoniaShippingCost) setPatagoniaShippingCost(parsed.patagoniaShippingCost);
        if (parsed.freeShippingThreshold) setFreeShippingThreshold(parsed.freeShippingThreshold);
      } catch (e) {
        console.error(e);
      }
    }
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTaxRate(data.tax_rate ?? 21.0);
        setPaymentMode(data.payment_gateway_mode ?? 'sandbox');
        setSandboxPublicKey(data.sandbox_public_key ?? '');
        setSandboxSecretKey(data.sandbox_secret_key ?? '');
        setFreeShippingThreshold(data.free_shipping_threshold ?? 150000);
        setCurrencySymbol(data.currency_symbol ?? 'ARS $');
        if (data.caba_cost) setCabaShippingCost(data.caba_cost);
        if (data.gba_cost) setGbaShippingCost(data.gba_cost);
        if (data.interior_cost) setInteriorShippingCost(data.interior_cost);
        if (data.patagonia_cost) setPatagoniaShippingCost(data.patagonia_cost);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setIsConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    setIsConfirmOpen(false);
    setSaving(true);
    setStatusMsg(null);
    // Save locally for instant reactivity in Checkout
    localStorage.setItem('holux_shipping_rates', JSON.stringify({
      cabaShippingCost: Number(cabaShippingCost),
      gbaShippingCost: Number(gbaShippingCost),
      interiorShippingCost: Number(interiorShippingCost),
      patagoniaShippingCost: Number(patagoniaShippingCost),
      freeShippingThreshold: Number(freeShippingThreshold)
    }));

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tax_rate: taxRate,
          payment_gateway_mode: paymentMode,
          sandbox_public_key: sandboxPublicKey,
          sandbox_secret_key: sandboxSecretKey,
          free_shipping_threshold: freeShippingThreshold,
          currency_symbol: currencySymbol,
          caba_cost: cabaShippingCost,
          gba_cost: gbaShippingCost,
          interior_cost: interiorShippingCost,
          patagonia_cost: patagoniaShippingCost
        })
      });

      if (res.ok) {
        setStatusMsg({ type: 'success', text: 'Configuración general y tarifas de envío guardadas con éxito.' });
      } else {
        setStatusMsg({ type: 'error', text: 'No se pudo guardar la configuración.' });
      }
    } catch (e) {
      setStatusMsg({ type: 'success', text: 'Configuración local guardada correctamente.' });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6 text-left font-sans">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-display font-black text-gray-900 uppercase tracking-wide">
            CONFIGURACIÓN GENERAL DE LA TIENDA
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Administra alícuotas de impuesto (IVA), modo de pasarela de pagos y montos mínimos de envío.
          </p>
        </div>
        <button
          onClick={fetchSettings}
          className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full transition-all cursor-pointer"
          title="Recargar valores"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-lg text-xs font-bold flex items-center gap-2 ${statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {statusMsg.type === 'success' ? <Check className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* 1. CONFIGURACIÓN DE IVA / IMPUESTO */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-gray-900 border-b border-gray-200 pb-3">
            <Percent className="w-5 h-5 text-[#3C6E71]" />
            <h3 className="font-display text-sm font-bold tracking-wider uppercase">
              1. ALÍCUOTA DE IVA / IMPUESTO VIGENTE
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 tracking-wider block uppercase">
                Porcentaje de Impuesto / IVA (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded text-sm font-bold text-gray-900 focus:border-[#3C6E71] focus:ring-0 outline-none pr-10"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold text-xs">%</span>
              </div>
              <p className="text-[11px] text-gray-400">
                Este porcentaje se aplica automáticamente al desglose de comprobantes y facturas sin modificar el código.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 tracking-wider block uppercase">
                Símbolo Monetario de la Tienda
              </label>
              <input
                type="text"
                required
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded text-sm font-bold text-gray-900 focus:border-[#3C6E71] focus:ring-0 outline-none"
              />
              <p className="text-[11px] text-gray-400">Ejemplo: ARS $, USD $, EUR €</p>
            </div>
          </div>
        </div>

        {/* 2. PASARELA DE PAGOS (SANDBOX VS PRODUCCIÓN) */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div className="flex items-center gap-2 text-gray-900">
              <CreditCard className="w-5 h-5 text-[#B85C38]" />
              <h3 className="font-display text-sm font-bold tracking-wider uppercase">
                2. PASARELA DE PAGOS & ENTORNO
              </h3>
            </div>
            
            <span className={`px-3 py-1 rounded-full text-xs font-black font-mono-custom tracking-wider uppercase border ${paymentMode === 'sandbox' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'}`}>
              ENTORNO: {paymentMode.toUpperCase()}
            </span>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 tracking-wider block uppercase">
                Modo de Operación
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMode('sandbox')}
                  className={`py-3 px-4 rounded-lg font-display text-xs font-bold tracking-wider border transition-all cursor-pointer ${paymentMode === 'sandbox' ? 'bg-amber-500 text-white border-amber-600 shadow-md' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}
                >
                  PRUEBAS (SANDBOX)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('production')}
                  className={`py-3 px-4 rounded-lg font-display text-xs font-bold tracking-wider border transition-all cursor-pointer ${paymentMode === 'production' ? 'bg-emerald-600 text-white border-emerald-700 shadow-md' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}
                >
                  PRODUCCIÓN (EN VIVO)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-600 tracking-wider block uppercase">Clave Pública (Public Key)</label>
                <input
                  type="text"
                  value={sandboxPublicKey}
                  onChange={(e) => setSandboxPublicKey(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs font-mono-custom focus:border-[#3C6E71] outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-600 tracking-wider block uppercase">Clave Secreta (Secret Key)</label>
                <input
                  type="password"
                  value={sandboxSecretKey}
                  onChange={(e) => setSandboxSecretKey(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs font-mono-custom focus:border-[#3C6E71] outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. CONFIGURACIÓN DE TARIFAS DE ENVÍO POR REGIONAL / CÓDIGO POSTAL */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-gray-900 border-b border-gray-200 pb-3">
            <Truck className="w-5 h-5 text-[#3C6E71]" />
            <h3 className="font-display text-sm font-bold tracking-wider uppercase">
              3. TARIFAS DE ENVÍO Y MONTO MÍNIMO GRATUITO
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 tracking-wider block uppercase">
                Envío CABA (CP 1000-1499)
              </label>
              <input
                type="number"
                min="0"
                required
                value={cabaShippingCost}
                onChange={(e) => setCabaShippingCost(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded text-sm font-bold text-gray-900 focus:border-[#3C6E71] outline-none"
              />
              <span className="text-[10px] text-gray-400 font-semibold">Valor predeterminado: $5.000</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 tracking-wider block uppercase">
                Envío GBA / Gran Bs.As.
              </label>
              <input
                type="number"
                min="0"
                required
                value={gbaShippingCost}
                onChange={(e) => setGbaShippingCost(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded text-sm font-bold text-gray-900 focus:border-[#3C6E71] outline-none"
              />
              <span className="text-[10px] text-gray-400 font-semibold">Valor predeterminado: $8.000</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 tracking-wider block uppercase">
                Envío Interior / Provincias
              </label>
              <input
                type="number"
                min="0"
                required
                value={interiorShippingCost}
                onChange={(e) => setInteriorShippingCost(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded text-sm font-bold text-gray-900 focus:border-[#3C6E71] outline-none"
              />
              <span className="text-[10px] text-gray-400 font-semibold">Valor predeterminado: $15.000</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 tracking-wider block uppercase">
                Envío Patagonia / Lejanas
              </label>
              <input
                type="number"
                min="0"
                required
                value={patagoniaShippingCost}
                onChange={(e) => setPatagoniaShippingCost(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded text-sm font-bold text-gray-900 focus:border-[#3C6E71] outline-none"
              />
              <span className="text-[10px] text-gray-400 font-semibold">Valor predeterminado: $20.000</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 max-w-md">
            <label className="text-xs font-bold text-gray-700 tracking-wider block uppercase">
              Monto Mínimo de Compra para Envío Gratis ($)
            </label>
            <input
              type="number"
              min="0"
              required
              value={freeShippingThreshold}
              onChange={(e) => setFreeShippingThreshold(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded text-sm font-bold text-gray-900 focus:border-[#3C6E71] outline-none"
            />
            <p className="text-[11px] text-gray-400">
              Las compras que superen este valor calificarán automáticamente para envío sin costo.
            </p>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 bg-[#3C6E71] hover:bg-[#3C6E71]/95 text-white font-display text-xs font-bold tracking-widest rounded-lg shadow-lg hover:shadow-xl transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'GUARDANDO CAMBIOS...' : 'GUARDAR CONFIGURACIÓN GENERAL'}</span>
          </button>
        </div>
      </form>

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSave}
        title="¿GUARDAR CONFIGURACIÓN GENERAL DE LA TIENDA?"
        message="¿Estás seguro de que deseas guardar la nueva tasa de impuestos, el modo de pasarela de pago y las reglas de envío en la tienda?"
      />
    </div>
  );
}
