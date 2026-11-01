import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { FilterState } from '../types';
import { LoadingSkeleton, ErrorBanner } from '../components/common/LoadingSkeleton';
import { AlertTriangle, PieChart as PieIcon, ShieldAlert, ShieldCheck, Factory } from 'lucide-react';

export const ProductsPage: React.FC<{ filters: FilterState; activeCompany?: any }> = ({ filters, activeCompany }) => {
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
      setError(err.message || 'Failed to fetch analytics.');
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
  const isBanking = industry.includes('BANK') || !!data.risk_distribution || !!data.type_performance;
  const isMfg = industry.includes('MANUF') || !!data.work_center_performance;

  // Banking metrics
  const riskTiers = data.risk_distribution || [];
  const typePerf = data.type_performance || [];
  const channelPerf = data.channel_performance || [];

  // Retail metrics
  const topRevenue = data.top_revenue_products || [];
  const topProfit = data.top_profit_products || [];
  const revenueTraps = data.revenue_traps || [];
  const concentration = data.concentration || { pareto_top_20_revenue_share: 0, top_20_pct_count: 0 };

  // Mfg metrics
  const workCenters = data.work_center_performance || [];
  const defects = data.defect_breakdown || [];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            {isBanking ? 'Risk & Fraud Analytics' : isMfg ? 'Defect & Quality Control' : 'Product Intelligence'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isBanking
              ? 'Transaction risk scoring tiers, service failure tracking, and channel vulnerability profiling.'
              : isMfg
              ? 'Work center scrap rates, defect Pareto distributions, and batch tolerances.'
              : 'SKU-level profitability ranking, margin traps, and Pareto concentration analysis.'}
          </p>
        </div>
      </div>

      {/* Banking View */}
      {isBanking && (
        <>
          {/* Risk Profile Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                <span>Portfolio Risk Scoring Model</span>
              </div>
              <h2 className="text-xl font-bold">
                {riskTiers.length > 0 ? `${riskTiers[0]?.share || 96}% Transactions Cleared Under Low-Risk Tier` : 'Active Risk Scoring Engine'}
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Automated risk scoring screens transactions across payment rails. Flagged and high-risk operations are quarantined for AML and fraud verification.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center border border-white/10 min-w-44">
              <div className="text-3xl font-bold font-mono text-emerald-400">
                {riskTiers[0]?.share || 96.1}%
              </div>
              <div className="text-[11px] text-slate-300 uppercase tracking-wider mt-1">
                Settled Low Risk
              </div>
            </div>
          </div>

          {/* Risk Tiers Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {riskTiers.map((tier: any, i: number) => (
              <div key={i} className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{tier.tier}</span>
                  {tier.tier.includes('High') ? (
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                  ) : tier.tier.includes('Medium') ? (
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900">{Number(tier.count || 0).toLocaleString()}</div>
                <div className="text-xs text-slate-500 font-medium">Share of Total: {Number(tier.share || 0).toFixed(2)}%</div>
              </div>
            ))}
          </div>

          {/* Service & Channel Risk Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-3">Service Category Risk Profiling</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Service</th>
                      <th className="py-2.5 px-3 text-right">Volume</th>
                      <th className="py-2.5 px-3 text-right">Value ($)</th>
                      <th className="py-2.5 px-3 text-right">Avg Risk Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {typePerf.map((t: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{t.transaction_type}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{Number(t.transaction_volume || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium">${Number(t.transaction_value || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            Number(t.avg_risk || 0) > 0.05 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {Number(t.avg_risk || 0).toFixed(3)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-3">Channel Vulnerability & Rail Security</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Channel</th>
                      <th className="py-2.5 px-3 text-right">Transactions</th>
                      <th className="py-2.5 px-3 text-right">Settled Amount</th>
                      <th className="py-2.5 px-3 text-right">Fraud Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {channelPerf.map((c: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{c.channel}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{Number(c.transaction_volume || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium">${Number(c.transaction_value || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-bold">{c.fraud_count || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Retail View */}
      {!isBanking && !isMfg && (
        <>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-3">Top Grossing Products</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3 text-right">Revenue</th>
                      <th className="py-2.5 px-3 text-right">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {topRevenue.map((p: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-slate-900">{p.product_name}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">${Number(p.revenue || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-600">${Number(p.profit || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-3">Most Profitable Products</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3 text-right">Profit</th>
                      <th className="py-2.5 px-3 text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {topProfit.map((p: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-slate-900">{p.product_name}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-600">${Number(p.profit || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium">{Number(p.profit_margin || 0).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
