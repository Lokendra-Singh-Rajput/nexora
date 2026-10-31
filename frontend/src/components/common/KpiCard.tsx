import React from 'react';
import { KpiValue } from '../../types';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

interface KpiCardProps {
  title: string;
  metric?: KpiValue;
  format?: 'currency' | 'number' | 'percent';
  description?: string;
  invertColors?: boolean; // For return rate or cost where increase is negative
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  metric,
  format = 'number',
  description,
  invertColors = false
}) => {
  if (!metric) {
    return (
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className="text-xl font-bold font-mono text-slate-300 mt-2">N/A</div>
      </div>
    );
  }

  const formatVal = (val: number) => {
    if (val === undefined || val === null || isNaN(val)) return '0';
    if (format === 'currency') {
      return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (format === 'percent') {
      return `${val.toFixed(1)}%`;
    }
    return val.toLocaleString('en-US');
  };

  const isUp = metric.pct_diff > 0;
  const isDown = metric.pct_diff < 0;
  const isFlat = metric.pct_diff === 0;

  // Normal: Up is Green (positive for revenue/profit). Inverted: Up is Red (bad for return rate)
  const isPositive = invertColors ? isDown : isUp;
  const isNegative = invertColors ? isUp : isDown;

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
          {description && (
            <div className="group relative">
              <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-slate-600" />
              <div className="absolute right-0 top-5 hidden group-hover:block w-48 p-2 bg-slate-900 text-white text-[11px] rounded shadow-lg z-30 pointer-events-none">
                {description}
              </div>
            </div>
          )}
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
          {formatVal(metric.current)}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-medium">
          {isUp && (
            <span
              className={`flex items-center px-1.5 py-0.5 rounded ${
                isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              <TrendingUp className="w-3 h-3 mr-0.5" />
              {metric.pct_diff > 0 ? `+${metric.pct_diff.toFixed(1)}%` : `${metric.pct_diff.toFixed(1)}%`}
            </span>
          )}
          {isDown && (
            <span
              className={`flex items-center px-1.5 py-0.5 rounded ${
                isNegative ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              <TrendingDown className="w-3 h-3 mr-0.5" />
              {metric.pct_diff.toFixed(1)}%
            </span>
          )}
          {isFlat && (
            <span className="flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
              <Minus className="w-3 h-3 mr-0.5" />
              0.0%
            </span>
          )}
          <span className="text-slate-400">vs prev</span>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Prev: {formatVal(metric.previous)}
        </div>
      </div>
    </div>
  );
};
