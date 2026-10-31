import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { LoadingSkeleton, ErrorBanner } from '../components/common/LoadingSkeleton';
import { Boxes, AlertOctagon, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export const InventoryPage: React.FC<{ companyId?: string }> = ({ companyId = 'novamart' }) => {
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
      setError(err.message || 'Failed to fetch inventory intelligence.');
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

  const summary = data.summary || {};
  const risks = data.inventory_risks || [];
  const reorders = data.reorder_recommendations || [];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">Inventory Intelligence</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time stock velocity, estimated days of buffer coverage, and replenishment alerts.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Catalog SKUs</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{summary.total_skus}</div>
            <div className="text-[11px] text-slate-400">Tracked products</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-rose-200 shadow-xs flex items-center justify-between bg-rose-50/20">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-rose-600">Critical Stockouts</div>
            <div className="text-2xl font-bold font-mono text-rose-600 mt-1">{summary.critical_stockouts}</div>
            <div className="text-[11px] text-rose-500 font-medium">&lt; 7 Days coverage</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-amber-200 shadow-xs flex items-center justify-between bg-amber-50/20">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-600">Reorder Thresholds Hit</div>
            <div className="text-2xl font-bold font-mono text-amber-600 mt-1">{summary.reorder_needed}</div>
            <div className="text-[11px] text-amber-500 font-medium">Stock &le; Reorder Point</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Healthy Buffer Stock</div>
            <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">{summary.healthy_skus}</div>
            <div className="text-[11px] text-emerald-600 font-medium">&gt; 15 Days coverage</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Critical Stockout Risks Table */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">High-Velocity Inventory Depletion Risks</h2>
            <p className="text-xs text-slate-500">SKUs requiring priority supplier purchase orders</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Product Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Current Stock</th>
                <th className="py-2.5 px-3 text-right">Reorder Level</th>
                <th className="py-2.5 px-3 text-right">Daily Demand</th>
                <th className="py-2.5 px-3 text-right">Days Left</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {risks.map((item: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-slate-900">{item.product_name}</td>
                  <td className="py-2.5 px-3 text-slate-500">{item.category || 'General'}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{item.stock_quantity}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500">{item.reorder_level}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{item.daily_demand} units/day</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">{item.days_remaining} d</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${
                      item.risk_level === 'CRITICAL' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.risk_level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommended Purchase Orders */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-2">Automated Purchase Order Replenishment Guidance</h2>
        <p className="text-xs text-slate-500 mb-4">
          Recommendation formula: Target 45 days coverage + supplier transit lead time buffer minus on-hand quantity.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reorders.slice(0, 6).map((rec: any, idx: number) => (
            <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-slate-900 truncate">{rec.product_name}</span>
                <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                  {rec.product_id}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                <span className="text-slate-500">Order Quantity:</span>
                <span className="font-bold text-indigo-700 font-mono text-sm">+{rec.recommended_reorder_qty} units</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Supplier Lead Time:
                </span>
                <span className="font-mono">{rec.supplier_lead_time} days</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
