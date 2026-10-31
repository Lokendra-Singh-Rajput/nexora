import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { FilterState } from '../types';
import { LoadingSkeleton, ErrorBanner } from '../components/common/LoadingSkeleton';
import { Users, UserCheck, ShoppingBag, DollarSign } from 'lucide-react';

export const CustomersPage: React.FC<{ filters: FilterState }> = ({ filters }) => {
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

  const segments = data.segment_performance || [];
  const topCustomers = data.top_customers || [];
  const repeatRate = data.repeat_purchase_rate || 0;
  const totalCustomers = data.total_active_customers || 0;
  const frequencyDist = data.frequency_distribution || [];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">Customer Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">
            Segment profitability, repeat purchase rate, and customer cohort frequency distribution.
          </p>
        </div>
      </div>

      {/* Highlights Top Banner */}
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

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Repeat Purchase Rate</div>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-0.5">{repeatRate}%</div>
            <div className="text-[11px] text-emerald-600 font-medium">&gt; 1 completed order</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Enterprise Loyalty Share</div>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-0.5">Corporate & Small Biz</div>
            <div className="text-[11px] text-purple-600 font-medium">Higher ticket AOV tiers</div>
          </div>
        </div>
      </div>

      {/* Customer Segments Cards */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider text-slate-500">
          Segment Performance Breakdown
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {segments.map((seg: any, idx: number) => (
            <div key={idx} className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="font-bold text-base text-slate-900">{seg.segment}</span>
                <span className="text-xs font-mono font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                  {seg.revenue_share.toFixed(1)}% Share
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Total Revenue</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">${seg.revenue.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Net Profit</span>
                  <span className="font-mono font-bold text-emerald-600 text-sm">${seg.profit.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Profit Margin</span>
                  <span className="font-mono font-medium text-slate-800">{seg.profit_margin.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Average Ticket (AOV)</span>
                  <span className="font-mono font-medium text-slate-800">${seg.aov.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Frequency Distribution + Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Frequency Breakdown */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-2">Purchase Frequency Distribution</h2>
          <p className="text-xs text-slate-500 mb-4">Customer count grouped by order frequency bracket</p>
          <div className="space-y-3">
            {frequencyDist.map((fb: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700">{fb.frequency_bracket}</span>
                  <span className="font-mono text-slate-900">{fb.customer_count} ({fb.percentage}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${fb.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 10 Customers Table */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Top 10 High-Value Accounts</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Customer Name</th>
                  <th className="py-2.5 px-3">Segment</th>
                  <th className="py-2.5 px-3 text-right">Orders</th>
                  <th className="py-2.5 px-3 text-right">Lifetime Spend</th>
                  <th className="py-2.5 px-3 text-right">Net Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {topCustomers.map((c: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-900">{c.customer_name}</td>
                    <td className="py-2.5 px-3">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-mono">
                        {c.segment}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">{c.orders_count}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                      ${c.total_spent.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-600">
                      ${c.total_profit.toLocaleString()}
                    </td>
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
