import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { FilterState } from '../types';
import { LoadingSkeleton, ErrorBanner } from '../components/common/LoadingSkeleton';
import { AlertTriangle, TrendingDown, PieChart as PieIcon, ShieldAlert } from 'lucide-react';

export const ProductsPage: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiService.getProducts(filters);
      setData(resp);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch product intelligence.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorBanner message={error} onRetry={fetchData} />;
  if (!data) return null;

  const topRevenue = data.top_revenue_products || [];
  const topProfit = data.top_profit_products || [];
  const lowestMargin = data.lowest_margin_products || [];
  const revenueTraps = data.revenue_traps || [];
  const declining = data.declining_products || [];
  const concentration = data.concentration || { pareto_top_20_revenue_share: 0, top_20_pct_count: 0 };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">Product Intelligence</h1>
          <p className="text-sm text-slate-500 mt-1">
            SKU-level profitability ranking, margin traps, and Pareto concentration analysis.
          </p>
        </div>
      </div>

      {/* Pareto Concentration Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <PieIcon className="w-4 h-4" />
            <span>Pareto Concentration (80/20 Rule)</span>
          </div>
          <h2 className="text-xl font-bold">
            Top {concentration.top_20_pct_count} Products Generate {concentration.pareto_top_20_revenue_share}% of Total Revenue
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Revenue concentration signals strong dependence on core bestsellers. Protecting inventory buffers for these high-velocity SKUs is essential.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center border border-white/10 min-w-44">
          <div className="text-3xl font-bold font-mono text-teal-400">
            {concentration.pareto_top_20_revenue_share}%
          </div>
          <div className="text-[11px] text-slate-300 uppercase tracking-wider mt-1">
            Top 20% Revenue Share
          </div>
        </div>
      </div>

      {/* Revenue Traps Section */}
      {revenueTraps.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Identified Margin Traps (High Revenue, Sub-Standard Margin)</span>
          </div>
          <p className="text-xs text-amber-700">
            These products contribute substantial top-line sales volume but deliver low net profit margins due to supplier costs or excessive discounting.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {revenueTraps.slice(0, 3).map((trap: any, i: number) => (
              <div key={i} className="bg-white rounded-lg p-3 border border-amber-200 shadow-2xs space-y-1">
                <div className="text-xs font-semibold text-slate-900 truncate">{trap.product_name}</div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Revenue: ${trap.revenue.toLocaleString()}</span>
                  <span className="font-mono font-bold text-rose-600">Margin: {trap.profit_margin.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Top Revenue vs Top Profit Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Revenue */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Top 10 Grossing Products</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3 text-right">Revenue</th>
                  <th className="py-2.5 px-3 text-right">Profit</th>
                  <th className="py-2.5 px-3 text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {topRevenue.map((p: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-900">{p.product_name}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold">${p.revenue.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-600">${p.profit.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium">{p.profit_margin.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Highest Profit */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Top 10 Most Profitable Products</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3 text-right">Profit</th>
                  <th className="py-2.5 px-3 text-right">Revenue</th>
                  <th className="py-2.5 px-3 text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {topProfit.map((p: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-900">{p.product_name}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-600">${p.profit.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-mono">${p.revenue.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium">{p.profit_margin.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Grid: Lowest Margin vs Declining Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lowest Margin */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Lowest Margin SKUs</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3 text-right">Margin</th>
                  <th className="py-2.5 px-3 text-right">Revenue</th>
                  <th className="py-2.5 px-3 text-right">Units</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {lowestMargin.map((p: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-900">{p.product_name}</td>
                    <td className={`py-2.5 px-3 text-right font-mono font-bold ${p.profit_margin < 10 ? 'text-rose-600' : 'text-slate-800'}`}>
                      {p.profit_margin.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">${p.revenue.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{p.units.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Declining Products */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Declining Products (Second Half vs First Half)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3 text-right">H2 vs H1 Growth</th>
                  <th className="py-2.5 px-3 text-right">Current Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {declining.map((p: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-900">{p.product_name}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                      {p.growth !== undefined ? `${p.growth.toFixed(1)}%` : 'Declining'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">${p.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
