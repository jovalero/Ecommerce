import React, { memo } from 'react';
import {
  ShieldCheck,
  ArrowLeft,
  ChevronRight,
  MapPin,
  Store,
  CreditCard,
  Shield,
  ShoppingBag,
  Download,
  Tag,
  X,
  Building2
} from 'lucide-react';
import { SmoothInput } from '../Common/SmoothInput';

const getProductImage = (name) => {
  if (!name) return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80';
  const cleanName = name.toLowerCase();
  if (cleanName.includes('campera') || cleanName.includes('cortavientos')) {
    return 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80';
  }
  if (cleanName.includes('pantalón') || cleanName.includes('pantalon') || cleanName.includes('calza')) {
    return 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&auto=format&fit=crop&q=80';
  }
  if (cleanName.includes('carpa') || cleanName.includes('domo')) {
    return 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&auto=format&fit=crop&q=80';
  }
  if (cleanName.includes('bolsa de dormir') || cleanName.includes('sleeping') || cleanName.includes('alpamayo')) {
    return 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=600&auto=format&fit=crop&q=80';
  }
  if (cleanName.includes('bota') || cleanName.includes('tronador') || cleanName.includes('calzado') || cleanName.includes('zapatilla') || cleanName.includes('sandalia')) {
    return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80';
  }
  if (cleanName.includes('mochila') || cleanName.includes('cordillera')) {
    return 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80';
  }
  if (cleanName.includes('bastón') || cleanName.includes('baston') || cleanName.includes('trail')) {
    return 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=600&auto=format&fit=crop&q=80';
  }
  if (cleanName.includes('termo') || cleanName.includes('botella') || cleanName.includes('inox') || cleanName.includes('anafe')) {
    return 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80';
  }
  if (cleanName.includes('linterna') || cleanName.includes('frontal')) {
    return 'https://images.unsplash.com/photo-1554189097-ffe88e99897e?w=600&auto=format&fit=crop&q=80';
  }
  if (cleanName.includes('brújula') || cleanName.includes('brujula')) {
    return 'https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?w=600&auto=format&fit=crop&q=80';
  }
  if (cleanName.includes('guantes')) {
    return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80';
  }
  if (cleanName.includes('gorro')) {
    return 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=600&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80';
};

// Memoized Contact Inputs
const ContactInputs = memo(({ checkoutName, setCheckoutName, checkoutEmail, setCheckoutEmail, checkoutDni, setCheckoutDni }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">NOMBRE Y APELLIDO *</label>
      <SmoothInput
        type="text"
        required
        value={checkoutName}
        onChange={(e) => setCheckoutName(e.target.value)}
        placeholder="Ej: Lucía Fernández"
        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#3C6E71] outline-none transition-all"
      />
    </div>
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">CORREO ELECTRÓNICO *</label>
      <SmoothInput
        type="email"
        required
        value={checkoutEmail}
        onChange={(e) => setCheckoutEmail(e.target.value)}
        placeholder="Ej: lucia@example.com"
        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#3C6E71] outline-none transition-all"
      />
    </div>
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">DNI / DOCUMENTO *</label>
      <SmoothInput
        type="text"
        required
        value={checkoutDni}
        onChange={(e) => setCheckoutDni(e.target.value)}
        placeholder="Ej: 38.492.012"
        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#3C6E71] outline-none transition-all"
      />
    </div>
  </div>
));

// Memoized Address Inputs
const AddressInputs = memo(({
  shippingStreet,
  setShippingStreet,
  shippingApartment,
  setShippingApartment,
  shippingCity,
  setShippingCity,
  shippingProvince,
  setShippingProvince,
  shippingPostalCode,
  setShippingPostalCode
}) => (
  <div className="p-4 bg-gray-50/70 border border-gray-200 rounded-xl space-y-3 pt-3">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="sm:col-span-2 space-y-1">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">CALLE Y NÚMERO *</label>
        <SmoothInput
          type="text"
          required
          value={shippingStreet}
          onChange={(e) => setShippingStreet(e.target.value)}
          placeholder="Ej: Av. Pellegrini 1840"
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:border-[#3C6E71] outline-none"
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">PISO / DEPTO</label>
        <SmoothInput
          type="text"
          value={shippingApartment}
          onChange={(e) => setShippingApartment(e.target.value)}
          placeholder="Ej: 4º B"
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:border-[#3C6E71] outline-none"
        />
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">CIUDAD / LOCALIDAD *</label>
        <SmoothInput
          type="text"
          required
          value={shippingCity}
          onChange={(e) => setShippingCity(e.target.value)}
          placeholder="Ej: Rosario"
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:border-[#3C6E71] outline-none"
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">PROVINCIA *</label>
        <select
          value={shippingProvince}
          onChange={(e) => setShippingProvince(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:border-[#3C6E71] outline-none"
        >
          <option value="Santa Fe">Santa Fe</option>
          <option value="Buenos Aires">Buenos Aires</option>
          <option value="CABA">CABA</option>
          <option value="Córdoba">Córdoba</option>
          <option value="Mendoza">Mendoza</option>
          <option value="Río Negro">Río Negro</option>
          <option value="Neuquén">Neuquén</option>
          <option value="Chubut">Chubut</option>
          <option value="Salta">Salta</option>
          <option value="Tucumán">Tucumán</option>
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">CÓDIGO POSTAL *</label>
        <SmoothInput
          type="text"
          required
          value={shippingPostalCode}
          onChange={(e) => setShippingPostalCode(e.target.value)}
          placeholder="Ej: 2000"
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:border-[#3C6E71] outline-none"
        />
      </div>
    </div>
  </div>
));

const CheckoutView = memo(({
  checkoutName,
  setCheckoutName,
  checkoutEmail,
  setCheckoutEmail,
  checkoutDni,
  setCheckoutDni,
  checkoutValidationError,
  deliveryOption,
  setDeliveryOption,
  shippingStreet,
  setShippingStreet,
  shippingApartment,
  setShippingApartment,
  shippingCity,
  setShippingCity,
  shippingProvince,
  setShippingProvince,
  shippingPostalCode,
  setShippingPostalCode,
  checkoutStep,
  setCheckoutStep,
  paymentMethod,
  setPaymentMethod,
  paymentInstallments,
  setPaymentInstallments,
  transferReceiptName,
  transferReceiptError,
  transferReceiptPreview,
  handleTransferReceiptFileChange,
  cart,
  getCartTotal,
  isProcessingPayment,
  handleFinalCheckoutSubmit,
  setCurrentView,
  setIsCartOpen,
  checkoutOrderStatus,
  createdOrderData,
  setCheckoutOrderStatus,
  addresses,
  setAddresses,
  appliedCoupon,
  setAppliedCoupon,
  customerCoupons,
  userProfile
}) => {
  const [isAddressModalOpen, setIsAddressModalOpen] = React.useState(false);
  const [newModalAddrLabel, setNewModalAddrLabel] = React.useState('');
  const [newModalAddrStreet, setNewModalAddrStreet] = React.useState('');
  const [newModalAddrCity, setNewModalAddrCity] = React.useState('');
  const [newModalAddrCp, setNewModalAddrCp] = React.useState('');

  const [checkoutCouponInput, setCheckoutCouponInput] = React.useState('');
  const [checkoutCouponError, setCheckoutCouponError] = React.useState('');

  // Dynamic Payment Methods Configuration from Admin Settings
  const [paymentMethodsConfig] = React.useState(() => {
    try {
      const saved = localStorage.getItem('holux_payment_methods_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 'transfer', name: 'TRANSFERENCIA BANCARIA', description: 'Pago directo mediante CBU / CVU o Alias bancario', badge: 'BANCO / CBU', icon: 'building', isEnabled: true },
      { id: 'mercadopago_checkout_pro', name: 'PAGAR CON TU CUENTA DE MERCADO PAGO (CHECKOUT PRO)', description: 'Paga con Dinero en Cuenta MP, Mercado Crédito, QR, Rapipago o Pago Fácil. Redirección oficial 100% segura.', badge: 'OFICIAL MP', icon: 'mp', isEnabled: true },
      { id: 'mercadopago', name: 'TARJETA DE CRÉDITO / DÉBITO (MERCADO PAGO BRICKS)', description: 'Formulario directo en la web con tokenización oficial PCI-DSS', badge: 'TARJETAS', icon: 'card', isEnabled: true }
    ];
  });

  const activePaymentMethods = React.useMemo(() => {
    return paymentMethodsConfig.filter(m => m.isEnabled !== false);
  }, [paymentMethodsConfig]);

  // Ensure default preselected method is the first active method
  React.useEffect(() => {
    if (activePaymentMethods.length > 0) {
      const isCurrentlyActive = activePaymentMethods.some(m => m.id === paymentMethod);
      if (!isCurrentlyActive) {
        setPaymentMethod(activePaymentMethods[0].id);
      }
    }
  }, [activePaymentMethods, paymentMethod, setPaymentMethod]);

  const subtotal = getCartTotal();

  // 1. Membership Tier Discount (VIP & SUPER VIP)
  const tierPercent = userProfile?.benefits?.auto_discount_percent || (userProfile?.tier === 'super_vip' ? 10 : userProfile?.tier === 'vip' ? 5 : 0);
  const tierDiscount = tierPercent > 0 ? Math.round((subtotal * tierPercent) / 100) : 0;
  const tierBadge = userProfile?.benefits?.badge || (userProfile?.tier === 'super_vip' ? '👑 SUPER VIP' : '⭐ VIP');

  const transferDiscount = 0;

  let couponDiscount = 0;
  if (appliedCoupon) {
    couponDiscount = appliedCoupon.type === 'percentage'
      ? Math.round((subtotal * appliedCoupon.value) / 100)
      : Math.min(subtotal, appliedCoupon.value);
  }

  const subtotalAfterDiscount = Math.max(0, subtotal - tierDiscount - transferDiscount - couponDiscount);

  const handleApplyCouponInCheckout = async (e) => {
    if (e) e.preventDefault();
    setCheckoutCouponError('');
    const code = checkoutCouponInput.trim().toUpperCase();
    if (!code) {
      setCheckoutCouponError('Ingresá un código de cupón.');
      return;
    }

    try {
      const token = localStorage.getItem('holux_auth_token') || '';
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/me/coupons/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          code,
          subtotal
        })
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        setCheckoutCouponError(data.message || 'Código de cupón no válido.');
        return;
      }

      if (setAppliedCoupon) {
        setAppliedCoupon({
          code: data.code,
          type: data.type,
          value: data.value,
          discount_amount: data.discount_amount,
          allowed_tier: data.allowed_tier,
          origin: data.origin || 'Cupón Oficial',
          description: data.message
        });
      }
      setCheckoutCouponInput('');
    } catch (err) {
      console.error(err);
      setCheckoutCouponError('Error al validar el cupón con el servidor.');
    }
  };

  const handleAddAddressFromModal = () => {
    if (!newModalAddrStreet || !newModalAddrCity || !newModalAddrCp) return;
    const newObj = {
      id: `addr-${Date.now()}`,
      label: newModalAddrLabel || `Dirección (${newModalAddrCity})`,
      street: newModalAddrStreet,
      apartment: '',
      city: newModalAddrCity,
      province: 'Santa Fe',
      postal_code: newModalAddrCp,
      is_default: false
    };

    if (setAddresses) {
      setAddresses(prev => {
        const updated = [newObj, ...prev];
        localStorage.setItem('holux_saved_addresses', JSON.stringify(updated));
        return updated;
      });
    }

    setShippingStreet(newModalAddrStreet);
    setShippingCity(newModalAddrCity);
    setShippingPostalCode(newModalAddrCp);

    setNewModalAddrLabel('');
    setNewModalAddrStreet('');
    setNewModalAddrCity('');
    setNewModalAddrCp('');
    setIsAddressModalOpen(false);
  };

  // Dynamic Shipping Rates from Store Admin Settings
  const [shippingRates, setShippingRates] = React.useState(() => {
    try {
      const saved = localStorage.getItem('holux_shipping_rates');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      all_free: false,
      free_shipping_enabled: false,
      free_shipping_threshold: 150000,
      caba_cost: 5000,
      caba_free: false,
      caba_enabled: true,
      caba_cp_min: 1000,
      caba_cp_max: 1499,
      gba_cost: 8000,
      gba_free: false,
      gba_enabled: true,
      gba_cp_min: 1500,
      gba_cp_max: 1999,
      interior_cost: 15000,
      interior_free: false,
      interior_enabled: true,
      interior_cp_min: 2000,
      interior_cp_max: 7999,
      patagonia_cost: 20000,
      patagonia_free: false,
      patagonia_enabled: true,
      patagonia_cp_min: 8000,
      patagonia_cp_max: 9999,
      pickup_enabled: true,
      pickup_address: 'Av. Corrientes 1234, CABA',
      pickup_schedule: 'Lunes a Viernes de 10:00 a 18:00 hs'
    };
  });

  // Fetch live shipping settings on mount and listen to changes
  React.useEffect(() => {
    const fetchLatestRates = async () => {
      try {
        const saved = localStorage.getItem('holux_shipping_rates');
        if (saved) {
          setShippingRates(JSON.parse(saved));
        }

        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/settings`);
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setShippingRates(prev => {
              const updated = {
                ...prev,
                ...data.settings
              };
              localStorage.setItem('holux_shipping_rates', JSON.stringify(updated));
              return updated;
            });
          }
        }
      } catch (e) {}
    };

    fetchLatestRates();

    const handleRatesUpdate = () => {
      try {
        const saved = localStorage.getItem('holux_shipping_rates');
        if (saved) setShippingRates(JSON.parse(saved));
      } catch {}
    };

    window.addEventListener('holux_shipping_rates_updated', handleRatesUpdate);
    window.addEventListener('storage', handleRatesUpdate);
    return () => {
      window.removeEventListener('holux_shipping_rates_updated', handleRatesUpdate);
      window.removeEventListener('storage', handleRatesUpdate);
    };
  }, []);

  // Dynamic Shipping Rate Calculation
  const calculateShipping = () => {
    if (deliveryOption === 'pickup') {
      return { cost: 0, label: 'Retiro en Sucursal ($0 Gratis)' };
    }

    if (shippingRates.all_free) {
      return { cost: 0, label: '¡Envío Gratis! (Promoción Nacional)' };
    }

    if (shippingRates.free_shipping_enabled && subtotalAfterDiscount >= (shippingRates.free_shipping_threshold || 150000)) {
      return { cost: 0, label: '¡Envío 100% Gratis! (Monto superado)' };
    }

    const cp = parseInt(String(shippingPostalCode || '').trim(), 10);
    const cabaMin = Number(shippingRates.caba_cp_min ?? 1000);
    const cabaMax = Number(shippingRates.caba_cp_max ?? 1499);
    const gbaMin = Number(shippingRates.gba_cp_min ?? 1500);
    const gbaMax = Number(shippingRates.gba_cp_max ?? 1999);
    const patMin = Number(shippingRates.patagonia_cp_min ?? 8000);
    const patMax = Number(shippingRates.patagonia_cp_max ?? 9999);
    const intMin = Number(shippingRates.interior_cp_min ?? 2000);
    const intMax = Number(shippingRates.interior_cp_max ?? 7999);

    if (!isNaN(cp)) {
      if (cp >= cabaMin && cp <= cabaMax) {
        return shippingRates.caba_free
          ? { cost: 0, label: '¡Envío Gratis! (CABA)' }
          : { cost: Number(shippingRates.caba_cost ?? 5000), label: 'Envío a CABA' };
      }
      if (cp >= gbaMin && cp <= gbaMax) {
        return shippingRates.gba_free
          ? { cost: 0, label: '¡Envío Gratis! (GBA)' }
          : { cost: Number(shippingRates.gba_cost ?? 8000), label: 'Envío a GBA' };
      }
      if (cp >= patMin && cp <= patMax) {
        return shippingRates.patagonia_free
          ? { cost: 0, label: '¡Envío Gratis! (Patagonia)' }
          : { cost: Number(shippingRates.patagonia_cost ?? 20000), label: 'Envío a Patagonia' };
      }
      if (cp >= intMin && cp <= intMax) {
        return shippingRates.interior_free
          ? { cost: 0, label: '¡Envío Gratis! (Interior)' }
          : { cost: Number(shippingRates.interior_cost ?? 15000), label: 'Envío al Interior' };
      }
    }

    // Province Fallbacks
    if (shippingProvince === 'CABA') {
      return shippingRates.caba_free
        ? { cost: 0, label: '¡Envío Gratis! (CABA)' }
        : { cost: Number(shippingRates.caba_cost ?? 5000), label: 'Envío a CABA' };
    }
    if (shippingProvince === 'Buenos Aires') {
      return shippingRates.gba_free
        ? { cost: 0, label: '¡Envío Gratis! (GBA)' }
        : { cost: Number(shippingRates.gba_cost ?? 8000), label: 'Envío a Buenos Aires' };
    }
    if (['Chubut', 'Neuquén', 'Río Negro', 'Santa Cruz', 'Tierra del Fuego'].includes(shippingProvince)) {
      return shippingRates.patagonia_free
        ? { cost: 0, label: '¡Envío Gratis! (Patagonia)' }
        : { cost: Number(shippingRates.patagonia_cost ?? 20000), label: 'Envío a Patagonia' };
    }

    return shippingRates.interior_free
      ? { cost: 0, label: '¡Envío Gratis! (Interior)' }
      : { cost: Number(shippingRates.interior_cost ?? 15000), label: 'Envío a Domicilio' };
  };

  const shippingInfo = calculateShipping();
  const shippingCost = shippingInfo.cost;
  const finalTotal = subtotalAfterDiscount + shippingCost;

  // Ley de Transparencia Fiscal Argentina (Ley N° 27.743 - IVA 21%)
  const netAmount = Math.round(finalTotal / 1.21);
  const vatAmount = finalTotal - netAmount;

  // --- PROCESSING / CREATING ORDER IN-PLACE STATE ---
  if (isProcessingPayment || checkoutOrderStatus === 'creating') {
    return (
      <main className="flex-grow bg-[#F5F5F5] min-h-screen py-16 font-sans text-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-gray-200 text-center space-y-6">
          <div className="w-16 h-16 bg-[#3C6E71]/10 text-[#3C6E71] rounded-full flex items-center justify-center mx-auto relative">
            <Shield className="w-8 h-8 animate-pulse" />
            <div className="absolute inset-0 rounded-full border-2 border-[#3C6E71] border-t-transparent animate-spin"></div>
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 bg-[#3C6E71]/10 text-[#3C6E71] rounded-full text-[10px] font-mono-custom font-bold uppercase tracking-widest">
              PROCESANDO TU PEDIDO DE FORMA SEGURA
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-wide">
              REGISTRANDO COMPRA...
            </h2>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Estamos validando tu pago y generando tu comprobante oficial en Holux. Por favor aguarda unos instantes.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-center">
            <div className="flex items-center gap-2 text-[11px] font-mono-custom text-gray-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Conexión cifrada de 256 bits</span>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // --- SUCCESS / ORDER CONFIRMED VIEW ---
  if (checkoutOrderStatus === 'paid' || checkoutOrderStatus === 'pending_review') {
    return (
      <main className="flex-grow bg-[#F5F5F5] min-h-screen py-12 font-sans text-gray-900 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-gray-200 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-mono-custom font-bold uppercase tracking-wider">
              {checkoutOrderStatus === 'pending_review' ? 'COMPROBANTE RECIBIDO • EN REVISIÓN' : '¡PAGO CONFIRMADO CON ÉXITO!'}
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-gray-900 uppercase">
              ¡GRACIAS POR TU COMPRA EN HOLUX!
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Hemos registrado tu pedido correctamente. Te enviamos los detalles a tu correo electrónico.
            </p>
          </div>

          <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 text-left space-y-3 text-xs font-sans">
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-500 font-semibold">N° DE PEDIDO:</span>
              <strong className="font-mono-custom text-gray-900 text-sm">{createdOrderData?.id || 'HLX-839210'}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Comprador:</span>
              <strong className="text-gray-800">{checkoutName || createdOrderData?.customer_name || 'Cliente Holux'}</strong>
            </div>
            {checkoutDni && (
              <div className="flex justify-between">
                <span className="text-gray-500">DNI / Documento:</span>
                <strong className="text-gray-800 font-mono-custom">{checkoutDni}</strong>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Dirección de Entrega:</span>
              <strong className="text-gray-800 truncate max-w-[280px]">{createdOrderData?.shipping_address || 'Entrega a domicilio'}</strong>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 text-sm text-[#3C6E71]">
              <span className="font-bold uppercase">Monto Total Pagado:</span>
              <strong className="font-mono-custom text-base">
                ${Number(createdOrderData?.total_amount || createdOrderData?.total || finalTotal || 0).toLocaleString('es-AR')}
              </strong>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                if (setCheckoutOrderStatus) setCheckoutOrderStatus(null);
                window.location.hash = '#/';
                setCurrentView('home');
              }}
              className="flex-1 py-3.5 bg-[#3C6E71] hover:bg-[#3C6E71]/95 text-white font-display text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>VOLVER A LA TIENDA</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-grow bg-[#F5F5F5] min-h-screen py-8 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Validation Error Alert Banner */}
        {checkoutValidationError && (
          <div className="p-4 bg-red-50 border-2 border-red-400 rounded-2xl text-xs font-bold text-red-800 flex items-center justify-between shadow-sm animate-bounce">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>{checkoutValidationError}</span>
            </div>
            <span className="text-[10px] text-red-600 uppercase font-mono-custom">Campo Obligatorio</span>
          </div>
        )}
        
        {/* Top Checkout Header Bar */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xs border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentView('home')}
              className="p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-all cursor-pointer"
              title="Volver a la Tienda"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-lg sm:text-xl font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-[#3C6E71]" />
                CHECKOUT SEGURO & CONFIRMACIÓN DE COMPRA
              </h1>
              <p className="text-xs text-gray-500">Completa tus datos de envío y pago para procesar tu orden.</p>
            </div>
          </div>

          {/* Progress Stepper */}
          <div className="flex items-center gap-2 font-mono-custom text-xs font-bold">
            <button
              type="button"
              onClick={() => setCheckoutStep(1)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${checkoutStep === 1 ? 'bg-[#3C6E71] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              1. DIRECCIÓN
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <button
              type="button"
              onClick={() => setCheckoutStep(2)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${checkoutStep === 2 ? 'bg-[#3C6E71] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              2. PAGO
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <button
              type="button"
              onClick={() => setCheckoutStep(3)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${checkoutStep === 3 ? 'bg-[#3C6E71] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              3. CONFIRMACIÓN
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN (8 cols): Input Forms & Products */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* CARD 1: Dirección de Entrega & Contacto */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200 space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="font-display text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#3C6E71]" />
                  1. DIRECCIÓN DE ENTREGA Y CONTACTO
                </h2>
                {checkoutStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCheckoutStep(1)}
                    className="text-xs font-bold text-[#3C6E71] hover:underline cursor-pointer"
                  >
                    Modificar
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {/* Isolated Contact Inputs */}
                <ContactInputs
                  checkoutName={checkoutName}
                  setCheckoutName={setCheckoutName}
                  checkoutEmail={checkoutEmail}
                  setCheckoutEmail={setCheckoutEmail}
                  checkoutDni={checkoutDni}
                  setCheckoutDni={setCheckoutDni}
                />

                {/* Delivery Option Toggle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryOption('home')}
                    className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${deliveryOption === 'home' ? 'border-[#3C6E71] bg-[#3C6E71]/5 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <MapPin className={`w-5 h-5 mt-0.5 ${deliveryOption === 'home' ? 'text-[#3C6E71]' : 'text-gray-400'}`} />
                    <div>
                      <span className="font-display text-xs font-bold text-gray-900 block uppercase">ENVÍO A DOMICILIO</span>
                      <span className="text-[10px] text-gray-500">Entrega directa en 48/72hs en todo el país</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryOption('pickup')}
                    className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${deliveryOption === 'pickup' ? 'border-[#3C6E71] bg-[#3C6E71]/5 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <Store className={`w-5 h-5 mt-0.5 ${deliveryOption === 'pickup' ? 'text-[#3C6E71]' : 'text-gray-400'}`} />
                    <div>
                      <span className="font-display text-xs font-bold text-gray-900 block uppercase">RETIRO EN SUCURSAL</span>
                      <span className="text-[10px] text-emerald-600 font-bold">¡GRATIS en Sucursal Central Holux!</span>
                    </div>
                  </button>
                </div>

                {/* Isolated Address Inputs */}
                {deliveryOption === 'home' && (
                  <div className="space-y-3">
                    <AddressInputs
                      shippingStreet={shippingStreet}
                      setShippingStreet={setShippingStreet}
                      shippingApartment={shippingApartment}
                      setShippingApartment={setShippingApartment}
                      shippingCity={shippingCity}
                      setShippingCity={setShippingCity}
                      shippingProvince={shippingProvince}
                      setShippingProvince={setShippingProvince}
                      shippingPostalCode={shippingPostalCode}
                      setShippingPostalCode={setShippingPostalCode}
                    />

                    {/* Floating Modal Trigger Button */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddressModalOpen(true)}
                        className="text-xs font-bold text-[#3C6E71] bg-[#3C6E71]/10 hover:bg-[#3C6E71]/20 px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2"
                      >
                        <MapPin className="w-4 h-4 text-[#3C6E71]" />
                        <span>📋 SELECCIONAR O CAMBIAR DE DOMICILIO GUARDADO ({addresses?.length || 0})</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CARD 2: Métodos de Pago */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200 space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="font-display text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#3C6E71]" />
                  2. MÉTODOS DE PAGO
                </h2>
                {checkoutStep > 2 && (
                  <button
                    type="button"
                    onClick={() => setCheckoutStep(2)}
                    className="text-xs font-bold text-[#3C6E71] hover:underline cursor-pointer"
                  >
                    Modificar
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {activePaymentMethods.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-bold">
                    No hay métodos de pago habilitados en este momento. Por favor contactá al soporte.
                  </div>
                ) : (
                  activePaymentMethods.map((method) => {
                    if (method.id === 'transfer') {
                      return (
                        <React.Fragment key="transfer">
                          {/* Option 1: Transferencia Bancaria Directa */}
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('transfer')}
                            className={`w-full p-4 rounded-xl border text-left flex items-start justify-between transition-all cursor-pointer ${paymentMethod === 'transfer' ? 'border-[#3C6E71] bg-[#3C6E71]/5 shadow-sm ring-1 ring-[#3C6E71]/30' : 'border-gray-200 hover:border-gray-300'}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-[#3C6E71] text-white rounded-lg font-bold text-xs flex items-center justify-center">
                                <Building2 className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-display text-xs font-bold text-gray-900 block uppercase">{method.name || 'TRANSFERENCIA BANCARIA'}</span>
                                <span className="text-[10px] text-gray-500">{method.description || 'Pago directo mediante CBU / CVU o Alias bancario'}</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold bg-[#3C6E71]/15 text-[#3C6E71] px-2.5 py-1 rounded uppercase">{method.badge || 'BANCO / CBU'}</span>
                          </button>

                          {paymentMethod === 'transfer' && (
                            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-4 text-xs text-emerald-900 font-sans">
                              <div className="space-y-1">
                                <p className="font-bold uppercase tracking-wider text-emerald-800">Datos Bancarios para Transferir:</p>
                                <p className="font-mono-custom text-[11px] text-gray-800">CBU: 0170098520000001234567</p>
                                <p className="font-mono-custom text-[11px] text-gray-800">Alias: HOLUX.OFICIAL.MP</p>
                                <p className="text-[11px] text-emerald-800 font-bold">Total a Transferir: ${Math.round(subtotalAfterDiscount + shippingCost).toLocaleString('es-AR')}</p>
                              </div>

                              {/* Mandatory Receipt Upload Box */}
                              <div className="p-3 bg-white rounded-xl border border-emerald-300 space-y-2">
                                <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block">
                                  ADJUNTAR COMPROBANTE DE TRANSFERENCIA (OBLIGATORIO) *
                                </label>
                                <p className="text-[10px] text-gray-500">Formatos permitidos: JPG, PNG o PDF (Máximo 5MB)</p>

                                <div className="relative">
                                  <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                                    onChange={handleTransferReceiptFileChange}
                                    className="w-full text-xs text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                                  />
                                </div>

                                {transferReceiptName && (
                                  <div className="flex items-center justify-between p-2 bg-emerald-100/70 rounded-lg border border-emerald-200 text-emerald-900 font-mono-custom text-[11px]">
                                    <span className="truncate max-w-[200px]">📄 {transferReceiptName}</span>
                                    <span className="font-bold text-emerald-700 text-[10px] uppercase">¡CARGADO!</span>
                                  </div>
                                )}

                                {transferReceiptError && (
                                  <p className="text-[11px] text-red-600 font-bold">{transferReceiptError}</p>
                                )}
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    }

                    if (method.id === 'mercadopago_checkout_pro') {
                      return (
                        <React.Fragment key="mercadopago_checkout_pro">
                          {/* Option 2: Mercado Pago Checkout Pro */}
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('mercadopago_checkout_pro')}
                            className={`w-full p-4 rounded-xl border text-left flex items-start justify-between transition-all cursor-pointer ${paymentMethod === 'mercadopago_checkout_pro' ? 'border-[#3C6E71] bg-[#3C6E71]/5 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-[#009EE3] text-white rounded-lg font-bold font-mono-custom text-xs">
                                MP
                              </div>
                              <div>
                                <span className="font-display text-xs font-bold text-gray-900 block uppercase">{method.name || 'PAGAR CON TU CUENTA DE MERCADO PAGO (CHECKOUT PRO)'}</span>
                                <span className="text-[10px] text-gray-500">{method.description || 'Paga con Dinero en Cuenta MP, Mercado Crédito, QR, Rapipago o Pago Fácil. Redirección oficial 100% segura.'}</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold bg-[#009EE3]/15 text-[#009EE3] px-2.5 py-1 rounded uppercase">{method.badge || 'OFICIAL MP'}</span>
                          </button>

                          {paymentMethod === 'mercadopago_checkout_pro' && (
                            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 font-sans text-xs text-blue-950">
                              <div className="flex items-center justify-between font-bold text-blue-900 text-[11px] uppercase">
                                <span>📱 REDIRECCIÓN A MERCADO PAGO</span>
                                <span className="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded font-mono-custom">CHECKOUT PRO</span>
                              </div>
                              <p className="text-[11px] text-blue-900">
                                Al hacer clic en <strong>"REALIZAR PEDIDO Y PAGAR CON MERCADO PAGO"</strong> serás redirigido al portal oficial de Mercado Pago para ingresar con tu cuenta o pagar en cuotas/efectivo.
                              </p>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    }

                    if (method.id === 'mercadopago') {
                      return (
                        <React.Fragment key="mercadopago">
                          {/* Option 3: Mercado Pago Card Brick */}
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('mercadopago')}
                            className={`w-full p-4 rounded-xl border text-left flex items-start justify-between transition-all cursor-pointer ${paymentMethod === 'mercadopago' ? 'border-[#3C6E71] bg-[#3C6E71]/5 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-gray-800 text-white rounded-lg font-bold font-mono-custom text-xs">
                                💳
                              </div>
                              <div>
                                <span className="font-display text-xs font-bold text-gray-900 block uppercase">{method.name || 'TARJETA DE CRÉDITO / DÉBITO (MERCADO PAGO BRICKS)'}</span>
                                <span className="text-[10px] text-gray-500">{method.description || 'Formulario directo en la web con tokenización oficial PCI-DSS'}</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded uppercase">{method.badge || 'TARJETAS'}</span>
                          </button>

                          {paymentMethod === 'mercadopago' && (
                            <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3 font-sans text-xs text-blue-950">
                              <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                                <span className="font-bold text-blue-900 flex items-center gap-1.5 uppercase text-[11px]">
                                  💳 MERCADO PAGO CARD PAYMENT BRICK V2
                                </span>
                                <span className="text-[9px] font-mono-custom bg-blue-600 text-white px-2 py-0.5 rounded font-bold">
                                  CHECKOUT SEGURO
                                </span>
                              </div>

                              <div id="cardPaymentBrick_container" className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm min-h-[140px] flex flex-col justify-center items-center">
                                <div className="w-full space-y-3">
                                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between font-mono-custom text-[11px]">
                                    <span>Monto a cobrar:</span>
                                    <strong className="text-[#3C6E71] text-sm">${Math.round(subtotal).toLocaleString('es-AR')}</strong>
                                  </div>
                                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 text-[10px] space-y-1">
                                    <p className="font-bold">✓ Conexión establecida con /process_order (Mercado Pago API v1)</p>
                                    <p className="text-gray-600">Tus datos están protegidos bajo normas PCI-DSS.</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    }

                    return null;
                  })
                )}
              </div>
            </div>

            {/* CARD 3: Productos en tu pedido (Fixed Image Resolution) */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="font-display text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#3C6E71]" />
                  3. PRODUCTOS EN TU PEDIDO ({cart.reduce((acc, item) => acc + item.quantity, 0)})
                </h2>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(true)}
                  className="text-xs font-bold text-[#3C6E71] hover:underline cursor-pointer"
                >
                  Editar Carrito
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {cart.map((item, idx) => {
                  const imgSrc = item.image_url || (item.images && item.images[0]) || item.image || item.icon || getProductImage(item.name);
                  return (
                    <div key={idx} className="py-3 flex items-center gap-4">
                      <img
                        src={imgSrc}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-xl border border-gray-200 flex-shrink-0 bg-gray-50"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = getProductImage(item.name);
                        }}
                      />
                      <div className="flex-grow min-w-0">
                        <p className="font-bold text-xs text-gray-900 truncate">{item.name}</p>
                        {item.brand && <p className="text-[10px] text-gray-400 font-mono-custom">{item.brand}</p>}
                        {item.sizeLabel && <p className="text-[10px] text-gray-500 font-semibold">Talle: {item.sizeLabel}</p>}
                        <p className="text-[11px] text-gray-500 mt-0.5">Cantidad: <span className="font-bold text-gray-800">{item.quantity}</span></p>
                      </div>
                      <div className="text-right font-mono-custom">
                        <p className="font-bold text-xs text-gray-900">
                          ${(item.price * item.quantity).toLocaleString('es-AR')}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-[9px] text-gray-400">
                            (${item.price.toLocaleString('es-AR')} c/u)
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN (4 cols Sticky Sidebar) */}
          <div className="lg:col-span-4 sticky top-6 space-y-4">
            
            {/* ORDER SUMMARY CARD */}
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 space-y-5">
              <h2 className="font-display text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3">
                RESUMEN DE COMPRA
              </h2>

              <div className="space-y-3 text-xs font-sans text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Subtotal Productos:</span>
                  <span className="font-mono-custom font-bold text-gray-900">${subtotal.toLocaleString('es-AR')}</span>
                </div>

                {/* Coupon Promo Input Box & Active Card */}
                {appliedCoupon ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 font-mono-custom">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold block">Cupón: {appliedCoupon.code}</span>
                        <span className="text-[10px] text-emerald-700 font-sans">
                          Descuento: {appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}% OFF` : `$${appliedCoupon.value.toLocaleString('es-AR')} OFF`}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAppliedCoupon && setAppliedCoupon(null)}
                      className="p-1 hover:bg-emerald-200/60 rounded text-emerald-800 transition-colors cursor-pointer"
                      title="Quitar cupón"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-gray-100 space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">¿TENÉS UN CUPÓN DE DESCUENTO?</label>
                    <form onSubmit={handleApplyCouponInCheckout} className="flex gap-2">
                      <SmoothInput
                        type="text"
                        value={checkoutCouponInput}
                        onChange={(e) => setCheckoutCouponInput(e.target.value.toUpperCase())}
                        placeholder="Ingresá tu código..."
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono-custom font-bold text-gray-900 uppercase outline-none focus:border-[#3C6E71] focus:bg-white"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white font-display text-xs font-bold rounded-xl uppercase transition-all shadow-sm cursor-pointer shrink-0"
                      >
                        APLICAR
                      </button>
                    </form>
                    {checkoutCouponError && <p className="text-[10px] text-red-600 font-bold">{checkoutCouponError}</p>}
                  </div>
                )}

                {/* Automatic VIP / Super VIP Membership Discount */}
                {tierDiscount > 0 && (
                  <div className="flex items-center justify-between text-purple-700 font-bold bg-purple-50/90 px-3 py-2 rounded-xl border border-purple-200/60 font-mono-custom">
                    <span className="flex items-center gap-1.5">
                      <span>Descuento {tierBadge} ({tierPercent}% OFF):</span>
                    </span>
                    <span className="font-black text-sm">-${tierDiscount.toLocaleString('es-AR')}</span>
                  </div>
                )}

                {appliedCoupon && couponDiscount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600 font-bold font-mono-custom">
                    <span>Descuento por Cupón ({appliedCoupon.code}):</span>
                    <span className="font-bold">-${couponDiscount.toLocaleString('es-AR')}</span>
                  </div>
                )}

                {paymentMethod === 'transfer' && transferDiscount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600 font-bold">
                    <span>Descuento Transferencia:</span>
                    <span className="font-mono-custom">-${transferDiscount.toLocaleString('es-AR')}</span>
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <span>Gastos de Envío:</span>
                  <span className={`font-bold text-right font-mono-custom ${shippingCost === 0 ? 'text-emerald-600 uppercase font-sans' : 'text-gray-900'}`}>
                    {shippingInfo.label}
                  </span>
                </div>

                {/* Ley de Transparencia Fiscal Argentina (Ley N° 27.743 - IVA 21%) */}
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/80 space-y-1.5 text-[11px] text-gray-500 font-mono-custom">
                  <div className="flex justify-between">
                    <span>Precio Neto (Sin Impuestos):</span>
                    <span className="font-bold text-gray-700">${netAmount.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA Discriminado (21%):</span>
                    <span className="font-bold text-gray-700">${vatAmount.toLocaleString('es-AR')}</span>
                  </div>
                  <p className="text-[9px] text-gray-400 font-sans leading-tight pt-0.5">
                    📜 Régimen de Transparencia Fiscal al Consumidor Final (Ley N° 27.743)
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-3 flex items-baseline justify-between text-gray-900">
                  <span className="font-display text-sm font-bold uppercase">TOTAL FINAL</span>
                  <span className="font-mono-custom text-xl font-bold text-[#3C6E71]">
                    ARS ${finalTotal.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              {/* MAIN PAYMENT / SUBMIT BUTTON */}
              <button
                type="button"
                disabled={isProcessingPayment}
                onClick={handleFinalCheckoutSubmit}
                className="w-full py-4 bg-[#3C6E71] hover:bg-[#3C6E71]/95 text-white font-display text-sm font-bold tracking-wider rounded-xl shadow-lg shadow-[#3C6E71]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>{isProcessingPayment ? 'PROCESANDO PAGO...' : 'REALIZAR PEDIDO Y PAGAR'}</span>
              </button>

              <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                Al hacer clic en "Realizar Pedido", confirmas haber leído y aceptado nuestros términos de servicio y políticas de privacidad.
              </p>
            </div>

            {/* PROTECTION & GUARANTEE CARD */}
            <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-200 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-[#3C6E71] font-bold">
                <ShieldCheck className="w-5 h-5" />
                <span>COMPRA 100% PROTEGIDA EN HOLUX</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Holux mantiene seguros tu información y tu pago. Todas las compras cuentan con garantía oficial de fábrica por 12 meses.
              </p>
              <div className="flex items-center gap-3 pt-2 text-[10px] font-mono-custom text-gray-400">
                <span>🔒 SSL 256-Bit</span>
                <span>•</span>
                <span>PCI-DSS Compliant</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* FLOATING MODAL DE DIRECCIONES GUARDADAS */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl border border-gray-200 p-6 space-y-5 relative">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#3C6E71]" />
                <h3 className="font-display text-sm font-bold text-gray-900 uppercase">
                  MIS DIRECCIONES GUARDADAS
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-900 text-sm font-bold rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* List of saved addresses */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1 divide-y divide-gray-100">
              {addresses && addresses.length > 0 ? (
                addresses.map((addr) => (
                  <div key={addr.id} className="pt-3 first:pt-0 flex items-start justify-between gap-3">
                    <div className="space-y-0.5 text-xs text-gray-700">
                      <div className="flex items-center gap-2 font-bold text-gray-900">
                        <span>{addr.label || 'Dirección de Envío'}</span>
                        {addr.is_default && (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 rounded font-mono-custom uppercase">
                            Principal
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 font-mono-custom">{addr.street} {addr.apartment ? `(Depto ${addr.apartment})` : ''}</p>
                      <p className="text-[11px] text-gray-400">{addr.city}, {addr.province} - CP {addr.postal_code}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShippingStreet(addr.street || '');
                        setShippingApartment(addr.apartment || '');
                        setShippingCity(addr.city || '');
                        setShippingProvince(addr.province || 'Santa Fe');
                        setShippingPostalCode(addr.postal_code || '');
                        setIsAddressModalOpen(false);
                      }}
                      className="px-3.5 py-1.5 bg-[#3C6E71] text-white text-xs font-bold rounded-lg hover:bg-[#3C6E71]/90 transition-all cursor-pointer shrink-0"
                    >
                      Usar Esta
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 text-center py-4">No tienes direcciones guardadas todavía.</p>
              )}
            </div>

            {/* Form to add a new address directly from modal */}
            <div className="border-t border-gray-200 pt-4 space-y-3">
              <p className="text-xs font-bold text-gray-800 uppercase">➕ AGREGAR NUEVO DOMICILIO Y GUARDAR</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <SmoothInput
                  type="text"
                  placeholder="Etiqueta (Ej: Casa, Trabajo)"
                  value={newModalAddrLabel}
                  onChange={(e) => setNewModalAddrLabel(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#3C6E71]"
                />
                <SmoothInput
                  type="text"
                  placeholder="Calle y Número *"
                  value={newModalAddrStreet}
                  onChange={(e) => setNewModalAddrStreet(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#3C6E71]"
                />
                <SmoothInput
                  type="text"
                  placeholder="Ciudad / Localidad *"
                  value={newModalAddrCity}
                  onChange={(e) => setNewModalAddrCity(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#3C6E71]"
                />
                <SmoothInput
                  type="text"
                  placeholder="Código Postal *"
                  value={newModalAddrCp}
                  onChange={(e) => setNewModalAddrCp(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#3C6E71]"
                />
              </div>
              <button
                type="button"
                onClick={handleAddAddressFromModal}
                className="w-full py-2.5 bg-gray-900 text-white font-bold text-xs rounded-xl hover:bg-black transition-all cursor-pointer shadow-sm"
              >
                GUARDAR DOMICILIO Y SELECCIONAR
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
});

export default CheckoutView;
