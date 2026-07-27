import http from 'http';

const PORT = 8000;

const CATEGORIES = [
  { id: 1, name: "Trekking", slug: "trekking" },
  { id: 2, name: "Camping", slug: "camping" },
  { id: 3, name: "Calzado", slug: "calzado" },
  { id: 4, name: "Accesorios", slug: "accesorios" }
];

const PRODUCTS = [
  {
    id: 1,
    name: "Campera Cortavientos Fitz Roy",
    brand: "Holux Gear",
    price: 89000,
    installments: 6,
    stock: 15,
    category_id: 1,
    categories: { id: 1, name: "Trekking", slug: "trekking" },
    description: "Campera de alta montaña con membrana impermeable Gore-Tex y costuras selladas térmicamente."
  },
  {
    id: 2,
    name: "Pantalón Técnico Lanín",
    brand: "Holux Gear",
    price: 62000,
    installments: 6,
    stock: 20,
    category_id: 1,
    categories: { id: 1, name: "Trekking", slug: "trekking" },
    description: "Pantalón antidesgarro con protección UV50+ y secado rápido para senderismo."
  },
  {
    id: 3,
    name: "Carpa Domo Refugio 2P",
    brand: "Holux Gear",
    price: 145000,
    installments: 6,
    stock: 8,
    category_id: 2,
    categories: { id: 2, name: "Camping", slug: "camping" },
    description: "Carpa ligera de duraluminio probada contra vientos patagónicos de más de 90 km/h."
  },
  {
    id: 4,
    name: "Bolsa de Dormir Alpamayo -10°C",
    brand: "Holux Gear",
    price: 78000,
    installments: 6,
    stock: 12,
    category_id: 2,
    categories: { id: 2, name: "Camping", slug: "camping" },
    description: "Bolsa de dormir anatómica de pluma sintética ultra compacta."
  },
  {
    id: 5,
    name: "Botas de Trekking Tronador",
    brand: "Holux Footwear",
    price: 110000,
    installments: 6,
    stock: 14,
    category_id: 3,
    categories: { id: 3, name: "Calzado", slug: "calzado" },
    description: "Botas técnicas con suela Vibram de alta tracción y protección de cuero hidrofugado."
  },
  {
    id: 6,
    name: "Mochila Cordillera 65L",
    brand: "Holux Gear",
    price: 95000,
    installments: 6,
    stock: 10,
    category_id: 4,
    categories: { id: 4, name: "Accesorios", slug: "accesorios" },
    description: "Mochila ergonómica de 65 litros con estructura de aluminio ligero y funda de lluvia."
  },
  {
    id: 7,
    name: "Bastones de Trekking Trail",
    brand: "Holux Gear",
    price: 28000,
    installments: 3,
    stock: 25,
    category_id: 4,
    categories: { id: 4, name: "Accesorios", slug: "accesorios" },
    description: "Par de bastones telescópicos antishock con empuñadura de corcho natural."
  },
  {
    id: 8,
    name: "Termo Acero Inox 1L",
    brand: "Holux Gear",
    price: 34000,
    installments: 3,
    stock: 30,
    category_id: 4,
    categories: { id: 4, name: "Accesorios", slug: "accesorios" },
    description: "Termo de doble pared al vacío que mantiene el calor hasta por 36 horas seguidas."
  }
];

let ORDERS = [
  {
    id: 'HLX-849201',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    customer_name: 'Lucía Fernández',
    customer_email: 'lucia.fernandez@gmail.com',
    total: 184000,
    subtotal: 152066.11,
    tax_amount: 31933.89,
    status: 'paid',
    payment_method: 'MercadoPago',
    shipping_address: 'Av. Libertador 2450, 4º B, CABA',
    receipt_url: null,
    rejection_reason: null,
    order_items: [
      { id: 'item-1', product_name: 'Campera Cortavientos Fitz Roy', quantity: 1, unit_price: 89000 },
      { id: 'item-2', product_name: 'Mochila Cordillera 65L', quantity: 1, unit_price: 95000 }
    ]
  },
  {
    id: 'HLX-849202',
    created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    customer_name: 'Martín Palermo',
    customer_email: 'martin.palermo@gmail.com',
    total: 165600,
    subtotal: 136859.50,
    tax_amount: 28740.50,
    status: 'pending_review',
    payment_method: 'transfer',
    shipping_address: 'Calle San Martín 120, Bariloche, Río Negro',
    receipt_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    rejection_reason: null,
    order_items: [
      { id: 'item-3', product_name: 'Carpa Domo Refugio 2P', quantity: 1, unit_price: 145000 }
    ]
  }
];

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {
    res.setHeader('Content-Type', 'application/json');

    if (pathname === '/api/categories' && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify(CATEGORIES));
      return;
    }

    if (pathname === '/api/products' && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify(PRODUCTS));
      return;
    }

    if (pathname === '/api/me' && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify({
        id: 'usr-1001',
        email: 'usuario@holux.com',
        full_name: 'Lucía Fernández',
        role: 'client',
        phone: '+54 9 11 4521-8899',
        is_vip: true
      }));
      return;
    }

    if ((pathname === '/api/me/orders' || pathname === '/api/admin/orders') && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify(ORDERS));
      return;
    }

    if (pathname.startsWith('/api/orders/') && req.method === 'GET') {
      const orderId = pathname.replace('/api/orders/', '').split('/')[0];
      const found = ORDERS.find(o => String(o.id) === String(orderId));
      if (found) {
        res.writeHead(200);
        res.end(JSON.stringify(found));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ message: 'Pedido no encontrado.' }));
      }
      return;
    }

    // POST /api/orders - Order creation with strict status enum
    if (pathname === '/api/orders' && req.method === 'POST') {
      try {
        const payload = JSON.parse(body || '{}');
        const isTransfer = payload.payment_method === 'transfer';
        const initialStatus = isTransfer && payload.receipt_url ? 'pending_review' : 'pending_payment';

        const newOrder = {
          id: `HLX-${Math.floor(100000 + Math.random() * 900000)}`,
          created_at: new Date().toISOString(),
          customer_name: payload.customer_name || 'Cliente Holux',
          customer_email: payload.customer_email || 'cliente@holux.com',
          total: payload.total_amount || 89000,
          status: initialStatus,
          payment_method: payload.payment_method || 'card',
          shipping_address: payload.shipping_address || 'Entrega a Domicilio',
          receipt_url: payload.receipt_url || null,
          rejection_reason: null,
          order_items: payload.items || [
            { id: 'item-new', product_name: 'Campera Cortavientos Fitz Roy', quantity: 1, unit_price: 89000 }
          ]
        };

        ORDERS.unshift(newOrder);

        // Simulate credit card webhook auto-approval after 3 seconds for card payments
        if (!isTransfer) {
          setTimeout(() => {
            newOrder.status = 'paid';
          }, 3000);
        }

        res.writeHead(201);
        res.end(JSON.stringify({ order: newOrder }));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ message: 'Formato de pedido inválido.' }));
      }
      return;
    }

    // POST /api/process_order - Mercado Pago Card Brick Submission
    if ((pathname === '/api/process_order' || pathname === '/api/orders/process-payment') && req.method === 'POST') {
      try {
        const payload = JSON.parse(body || '{}');
        res.writeHead(200);
        res.end(JSON.stringify({
          status: 'approved',
          status_detail: 'accredited',
          id: Math.floor(1000000000 + Math.random() * 9000000000),
          order_id: `HLX-${Math.floor(100000 + Math.random() * 900000)}`,
          message: '¡Pago procesado con éxito vía Mercado Pago Bricks!',
          received_payload: payload
        }));
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ message: 'Error procesando Brick de Mercado Pago.' }));
      }
      return;
    }

    // PATCH /api/admin/orders/:id - Status update by Admin
    if (pathname.startsWith('/api/admin/orders/') && req.method === 'PATCH') {
      const orderId = pathname.replace('/api/admin/orders/', '');
      try {
        const payload = JSON.parse(body || '{}');
        const targetOrder = ORDERS.find(o => String(o.id) === String(orderId));
        if (targetOrder) {
          if (payload.status) targetOrder.status = payload.status;
          if (payload.rejection_reason !== undefined) targetOrder.rejection_reason = payload.rejection_reason;
          res.writeHead(200);
          res.end(JSON.stringify(targetOrder));
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ message: 'Pedido no encontrado.' }));
        }
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ message: 'Error al actualizar pedido.' }));
      }
      return;
    }

    if (pathname === '/api/admin/dashboard' && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify({
        total_sales: 1245000,
        total_orders: ORDERS.length,
        total_customers: 28,
        active_products: PRODUCTS.length
      }));
      return;
    }

    // Fallback default response
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', message: 'API active on port 8000' }));
  });
});

server.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
});
