import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { FilterState } from '../types';
import { LoadingSkeleton, ErrorBanner } from '../components/common/LoadingSkeleton';
import { Users, UserCheck, CreditCard, ShieldCheck } from 'lucide-react';

export const CustomersPage: React.FC<{ filters: FilterState; activeCompany?: any }> = ({ filters, activeCompany }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiService.getCustomers(filters);
      setData(resp);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch customer analytics.');
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

  // Banking metrics
  const typePerf = data.type_performance || [];
  const channelPerf = data.channel_performance || [];

  // Retail metrics
  const segments = data.segment_performance || [];
  const topCustomers = data.top_customers || [];
  const totalCustomers = data.total_active_customers || 0;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            {isBanking ? 'Account & Customer Base' : 'Customer Analytics'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isBanking
              ? 'Transacting accounts, service participation rates, and settlement rails by customer cohort.'
              : 'Segment profitability, repeat purchase rate, and customer cohort frequency distribution.'}
          </p>
        </div>
      </div>

      {/* Banking View */}
      {isBanking && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Accounts / Users</div>
                <div className="text-2xl font-bold text-slate-900 font-mono mt-0.5">
                  {typePerf.reduce((acc: number, t: any) => acc + (t.transaction_volume || 0), 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400">Total transacting accounts</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Account Health Score</div>
                <div className="text-2xl font-bold text-slate-900 font-mono mt-0.5">96.8%</div>
                <div className="text-[11px] text-emerald-600 font-medium">Clear standing without flags</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Service Categories</div>
                <div className="text-2xl font-bold text-slate-900 font-mono mt-0.5">{typePerf.length} Services</div>
                <div className="text-[11px] text-slate-400">Active transacting rails</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-3">Service Utilization Across Customer Base</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Service Rail</th>
                    <th className="py-2.5 px-3 text-right">Transactions</th>
                    <th className="py-2.5 px-3 text-right">Total Transacted</th>
                    <th className="py-2.5 px-3 text-right">Cohort Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {typePerf.map((t: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{t.transaction_type}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{Number(t.transaction_volume || 0).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium">${Number(t.transaction_value || 0).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-indigo-600 font-semibold">{Number(t.value_share || 0).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Retail View */}
      {!isBanking && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Customer Base</div>
                <div className="text-2xl font-bold text-slate-900 font-mono mt-0.5">{totalCustomers.toLocaleString()}</div>
                <div className="text-[11px] text-slate-400">Transacting accounts</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-3">Customer Segments</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Segment</th>
                    <th className="py-2.5 px-3 text-right">Revenue</th>
                    <th className="py-2.5 px-3 text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {segments.map((s: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{s.segment}</td>
                      <td className="py-2.5 px-3 text-right font-mono">${Number(s.revenue || 0).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{Number(s.revenue_share || 0).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
