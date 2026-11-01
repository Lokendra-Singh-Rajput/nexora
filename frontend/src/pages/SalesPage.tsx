import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { FilterState } from '../types';
import { LoadingSkeleton, ErrorBanner } from '../components/common/LoadingSkeleton';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

export const SalesPage: React.FC<{ filters: FilterState; activeCompany?: any }> = ({ filters, activeCompany }) => {
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

  const industry = (activeCompany?.industry || '').toUpperCase();
  const isBanking = industry.includes('BANK') || !!data.type_performance;
  const isMfg = industry.includes('MANUF') || !!data.work_center_performance;

  const trends = viewMode === 'monthly' ? (data.monthly_trends || []) : (data.daily_trends || []);

  // Banking specific variables
  const typePerformance = data.type_performance || [];
  const channelPerformance = data.channel_performance || [];
  const riskDistribution = data.risk_distribution || [];

  // Retail specific variables
  const regional = data.regional_performance || [];
  const categories = data.category_performance || [];
  const discountAnalysis = data.discount_analysis || { avg_discount_rate: 0, discount_tiers: [] };

  // Mfg specific variables
  const workCenters = data.work_center_performance || [];
  const defectBreakdown = data.defect_breakdown || [];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            {isBanking ? 'Transaction Intelligence' : isMfg ? 'Production & OEE Analytics' : 'Sales Analytics'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isBanking
              ? 'Detailed transaction volume, service category breakdowns, and settlement channel trends.'
              : isMfg
              ? 'Real-time production throughput, scheduled vs actual quantities, and operating efficiency.'
              : 'Detailed time series, regional fulfillment metrics, and discounting impact analysis.'}
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
            <h2 className="text-sm font-bold text-slate-900">
              {isBanking
                ? 'Transaction Volume & Ticket Size Trend'
                : isMfg
                ? 'Production Output & Efficiency Trend'
                : 'Revenue & Average Order Value (AOV) Trend'}
            </h2>
            <p className="text-xs text-slate-500">
              {isBanking
                ? 'Historical payment volume plotted against average transaction value'
                : isMfg
                ? 'Produced batch units plotted against target schedule and efficiency'
                : 'Historical transaction revenue plotted against ticket size'}
            </p>
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
                tickFormatter={(val) => isMfg ? `${val}` : `$${(val / 1000).toFixed(0)}k`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#94a3b8"
                fontSize={11}
                tickFormatter={(val) => isMfg ? `${val}%` : `$${val}`}
              />
              <Tooltip
                formatter={(val: any) => [isMfg ? `${val}` : `$${Number(val).toLocaleString()}`, '']}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

              {isBanking ? (
                <>
                  <Line yAxisId="left" type="monotone" dataKey="transaction_value" name="Total Volume ($)" stroke="#4f46e5" strokeWidth={2.5} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="average_value" name="Avg Transaction ($)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="transaction_volume" name="Transaction Count" stroke="#10b981" strokeWidth={1.5} dot={false} />
                </>
              ) : isMfg ? (
                <>
                  <Line yAxisId="left" type="monotone" dataKey="produced_quantity" name="Produced Units" stroke="#10b981" strokeWidth={2.5} dot={false} />
                  <Line yAxisId="left" type="monotone" dataKey="planned_quantity" name="Planned Target" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="efficiency_pct" name="Efficiency %" stroke="#4f46e5" strokeWidth={1.5} dot={false} />
                </>
              ) : (
                <>
                  <Line yAxisId="left" type="monotone" dataKey="revenue" name="Total Revenue" stroke="#4f46e5" strokeWidth={2.5} dot={false} />
                  <Line yAxisId="left" type="monotone" dataKey="profit" name="Net Profit" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="aov" name="Avg Order Value ($)" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Banking Tables */}
      {isBanking && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service & Type Breakdown */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-3">Service & Transaction Types</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Service Type</th>
                      <th className="py-2.5 px-3 text-right">Total Value</th>
                      <th className="py-2.5 px-3 text-right">Transactions</th>
                      <th className="py-2.5 px-3 text-right">Share</th>
                      <th className="py-2.5 px-3 text-right">Avg Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {typePerformance.map((t: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{t.transaction_type}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium">${Number(t.transaction_value || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{Number(t.transaction_volume || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-indigo-600">{Number(t.value_share || 0).toFixed(1)}%</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">{Number(t.avg_risk || 0).toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Channels Breakdown */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-3">Settlement Channels & Rails</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Channel</th>
                      <th className="py-2.5 px-3 text-right">Total Volume</th>
                      <th className="py-2.5 px-3 text-right">Transactions</th>
                      <th className="py-2.5 px-3 text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {channelPerformance.map((c: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{c.channel}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium">${Number(c.transaction_value || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{Number(c.transaction_volume || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-indigo-600">{Number(c.value_share || 0).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Risk Distribution Cards */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Risk Profile & Exposure Tiers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {riskDistribution.map((rd: any, i: number) => (
                <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{rd.tier}</span>
                    {rd.tier.includes('High') ? (
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                    ) : rd.tier.includes('Medium') ? (
                      <ShieldAlert className="w-4 h-4 text-amber-500" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                  <div className="text-lg font-bold text-slate-900 font-mono">{Number(rd.count || 0).toLocaleString()} txns</div>
                  <div className="text-xs text-slate-500 font-medium">Share: {Number(rd.share || 0).toFixed(2)}%</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Retail Tables */}
      {!isBanking && !isMfg && (
        <>
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
                        <td className="py-2.5 px-3 text-right font-mono font-medium">${Number(r.revenue || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{Number(r.revenue_share || 0).toFixed(1)}%</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-600">{Number(r.profit_margin || 0).toFixed(1)}%</td>
                        <td className="py-2.5 px-3 text-right font-mono">${Number(r.aov || 0).toFixed(1)}</td>
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
                        <td className="py-2.5 px-3 text-right font-mono font-medium">${Number(c.revenue || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{Number(c.revenue_share || 0).toFixed(1)}%</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-600">{Number(c.profit_margin || 0).toFixed(1)}%</td>
                        <td className="py-2.5 px-3 text-right font-mono">{Number(c.orders || 0).toLocaleString()}</td>
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
                  <div className="text-lg font-bold text-slate-900 font-mono">${Number(dt.revenue || 0).toLocaleString()}</div>
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
        </>
      )}
    </div>
  );
};
