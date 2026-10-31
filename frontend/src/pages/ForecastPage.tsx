import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { FilterState, ForecastResult } from '../types';
import { LoadingSkeleton, ErrorBanner } from '../components/common/LoadingSkeleton';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { LineChart as LineIcon, CheckCircle2, ShieldCheck, HelpCircle } from 'lucide-react';

export const ForecastPage: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [horizon, setHorizon] = useState<number>(30);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiService.getForecast(filters, horizon);
      setForecast(resp);
    } catch (err: any) {
      setError(err.message || 'Failed to generate predictive sales forecast.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters, horizon]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorBanner message={error} onRetry={fetchData} />;
  if (!forecast || !forecast.historical_plus_forecast) return null;

  const chartData = forecast.historical_plus_forecast;
  const metrics = forecast.evaluation_metrics;
  const allModels = forecast.all_model_evaluations || [];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <LineIcon className="w-4 h-4" />
            <span>Time-Series Predictive Machine Learning</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            Daily Sales Forecasting (30-Day Forward)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Statistically evaluated projection with 95% confidence intervals and chronological train/test validation.
          </p>
        </div>

        {/* Forecast Horizon Selector */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setHorizon(14)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              horizon === 14 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            14 Days
          </button>
          <button
            onClick={() => setHorizon(30)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              horizon === 30 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            30 Days
          </button>
        </div>
      </div>

      {/* Model Performance & Selected Algorithm Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Selected Algorithm</div>
          <div className="text-lg font-bold text-indigo-700 font-mono mt-1 truncate">
            {forecast.model_selected}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Min Out-of-Sample Error
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Projected 30d Revenue</div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
            ${forecast.projected_total_revenue_30d.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">Cumulative expected forward sales</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Mean Absolute Error (MAE)</div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
            ${metrics.mae.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">Avg daily dollar variance</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">WAPE Accuracy Metric</div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
            {metrics.wape.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400">Weighted percent error on holdout</div>
        </div>
      </div>

      {/* Main Forecast Chart */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Historical Sales Actuals vs Forward Forecast Band</h2>
            <p className="text-xs text-slate-500">
              Shaded bounds indicate the 95% statistical confidence envelope
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-3 h-0.5 bg-slate-900 inline-block"></span>
              Historical Actuals
            </span>
            <span className="flex items-center gap-1 text-indigo-600 font-semibold">
              <span className="w-3 h-0.5 bg-indigo-600 inline-block border-b-2 border-indigo-600"></span>
              Predicted Series
            </span>
          </div>
        </div>

        <div className="h-88 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} minTickGap={30} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(val: any, name: any) => [val !== null ? `$${Number(val).toLocaleString()}` : '-', name]}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

              {/* Confidence Interval Band */}
              <Area
                type="monotone"
                dataKey="upper_bound"
                stroke="transparent"
                fill="#818cf8"
                fillOpacity={0.15}
                name="95% Upper Bound"
              />
              <Area
                type="monotone"
                dataKey="lower_bound"
                stroke="transparent"
                fill="#818cf8"
                fillOpacity={0.15}
                name="95% Lower Bound"
              />

              {/* Historical actual line */}
              <Line
                type="monotone"
                dataKey="actual"
                name="Actual Sales"
                stroke="#0f172a"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />

              {/* Forecast projection line */}
              <Line
                type="monotone"
                dataKey="forecast"
                name="Forecast Projection"
                stroke="#4f46e5"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={{ r: 2 }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Model Benchmark Comparison Table */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-2">Chronological Model Benchmark Evaluation</h2>
        <p className="text-xs text-slate-500 mb-4">
          Models trained on first 80% chronological series and scored on out-of-sample holdout test partition (20%).
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Candidate Model</th>
                <th className="py-2.5 px-3 text-right">MAE ($)</th>
                <th className="py-2.5 px-3 text-right">RMSE ($)</th>
                <th className="py-2.5 px-3 text-right">WAPE (%)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {allModels.map((m: any, idx: number) => {
                const isWinner = m.model === forecast.model_selected;
                return (
                  <tr key={idx} className={isWinner ? 'bg-indigo-50/50 font-semibold' : ''}>
                    <td className="py-2.5 px-3 text-slate-900">{m.model}</td>
                    <td className="py-2.5 px-3 text-right font-mono">${m.mae.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-mono">${m.rmse.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{m.wape.toFixed(1)}%</td>
                    <td className="py-2.5 px-3 text-center">
                      {isWinner ? (
                        <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded font-bold">
                          Selected Model
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Benchmarked</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
