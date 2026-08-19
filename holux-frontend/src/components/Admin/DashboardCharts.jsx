import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  AlertTriangle, 
  Package, 
  Users, 
  BarChart2,
  Calendar,
  CheckCircle2
} from 'lucide-react';

export default function DashboardCharts({ adminStats, productsList = [], ordersList = [] }) {
  const [timeframe, setTimeframe] = useState('year'); // 'day' | 'week' | 'month' | 'year'

  // Metric Totals from Backend or Real Orders List
  const totalRevenue = useMemo(() => {
    if (adminStats?.metrics?.total_revenue !== undefined) {
      return Number(adminStats.metrics.total_revenue);
    }
    return ordersList.reduce((acc, o) => acc + (Number(o.total) || Number(o.total_amount) || 0), 0);
  }, [adminStats, ordersList]);

  const totalOrders = useMemo(() => {
    if (adminStats?.metrics?.total_orders !== undefined) {
      return Number(adminStats.metrics.total_orders);
    }
    return ordersList.length;
  }, [adminStats, ordersList]);

  const avgTicket = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const totalCustomers = adminStats?.metrics?.total_customers || 1;

  // Real Chart Data grouped by Orders timestamp
  const chartData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed (7 is August)

    if (timeframe === 'day') {
      // 4 hourly buckets today
      const buckets = [
        { label: '00:00 - 06:00', sales: 0, orders: 0 },
        { label: '06:00 - 12:00', sales: 0, orders: 0 },
        { label: '12:00 - 18:00', sales: 0, orders: 0 },
        { label: '18:00 - 24:00', sales: 0, orders: 0 },
      ];

      ordersList.forEach(o => {
        if (!o.created_at) return;
        const d = new Date(o.created_at);
        if (d.toDateString() === now.toDateString()) {
          const hr = d.getHours();
          const amount = Number(o.total) || Number(o.total_amount) || 0;
          if (hr < 6) { buckets[0].sales += amount; buckets[0].orders += 1; }
          else if (hr < 12) { buckets[1].sales += amount; buckets[1].orders += 1; }
          else if (hr < 18) { buckets[2].sales += amount; buckets[2].orders += 1; }
          else { buckets[3].sales += amount; buckets[3].orders += 1; }
        }
      });
      return buckets;
    }

    if (timeframe === 'week') {
      // Last 7 days
      const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const buckets = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dayName = days[d.getDay()];
        const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;
        buckets.push({
          label: `${dayName} ${dateStr}`,
          dateKey: d.toDateString(),
          sales: 0,
          orders: 0
        });
      }

      ordersList.forEach(o => {
        if (!o.created_at) return;
        const d = new Date(o.created_at);
        const match = buckets.find(b => b.dateKey === d.toDateString());
        if (match) {
          match.sales += (Number(o.total) || Number(o.total_amount) || 0);
          match.orders += 1;
        }
      });
      return buckets;
    }

    if (timeframe === 'month') {
      // 4 Weeks of the current Month
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const currentMonthName = monthNames[currentMonth];
      const buckets = [
        { label: `Sem 1 (${currentMonthName})`, week: 1, sales: 0, orders: 0 },
        { label: `Sem 2 (${currentMonthName})`, week: 2, sales: 0, orders: 0 },
        { label: `Sem 3 (${currentMonthName})`, week: 3, sales: 0, orders: 0 },
        { label: `Sem 4 (${currentMonthName})`, week: 4, sales: 0, orders: 0 },
      ];

      ordersList.forEach(o => {
        if (!o.created_at) return;
        const d = new Date(o.created_at);
        if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
          const day = d.getDate();
          const amount = Number(o.total) || Number(o.total_amount) || 0;
          if (day <= 7) { buckets[0].sales += amount; buckets[0].orders += 1; }
          else if (day <= 14) { buckets[1].sales += amount; buckets[1].orders += 1; }
          else if (day <= 21) { buckets[2].sales += amount; buckets[2].orders += 1; }
          else { buckets[3].sales += amount; buckets[3].orders += 1; }
        }
      });
      return buckets;
    }

    // Default: 'year' -> 12 Months of the current year
    const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const buckets = monthLabels.map((lbl, idx) => ({
      label: lbl,
      monthIndex: idx,
      sales: 0,
      orders: 0
    }));

    ordersList.forEach(o => {
      if (!o.created_at) return;
      const d = new Date(o.created_at);
      if (d.getFullYear() === currentYear) {
        const m = d.getMonth();
        if (buckets[m]) {
          buckets[m].sales += (Number(o.total) || Number(o.total_amount) || 0);
          buckets[m].orders += 1;
        }
      }
    });

    return buckets;
  }, [ordersList, timeframe]);

  const maxSales = Math.max(...chartData.map(d => d.sales), 1);
  const totalChartPeriodSales = chartData.reduce((acc, c) => acc + c.sales, 0);
  const totalChartPeriodOrders = chartData.reduce((acc, c) => acc + c.orders, 0);

  // Low Stock Products
  const sortedByStockAsc = useMemo(() => {
    return [...productsList].sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0));
  }, [productsList]);

  const lowStockFiltered = sortedByStockAsc.filter(p => Number(p.stock) <= 10);
  const displayLowStock = lowStockFiltered.length > 0 ? lowStockFiltered : sortedByStockAsc.slice(0, 4);

  // Best and worst sellers
  const bestSellers = adminStats?.best_sellers || [];
  const worstSellers = useMemo(() => {
    return [...productsList].sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0)).slice(0, 5);
  }, [productsList]);

  return (
    <div className="space-y-6 text-left font-sans">
      
      {/* HEADER & TIMEFRAME SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-display font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#3C6E71]" />
            PANEL DE ANALÍTICA & DASHBOARD EN TIEMPO REAL
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Métricas 100% reales calculadas directamente de la base de datos de órdenes y stock.
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-display font-bold">
          {[
            { id: 'day', label: 'HOY' },
            { id: 'week', label: 'SEMANA' },
            { id: 'month', label: 'MES' },
            { id: 'year', label: 'AÑO' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTimeframe(t.id)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeframe === t.id 
                  ? 'bg-[#3C6E71] text-white shadow-sm font-bold' 
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* METRICS CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Facturación */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-5 rounded-2xl space-y-2 shadow-md">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold font-display uppercase tracking-wider">
            <span>FACTURACIÓN TOTAL</span>
            <DollarSign className="w-4 h-4 text-[#3C6E71]" />
          </div>
          <div className="text-2xl font-black font-mono-custom">
            ARS ${Math.round(totalRevenue).toLocaleString('es-AR')}
          </div>
          <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium pt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ventas reales confirmadas</span>
          </div>
        </div>

        {/* 2. Total Pedidos */}
        <div className="bg-white border border-gray-200 p-5 rounded-2xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-[10px] font-bold font-display uppercase tracking-wider">
            <span>CANTIDAD DE PEDIDOS</span>
            <ShoppingBag className="w-4 h-4 text-[#3C6E71]" />
          </div>
          <div className="text-2xl font-black font-mono-custom text-gray-900">
            {totalOrders}
          </div>
          <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium pt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{totalOrders} transacciones en sistema</span>
          </div>
        </div>

        {/* 3. Ticket Promedio */}
        <div className="bg-white border border-gray-200 p-5 rounded-2xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-[10px] font-bold font-display uppercase tracking-wider">
            <span>TICKET PROMEDIO</span>
            <TrendingUp className="w-4 h-4 text-[#B85C38]" />
          </div>
          <div className="text-2xl font-black font-mono-custom text-gray-900">
            ARS ${avgTicket.toLocaleString('es-AR')}
          </div>
          <div className="flex items-center gap-1 text-blue-600 text-xs font-medium pt-1">
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Calculado sobre {totalOrders} {totalOrders === 1 ? 'pedido' : 'pedidos'}</span>
          </div>
        </div>

        {/* 4. Clientes Totales */}
        <div className="bg-white border border-gray-200 p-5 rounded-2xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-[10px] font-bold font-display uppercase tracking-wider">
            <span>CLIENTES REGISTRADOS</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black font-mono-custom text-gray-900">
            {totalCustomers}
          </div>
          <div className="flex items-center gap-1 text-purple-600 text-xs font-medium pt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{totalCustomers} {totalCustomers === 1 ? 'cuenta activa' : 'cuentas activas'}</span>
          </div>
        </div>
      </div>

      {/* RENDERED CHART & LOW STOCK ALERT ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
        
        {/* REAL CHART CONTAINER (2 COLS) */}
        <div className="lg:col-span-2 bg-white border border-gray-200 p-5 sm:p-6 rounded-2xl space-y-4 shadow-sm min-w-0 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-2">
            <h3 className="font-display text-sm font-bold tracking-wider text-gray-900 uppercase flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#3C6E71]" />
              <span>EVOLUCIÓN DE INGRESOS Y VENTAS (DATOS REALES)</span>
            </h3>
            <span className="text-[11px] font-mono-custom text-[#3C6E71] font-bold bg-[#3C6E71]/10 px-2 py-0.5 rounded self-start sm:self-auto">
              {totalChartPeriodOrders} {totalChartPeriodOrders === 1 ? 'pedido' : 'pedidos'} (${totalChartPeriodSales.toLocaleString('es-AR')})
            </span>
          </div>

          {/* Real Bar Graph Container */}
          <div className="h-60 flex items-end justify-between gap-1 sm:gap-2 pt-8 pb-1 px-1 sm:px-2 w-full overflow-hidden">
            {chartData.map((d, i) => {
              const hasSales = d.sales > 0;
              const heightPercent = hasSales 
                ? Math.max(Math.round((d.sales / maxSales) * 100), 12) 
                : 4; // Flat base line if 0 sales

              return (
                <div key={i} className="flex-1 min-w-0 flex flex-col items-center justify-end h-full group relative">
                  {/* Tooltip on hover (Absolute so it doesn't break layout) */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[9px] font-mono-custom py-1 px-1.5 rounded shadow whitespace-nowrap pointer-events-none absolute bottom-[calc(100%+4px)] left-1/2 -translate-x-1/2 z-30">
                    {d.orders} ped. | ${d.sales.toLocaleString('es-AR')}
                  </div>
                  
                  {/* Bar */}
                  <div 
                    className={`w-full max-w-[42px] rounded-t transition-all duration-300 ${
                      hasSales 
                        ? 'bg-[#3C6E71] hover:bg-[#3C6E71]/80 shadow-sm' 
                        : 'bg-gray-200/80 hover:bg-gray-300'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                    title={`${d.label}: ${d.orders} pedidos ($${d.sales.toLocaleString('es-AR')})`}
                  />
                  
                  {/* Label */}
                  <span className={`text-[9px] sm:text-[10px] font-mono-custom font-bold uppercase truncate max-w-full text-center mt-1 ${
                    hasSales ? 'text-[#3C6E71] font-black' : 'text-gray-400'
                  }`}>
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* LOW STOCK ALERTS (1 COL) */}
        <div className="lg:col-span-1 bg-red-50/60 border border-red-200 p-5 sm:p-6 rounded-2xl space-y-4 shadow-sm text-left min-w-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-red-200 pb-3 text-red-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse shrink-0" />
              <h3 className="font-display text-sm font-bold tracking-wider uppercase truncate">
                ALERTAS DE STOCK BAJO
              </h3>
            </div>
            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-mono-custom shrink-0">
              {displayLowStock.length}
            </span>
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {displayLowStock.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">Todo el inventario tiene niveles óptimos de stock.</p>
            ) : (
              displayLowStock.map(prod => (
                <div key={prod.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-red-100 shadow-sm gap-2">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-800 truncate">{prod.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono-custom uppercase">{prod.brand || 'HOLUX'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs font-black font-mono-custom px-2 py-1 rounded border whitespace-nowrap ${
                      Number(prod.stock) <= 0 
                        ? 'text-red-700 bg-red-50 border-red-200' 
                        : Number(prod.stock) <= 5
                        ? 'text-amber-700 bg-amber-50 border-amber-200'
                        : 'text-gray-700 bg-gray-50 border-gray-200'
                    }`}>
                      {prod.stock} uds.
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RANKING BEST & WORST SELLERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* BEST SELLERS */}
        <div className="bg-white border border-gray-200 p-6 rounded-2xl space-y-4 shadow-sm">
          <h3 className="font-display text-sm font-bold tracking-wider text-gray-900 uppercase border-b border-gray-100 pb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            RANKING: PRODUCTOS MÁS VENDIDOS
          </h3>

          <div className="space-y-3">
            {bestSellers.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No hay registros de ventas suficientes aún.</p>
            ) : (
              bestSellers.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#3C6E71] text-white flex items-center justify-center text-xs font-black font-mono-custom">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-gray-800 line-clamp-1">{item.name}</p>
                      <p className="text-[10px] text-gray-400">{item.brand}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-900 font-mono-custom block">
                      {item.quantity_sold} {item.quantity_sold === 1 ? 'unidad' : 'unidades'}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono-custom">
                      ARS ${Math.round(item.total_revenue).toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* LOW MOVEMENT / HIGHEST STOCK */}
        <div className="bg-white border border-gray-200 p-6 rounded-2xl space-y-4 shadow-sm">
          <h3 className="font-display text-sm font-bold tracking-wider text-gray-900 uppercase border-b border-gray-100 pb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-600" />
            PRODUCTOS CON MAYOR STOCK DISPONIBLE
          </h3>

          <div className="space-y-3">
            {worstSellers.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No hay productos registrados en el inventario.</p>
            ) : (
              worstSellers.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-black font-mono-custom">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-gray-800 line-clamp-1">{item.name}</p>
                      <p className="text-[10px] text-gray-400">{item.brand || 'HOLUX'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-amber-700 font-mono-custom bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                      {item.stock} un. en stock
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
