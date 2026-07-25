import React, { useState } from 'react';
import { TrendingUp, ShoppingBag, DollarSign, AlertTriangle, ArrowUpRight, ArrowDownRight, Package, Users, BarChart2 } from 'lucide-react';

export default function DashboardCharts({ adminStats, productsList, ordersList }) {
  const [timeframe, setTimeframe] = useState('month'); // 'day' | 'week' | 'month' | 'year'

  if (!adminStats) {
    return (
      <div className="p-8 text-center text-gray-400 font-sans">
        Cargando métricas de la tienda...
      </div>
    );
  }

  // Calculate Low Stock Products (sorted ascending, lowest stock first)
  const sortedByStockAsc = [...(productsList || [])].sort((a, b) => Number(a.stock) - Number(b.stock));
  const lowStockFiltered = sortedByStockAsc.filter(p => Number(p.stock) <= 12);
  const displayLowStock = lowStockFiltered.length > 0 ? lowStockFiltered : sortedByStockAsc.slice(0, 4);
  
  // Best and worst sellers ranking
  const bestSellers = adminStats.best_sellers || [];
  const sortedByStockDesc = [...(productsList || [])].sort((a, b) => Number(b.stock) - Number(a.stock));
  const worstSellers = sortedByStockDesc.slice(0, 5);

  // Mock revenue chart points for visualization based on timeframe
  const chartData = timeframe === 'day' ? [
    { label: '08:00', sales: 45000, orders: 1 },
    { label: '12:00', sales: 120000, orders: 2 },
    { label: '16:00', sales: 280000, orders: 4 },
    { label: '20:00', sales: 190000, orders: 3 }
  ] : timeframe === 'week' ? [
    { label: 'Lun', sales: 320000, orders: 5 },
    { label: 'Mar', sales: 480000, orders: 7 },
    { label: 'Mié', sales: 290000, orders: 4 },
    { label: 'Jue', sales: 610000, orders: 9 },
    { label: 'Vie', sales: 850000, orders: 12 },
    { label: 'Sáb', sales: 920000, orders: 14 },
    { label: 'Dom', sales: 540000, orders: 8 }
  ] : [
    { label: 'Ene', sales: 1200000, orders: 18 },
    { label: 'Feb', sales: 1850000, orders: 24 },
    { label: 'Mar', sales: 1400000, orders: 20 },
    { label: 'Abr', sales: 2100000, orders: 29 },
    { label: 'May', sales: 2900000, orders: 38 },
    { label: 'Jun', sales: 3400000, orders: 45 },
    { label: 'Jul', sales: adminStats.metrics.total_revenue || 4100000, orders: adminStats.metrics.total_orders || 52 }
  ];

  const maxSales = Math.max(...chartData.map(d => d.sales), 1);
  const totalPeriodRevenue = chartData.reduce((acc, curr) => acc + curr.sales, 0);
  const totalPeriodOrders = chartData.reduce((acc, curr) => acc + curr.orders, 0);
  const avgTicket = totalPeriodOrders > 0 ? Math.round(totalPeriodRevenue / totalPeriodOrders) : 0;

  return (
    <div className="space-y-6 text-left font-sans">
      
      {/* HEADER & TIMEFRAME SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-display font-black text-gray-900 uppercase tracking-wide">
            PANEL DE ANALÍTICA & DASHBOARD EN TIEMPO REAL
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Resumen de facturación, ticket promedio, alertas de inventario y ranking de productos.
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 text-xs font-display font-bold">
          {[
            { id: 'day', label: 'HOY' },
            { id: 'week', label: 'SEMANA' },
            { id: 'month', label: 'MES' },
            { id: 'year', label: 'AÑO' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTimeframe(t.id)}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer ${timeframe === t.id ? 'bg-[#3C6E71] text-white shadow-sm' : 'text-gray-600 hover:text-black'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* METRICS CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Facturación */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-5 rounded-xl space-y-2 shadow-md">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold font-display uppercase tracking-wider">
            <span>FACTURACIÓN TOTAL</span>
            <DollarSign className="w-4 h-4 text-[#3C6E71]" />
          </div>
          <div className="text-2xl font-black font-mono-custom">
            ARS ${Math.round(adminStats.metrics.total_revenue).toLocaleString('es-AR')}
          </div>
          <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold pt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+18.4% vs período anterior</span>
          </div>
        </div>

        {/* 2. Total Pedidos */}
        <div className="bg-white border border-gray-200 p-5 rounded-xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-[10px] font-bold font-display uppercase tracking-wider">
            <span>CANTIDAD DE PEDIDOS</span>
            <ShoppingBag className="w-4 h-4 text-[#3C6E71]" />
          </div>
          <div className="text-2xl font-black font-mono-custom text-gray-900">
            {adminStats.metrics.total_orders}
          </div>
          <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold pt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+12.1% en conversión</span>
          </div>
        </div>

        {/* 3. Ticket Promedio */}
        <div className="bg-white border border-gray-200 p-5 rounded-xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-[10px] font-bold font-display uppercase tracking-wider">
            <span>TICKET PROMEDIO</span>
            <TrendingUp className="w-4 h-4 text-[#B85C38]" />
          </div>
          <div className="text-2xl font-black font-mono-custom text-gray-900">
            ARS ${avgTicket.toLocaleString('es-AR')}
          </div>
          <div className="flex items-center gap-1 text-blue-600 text-xs font-bold pt-1">
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Calculado sobre {totalPeriodOrders} compras</span>
          </div>
        </div>

        {/* 4. Clientes Totales */}
        <div className="bg-white border border-gray-200 p-5 rounded-xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-[10px] font-bold font-display uppercase tracking-wider">
            <span>CLIENTES REGISTRADOS</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black font-mono-custom text-gray-900">
            {adminStats.metrics.total_customers || 1}
          </div>
          <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold pt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+8 nuevos este mes</span>
          </div>
        </div>
      </div>

      {/* RENDERED CHART & LOW STOCK ALERT ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CHART CONTAINER (2 COLS) */}
        <div className="lg:col-span-2 bg-white border border-gray-200 p-6 rounded-xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-display text-sm font-bold tracking-wider text-gray-900 uppercase flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#3C6E71]" />
              EVOLUCIÓN DE INGRESOS Y VENTA POR PERÍODO
            </h3>
            <span className="text-[11px] font-mono-custom text-gray-400">EN PANTALLA</span>
          </div>

          {/* Rendered SVG/CSS Chart Bar Graph */}
          <div className="h-56 flex items-end justify-between gap-2 pt-6 px-2">
            {chartData.map((d, i) => {
              const heightPercent = Math.max(Math.round((d.sales / maxSales) * 100), 8);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[9px] font-mono-custom py-1 px-1.5 rounded shadow whitespace-nowrap mb-1">
                    ${d.sales.toLocaleString('es-AR')}
                  </div>
                  <div 
                    className="w-full bg-[#3C6E71] hover:bg-[#3C6E71]/80 rounded-t transition-all duration-300"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-[10px] font-mono-custom font-bold text-gray-500 uppercase">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* LOW STOCK ALERTS (1 COL) */}
        <div className="bg-red-50/70 border border-red-200 p-6 rounded-xl space-y-4 shadow-sm text-left">
          <div className="flex items-center justify-between border-b border-red-200 pb-3 text-red-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
              <h3 className="font-display text-sm font-bold tracking-wider uppercase">
                ALERTAS DE STOCK BAJO
              </h3>
            </div>
            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-mono-custom">
              {displayLowStock.length}
            </span>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {displayLowStock.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">Todo el inventario tiene niveles óptimos de stock.</p>
            ) : (
              displayLowStock.map(prod => (
                <div key={prod.id} className="flex items-center justify-between bg-white p-3 rounded border border-red-100 shadow-sm">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-gray-800 line-clamp-1">{prod.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono-custom uppercase">{prod.brand}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black font-mono-custom text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                      {prod.stock} un.
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
        <div className="bg-white border border-gray-200 p-6 rounded-xl space-y-4 shadow-sm">
          <h3 className="font-display text-sm font-bold tracking-wider text-gray-900 uppercase border-b border-gray-100 pb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            RANKING: PRODUCTOS MÁS VENDIDOS
          </h3>

          <div className="space-y-3">
            {bestSellers.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No hay registros de ventas suficientes aún.</p>
            ) : (
              bestSellers.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
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
                      {item.quantity_sold} un. vendidas
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono-custom">
                      ARS ${item.total_revenue.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* LOW MOVEMENT / WORST SELLERS */}
        <div className="bg-white border border-gray-200 p-6 rounded-xl space-y-4 shadow-sm">
          <h3 className="font-display text-sm font-bold tracking-wider text-gray-900 uppercase border-b border-gray-100 pb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-600" />
            PRODUCTOS CON MAYOR STOCK / MENOR ROTACIÓN
          </h3>

          <div className="space-y-3">
            {worstSellers.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No hay productos registrados en el inventario.</p>
            ) : (
              worstSellers.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-black font-mono-custom">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-gray-800 line-clamp-1">{item.name}</p>
                      <p className="text-[10px] text-gray-400">{item.brand}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-amber-700 font-mono-custom bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
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
