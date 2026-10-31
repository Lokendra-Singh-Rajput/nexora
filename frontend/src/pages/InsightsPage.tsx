import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { FilterState, RootCauseAnalysis, BusinessInsight } from '../types';
import { LoadingSkeleton, ErrorBanner } from '../components/common/LoadingSkeleton';
import {
  Sparkles,
  TrendingDown,
  TrendingUp,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Compass
} from 'lucide-react';

export const InsightsPage: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const [rootCause, setRootCause] = useState<RootCauseAnalysis | null>(null);
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [targetKpi, setTargetKpi] = useState<'revenue' | 'profit'>('revenue');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rcResp, insResp] = await Promise.all([
        apiService.getRootCause(filters, targetKpi),
        apiService.getInsights(filters)
      ]);
      setRootCause(rcResp);
      setInsights(insResp.insights || []);
    } catch (err: any) {
      setError(err.message || 'Failed to execute analytical root-cause investigation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters, targetKpi]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorBanner message={error} onRetry={fetchData} />;

  const decomp = rootCause?.variance_decomposition;
  const regions = rootCause?.dimension_breakdowns?.by_region || [];
  const categories = rootCause?.dimension_breakdowns?.by_category || [];
  const decliners = rootCause?.dimension_breakdowns?.top_decliners_products || [];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Diagnostic & Prescriptive Analytics</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            Root Cause Analysis & Actionable Insights
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Multidimensional variance decomposition and evidence-backed operational directives.
          </p>
        </div>

        {/* Toggle investigated KPI */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setTargetKpi('revenue')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              targetKpi === 'revenue' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Investigate Revenue
          </button>
          <button
            onClick={() => setTargetKpi('profit')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              targetKpi === 'profit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Investigate Profit
          </button>
        </div>
      </div>

      {/* Signature Root Cause Card */}
      {rootCause && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Header Banner */}
          <div className="bg-slate-900 text-white p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-mono tracking-widest text-indigo-400 font-semibold">
                  Variance Decomposition Matrix
                </span>
                <h2 className="text-xl font-bold mt-1">
                  Target Metric: {targetKpi.toUpperCase()} ({rootCause.percentage_change >= 0 ? '+' : ''}
                  {rootCause.percentage_change.toFixed(1)}% / ${rootCause.absolute_change.toLocaleString('en-US', { minimumFractionDigits: 2 })})
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Baseline: ${rootCause.previous_period_value.toLocaleString()} &rarr; Current: ${rootCause.current_period_value.toLocaleString()}
                </p>
              </div>

              {/* Volume vs AOV Breakdown Badges */}
              {decomp && (
                <div className="flex items-center gap-3">
                  <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 text-center">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Volume Effect</div>
                    <div className={`text-base font-bold font-mono ${decomp.order_volume_effect < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      ${decomp.order_volume_effect.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 text-center">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">AOV Effect</div>
                    <div className={`text-base font-bold font-mono ${decomp.aov_effect < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      ${decomp.aov_effect.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Dimensional Impact Analysis */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Regional Driver Contribution */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Regional Variance Contribution
                </h3>
                <div className="space-y-2">
                  {regions.map((reg, idx) => {
                    const isNeg = reg.absolute_change < 0;
                    return (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-900">{reg.name}</span>
                          <span className="text-slate-500 ml-2">
                            (${reg.current.toLocaleString()} vs ${reg.previous.toLocaleString()})
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={`font-mono font-bold ${isNeg ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {reg.absolute_change >= 0 ? '+' : ''}${reg.absolute_change.toLocaleString()}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            {reg.contribution_to_total_change.toFixed(1)}% of net delta
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Category Contribution */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Category Variance Contribution
                </h3>
                <div className="space-y-2">
                  {categories.map((cat, idx) => {
                    const isNeg = cat.absolute_change < 0;
                    return (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-900">{cat.name}</span>
                          <span className="text-slate-500 ml-2">
                            (${cat.current.toLocaleString()} vs ${cat.previous.toLocaleString()})
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={`font-mono font-bold ${isNeg ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {cat.absolute_change >= 0 ? '+' : ''}${cat.absolute_change.toLocaleString()}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            {cat.contribution_to_total_change.toFixed(1)}% of net delta
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Synthesized Business Explanations & Prescriptions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
                  <Compass className="w-4 h-4 text-indigo-600" />
                  <span>Synthesized Business Drivers</span>
                </div>
                <ul className="space-y-1.5 text-xs text-indigo-950">
                  {rootCause.potential_explanations.map((exp, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0 mt-1.5"></span>
                      <span>{exp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Actionable Management Prescriptions</span>
                </div>
                <ul className="space-y-1.5 text-xs text-emerald-950">
                  {rootCause.suggested_actions.map((act, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5"></span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Evidence Limitations Notice */}
            <div className="text-[11px] text-slate-400 italic flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>{rootCause.evidence_limitations}</span>
            </div>
          </div>
        </div>
      )}

      {/* Prioritized AI Insights List */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 font-mono">
          Evidence-Backed Operational Directives
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((ins, idx) => {
            const isCrit = ins.priority === 'CRITICAL';
            const isHigh = ins.priority === 'HIGH';
            return (
              <div
                key={idx}
                className={`bg-white rounded-xl p-5 border shadow-xs transition-all space-y-3 ${
                  isCrit
                    ? 'border-rose-300 hover:border-rose-400 bg-rose-50/10'
                    : isHigh
                    ? 'border-amber-300 hover:border-amber-400 bg-amber-50/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wide ${
                      isCrit
                        ? 'bg-rose-100 text-rose-700'
                        : isHigh
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {ins.priority} PRIORITY
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">{ins.business_area}</span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{ins.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ins.description}</p>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <div className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">
                    Empirical Evidence
                  </div>
                  <div className="font-mono text-slate-800 text-[11px]">{ins.supporting_evidence}</div>
                </div>

                <div className="text-xs text-indigo-950 font-medium bg-indigo-50 border border-indigo-100 p-2.5 rounded-lg flex items-start gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span>Recommendation: {ins.recommended_action}</span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-2 font-mono">
                  <span>Confidence: {ins.confidence}</span>
                  <span>ID: {ins.insight_id}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
