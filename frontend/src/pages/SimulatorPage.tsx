import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { SimulationResult } from '../types';
import { LoadingSkeleton, ErrorBanner } from '../components/common/LoadingSkeleton';
import { Sliders, RotateCcw, TrendingUp, TrendingDown, DollarSign, Info, ShieldAlert } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export const SimulatorPage: React.FC<{ companyId?: string }> = ({ companyId = 'novamart' }) => {
  const [params, setParams] = useState({
    priceChangePct: 0,
    discountChangePct: 0,
    marketingSpendChangePct: 0,
    volumeShockPct: 0,
    costChangePct: 0
  });

  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiService.runSimulator({
        companyId,
        priceChangePct: params.priceChangePct,
        discountChangePct: params.discountChangePct,
        marketingSpendChangePct: params.marketingSpendChangePct,
        volumeShockPct: params.volumeShockPct,
        costChangePct: params.costChangePct
      });
      setSimResult(resp);
    } catch (err: any) {
      setError(err.message || 'Failed to compute scenario simulation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [params]);

  const resetParams = () => {
    setParams({
      priceChangePct: 0,
      discountChangePct: 0,
      marketingSpendChangePct: 0,
      volumeShockPct: 0,
      costChangePct: 0
    });
  };

  if (loading && !simResult) return <LoadingSkeleton />;
  if (error && !simResult) return <ErrorBanner message={error} onRetry={runSimulation} />;

  const baseline = simResult?.baseline;
  const simulated = simResult?.simulated;
  const comparison = simResult?.scenario_comparison || [];
  const assumptions = simResult?.assumptions || [];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sliders className="w-4 h-4" />
            <span>Scenario Modelling Engine</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            What-If Scenario Simulator
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Model the business impact of pricing decisions, discount adjustments, marketing shifts, and cost fluctuations.
          </p>
        </div>

        <button
          onClick={resetParams}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-lg border border-slate-200 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Sliders to Baseline
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Interactive Controls */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500">
            Scenario Levers & Shocks
          </h2>

          {/* 1. Selling Price Change */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-800">Selling Price Adjustment</span>
              <span className={`font-mono font-bold ${params.priceChangePct > 0 ? 'text-indigo-600' : params.priceChangePct < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                {params.priceChangePct > 0 ? `+${params.priceChangePct}%` : `${params.priceChangePct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="30"
              step="1"
              value={params.priceChangePct}
              onChange={(e) => setParams({ ...params, priceChangePct: parseFloat(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">Incorporates price elasticity of demand (-1.2).</p>
          </div>

          {/* 2. Discount Rate Change */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-800">Promotional Discount Shift</span>
              <span className={`font-mono font-bold ${params.discountChangePct > 0 ? 'text-amber-600' : 'text-slate-600'}`}>
                {params.discountChangePct > 0 ? `+${params.discountChangePct}%` : `${params.discountChangePct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-10"
              max="15"
              step="1"
              value={params.discountChangePct}
              onChange={(e) => setParams({ ...params, discountChangePct: parseFloat(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">Shifts portfolio average discount rate directly.</p>
          </div>

          {/* 3. Marketing Spend Change */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-800">Marketing Expenditure Shift</span>
              <span className={`font-mono font-bold ${params.marketingSpendChangePct > 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                {params.marketingSpendChangePct > 0 ? `+${params.marketingSpendChangePct}%` : `${params.marketingSpendChangePct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="100"
              step="5"
              value={params.marketingSpendChangePct}
              onChange={(e) => setParams({ ...params, marketingSpendChangePct: parseFloat(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">Applies marketing elasticity with diminishing returns.</p>
          </div>

          {/* 4. Sales Volume Shock */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-800">Organic Market Volume Shock</span>
              <span className={`font-mono font-bold ${params.volumeShockPct > 0 ? 'text-teal-600' : 'text-slate-600'}`}>
                {params.volumeShockPct > 0 ? `+${params.volumeShockPct}%` : `${params.volumeShockPct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-30"
              max="30"
              step="2"
              value={params.volumeShockPct}
              onChange={(e) => setParams({ ...params, volumeShockPct: parseFloat(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">Simulates macro demand swings or new store expansion.</p>
          </div>

          {/* 5. Unit Cost (COGS) Change */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-800">Supplier COGS Inflation</span>
              <span className={`font-mono font-bold ${params.costChangePct > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                {params.costChangePct > 0 ? `+${params.costChangePct}%` : `${params.costChangePct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-10"
              max="25"
              step="1"
              value={params.costChangePct}
              onChange={(e) => setParams({ ...params, costChangePct: parseFloat(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">Supply chain manufacturing and shipping cost fluctuations.</p>
          </div>
        </div>

        {/* Right Column: Outcomes & Impact Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {/* Output Cards */}
          {simulated && baseline && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Simulated Revenue */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Simulated Revenue</span>
                <div className="text-2xl font-bold font-mono text-slate-900">
                  ${simulated.revenue.toLocaleString()}
                </div>
                <div className="text-xs font-medium flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-400">Baseline: ${baseline.revenue.toLocaleString()}</span>
                  <span className={`font-mono font-bold ${simulated.revenue_difference >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {simulated.revenue_percent_difference >= 0 ? '+' : ''}{simulated.revenue_percent_difference.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Simulated Profit */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Simulated Net Profit</span>
                <div className="text-2xl font-bold font-mono text-emerald-600">
                  ${simulated.profit.toLocaleString()}
                </div>
                <div className="text-xs font-medium flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-400">Baseline: ${baseline.profit.toLocaleString()}</span>
                  <span className={`font-mono font-bold ${simulated.profit_difference >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {simulated.profit_percent_difference >= 0 ? '+' : ''}{simulated.profit_percent_difference.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Simulated Margin */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Simulated Margin</span>
                <div className="text-2xl font-bold font-mono text-slate-900">
                  {simulated.profit_margin.toFixed(1)}%
                </div>
                <div className="text-xs font-medium flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-400">Baseline: {baseline.profit_margin.toFixed(1)}%</span>
                  <span className={`font-mono font-bold ${simulated.margin_difference >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {simulated.margin_difference >= 0 ? '+' : ''}{simulated.margin_difference.toFixed(1)} pts
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Scenario Comparison Chart */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Baseline vs Simulated Financial Delta</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="metric" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="baseline" name="Baseline Actual" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="simulated" name="Simulated Scenario" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Transparent Assumptions Box */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
              <Info className="w-4 h-4 text-indigo-600" />
              <span>Transparent Economic Assumptions</span>
            </div>
            <ul className="space-y-1 text-xs text-slate-600">
              {assumptions.map((assump, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mt-1.5"></span>
                  <span>{assump}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
