import React, { useState, useEffect } from 'react';
import {
  Percent,
  Shield,
  CreditCard,
  Save,
  Check,
  RefreshCw,
  Truck,
  AlertTriangle,
  Lock,
  Copy,
  History,
  Building2,
  ExternalLink
} from 'lucide-react';

export default function StoreSettings({ API_BASE_URL, token }) {
  // 1. Tax & Fiscal State
  const [taxRate, setTaxRate] = useState(21.0);
  const [currencySymbol, setCurrencySymbol] = useState('ARS $');

  // 2. Payment Gateway State
  const [paymentGateway, setPaymentGateway] = useState('mercadopago');
  const [paymentMode, setPaymentMode] = useState('sandbox');
  const [sandboxPublicKey, setSandboxPublicKey] = useState('');
  const [sandboxSecretKey, setSandboxSecretKey] = useState('');
  const [isSandboxSecretConfigured, setIsSandboxSecretConfigured] = useState(false);
  const [isEditingSandboxSecret, setIsEditingSandboxSecret] = useState(false);

  const [productionPublicKey, setProductionPublicKey] = useState('');
  const [productionSecretKey, setProductionSecretKey] = useState('');
  const [isProductionSecretConfigured, setIsProductionSecretConfigured] = useState(false);
  const [isEditingProductionSecret, setIsEditingProductionSecret] = useState(false);

  const [transferDiscount, setTransferDiscount] = useState(10);
  const [bankCbu, setBankCbu] = useState('');
  const [bankAlias, setBankAlias] = useState('');
  const [bankHolder, setBankHolder] = useState('');
  const [bankCuit, setBankCuit] = useState('');
  const [maxInstallments, setMaxInstallments] = useState(6);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // 3. Shipping Rates & Postal Code Ranges State
  const [cabaCost, setCabaCost] = useState(5000);
  const [cabaCpMin, setCabaCpMin] = useState(1000);
  const [cabaCpMax, setCabaCpMax] = useState(1499);

  const [gbaCost, setGbaCost] = useState(8000);
  const [gbaCpMin, setGbaCpMin] = useState(1500);
  const [gbaCpMax, setGbaCpMax] = useState(1999);

  const [interiorCost, setInteriorCost] = useState(15000);
  const [interiorCpMin, setInteriorCpMin] = useState(2000);
  const [interiorCpMax, setInteriorCpMax] = useState(7999);

  const [patagoniaCost, setPatagoniaCost] = useState(20000);
  const [patagoniaCpMin, setPatagoniaCpMin] = useState(8000);
  const [patagoniaCpMax, setPatagoniaCpMax] = useState(9999);

  const [freeShippingThreshold, setFreeShippingThreshold] = useState(150000);

  // General Form States
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isProdConfirmModalOpen, setIsProdConfirmModalOpen] = useState(false);

  // 4. Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load all settings from backend
  const fetchSettings = async () => {
    setLoading(true);
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
        
        // 1. Tax
        setTaxRate(s.tax_rate ?? 21.0);
        setCurrencySymbol(s.currency_symbol ?? 'ARS $');

        // 2. Payments
        setPaymentGateway(s.payment_gateway ?? 'mercadopago');
        setPaymentMode(s.payment_gateway_mode ?? 'sandbox');
        setSandboxPublicKey(s.sandbox_public_key ?? '');
        setIsSandboxSecretConfigured(!!s.sandbox_secret_key_configured);
        setSandboxSecretKey('');
        setIsEditingSandboxSecret(false);

        setProductionPublicKey(s.production_public_key ?? '');
        setIsProductionSecretConfigured(!!s.production_secret_key_configured);
        setProductionSecretKey('');
        setIsEditingProductionSecret(false);

        setTransferDiscount(s.transfer_discount_percent ?? 10);
        setMaxInstallments(s.max_installments ?? 6);
        setBankCbu(s.bank_cbu ?? '0720000000000000000000');
        setBankAlias(s.bank_alias ?? 'HOLUX.OUTDOOR.OFICIAL');
        setBankHolder(s.bank_holder ?? 'HOLUX OUTDOOR S.R.L.');
        setBankCuit(s.bank_cuit ?? '30-71829304-9');
        setWebhookUrl(s.webhook_url ?? `${API_BASE_URL}/api/webhooks/mercadopago`);

        // 3. Shipping
        setCabaCost(s.caba_cost ?? 5000);
        setCabaCpMin(s.caba_cp_min ?? 1000);
        setCabaCpMax(s.caba_cp_max ?? 1499);

        setGbaCost(s.gba_cost ?? 8000);
        setGbaCpMin(s.gba_cp_min ?? 1500);
        setGbaCpMax(s.gba_cp_max ?? 1999);

        setInteriorCost(s.interior_cost ?? 15000);
        setInteriorCpMin(s.interior_cp_min ?? 2000);
        setInteriorCpMax(s.interior_cp_max ?? 7999);

        setPatagoniaCost(s.patagonia_cost ?? 20000);
        setPatagoniaCpMin(s.patagonia_cp_min ?? 8000);
        setPatagoniaCpMax(s.patagonia_cp_max ?? 9999);

        setFreeShippingThreshold(s.free_shipping_threshold ?? 150000);

        // Audit Logs
        if (Array.isArray(data.recent_logs)) {
          setAuditLogs(data.recent_logs);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [token]);

  // Handle Copy Webhook URL
  const handleCopyWebhook = () => {
    if (!webhookUrl) return;
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  // Unified Save Handler (Single Button at bottom)
  const handleSubmitAllSettings = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // 1. Validations
    const rate = parseFloat(taxRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      setErrorMsg('La alícuota de IVA debe ser un número entre 0% y 100%.');
      return;
    }

    if (cabaCost < 0 || gbaCost < 0 || interiorCost < 0 || patagoniaCost < 0) {
      setErrorMsg('Las tarifas de envío no pueden ser números negativos.');
      return;
    }

    if (
      parseInt(cabaCpMin) > parseInt(cabaCpMax) ||
      parseInt(gbaCpMin) > parseInt(gbaCpMax) ||
      parseInt(interiorCpMin) > parseInt(interiorCpMax) ||
      parseInt(patagoniaCpMin) > parseInt(patagoniaCpMax)
    ) {
      setErrorMsg('El Código Postal Mínimo debe ser menor o igual al Código Postal Máximo en cada zona.');
      return;
    }

    // 2. Production Switch Confirmation
    if (paymentMode === 'production' && !isProdConfirmModalOpen) {
      setIsProdConfirmModalOpen(true);
      return;
    }

    setSaving(true);

    try {
      const payload = {
        // Tax
        tax_rate: rate,
        currency_symbol: currencySymbol,

        // Payment
        payment_gateway: paymentGateway,
        payment_gateway_mode: paymentMode,
        sandbox_public_key: sandboxPublicKey,
        production_public_key: productionPublicKey,
        transfer_discount_percent: parseFloat(transferDiscount) || 0,
        max_installments: parseInt(maxInstallments) || 6,
        bank_cbu: bankCbu,
        bank_alias: bankAlias,
        bank_holder: bankHolder,
        bank_cuit: bankCuit,

        // Shipping
        caba_cost: parseFloat(cabaCost),
        caba_cp_min: parseInt(cabaCpMin),
        caba_cp_max: parseInt(cabaCpMax),
        gba_cost: parseFloat(gbaCost),
        gba_cp_min: parseInt(gbaCpMin),
        gba_cp_max: parseInt(gbaCpMax),
        interior_cost: parseFloat(interiorCost),
        interior_cp_min: parseInt(interiorCpMin),
        interior_cp_max: parseInt(interiorCpMax),
        patagonia_cost: parseFloat(patagoniaCost),
        patagonia_cp_min: parseInt(patagoniaCpMin),
        patagonia_cp_max: parseInt(patagoniaCpMax),
        free_shipping_threshold: parseFloat(freeShippingThreshold)
      };

      // Write-Only: only send secret keys if user typed a new one
      if (isEditingSandboxSecret && sandboxSecretKey.trim()) {
        payload.sandbox_secret_key = sandboxSecretKey.trim();
      }
      if (isEditingProductionSecret && productionSecretKey.trim()) {
        payload.production_secret_key = productionSecretKey.trim();
      }

      const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('holux_auth_token')}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al guardar la configuración.');

      // Sync localStorage for checkout client-side fallback
      localStorage.setItem('holux_shipping_rates', JSON.stringify({
        cabaShippingCost: Number(cabaCost),
        gbaShippingCost: Number(gbaCost),
        interiorShippingCost: Number(interiorCost),
        patagoniaShippingCost: Number(patagoniaCost),
        freeShippingThreshold: Number(freeShippingThreshold)
      }));

      setSuccessMsg('¡Configuración general de la tienda guardada con éxito!');
      setIsEditingSandboxSecret(false);
      setIsEditingProductionSecret(false);
      setSandboxSecretKey('');
      setProductionSecretKey('');
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchSettings();
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar.');
    } finally {
      setSaving(false);
      setIsProdConfirmModalOpen(false);
    }
  };

  return (
    <div className="space-y-8 text-left font-sans animate-in fade-in duration-200">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-display font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#3C6E71]" />
            CONFIGURACIÓN GENERAL DE LA TIENDA
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Administrá los impuestos fiscales, credenciales cifradas de pasarelas y logística regional de tu eCommerce.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLogsModal(true)}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold font-display uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="Ver auditoría de cambios"
          >
            <History className="w-4 h-4 text-[#3C6E71]" />
            <span>Auditoría ({auditLogs.length})</span>
          </button>

          <button
            type="button"
            onClick={fetchSettings}
            className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
            title="Recargar valores del servidor"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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

      {/* Main Single Form */}
      <form onSubmit={handleSubmitAllSettings} className="space-y-8">
        
        {/* ========================================================================= */}
        {/* BLOQUE 1: ALÍCUOTA DE IVA & RÉGIMEN FISCAL */}
        {/* ========================================================================= */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 text-gray-900 border-b border-gray-100 pb-3">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Percent className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold tracking-wider uppercase">
                1. ALÍCUOTA DE IVA & RÉGIMEN FISCAL (LEY N° 27.743)
              </h3>
              <p className="text-[11px] text-gray-500">
                Se aplica al cálculo de precios netos e IVA discriminado en tickets y facturación legal.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-gray-700 uppercase tracking-wider block">
                Porcentaje de Impuesto / IVA (%) *
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
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono-custom font-bold text-gray-900 focus:bg-white focus:border-[#3C6E71] outline-none transition-all pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 font-mono-custom">%</span>
              </div>
              <p className="text-[10px] text-gray-400">Tasa estándar general en Argentina: 21.0% (o 10.5% reducida).</p>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-700 uppercase tracking-wider block">
                Símbolo Monetario de la Tienda *
              </label>
              <input
                type="text"
                required
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono-custom font-bold text-gray-900 focus:bg-white focus:border-[#3C6E71] outline-none transition-all"
                placeholder="Ej: ARS $"
              />
              <p className="text-[10px] text-gray-400">Prefijo monetario mostrado en catálogo y comprobantes.</p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BLOQUE 2: PASARELA DE PAGOS (MERCADO PAGO ARGENTINA & TRANSFERENCIAS) */}
        {/* ========================================================================= */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2.5 text-gray-900">
              <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-sm font-bold tracking-wider uppercase">
                    2. PASARELA DE PAGOS: MERCADO PAGO ARGENTINA
                  </h3>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[9px] font-bold font-mono-custom">
                    CHECKOUT PRO & TARJETAS
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Procesamiento seguro con encriptación AES-256 de claves secretas del lado del servidor.
                </p>
              </div>
            </div>

            <span className={`px-3 py-1 rounded-lg text-[10px] font-black font-mono-custom uppercase border ${
              paymentMode === 'sandbox' ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-emerald-100 text-emerald-900 border-emerald-300'
            }`}>
              {paymentMode === 'sandbox' ? '🟡 ENTORNO: SANDBOX (PRUEBAS)' : '🟢 ENTORNO: PRODUCCIÓN (EN VIVO)'}
            </span>
          </div>

          {/* Mode Selector Toggle */}
          <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
              Entorno de Operación de Cobros:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMode('sandbox')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  paymentMode === 'sandbox'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                <div className="p-1.5 bg-black/10 rounded-lg shrink-0">🧪</div>
                <div>
                  <span className="font-display font-bold text-xs block uppercase">MODO PRUEBAS (SANDBOX)</span>
                  <span className="text-[11px] opacity-90 block">Permite probar cobros con tarjetas de prueba sin dinero real.</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (paymentMode !== 'production') {
                    setIsProdConfirmModalOpen(true);
                  }
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  paymentMode === 'production'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                <div className="p-1.5 bg-black/10 rounded-lg shrink-0">💳</div>
                <div>
                  <span className="font-display font-bold text-xs block uppercase">MODO PRODUCCIÓN (EN VIVO)</span>
                  <span className="text-[11px] opacity-90 block">Cobra con dinero real procesando cuentas de Mercado Pago y bancos.</span>
                </div>
              </button>
            </div>
          </div>

          {/* Credentials Grid based on selected mode */}
          <div className="space-y-4">
            <h4 className="font-display text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#3C6E71]" />
              <span>Credenciales API ({paymentMode === 'production' ? 'Producción Oficial' : 'Sandbox Pruebas'}):</span>
            </h4>

            {paymentMode === 'sandbox' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700 uppercase tracking-wider block">
                    Public Key (Sandbox):
                  </label>
                  <input
                    type="text"
                    value={sandboxPublicKey}
                    onChange={(e) => setSandboxPublicKey(e.target.value)}
                    placeholder="TEST-0000000000-000000-..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono-custom text-gray-900 focus:bg-white focus:border-[#3C6E71] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-gray-700 uppercase tracking-wider block">
                      Access Token / Secret Key (Sandbox):
                    </label>
                    {isSandboxSecretConfigured && !isEditingSandboxSecret && (
                      <button
                        type="button"
                        onClick={() => setIsEditingSandboxSecret(true)}
                        className="text-[10px] text-[#3C6E71] hover:underline font-bold cursor-pointer"
                      >
                        ✏️ Cambiar Clave
                      </button>
                    )}
                  </div>

                  {isSandboxSecretConfigured && !isEditingSandboxSecret ? (
                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-mono-custom text-emerald-800">
                      <span className="flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-emerald-600" />
                        <span>••••••••••••••••••••••••••••••••</span>
                      </span>
                      <span className="text-[10px] font-bold bg-emerald-200/70 px-2 py-0.5 rounded text-emerald-900">
                        Cifrada AES-256
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <input
                        type="password"
                        value={sandboxSecretKey}
                        onChange={(e) => setSandboxSecretKey(e.target.value)}
                        placeholder="Pegar nuevo Access Token de Sandbox (TEST-...)"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-mono-custom text-gray-900 focus:border-[#3C6E71] outline-none"
                      />
                      {isEditingSandboxSecret && (
                        <button
                          type="button"
                          onClick={() => { setIsEditingSandboxSecret(false); setSandboxSecretKey(''); }}
                          className="text-[10px] text-gray-500 hover:text-gray-700 cursor-pointer"
                        >
                          Cancelar edición (Conservar clave actual)
                        </button>
                      )}
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400">
                    🔒 Guardado Write-Only: por seguridad nunca viaja en texto plano de regreso al navegador.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700 uppercase tracking-wider block">
                    Public Key (Producción Real):
                  </label>
                  <input
                    type="text"
                    value={productionPublicKey}
                    onChange={(e) => setProductionPublicKey(e.target.value)}
                    placeholder="APP_USR-0000000000-000000-..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono-custom text-gray-900 focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-gray-700 uppercase tracking-wider block">
                      Access Token / Secret Key (Producción):
                    </label>
                    {isProductionSecretConfigured && !isEditingProductionSecret && (
                      <button
                        type="button"
                        onClick={() => setIsEditingProductionSecret(true)}
                        className="text-[10px] text-emerald-700 hover:underline font-bold cursor-pointer"
                      >
                        ✏️ Cambiar Clave
                      </button>
                    )}
                  </div>

                  {isProductionSecretConfigured && !isEditingProductionSecret ? (
                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-mono-custom text-emerald-800">
                      <span className="flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-emerald-600" />
                        <span>••••••••••••••••••••••••••••••••</span>
                      </span>
                      <span className="text-[10px] font-bold bg-emerald-200/70 px-2 py-0.5 rounded text-emerald-900">
                        Cifrada AES-256
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <input
                        type="password"
                        value={productionSecretKey}
                        onChange={(e) => setProductionSecretKey(e.target.value)}
                        placeholder="Pegar nuevo Access Token de Producción (APP_USR-...)"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-mono-custom text-gray-900 focus:border-emerald-600 outline-none"
                      />
                      {isEditingProductionSecret && (
                        <button
                          type="button"
                          onClick={() => { setIsEditingProductionSecret(false); setProductionSecretKey(''); }}
                          className="text-[10px] text-gray-500 hover:text-gray-700 cursor-pointer"
                        >
                          Cancelar edición (Conservar clave actual)
                        </button>
                      )}
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400">
                    🔒 Guardado Write-Only: por seguridad nunca viaja en texto plano de regreso al navegador.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Webhook URL Visualizer */}
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>🔔 URL de Webhook Oficial (Notificaciones IPN de Mercado Pago):</span>
              </span>
              <a
                href="https://www.mercadopago.com.ar/developers/panel/app"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-bold text-blue-700 hover:underline flex items-center gap-1"
              >
                <span>Panel Mercado Pago</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs font-mono-custom text-blue-950 font-bold outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopyWebhook}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold font-display uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shrink-0 transition-all"
              >
                {copiedWebhook ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedWebhook ? '¡Copiado!' : 'Copiar URL'}</span>
              </button>
            </div>
            <p className="text-[10px] text-blue-700 font-sans">
              Configurá esta URL en la sección <em>Webhooks / Notificaciones IPN</em> de tu aplicación de Mercado Pago para acreditar pagos automáticamente.
            </p>
          </div>

          {/* Bank Transfer Details Block */}
          <div className="space-y-4 pt-2 border-t border-gray-100">
            <h4 className="font-display text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Datos Bancarios para Pago por Transferencia:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700 uppercase tracking-wider block text-[10px]">CBU / CVU Bancario</label>
                <input
                  type="text"
                  value={bankCbu}
                  onChange={(e) => setBankCbu(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-mono-custom text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 uppercase tracking-wider block text-[10px]">Alias Bancario</label>
                <input
                  type="text"
                  value={bankAlias}
                  onChange={(e) => setBankAlias(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-mono-custom text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 uppercase tracking-wider block text-[10px]">% Descuento Transferencia</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={transferDiscount}
                    onChange={(e) => setTransferDiscount(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-mono-custom text-xs font-bold pr-7"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-bold text-gray-400">%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700 uppercase tracking-wider block text-[10px]">Titular de Cuenta</label>
                <input
                  type="text"
                  value={bankHolder}
                  onChange={(e) => setBankHolder(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 uppercase tracking-wider block text-[10px]">CUIT / CUIL Titular</label>
                <input
                  type="text"
                  value={bankCuit}
                  onChange={(e) => setBankCuit(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-mono-custom text-xs"
                />
              </div>
            </div>

            {/* Financing & Installments Explanation Box */}
            <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 space-y-3 pt-3">
              <div className="flex items-center justify-between">
                <h5 className="font-display text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                  <span>💳 Financiación y Cuotas en la Tienda:</span>
                </h5>
                <span className="text-[10px] bg-purple-200 text-purple-900 font-bold px-2 py-0.5 rounded">
                  Predeterminado: {maxInstallments} cuotas
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-purple-900 uppercase block">
                    Máximo de Cuotas Predeterminado para Nuevos Productos:
                  </label>
                  <select
                    value={maxInstallments}
                    onChange={(e) => setMaxInstallments(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-purple-300 rounded-lg text-xs font-bold text-purple-950 outline-none cursor-pointer"
                  >
                    <option value={1}>1 Pago (Sin cuotas por defecto)</option>
                    <option value={3}>Hasta 3 Cuotas Fijas</option>
                    <option value={6}>Hasta 6 Cuotas Fijas</option>
                    <option value={9}>Hasta 9 Cuotas Fijas</option>
                    <option value={12}>Hasta 12 Cuotas Fijas</option>
                  </select>
                </div>

                <div className="text-[11px] text-purple-900 leading-relaxed space-y-1 font-sans">
                  <p>
                    💡 <strong>¿Cómo funcionan las cuotas?</strong>
                  </p>
                  <p className="text-[10px] text-purple-800">
                    <strong>1. En la pasarela (Mercado Pago):</strong> El comprador siempre puede elegir pagar en 1 a 12 cuotas con su tarjeta de crédito. Los intereses o promociones sin interés (Cuota Simple) se gestionan desde tu cuenta de Mercado Pago.
                  </p>
                  <p className="text-[10px] text-purple-800">
                    <strong>2. En cada producto:</strong> Podés definir cuántas cuotas mostrar en el cartel morado al <em>Editar cada producto</em>, o seleccionar <em>"Sin cuotas"</em> si ese artículo no debe mostrar facilidades de pago.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BLOQUE 3: TARIFAS DE ENVÍO & EDITOR DE RANGOS DE CÓDIGO POSTAL */}
        {/* ========================================================================= */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 text-gray-900 border-b border-gray-100 pb-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold tracking-wider uppercase">
                3. TARIFAS DE ENVÍO & RANGOS DE CÓDIGO POSTAL (CP)
              </h3>
              <p className="text-[11px] text-gray-500">
                Ajustá el costo y los rangos de códigos postales asociados a cada región geográfica.
              </p>
            </div>
          </div>

          {/* 4 Regional Shipping Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            
            {/* Zona 1: CABA */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <span className="font-display font-bold text-gray-900 uppercase">🏙️ CABA</span>
                <span className="text-[10px] text-gray-500 font-mono-custom font-bold">ZONA 1</span>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase">Tarifa ($ ARS):</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={cabaCost}
                  onChange={(e) => setCabaCost(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg font-mono-custom font-bold text-xs"
                />
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase block">Rango de CP:</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={cabaCpMin}
                    onChange={(e) => setCabaCpMin(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-center font-mono-custom text-[11px]"
                    placeholder="Min"
                  />
                  <span className="text-gray-400 font-bold">-</span>
                  <input
                    type="number"
                    value={cabaCpMax}
                    onChange={(e) => setCabaCpMax(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-center font-mono-custom text-[11px]"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>

            {/* Zona 2: GBA */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <span className="font-display font-bold text-gray-900 uppercase">🏘️ GBA / Gran Bs.As.</span>
                <span className="text-[10px] text-gray-500 font-mono-custom font-bold">ZONA 2</span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase">Tarifa ($ ARS):</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={gbaCost}
                  onChange={(e) => setGbaCost(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg font-mono-custom font-bold text-xs"
                />
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase block">Rango de CP:</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={gbaCpMin}
                    onChange={(e) => setGbaCpMin(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-center font-mono-custom text-[11px]"
                    placeholder="Min"
                  />
                  <span className="text-gray-400 font-bold">-</span>
                  <input
                    type="number"
                    value={gbaCpMax}
                    onChange={(e) => setGbaCpMax(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-center font-mono-custom text-[11px]"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>

            {/* Zona 3: Interior */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <span className="font-display font-bold text-gray-900 uppercase">🌾 Interior del País</span>
                <span className="text-[10px] text-gray-500 font-mono-custom font-bold">ZONA 3</span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase">Tarifa ($ ARS):</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={interiorCost}
                  onChange={(e) => setInteriorCost(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg font-mono-custom font-bold text-xs"
                />
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase block">Rango de CP:</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={interiorCpMin}
                    onChange={(e) => setInteriorCpMin(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-center font-mono-custom text-[11px]"
                    placeholder="Min"
                  />
                  <span className="text-gray-400 font-bold">-</span>
                  <input
                    type="number"
                    value={interiorCpMax}
                    onChange={(e) => setInteriorCpMax(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-center font-mono-custom text-[11px]"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>

            {/* Zona 4: Patagonia */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <span className="font-display font-bold text-gray-900 uppercase">🏔️ Patagonia / Lejanas</span>
                <span className="text-[10px] text-gray-500 font-mono-custom font-bold">ZONA 4</span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase">Tarifa ($ ARS):</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={patagoniaCost}
                  onChange={(e) => setPatagoniaCost(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg font-mono-custom font-bold text-xs"
                />
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase block">Rango de CP:</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={patagoniaCpMin}
                    onChange={(e) => setPatagoniaCpMin(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-center font-mono-custom text-[11px]"
                    placeholder="Min"
                  />
                  <span className="text-gray-400 font-bold">-</span>
                  <input
                    type="number"
                    value={patagoniaCpMax}
                    onChange={(e) => setPatagoniaCpMax(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-center font-mono-custom text-[11px]"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Free Shipping Threshold */}
          <div className="space-y-1.5 pt-2 max-w-md text-xs">
            <label className="font-bold text-gray-700 uppercase tracking-wider block">
              Monto Mínimo de Compra para Envío 100% Gratis ($) *
            </label>
            <input
              type="number"
              min="0"
              required
              value={freeShippingThreshold}
              onChange={(e) => setFreeShippingThreshold(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono-custom font-bold text-gray-900 focus:bg-white focus:border-[#3C6E71] outline-none"
            />
            <p className="text-[10px] text-gray-400">
              Los carritos que superen este valor bonifican automáticamente el 100% del costo de envío.
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BOTÓN PRINCIPAL ÚNICO DE GUARDAR CAMBIOS */}
        {/* ========================================================================= */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky bottom-4 z-20">
          <div>
            <h4 className="font-display font-bold text-xs uppercase text-gray-900">
              ¿Listo para aplicar los cambios en la tienda?
            </h4>
            <p className="text-[11px] text-gray-500">
              Se guardarán y auditarán de inmediato la configuración fiscal, pasarela de pagos y logística.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 bg-[#3C6E71] hover:bg-[#3C6E71]/95 text-white font-display text-xs font-bold tracking-widest rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : successMsg ? (
              <Check className="w-4 h-4 text-emerald-300" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>
              {saving ? 'GUARDANDO TODOS LOS CAMBIOS...' : successMsg ? '¡CAMBIOS GUARDADOS!' : 'GUARDAR TODOS LOS CAMBIOS DE LA TIENDA'}
            </span>
          </button>
        </div>

      </form>

      {/* ========================================================================= */}
      {/* MODAL CRÍTICO: CONFIRMACIÓN DE MODO PRODUCCIÓN */}
      {/* ========================================================================= */}
      {isProdConfirmModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-red-200 text-left">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 text-red-700 rounded-xl shrink-0">
                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-display font-black text-sm uppercase text-gray-900 tracking-wider">
                  ⚠️ ¿ACTIVAR MODO PRODUCCIÓN (COBROS REALES)?
                </h3>
                <p className="text-[11px] text-red-600 font-bold mt-0.5">
                  Acción sensible que impacta directamente en la facturación.
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Estás por activar el <strong>Modo Producción</strong> de la pasarela de pagos. A partir de este momento, todas las compras de los clientes procesarán <strong>tarjetas de crédito/débito y dinero real</strong> con tus credenciales de Mercado Pago.
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <p className="font-bold">Verificaciones recomendadas antes de confirmar:</p>
              <ul className="list-disc pl-4 text-[11px] text-amber-800 space-y-0.5">
                <li>Que hayas cargado tu <strong>Public Key</strong> y <strong>Access Token de Producción</strong>.</li>
                <li>Que tu cuenta de Mercado Pago esté homologada en Argentina.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsProdConfirmModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-bold cursor-pointer hover:bg-gray-50"
              >
                CANCELAR
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMode('production');
                  handleSubmitAllSettings();
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-display font-bold uppercase tracking-wider shadow-md cursor-pointer"
              >
                SÍ, ACTIVAR Y GUARDAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL AUDITORÍA DE CAMBIOS (ADMIN LOGS) */}
      {/* ========================================================================= */}
      {showLogsModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl border border-gray-200 text-left max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
              <div className="flex items-center gap-2 text-gray-900">
                <History className="w-5 h-5 text-[#3C6E71]" />
                <h3 className="font-display font-bold text-sm uppercase tracking-wider">
                  REGISTRO DE AUDITORÍA: MODIFICACIONES DE CONFIGURACIÓN
                </h3>
              </div>
              <button
                onClick={() => setShowLogsModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500 shrink-0">
              Historial cronológico de cambios realizados en impuestos, pasarelas de pago y logística regional.
            </p>

            <div className="flex-grow overflow-y-auto space-y-2 pr-1">
              {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">
                  No hay registros de auditoría recientes.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono-custom text-[#3C6E71]">
                          {log.action}
                        </span>
                        <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded font-bold text-gray-700">
                          {log.section}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono-custom">
                        {new Date(log.created_at || (log.timestamp * 1000)).toLocaleString('es-AR')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-600">
                      <span>Por: <strong>{log.admin_name || log.admin_email}</strong> ({log.admin_email})</span>
                      <span className="font-mono-custom text-[10px] text-gray-400">IP: {log.ip_address || '127.0.0.1'}</span>
                    </div>

                    {log.details && (
                      <div className="p-2 bg-white rounded border border-gray-200 font-mono-custom text-[10px] text-gray-700 overflow-x-auto">
                        {JSON.stringify(log.details)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100 shrink-0">
              <button
                type="button"
                onClick={() => setShowLogsModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold cursor-pointer"
              >
                CERRAR
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
