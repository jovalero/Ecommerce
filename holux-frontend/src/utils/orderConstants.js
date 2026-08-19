export const ORDER_STATUS_CONFIG = {
  created: {
    label: 'CREADO',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
    color: '#6B7280',
    stepIndex: 0
  },
  pending_review: {
    label: 'EN REVISIÓN',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    color: '#D97706',
    stepIndex: 1
  },
  paid: {
    label: 'PAGADO',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    color: '#059669',
    stepIndex: 1
  },
  preparing: {
    label: 'EN PREPARACIÓN',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    color: '#2563EB',
    stepIndex: 2
  },
  shipped: {
    label: 'DESPACHADO',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
    color: '#7C3AED',
    stepIndex: 3
  },
  delivered: {
    label: 'ENTREGADO',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    color: '#059669',
    stepIndex: 4
  },
  rejected: {
    label: 'RECHAZADO',
    badgeClass: 'bg-red-100 text-red-800 border-red-300',
    color: '#DC2626',
    stepIndex: -1
  },
  cancelled: {
    label: 'CANCELADO',
    badgeClass: 'bg-gray-100 text-gray-500 border-gray-300',
    color: '#9CA3AF',
    stepIndex: -1
  }
};

export const getOrderStatusInfo = (status) => {
  return ORDER_STATUS_CONFIG[status] || {
    label: (status || 'DESCONOCIDO').toUpperCase(),
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
    color: '#6B7280',
    stepIndex: 0
  };
};

export const parseOrderItems = (order) => {
  if (!order) return [];
  if (Array.isArray(order.order_items) && order.order_items.length > 0) return order.order_items;
  if (Array.isArray(order.items) && order.items.length > 0) return order.items;
  if (typeof order.items === 'string') {
    try {
      const parsed = JSON.parse(order.items);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
};

export const formatMoney = (amount) => {
  const num = Number(amount) || 0;
  return `$${Math.round(num).toLocaleString('es-AR')}`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};
