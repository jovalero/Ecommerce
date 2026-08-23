import React, { useState, useEffect } from 'react';
import {
  Truck,
  MapPin,
  Check,
  RefreshCw,
  AlertTriangle,
  Gift,
  DollarSign,
  Save,
  Clock,
  Building2,
  Search,
  ShieldCheck,
  Sliders,
  Sparkles
} from 'lucide-react';

export default function ShippingManager({ API_BASE_URL, token }) {
  // General & Nationwide Shipping Flags
  const [allFree, setAllFree] = useState(false);
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(true);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(150000);

  // Zone 1: CABA
  const [cabaCost, setCabaCost] = useState(5000);
  const [cabaFree, setCabaFree] = useState(false);
  const [cabaEnabled, setCabaEnabled] = useState(true);
  const [cabaCpMin, setCabaCpMin] = useState(1000);
  const [cabaCpMax, setCabaCpMax] = useState(1499);

  // Zone 2: GBA
  const [gbaCost, setGbaCost] = useState(8000);
  const [gbaFree, setGbaFree] = useState(false);
  const [gbaEnabled, setGbaEnabled] = useState(true);
  const [gbaCpMin, setGbaCpMin] = useState(1500);
  const [gbaCpMax, setGbaCpMax] = useState(1999);

  // Zone 3: Interior
  const [interiorCost, setInteriorCost] = useState(15000);
  const [interiorFree, setInteriorFree] = useState(false);
  const [interiorEnabled, setInteriorEnabled] = useState(true);
  const [interiorCpMin, setInteriorCpMin] = useState(2000);
  const [interiorCpMax, setInteriorCpMax] = useState(7999);

  // Zone 4: Patagonia
  const [patagoniaCost, setPatagoniaCost] = useState(20000);
  const [patagoniaFree, setPatagoniaFree] = useState(false);
  const [patagoniaEnabled, setPatagoniaEnabled] = useState(true);
  const [patagoniaCpMin, setPatagoniaCpMin] = useState(8000);
  const [patagoniaCpMax, setPatagoniaCpMax] = useState(9999);

  // Store Pickup (Retiro en Local)
  const [pickupEnabled, setPickupEnabled] = useState(true);
  const [pickupAddress, setPickupAddress] = useState('Av. Corrientes 1234, CABA');
  const [pickupSchedule, setPickupSchedule] = useState('Lunes a Viernes de 10:00 a 18:00 hs');

  // Simulator State
  const [testCp, setTestCp] = useState('');
  const [testAmount, setTestAmount] = useState(50000);

  // UI Status
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Fetch settings from API or local fallback
  const fetchShippingSettings = async () => {
    setLoading(true);
    setErrorMsg(null);

    // Try loading local first
    try {
      const local = localStorage.getItem('holux_shipping_rates');
      if (local) {
        const s = JSON.parse(local);
        if (s.all_free !== undefined) setAllFree(!!s.all_free);
        if (s.free_shipping_enabled !== undefined) setFreeShippingEnabled(!!s.free_shipping_enabled);
        if (s.free_shipping_threshold !== undefined) setFreeShippingThreshold(Number(s.free_shipping_threshold));

        if (s.caba_cost !== undefined) setCabaCost(Number(s.caba_cost));
        if (s.caba_free !== undefined) setCabaFree(!!s.caba_free);
        if (s.caba_enabled !== undefined) setCabaEnabled(s.caba_enabled !== false);
        if (s.caba_cp_min !== undefined) setCabaCpMin(Number(s.caba_cp_min));
        if (s.caba_cp_max !== undefined) setCabaCpMax(Number(s.caba_cp_max));

        if (s.gba_cost !== undefined) setGbaCost(Number(s.gba_cost));
        if (s.gba_free !== undefined) setGbaFree(!!s.gba_free);
        if (s.gba_enabled !== undefined) setGbaEnabled(s.gba_enabled !== false);
        if (s.gba_cp_min !== undefined) setGbaCpMin(Number(s.gba_cp_min));
        if (s.gba_cp_max !== undefined) setGbaCpMax(Number(s.gba_cp_max));

        if (s.interior_cost !== undefined) setInteriorCost(Number(s.interior_cost));
        if (s.interior_free !== undefined) setInteriorFree(!!s.interior_free);
        if (s.interior_enabled !== undefined) setInteriorEnabled(s.interior_enabled !== false);
        if (s.interior_cp_min !== undefined) setInteriorCpMin(Number(s.interior_cp_min));
        if (s.interior_cp_max !== undefined) setInteriorCpMax(Number(s.interior_cp_max));

        if (s.patagonia_cost !== undefined) setPatagoniaCost(Number(s.patagonia_cost));
        if (s.patagonia_free !== undefined) setPatagoniaFree(!!s.patagonia_free);
        if (s.patagonia_enabled !== undefined) setPatagoniaEnabled(s.patagonia_enabled !== false);
        if (s.patagonia_cp_min !== undefined) setPatagoniaCpMin(Number(s.patagonia_cp_min));
        if (s.patagonia_cp_max !== undefined) setPatagoniaCpMax(Number(s.patagonia_cp_max));

        if (s.pickup_enabled !== undefined) setPickupEnabled(s.pickup_enabled !== false);
        if (s.pickup_address) setPickupAddress(s.pickup_address);
        if (s.pickup_schedule) setPickupSchedule(s.pickup_schedule);
      }
    } catch (e) {}

    // Fetch from Backend API
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
          headers: {
            'Authorization': `Bearer ${token || localStorage.getItem('holux_auth_token')}`,
            'Accept': 'application/json'
          }
        });
        if (res.ok) {
          const data = await res.json();
          const s = data.settings || {};

          if (s.all_free !== undefined) setAllFree(!!s.all_free);
          if (s.free_shipping_enabled !== undefined) setFreeShippingEnabled(!!s.free_shipping_enabled);
          if (s.free_shipping_threshold !== undefined) setFreeShippingThreshold(Number(s.free_shipping_threshold));

          if (s.caba_cost !== undefined) setCabaCost(Number(s.caba_cost));
          if (s.caba_free !== undefined) setCabaFree(!!s.caba_free);
          if (s.caba_enabled !== undefined) setCabaEnabled(s.caba_enabled !== false);
          if (s.caba_cp_min !== undefined) setCabaCpMin(Number(s.caba_cp_min));
          if (s.caba_cp_max !== undefined) setCabaCpMax(Number(s.caba_cp_max));

          if (s.gba_cost !== undefined) setGbaCost(Number(s.gba_cost));
          if (s.gba_free !== undefined) setGbaFree(!!s.gba_free);
          if (s.gba_enabled !== undefined) setGbaEnabled(s.gba_enabled !== false);
          if (s.gba_cp_min !== undefined) setGbaCpMin(Number(s.gba_cp_min));
          if (s.gba_cp_max !== undefined) setGbaCpMax(Number(s.gba_cp_max));

          if (s.interior_cost !== undefined) setInteriorCost(Number(s.interior_cost));
          if (s.interior_free !== undefined) setInteriorFree(!!s.interior_free);
          if (s.interior_enabled !== undefined) setInteriorEnabled(s.interior_enabled !== false);
          if (s.interior_cp_min !== undefined) setInteriorCpMin(Number(s.interior_cp_min));
          if (s.interior_cp_max !== undefined) setInteriorCpMax(Number(s.interior_cp_max));

          if (s.patagonia_cost !== undefined) setPatagoniaCost(Number(s.patagonia_cost));
          if (s.patagonia_free !== undefined) setPatagoniaFree(!!s.patagonia_free);
          if (s.patagonia_enabled !== undefined) setPatagoniaEnabled(s.patagonia_enabled !== false);
          if (s.patagonia_cp_min !== undefined) setPatagoniaCpMin(Number(s.patagonia_cp_min));
          if (s.patagonia_cp_max !== undefined) setPatagoniaCpMax(Number(s.patagonia_cp_max));

          if (s.pickup_enabled !== undefined) setPickupEnabled(s.pickup_enabled !== false);
          if (s.pickup_address) setPickupAddress(s.pickup_address);
          if (s.pickup_schedule) setPickupSchedule(s.pickup_schedule);
        }
      } catch (err) {
        console.warn('Could not load shipping from API:', err);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchShippingSettings();
  }, [token]);

  // Save Shipping Settings
  const handleSaveShipping = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validation
    if (
      parseInt(cabaCpMin) > parseInt(cabaCpMax) ||
      parseInt(gbaCpMin) > parseInt(gbaCpMax) ||
      parseInt(interiorCpMin) > parseInt(interiorCpMax) ||
      parseInt(patagoniaCpMin) > parseInt(patagoniaCpMax)
    ) {
      setErrorMsg('El Código Postal Mínimo debe ser menor o igual al Código Postal Máximo en cada zona.');
      return;
    }

    setSaving(true);

    const payload = {
      all_free: allFree,
      free_shipping_enabled: freeShippingEnabled,
      free_shipping_threshold: parseFloat(freeShippingThreshold) || 0,

      caba_cost: parseFloat(cabaCost) || 0,
      caba_free: cabaFree,
      caba_enabled: cabaEnabled,
      caba_cp_min: parseInt(cabaCpMin) || 1000,
      caba_cp_max: parseInt(cabaCpMax) || 1499,

      gba_cost: parseFloat(gbaCost) || 0,
      gba_free: gbaFree,
      gba_enabled: gbaEnabled,
      gba_cp_min: parseInt(gbaCpMin) || 1500,
      gba_cp_max: parseInt(gbaCpMax) || 1999,

      interior_cost: parseFloat(interiorCost) || 0,
      interior_free: interiorFree,
      interior_enabled: interiorEnabled,
      interior_cp_min: parseInt(interiorCpMin) || 2000,
      interior_cp_max: parseInt(interiorCpMax) || 7999,

      patagonia_cost: parseFloat(patagoniaCost) || 0,
      patagonia_free: patagoniaFree,
      patagonia_enabled: patagoniaEnabled,
      patagonia_cp_min: parseInt(patagoniaCpMin) || 8000,
      patagonia_cp_max: parseInt(patagoniaCpMax) || 9999,

      pickup_enabled: pickupEnabled,
      pickup_address: pickupAddress,
      pickup_schedule: pickupSchedule
    };

    // Save locally
    try {
      localStorage.setItem('holux_shipping_rates', JSON.stringify(payload));
      window.dispatchEvent(new Event('holux_shipping_rates_updated'));
    } catch (e) {}

    // Save to API
    try {
      if (API_BASE_URL) {
        const res = await fetch(`${API_BASE_URL}/api/admin/settings/shipping`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token || localStorage.getItem('holux_auth_token')}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          // Fallback to unified update
          await fetch(`${API_BASE_URL}/api/admin/settings`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token || localStorage.getItem('holux_auth_token')}`,
              'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
          });
        }
      }

      setSuccessMsg('¡Tarifas y configuración de envíos guardadas con éxito!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.warn(err);
      setSuccessMsg('¡Configuración de envíos actualizada en el checkout localmente!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  // Live Simulator Calculation
  const simulateShipping = () => {
    if (allFree) {
      return { cost: 0, zone: 'Promoción Nacional', label: '¡ENVÍO GRATIS A TODO EL PAÍS!' };
    }
    if (freeShippingEnabled && testAmount >= freeShippingThreshold) {
      return { cost: 0, zone: 'Monto Superado', label: `¡ENVÍO GRATIS! (Superó $${freeShippingThreshold.toLocaleString('es-AR')})` };
    }
    const cp = parseInt(testCp.trim(), 10);
    if (isNaN(cp)) {
      return { cost: cabaFree ? 0 : cabaCost, zone: 'CABA (Por defecto)', label: 'Ingresá un CP para calcular' };
    }

    if (cp >= cabaCpMin && cp <= cabaCpMax) {
      if (!cabaEnabled) return { cost: null, zone: 'CABA', label: 'Zona deshabilitada para entregas' };
      return { cost: cabaFree ? 0 : cabaCost, zone: 'CABA (Zona 1)', label: cabaFree ? '¡Envío Gratis!' : `$${cabaCost.toLocaleString('es-AR')}` };
    }
    if (cp >= gbaCpMin && cp <= gbaCpMax) {
      if (!gbaEnabled) return { cost: null, zone: 'GBA / Gran Bs. As.', label: 'Zona deshabilitada para entregas' };
      return { cost: gbaFree ? 0 : gbaCost, zone: 'GBA (Zona 2)', label: gbaFree ? '¡Envío Gratis!' : `$${gbaCost.toLocaleString('es-AR')}` };
    }
    if (cp >= patagoniaCpMin && cp <= patagoniaCpMax) {
      if (!patagoniaEnabled) return { cost: null, zone: 'Patagonia / Lejanas', label: 'Zona deshabilitada para entregas' };
      return { cost: patagoniaFree ? 0 : patagoniaCost, zone: 'Patagonia (Zona 4)', label: patagoniaFree ? '¡Envío Gratis!' : `$${patagoniaCost.toLocaleString('es-AR')}` };
    }
    if (cp >= interiorCpMin && cp <= interiorCpMax) {
      if (!interiorEnabled) return { cost: null, zone: 'Interior del País', label: 'Zona deshabilitada para entregas' };
      return { cost: interiorFree ? 0 : interiorCost, zone: 'Interior (Zona 3)', label: interiorFree ? '¡Envío Gratis!' : `$${interiorCost.toLocaleString('es-AR')}` };
    }

    return { cost: interiorFree ? 0 : interiorCost, zone: 'Interior / General', label: interiorFree ? '¡Envío Gratis!' : `$${interiorCost.toLocaleString('es-AR')}` };
  };

  const simulation = simulateShipping();

  return (
    <div className="space-y-8 text-left font-sans animate-in fade-in duration-200">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-display font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#3C6E71]" />
            GESTIÓN DE LOGÍSTICA, ENVÍOS Y TARIFAS
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Definí precios por zona, rangos de código postal, promociones de envío gratis y retiro en tienda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchShippingSettings}
            className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
            title="Recargar valores"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleSaveShipping}
            disabled={saving}
            className="px-4 py-2 bg-[#3C6E71] hover:bg-[#2c5355] text-white font-display text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs cursor-pointer transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}</span>
          </button>
        </div>
      </div>

      {/* Status Alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-bold shadow-xs">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-300 text-red-800 text-xs rounded-xl flex items-center gap-2 font-bold shadow-xs">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveShipping} className="space-y-8">

        {/* ========================================================================= */}
        {/* BLOQUE 1: PROMOS GLOBALES DE ENVÍO GRATIS */}
        {/* ========================================================================= */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 text-gray-900 border-b border-gray-100 pb-3">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold tracking-wider uppercase">
                1. BENEFICIOS Y CONDICIONES DE ENVÍO GRATIS
              </h3>
              <p className="text-[11px] text-gray-500">
                Activá promociones para bonificar el 100% del costo de envío a tus clientes.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Promo 1: Envío Gratis a Todo el País Toggle */}
            <div className={`p-4 rounded-2xl border transition-all ${
              allFree ? 'bg-emerald-50 border-emerald-300 shadow-xs' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-xs font-bold text-gray-900 uppercase">
                      ENVÍO 100% GRATIS A TODO EL PAÍS
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold font-mono-custom">
                      PROMO GLOBAL
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Si se activa, el checkout cobrará $0 a todos los clientes sin importar su provincia o monto de compra.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setAllFree(!allFree)}
                  className={`px-3 py-1.5 rounded-xl font-display text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer shrink-0 border ${
                    allFree
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {allFree ? '🟢 ACTIVADO' : '⚪ DESACTIVADO'}
                </button>
              </div>
            </div>

            {/* Promo 2: Monto Mínimo de Compra para Envío Gratis */}
            <div className={`p-4 rounded-2xl border transition-all ${
              freeShippingEnabled ? 'bg-blue-50/60 border-blue-200 shadow-xs' : 'bg-gray-50 border-gray-200 opacity-70'
            }`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-display text-xs font-bold text-gray-900 uppercase">
                      ENVÍO GRATIS POR MONTO MÍNIMO
                    </span>
                    <p className="text-[10px] text-gray-500">Bonificación automática al superar este importe en el carrito.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFreeShippingEnabled(!freeShippingEnabled)}
                    className={`px-2.5 py-1 rounded-lg font-display text-[9px] font-bold uppercase transition-all cursor-pointer border ${
                      freeShippingEnabled
                        ? 'bg-blue-600 text-white border-blue-700'
                        : 'bg-white text-gray-600 border-gray-300'
                    }`}
                  >
                    {freeShippingEnabled ? 'ACTIVO' : 'INACTIVO'}
                  </button>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 font-mono-custom text-xs">$</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    disabled={!freeShippingEnabled}
                    value={freeShippingThreshold}
                    onChange={(e) => setFreeShippingThreshold(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-mono-custom font-bold text-gray-900 outline-none focus:border-blue-600 disabled:bg-gray-100"
                    placeholder="150000"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BLOQUE 2: CONFIGURACIÓN DE TARIFAS POR ZONA (4 ZONAS ARGENTINA) */}
        {/* ========================================================================= */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5 text-gray-900">
              <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold tracking-wider uppercase">
                  2. TARIFAS Y RANGOS DE CÓDIGO POSTAL POR ZONA GEOGRÁFICA
                </h3>
                <p className="text-[11px] text-gray-500">
                  Definí si el envío es gratis o fijá el costo y rango de Códigos Postales (CP) para cada región.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* ZONA 1: CABA */}
            <div className={`p-4 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
              cabaFree ? 'bg-emerald-50/50 border-emerald-300' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900">
                    <span>🏙️</span>
                    <span>CABA</span>
                  </div>
                  <span className="text-[9px] font-mono-custom font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    ZONA 1
                  </span>
                </div>

                {/* Free vs Paid Toggle */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-gray-700">Tipo de Envío:</span>
                  <button
                    type="button"
                    onClick={() => setCabaFree(!cabaFree)}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-bold font-mono-custom uppercase transition-all cursor-pointer border ${
                      cabaFree ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    {cabaFree ? '🎁 100% GRATIS' : '💵 CON TARIFA'}
                  </button>
                </div>

                {/* Cost Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    TARIFA ($ ARS):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 font-mono-custom text-xs">$</span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      disabled={cabaFree || allFree}
                      value={cabaFree || allFree ? 0 : cabaCost}
                      onChange={(e) => setCabaCost(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-mono-custom font-bold text-gray-900 outline-none focus:border-[#3C6E71] disabled:bg-gray-100"
                    />
                  </div>
                </div>

                {/* CP Range */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    RANGO DE CP:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={cabaCpMin}
                      onChange={(e) => setCabaCpMin(e.target.value)}
                      placeholder="1000"
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono-custom font-bold text-center"
                    />
                    <input
                      type="number"
                      value={cabaCpMax}
                      onChange={(e) => setCabaCpMax(e.target.value)}
                      placeholder="1499"
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono-custom font-bold text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200 text-[10px] text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span>Demora: 24 a 48 hs hábiles</span>
              </div>
            </div>

            {/* ZONA 2: GBA */}
            <div className={`p-4 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
              gbaFree ? 'bg-emerald-50/50 border-emerald-300' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900">
                    <span>🛣️</span>
                    <span>GBA / AMBA</span>
                  </div>
                  <span className="text-[9px] font-mono-custom font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    ZONA 2
                  </span>
                </div>

                {/* Free vs Paid Toggle */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-gray-700">Tipo de Envío:</span>
                  <button
                    type="button"
                    onClick={() => setGbaFree(!gbaFree)}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-bold font-mono-custom uppercase transition-all cursor-pointer border ${
                      gbaFree ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    {gbaFree ? '🎁 100% GRATIS' : '💵 CON TARIFA'}
                  </button>
                </div>

                {/* Cost Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    TARIFA ($ ARS):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 font-mono-custom text-xs">$</span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      disabled={gbaFree || allFree}
                      value={gbaFree || allFree ? 0 : gbaCost}
                      onChange={(e) => setGbaCost(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-mono-custom font-bold text-gray-900 outline-none focus:border-[#3C6E71] disabled:bg-gray-100"
                    />
                  </div>
                </div>

                {/* CP Range */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    RANGO DE CP:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={gbaCpMin}
                      onChange={(e) => setGbaCpMin(e.target.value)}
                      placeholder="1500"
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono-custom font-bold text-center"
                    />
                    <input
                      type="number"
                      value={gbaCpMax}
                      onChange={(e) => setGbaCpMax(e.target.value)}
                      placeholder="1999"
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono-custom font-bold text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200 text-[10px] text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span>Demora: 24 a 72 hs hábiles</span>
              </div>
            </div>

            {/* ZONA 3: INTERIOR DEL PAÍS */}
            <div className={`p-4 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
              interiorFree ? 'bg-emerald-50/50 border-emerald-300' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900">
                    <span>🌾</span>
                    <span>INTERIOR</span>
                  </div>
                  <span className="text-[9px] font-mono-custom font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    ZONA 3
                  </span>
                </div>

                {/* Free vs Paid Toggle */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-gray-700">Tipo de Envío:</span>
                  <button
                    type="button"
                    onClick={() => setInteriorFree(!interiorFree)}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-bold font-mono-custom uppercase transition-all cursor-pointer border ${
                      interiorFree ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    {interiorFree ? '🎁 100% GRATIS' : '💵 CON TARIFA'}
                  </button>
                </div>

                {/* Cost Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    TARIFA ($ ARS):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 font-mono-custom text-xs">$</span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      disabled={interiorFree || allFree}
                      value={interiorFree || allFree ? 0 : interiorCost}
                      onChange={(e) => setInteriorCost(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-mono-custom font-bold text-gray-900 outline-none focus:border-[#3C6E71] disabled:bg-gray-100"
                    />
                  </div>
                </div>

                {/* CP Range */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    RANGO DE CP:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={interiorCpMin}
                      onChange={(e) => setInteriorCpMin(e.target.value)}
                      placeholder="2000"
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono-custom font-bold text-center"
                    />
                    <input
                      type="number"
                      value={interiorCpMax}
                      onChange={(e) => setInteriorCpMax(e.target.value)}
                      placeholder="7999"
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono-custom font-bold text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200 text-[10px] text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span>Demora: 3 a 5 días hábiles</span>
              </div>
            </div>

            {/* ZONA 4: PATAGONIA */}
            <div className={`p-4 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
              patagoniaFree ? 'bg-emerald-50/50 border-emerald-300' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900">
                    <span>🏔️</span>
                    <span>PATAGONIA</span>
                  </div>
                  <span className="text-[9px] font-mono-custom font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    ZONA 4
                  </span>
                </div>

                {/* Free vs Paid Toggle */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-gray-700">Tipo de Envío:</span>
                  <button
                    type="button"
                    onClick={() => setPatagoniaFree(!patagoniaFree)}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-bold font-mono-custom uppercase transition-all cursor-pointer border ${
                      patagoniaFree ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    {patagoniaFree ? '🎁 100% GRATIS' : '💵 CON TARIFA'}
                  </button>
                </div>

                {/* Cost Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    TARIFA ($ ARS):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 font-mono-custom text-xs">$</span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      disabled={patagoniaFree || allFree}
                      value={patagoniaFree || allFree ? 0 : patagoniaCost}
                      onChange={(e) => setPatagoniaCost(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-mono-custom font-bold text-gray-900 outline-none focus:border-[#3C6E71] disabled:bg-gray-100"
                    />
                  </div>
                </div>

                {/* CP Range */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    RANGO DE CP:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={patagoniaCpMin}
                      onChange={(e) => setPatagoniaCpMin(e.target.value)}
                      placeholder="8000"
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono-custom font-bold text-center"
                    />
                    <input
                      type="number"
                      value={patagoniaCpMax}
                      onChange={(e) => setPatagoniaCpMax(e.target.value)}
                      placeholder="9999"
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono-custom font-bold text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200 text-[10px] text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span>Demora: 4 a 7 días hábiles</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BLOQUE 3: RETIRO EN SUCURSAL / LOCAL (PICK UP) */}
        {/* ========================================================================= */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5 text-gray-900">
              <div className="p-2 bg-purple-100 text-purple-800 rounded-xl">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold tracking-wider uppercase">
                  3. RETIRO EN TIENDA / LOCAL FÍSICO (PICK UP)
                </h3>
                <p className="text-[11px] text-gray-500">
                  Permite a tus clientes retirar sus pedidos sin costo en tu dirección física.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPickupEnabled(!pickupEnabled)}
              className={`px-3 py-1.5 rounded-xl font-display text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer border ${
                pickupEnabled
                  ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              {pickupEnabled ? '🟢 HABILITADO' : '⚪ DESHABILITADO'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block">
                DIRECCIÓN DE RETIRO *
              </label>
              <input
                type="text"
                disabled={!pickupEnabled}
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="Ej: Av. Corrientes 1234, CABA"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:border-[#3C6E71] outline-none disabled:bg-gray-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block">
                HORARIOS DE ATENCIÓN PARA RETIRO *
              </label>
              <input
                type="text"
                disabled={!pickupEnabled}
                value={pickupSchedule}
                onChange={(e) => setPickupSchedule(e.target.value)}
                placeholder="Ej: Lunes a Viernes de 10:00 a 18:00 hs"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:border-[#3C6E71] outline-none disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BLOQUE 4: SIMULADOR DE ENVÍOS EN VIVO */}
        {/* ========================================================================= */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 text-gray-900 border-b border-gray-100 pb-3">
            <div className="p-2 bg-emerald-100 text-[#3C6E71] rounded-xl">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold tracking-wider uppercase">
                4. SIMULADOR DE ENVÍOS EN TIEMPO REAL (PRUEBA TU CONFIGURACIÓN)
              </h3>
              <p className="text-[11px] text-gray-500">
                Ingresá un Código Postal y monto para comprobar la zona detectada y la tarifa que verá el cliente.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block">
                PROBAR CÓDIGO POSTAL (CP):
              </label>
              <input
                type="text"
                value={testCp}
                onChange={(e) => setTestCp(e.target.value)}
                placeholder="Ej: 1425, 2000, 9410"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono-custom font-bold text-gray-900 outline-none focus:bg-white focus:border-[#3C6E71] transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block">
                MONTO DE COMPRA DEL CARRITO:
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono-custom font-bold">$</span>
                <input
                  type="number"
                  value={testAmount}
                  onChange={(e) => setTestAmount(Number(e.target.value))}
                  placeholder="50000"
                  className="w-full pl-7 pr-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono-custom font-bold text-gray-900 outline-none focus:bg-white focus:border-[#3C6E71] transition-all"
                />
              </div>
            </div>

            {/* Simulated Output Card */}
            <div className="p-3.5 bg-[#3C6E71]/5 border border-[#3C6E71]/20 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[9px] text-gray-500 uppercase font-mono-custom font-bold block">ZONA DETECTADA:</span>
                <strong className="text-xs text-gray-900 uppercase block">{simulation.zone}</strong>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-gray-500 uppercase font-mono-custom font-bold block">TARIFA AL CLIENTE:</span>
                <span className={`text-xs font-mono-custom font-bold ${simulation.cost === 0 ? 'text-emerald-700 font-sans' : 'text-gray-900'}`}>
                  {simulation.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div>
            <h4 className="font-display text-xs font-bold text-gray-900 uppercase">¿LISTO PARA APLICAR LAS TARIFAS?</h4>
            <p className="text-[11px] text-gray-500">Se sincronizarán de inmediato con el carrito y el proceso de checkout.</p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-3 bg-[#3C6E71] hover:bg-[#2c5355] text-white font-display text-xs font-bold tracking-wider uppercase rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'GUARDANDO CAMBIOS...' : 'GUARDAR TODAS LAS TARIFAS'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
