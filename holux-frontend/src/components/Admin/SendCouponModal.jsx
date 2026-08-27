import React, { useState, useEffect } from 'react';
import { X, Tag, Gift, Send, Copy, Check, Percent, DollarSign, Calendar, MessageCircle, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export default function SendCouponModal({ customer, onClose, token }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('existing'); // 'existing' | 'new'

  // Selected existing coupon
  const [selectedCouponCode, setSelectedCouponCode] = useState('');

  // New coupon creation fields
  const [customCode, setCustomCode] = useState('');
  const [customType, setCustomType] = useState('percentage'); // 'percentage' | 'fixed'
  const [customValue, setCustomValue] = useState(20);
  const [customMinSpend, setCustomMinSpend] = useState(0);
  const [customDaysValid, setCustomDaysValid] = useState(14);
  const [customDescription, setCustomDescription] = useState('Cupón exclusivo para tu próxima compra.');

  // Phone input for sending
  const [targetPhone, setTargetPhone] = useState(customer?.phone || '');
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [assignedSuccess, setAssignedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const customerName = customer?.full_name || customer?.name || 'Cliente';

  // Initialize custom code with customer name when opening
  useEffect(() => {
    if (customer) {
      const cleanName = (customer.full_name || customer.name || 'CLIENTE')
        .split(' ')[0]
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
      setCustomCode(`${cleanName}20`);
      setTargetPhone(customer.phone || '');
    }
  }, [customer]);

  // Fetch store coupons
  useEffect(() => {
    const fetchCoupons = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/coupons`, {
          headers: {
            'Authorization': `Bearer ${token || localStorage.getItem('holux_auth_token')}`,
            'Accept': 'application/json'
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCoupons(data);
            setSelectedCouponCode(data[0].code);
          }
        }
      } catch (err) {
        console.error('Error fetching coupons:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCoupons();
  }, [token]);

  // Calculate active coupon details
  const activeCoupon = mode === 'existing' 
    ? coupons.find(c => c.code === selectedCouponCode) 
    : {
        code: customCode.toUpperCase().trim(),
        type: customType,
        value: customValue,
        min_spend: customMinSpend,
        daysValid: customDaysValid,
        description: customDescription
      };

  const discountText = activeCoupon?.type === 'percentage' 
    ? `${activeCoupon?.value}% OFF` 
    : `ARS $${(activeCoupon?.value || 0).toLocaleString('es-AR')} OFF`;

  // WhatsApp Message Generator
  const whatsappMessage = `¡Hola ${customerName}! ✨\n\nDesde *HOLUX* te enviamos un regalo exclusivo para tu próxima compra:\n\n🎟️ Cupón: *${activeCoupon?.code || 'HOLUX'}*\n🎁 Descuento: *${discountText}*${activeCoupon?.min_spend > 0 ? ` (En compras mayores a ARS $${Number(activeCoupon.min_spend).toLocaleString('es-AR')})` : ''}\n🌐 Usalo acá: https://ecommerce-holux.vercel.app\n\n¡Esperamos que lo disfrutes! 🛍️✨`;

  // 1. Assign Directly to Customer Account
  const handleAssignDirectlyToAccount = async () => {
    if (!activeCoupon?.code) {
      alert('Por favor selecciona o crea un código de cupón.');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);
    setAssignedSuccess(false);

    try {
      // Step A: If mode is new, create it in global store coupons first
      if (mode === 'new') {
        await handleCreateCustomCoupon();
      }

      // Step B: Save/ensure in global store database (holux_coupons_database)
      try {
        const dbKey = 'holux_coupons_database';
        const existingDb = JSON.parse(localStorage.getItem(dbKey) || '[]');
        const globalEntry = {
          id: 'coup-admin-' + Date.now(),
          code: activeCoupon.code,
          type: activeCoupon.type,
          value: parseFloat(activeCoupon.value),
          minPurchase: parseFloat(activeCoupon.min_spend || 0),
          origin: `Regalo Especial HOLUX 🎁`,
          description: activeCoupon.description || 'Descuento exclusivo para tu cuenta.',
          active: true,
          maxUses: 100,
          usedCount: 0,
          expiry_timestamp: Date.now() + (parseInt(activeCoupon.daysValid || 14) * 86400000)
        };
        const updatedDb = [globalEntry, ...existingDb.filter(c => c.code !== activeCoupon.code)];
        localStorage.setItem(dbKey, JSON.stringify(updatedDb));
      } catch (e) {
        console.error(e);
      }

      // Step C: Store in customer wallet by both User ID and User Email
      try {
        const newEntry = {
          id: 'coup-assigned-' + Date.now(),
          code: activeCoupon.code,
          type: activeCoupon.type,
          value: parseFloat(activeCoupon.value),
          min_spend: parseFloat(activeCoupon.min_spend || 0),
          origin: `Regalo Especial HOLUX 🎁`,
          description: activeCoupon.description || 'Descuento exclusivo para tu cuenta.',
          status: 'disponible',
          expiry_timestamp: Date.now() + (parseInt(activeCoupon.daysValid || 14) * 86400000)
        };

        // 1. By customer ID
        if (customer?.id) {
          const idKey = `holux_customer_coupons_wallet_${customer.id}`;
          const currentIdWallet = JSON.parse(localStorage.getItem(idKey) || '[]');
          const updatedIdWallet = [newEntry, ...currentIdWallet.filter(c => c.code !== activeCoupon.code)];
          localStorage.setItem(idKey, JSON.stringify(updatedIdWallet));
        }

        // 2. By customer Email
        if (customer?.email) {
          const emailKey = `holux_customer_coupons_wallet_${customer.email}`;
          const currentEmailWallet = JSON.parse(localStorage.getItem(emailKey) || '[]');
          const updatedEmailWallet = [newEntry, ...currentEmailWallet.filter(c => c.code !== activeCoupon.code)];
          localStorage.setItem(emailKey, JSON.stringify(updatedEmailWallet));
        }

        // Dispatch events for immediate UI reactivity
        window.dispatchEvent(new CustomEvent('holux_coupons_updated'));
        window.dispatchEvent(new Event('storage'));
      } catch (e) {
        console.error(e);
      }

      setAssignedSuccess(true);
      setStatusMessage(`¡Cupón "${activeCoupon.code}" asignado con éxito a la cuenta de ${customerName}! Cuando ingrese a la tienda le aparecerá listo para usar.`);
    } catch (err) {
      console.error(err);
      alert('Error al asignar el cupón: ' + (err.message || 'Error de conexión'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopied(true);
    setStatusMessage('¡Mensaje y cupón copiados al portapapeles!');
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  const handleSendWhatsApp = async () => {
    if (mode === 'new') {
      const ok = await handleCreateCustomCoupon();
      if (!ok) return;
    }

    const cleanPhone = targetPhone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(whatsappMessage);
    const waUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    
    window.open(waUrl, '_blank');
  };

  const handleCreateCustomCoupon = async () => {
    if (!customCode.trim()) {
      alert('Por favor ingresa un código de cupón.');
      return false;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/coupons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('holux_auth_token')}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          code: customCode.toUpperCase().trim(),
          type: customType,
          value: parseFloat(customValue),
          min_spend: parseFloat(customMinSpend) || 0,
          allowed_tier: 'all',
          origin: `Regalo Directo a ${customerName}`,
          description: customDescription,
          max_uses: 10,
          daysValid: parseInt(customDaysValid) || 14
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error al guardar el cupón.');
      }
      return true;
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error al crear cupón');
      return false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans text-gray-900">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 z-10 animate-in fade-in zoom-in duration-200 text-xs">
        
        {/* Header */}
        <div className="bg-[#1C2321] text-white px-6 py-4 flex items-center justify-between border-b border-[#3C6E71]/30">
          <div className="flex items-center gap-3">
            <span className="bg-amber-500 p-2 rounded-xl text-white font-bold shadow-md">
              <Gift className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <span>ENVIAR CUPÓN DE REGALO</span>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full border border-amber-500/30">
                  {customerName}
                </span>
              </h3>
              <p className="text-[11px] text-gray-300 mt-0.5">
                Para: <span className="font-bold text-white">{customer?.email}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg cursor-pointer text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 bg-gray-50 max-h-[80vh] overflow-y-auto">
          
          {/* Mode Selector */}
          <div className="flex rounded-xl bg-gray-200 p-1">
            <button
              type="button"
              onClick={() => setMode('existing')}
              className={`flex-1 py-2 text-center rounded-lg font-display font-bold text-xs transition-all cursor-pointer ${
                mode === 'existing' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🏷️ Usar Cupón Existente ({coupons.length})
            </button>
            <button
              type="button"
              onClick={() => setMode('new')}
              className={`flex-1 py-2 text-center rounded-lg font-display font-bold text-xs transition-all cursor-pointer ${
                mode === 'new' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ✨ Crear Cupón Personalizado
            </button>
          </div>

          {/* Mode 1: Existing Coupons */}
          {mode === 'existing' && (
            <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-200">
              <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block">
                Selecciona un cupón disponible:
              </label>
              {loading ? (
                <div className="text-gray-400 py-3 text-center">Cargando cupones...</div>
              ) : coupons.length === 0 ? (
                <div className="text-gray-500 py-3 text-center">
                  No hay cupones activos creados en la tienda. Cambia a la pestaña <b>"Crear Cupón Personalizado"</b>.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1">
                  {coupons.map(c => {
                    const isSelected = selectedCouponCode === c.code;
                    return (
                      <div
                        key={c.code}
                        onClick={() => setSelectedCouponCode(c.code)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/50 shadow-xs'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono-custom font-black text-sm text-gray-900">
                            {c.code}
                          </span>
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {c.type === 'percentage' ? `${c.value}% OFF` : `ARS $${c.value}`}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">
                          {c.description || 'Descuento tienda'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Create Custom Coupon */}
          {mode === 'new' && (
            <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block mb-1">
                    Código del Cupón
                  </label>
                  <input
                    type="text"
                    required
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                    placeholder="EJ: VALERIA20"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:border-amber-500 outline-none font-mono-custom font-bold text-gray-900 uppercase"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block mb-1">
                    Tipo de Descuento
                  </label>
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:border-amber-500 outline-none font-bold text-gray-800"
                  >
                    <option value="percentage">Porcentaje (% OFF)</option>
                    <option value="fixed">Monto Fijo (ARS $)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block mb-1">
                    Valor del Descuento ({customType === 'percentage' ? '%' : 'ARS $'})
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:border-amber-500 outline-none font-mono-custom font-bold text-gray-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block mb-1">
                    Días de Validez
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={customDaysValid}
                    onChange={(e) => setCustomDaysValid(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:border-amber-500 outline-none font-mono-custom font-bold text-gray-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Target Phone input */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-1.5">
            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block">
              📱 Teléfono / WhatsApp del Cliente (Opcional para aviso directo)
            </label>
            <input
              type="text"
              value={targetPhone}
              onChange={(e) => setTargetPhone(e.target.value)}
              placeholder="Ej: +54 9 11 2345-6789"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:border-emerald-500 outline-none font-mono-custom font-bold text-gray-800"
            />
          </div>

          {/* Preview of WhatsApp Message */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-emerald-900 font-bold text-[11px]">
              <span className="flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Vista Previa del Mensaje de Aviso:</span>
              </span>
              <span className="text-[9px] uppercase bg-emerald-200/60 text-emerald-800 px-1.5 py-0.5 rounded font-mono-custom">
                WhatsApp
              </span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-emerald-200/80 font-mono-custom text-[11px] text-gray-800 whitespace-pre-line leading-relaxed shadow-2xs">
              {whatsappMessage}
            </div>
          </div>

          {/* Feedback Status */}
          {statusMessage && (
            <div className={`p-3 rounded-xl text-center font-bold animate-in fade-in flex items-center justify-center gap-2 ${
              assignedSuccess 
                ? 'bg-emerald-100 border border-emerald-300 text-emerald-900 shadow-sm' 
                : 'bg-blue-100 border border-blue-300 text-blue-900'
            }`}>
              {assignedSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
              <span>{statusMessage}</span>
            </div>
          )}

          {/* PRIMARY ACTION BUTTON: Assign directly to client account */}
          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={handleAssignDirectlyToAccount}
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-display font-black text-xs tracking-wider uppercase transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer border border-amber-400/30 active:scale-[0.99] disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 fill-white text-white animate-pulse" />
              <span>
                {isSubmitting 
                  ? 'ASIGNANDO AL CLIENTE...' 
                  : `🎁 ASIGNAR Y ENVIAR DIRECTO A LA CUENTA DE ${customerName.toUpperCase()}`}
              </span>
            </button>

            {/* Secondary Notification Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleSendWhatsApp}
                disabled={isSubmitting}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-display font-bold text-xs tracking-wider uppercase transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar por WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleCopyMessage}
                className="py-2.5 px-3 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-display font-bold text-xs tracking-wider uppercase transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '¡Copiado!' : 'Copiar Mensaje y Código'}</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
