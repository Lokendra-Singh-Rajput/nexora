import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { FilterState, KpiSummary, Company } from '../types';
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
import { Sparkles, ArrowRight, ShieldAlert, Factory, Landmark, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

interface OverviewPageProps {
  filters: FilterState;
  activeCompany?: Company;
}

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export const OverviewPage: React.FC<OverviewPageProps> = ({ filters, activeCompany }) => {
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
  const industry = (data.meta?.industry || activeCompany?.industry || 'RETAIL').toUpperCase();
  const companyName = data.meta?.companyName || activeCompany?.name || filters.companyId;

  // -------------------------------------------------------------
  // BANKING ADAPTIVE DASHBOARD
  // -------------------------------------------------------------
  if (industry.includes('BANK')) {
    const trends = data.trends || data.sales || {};
    const dailyTrends = trends.daily_trends || [];
    const typePerf = trends.type_performance || [];
    const channelPerf = trends.channel_performance || [];
    const riskDist = trends.risk_distribution || [];

    return (
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        {/* Banking Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Banking & Financial Services
              </span>
              <span className="text-xs text-slate-400 font-mono">Tenant: {filters.companyId}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono mt-1">
              Financial Performance & Risk Intelligence
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Settled transaction throughput, credit facility default rates, and automated fraud surveillance for {companyName}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/insights"
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-lg transition-colors shadow-2xs"
            >
              <Landmark className="w-3.5 h-3.5 text-emerald-600" />
              <span>Risk & Fraud Surveillance</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Banking KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total Transaction Value"
            metric={kpis.transaction_value}
            format="currency"
            description="Gross volume of settled transactions across all institutional and retail rails."
          />
          <KpiCard
            title="Transaction Volume"
            metric={kpis.transaction_volume}
            format="number"
            description="Total count of successfully cleared and settled payment records."
          />
          <KpiCard
            title="Average Transaction Value"
            metric={kpis.average_transaction_value}
            format="currency"
            description="Mean financial value per processed transaction record."
          />
          <KpiCard
            title="Loan Delinquency / Default Rate"
            metric={kpis.default_rate}
            format="percent"
            invertColors={true}
            description="Defaulted or non-performing facilities as a percentage of total credit extensions."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCard
            title="Fraud Incident Rate"
            metric={kpis.fraud_rate}
            format="percent"
            invertColors={true}
            description="Flagged suspicious and fraudulent attempts relative to total transaction flow."
          />
          <KpiCard
            title="Flagged Fraud Cases"
            metric={kpis.fraud_count}
            format="number"
            invertColors={true}
            description="Distinct transactions quarantined by security anomaly filters."
          />
          <KpiCard
            title="High-Risk Transactions"
            metric={kpis.high_risk_volume}
            format="number"
            invertColors={true}
            description="Transactions exhibiting empirical risk scores equal to or exceeding 0.70."
          />
        </div>

        {/* Banking Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transaction Value Trajectory */}
          <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Transaction Value & Settlement Trajectory</h2>
                <p className="text-xs text-slate-500">Daily gross value and transaction throughput volume</p>
              </div>
              <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                Daily Ledger
              </span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrends.slice(-30)}>
                  <defs>
                    <linearGradient id="colorTxn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Value']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="transaction_value" name="Transaction Value" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorTxn)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-slate-900">Credit Risk Tiers</h2>
              <p className="text-xs text-slate-500">Transaction portfolio distribution by risk band</p>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDist}
                    dataKey="count"
                    nameKey="tier"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {riskDist.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={['#10b981', '#f59e0b', '#ef4444'][index % 3]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${Number(val).toLocaleString()} txns`, 'Volume']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Banking Breakdown Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Transaction Type */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-slate-900">Volume by Transaction Type</h2>
              <p className="text-xs text-slate-500">Gross settled capital classified by banking operation</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typePerf} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="transaction_type" type="category" stroke="#94a3b8" fontSize={11} width={110} />
                  <Tooltip
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Settled Value']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="transaction_value" name="Settled Value" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* By Channel */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-slate-900">Channel Origin & Clearing Route</h2>
              <p className="text-xs text-slate-500">Distribution across ATM, Mobile, POS, Branch, and Web</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelPerf} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="channel" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                  <Tooltip
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Channel Volume']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="transaction_value" name="Channel Volume" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MANUFACTURING ADAPTIVE DASHBOARD
  // -------------------------------------------------------------
  if (industry.includes('MANUF')) {
    const trends = data.trends || data.sales || {};
    const dailyTrends = trends.daily_trends || [];
    const wcPerf = trends.work_center_performance || [];
    const shiftPerf = trends.shift_performance || [];

    return (
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        {/* Manufacturing Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                Manufacturing & Operations
              </span>
              <span className="text-xs text-slate-400 font-mono">Tenant: {filters.companyId}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono mt-1">
              Industrial Production & OEE Intelligence
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Line throughput, machine downtime bottlenecks, scrap rates, and overall equipment effectiveness for {companyName}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/insights"
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900 bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-lg transition-colors shadow-2xs"
            >
              <Factory className="w-3.5 h-3.5 text-amber-700" />
              <span>Plant Diagnostics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Manufacturing KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total Production Output"
            metric={kpis.production_volume}
            format="number"
            description="Total finished units manufactured across all production lines and shifts."
          />
          <KpiCard
            title="Planned Production Target"
            metric={kpis.planned_volume}
            format="number"
            description="Aggregated master production schedule targets for the active period."
          />
          <KpiCard
            title="Production Efficiency (OEE)"
            metric={kpis.production_efficiency}
            format="percent"
            description="Overall Equipment Effectiveness combining availability, performance, and yield."
          />
          <KpiCard
            title="Defect / Scrap Rate"
            metric={kpis.defect_rate}
            format="percent"
            invertColors={true}
            description="Scrapped or rejected parts as a proportion of total manufactured volume."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          <KpiCard
            title="Total Machine Downtime"
            metric={kpis.machine_downtime}
            format="number"
            invertColors={true}
            description="Cumulative minutes lost to unplanned stoppages, changeovers, and tooling faults."
          />
          <KpiCard
            title="Scrapped Defective Units"
            metric={kpis.defective_units}
            format="number"
            invertColors={true}
            description="Absolute count of manufactured parts failing strict quality assurance tolerance checks."
          />
        </div>

        {/* Manufacturing Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Production vs Plan Trajectory */}
          <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Production Output vs Planned Schedule</h2>
                <p className="text-xs text-slate-500">Daily actual production units manufactured versus targets</p>
              </div>
              <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                Daily Actuals
              </span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrends.slice(-30)}>
                  <defs>
                    <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(val: any) => [`${Number(val).toLocaleString()} units`, '']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="production_volume" name="Produced Volume" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorProd)" />
                  <Area type="monotone" dataKey="planned_volume" name="Planned Target" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Shift Performance */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-slate-900">Shift Operational Performance</h2>
              <p className="text-xs text-slate-500">Volume and scrap percentage across shifts</p>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shiftPerf}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="shift" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(val: any) => [`${Number(val).toLocaleString()} units`, 'Output']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="production_volume" name="Output Volume" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Work Center Breakdown */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Work Center Throughput & Line Scrap Rates</h2>
            <p className="text-xs text-slate-500">Production metrics by machine line and assembly station</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Work Center / Machine</th>
                  <th className="py-2.5 px-3 text-right">Volume (Units)</th>
                  <th className="py-2.5 px-3 text-right">Defective Units</th>
                  <th className="py-2.5 px-3 text-right">Scrap Rate</th>
                  <th className="py-2.5 px-3 text-right">Downtime</th>
                  <th className="py-2.5 px-3 text-right">Average OEE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {wcPerf.map((wc: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-900">{wc.work_center}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold">{wc.production_volume.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-600">{wc.defective_units.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{wc.defect_rate.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 text-right font-mono">{wc.downtime_minutes} mins</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-semibold">{wc.avg_efficiency.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RETAIL / E-COMMERCE STANDARD DASHBOARD
  // -------------------------------------------------------------
  const sales = data.sales || {};
  const products = data.products || {};
  const customers = data.customers || {};

  const monthlyTrends = sales.monthly_trends || [];
  const regionalPerformance = sales.regional_performance || [];
  const categoryPerformance = sales.category_performance || [];
  const topProducts = (products.top_revenue_products || []).slice(0, 5);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Title & Business Context Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
              Retail & E-Commerce
            </span>
            <span className="text-xs text-slate-400 font-mono">Tenant: {filters.companyId}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono mt-1">Executive Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Consolidated operational KPIs and multi-dimensional business performance for {companyName}.
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
