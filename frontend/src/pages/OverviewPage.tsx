import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { FilterState, KpiSummary } from '../types';
import { KpiCard } from '../components/common/KpiCard';
import { LoadingSkeleton, ErrorBanner } from '../components/common/LoadingSkeleton';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

interface OverviewPageProps {
  filters: FilterState;
}

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export const OverviewPage: React.FC<OverviewPageProps> = ({ filters }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiService.getOverview(filters);
      setData(resp);
    } catch (err: any) {
      setError(err.message || 'Failed to load executive overview analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorBanner message={error} onRetry={fetchData} />;
  if (!data || !data.kpis) return <div className="p-8 text-center text-slate-500">No data available.</div>;

  const kpis: KpiSummary = data.kpis;
  const sales = data.sales || {};
  const products = data.products || {};
  const customers = data.customers || {};

  const monthlyTrends = sales.monthly_trends || [];
  const regionalPerformance = sales.regional_performance || [];
  const categoryPerformance = sales.category_performance || [];
  const topProducts = (products.top_revenue_products || []).slice(0, 5);
  const customerSegments = customers.segment_performance || [];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Title & Business Context Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">Executive Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            Consolidated operational KPIs and multi-dimensional business performance for NovaMart Retail.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/insights"
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-200 px-3.5 py-2 rounded-lg transition-colors shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Root Cause Deep Dive</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Revenue"
          metric={kpis.revenue}
          format="currency"
          description="Gross sales across completed customer transactions."
        />
        <KpiCard
          title="Total Profit"
          metric={kpis.profit}
          format="currency"
          description="Net profit after deducting cost of goods sold (COGS) and discount allowances."
        />
        <KpiCard
          title="Profit Margin"
          metric={kpis.profit_margin}
          format="percent"
          description="Net profit divided by total revenue multiplied by 100."
        />
        <KpiCard
          title="Total Orders"
          metric={kpis.total_orders}
          format="number"
          description="Total distinct orders completed within the reporting period."
        />
      </div>

      {/* Secondary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Average Order Value"
          metric={kpis.average_order_value}
          format="currency"
          description="Total revenue divided by distinct completed orders."
        />
        <KpiCard
          title="Units Sold"
          metric={kpis.units_sold}
          format="number"
          description="Total item quantity fulfilled across all product lines."
        />
        <KpiCard
          title="Return Rate"
          metric={kpis.return_rate}
          format="percent"
          invertColors={true}
          description="Returned orders as a percentage of total eligible orders."
        />
        <KpiCard
          title="Active Customers"
          metric={kpis.total_customers}
          format="number"
          description="Distinct purchasing customer accounts active in this window."
        />
      </div>

      {/* Charts Row 1: Revenue & Profit Over Time + Regional Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Profit Trends (Area Chart) */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Revenue & Profit Trajectory</h2>
              <p className="text-xs text-slate-500">Monthly chronological sales versus net earnings</p>
            </div>
            <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              Monthly Aggregation
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month_str" stroke="#94a3b8" fontSize={11} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProf)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regional Performance (Bar Chart) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Regional Revenue Breakdown</h2>
            <p className="text-xs text-slate-500">Sales volume by geographic sales territory</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionalPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="region" type="category" stroke="#94a3b8" fontSize={11} width={60} />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" name="Revenue" fill="#4f46e5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2: Category Distribution + Top Products Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Contribution (Donut) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Category Contribution</h2>
            <p className="text-xs text-slate-500">Revenue share by merchandise department</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryPerformance}
                  dataKey="revenue"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {categoryPerformance.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products Table */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Top Revenue Generating Products</h2>
              <p className="text-xs text-slate-500">Highest grossing SKUs across current window</p>
            </div>
            <Link to="/products" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
              View All &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3 text-right">Units</th>
                  <th className="py-2.5 px-3 text-right">Revenue</th>
                  <th className="py-2.5 px-3 text-right">Profit</th>
                  <th className="py-2.5 px-3 text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {topProducts.map((p: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-900">{p.product_name}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{p.units.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                      ${p.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-600">
                      ${p.profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium">
                      {p.profit_margin.toFixed(1)}%
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
