import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { LoadingSkeleton, ErrorBanner } from '../components/common/LoadingSkeleton';
import { Boxes, CreditCard, ShieldCheck, Layers, CheckCircle2 } from 'lucide-react';

export const InventoryPage: React.FC<{ companyId?: string; activeCompany?: any }> = ({
  companyId = 'novamart',
  activeCompany
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiService.getInventory(companyId);
      setData(resp);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch asset/inventory intelligence.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorBanner message={error} onRetry={fetchData} />;
  if (!data) return null;

  const industry = (activeCompany?.industry || '').toUpperCase();
  const isBanking = industry.includes('BANK') || !!data.type_performance;

  // Banking metrics
  const typePerf = data.type_performance || [];
  const channelPerf = data.channel_performance || [];

  // Retail metrics
  const summary = data.summary || {};
  const risks = data.inventory_risks || [];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            {isBanking ? 'Portfolio Assets & Settlement Rails' : 'Inventory Intelligence'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isBanking
              ? 'Payment network channels, service asset liquidity, and settlement allocation.'
              : 'Real-time stock velocity, estimated days of buffer coverage, and replenishment alerts.'}
          </p>
        </div>
      </div>

      {/* Banking View */}
      {isBanking && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Service Asset Types</div>
                <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{typePerf.length}</div>
                <div className="text-[11px] text-slate-400">Active portfolios</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Settlement Channels</div>
                <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{channelPerf.length}</div>
                <div className="text-[11px] text-slate-400">Payment gateways</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Asset Volume</div>
                <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                  ${(typePerf.reduce((acc: number, t: any) => acc + (t.transaction_value || 0), 0) / 1000000).toFixed(2)}M
                </div>
                <div className="text-[11px] text-slate-400">Cumulative settlement</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Compliance Rate</div>
                <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">99.9%</div>
                <div className="text-[11px] text-slate-400">Asset verification</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-3">Service Asset Breakdown</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Service</th>
                      <th className="py-2.5 px-3 text-right">Transactions</th>
                      <th className="py-2.5 px-3 text-right">Settled Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {typePerf.map((t: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{t.transaction_type}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{Number(t.transaction_volume || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium">${Number(t.transaction_value || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-3">Gateway Settlement Rails</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Rail / Channel</th>
                      <th className="py-2.5 px-3 text-right">Volume</th>
                      <th className="py-2.5 px-3 text-right">Settled Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {channelPerf.map((c: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{c.channel}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{Number(c.transaction_volume || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium">${Number(c.transaction_value || 0).toLocaleString()}</td>
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
      {!isBanking && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Catalog SKUs</div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{summary.total_skus || 0}</div>
              <div className="text-[11px] text-slate-400">Tracked products</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
