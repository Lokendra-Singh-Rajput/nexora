import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { FilterState } from '../types';
import { LoadingSkeleton, ErrorBanner } from '../components/common/LoadingSkeleton';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { TrendingUp, Percent, DollarSign, Layers } from 'lucide-react';

export const SalesPage: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'monthly' | 'daily'>('monthly');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiService.getSales(filters);
      setData(resp);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sales analytics.');
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

  const trends = viewMode === 'monthly' ? (data.monthly_trends || []) : (data.daily_trends || []);
  const regional = data.regional_performance || [];
  const categories = data.category_performance || [];
  const discountAnalysis = data.discount_analysis || { avg_discount_rate: 0, discount_tiers: [] };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">Sales Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">
            Detailed time series, regional fulfillment metrics, and discounting impact analysis.
          </p>
        </div>
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              viewMode === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly Trend
          </button>
          <button
            onClick={() => setViewMode('daily')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              viewMode === 'daily' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily Granularity
          </button>
        </div>
      </div>

      {/* Main Time-Series Chart */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Revenue & Average Order Value (AOV) Trend</h2>
            <p className="text-xs text-slate-500">Historical transaction revenue plotted against ticket size</p>
          </div>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey={viewMode === 'monthly' ? 'month_str' : 'date'} stroke="#94a3b8" fontSize={11} />
              <YAxis
                yAxisId="left"
                stroke="#94a3b8"
                fontSize={11}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#94a3b8"
                fontSize={11}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip
                formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Line yAxisId="left" type="monotone" dataKey="revenue" name="Total Revenue" stroke="#4f46e5" strokeWidth={2.5} dot={false} />
              <Line yAxisId="left" type="monotone" dataKey="profit" name="Net Profit" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="aov" name="Avg Order Value ($)" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Regional & Category Breakdown Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Table */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Regional Sales Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Region</th>
                  <th className="py-2.5 px-3 text-right">Revenue</th>
                  <th className="py-2.5 px-3 text-right">Share</th>
                  <th className="py-2.5 px-3 text-right">Margin</th>
                  <th className="py-2.5 px-3 text-right">AOV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {regional.map((r: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{r.region}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium">${r.revenue.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{r.revenue_share.toFixed(1)}%</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-600">{r.profit_margin.toFixed(1)}%</td>
                    <td className="py-2.5 px-3 text-right font-mono">${r.aov.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Table */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Category Margins & Volume</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Revenue</th>
                  <th className="py-2.5 px-3 text-right">Share</th>
                  <th className="py-2.5 px-3 text-right">Margin</th>
                  <th className="py-2.5 px-3 text-right">Orders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {categories.map((c: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{c.category}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium">${c.revenue.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{c.revenue_share.toFixed(1)}%</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-600">{c.profit_margin.toFixed(1)}%</td>
                    <td className="py-2.5 px-3 text-right font-mono">{c.orders.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Discount Impact Analysis */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Discount Impact & Margin Dilution</h2>
            <p className="text-xs text-slate-500">Evaluating profitability across promotional discount tiers</p>
          </div>
          <div className="text-xs font-mono font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg">
            Portfolio Avg Discount: {discountAnalysis.avg_discount_rate}%
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {discountAnalysis.discount_tiers.map((dt: any, i: number) => (
            <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="text-xs font-bold text-slate-800">{dt.tier}</div>
              <div className="text-lg font-bold text-slate-900 font-mono">${dt.revenue.toLocaleString()}</div>
              <div className="text-xs text-slate-500 flex justify-between">
                <span>Orders: {dt.order_count}</span>
                <span className={`font-semibold ${dt.profit_margin < 15 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  Margin: {dt.profit_margin}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
