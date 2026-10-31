import React from 'react';
import { FilterState } from '../../types';
import {
  RotateCcw,
  Sparkles,
  Calendar,
  MapPin,
  RefreshCw,
  Clock
} from 'lucide-react';

interface TopbarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onResetFilters: () => void;
  onResetDemo: () => void;
  isCopilotOpen: boolean;
  onToggleCopilot: () => void;
  isRefreshing?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  onResetDemo,
  isCopilotOpen,
  onToggleCopilot,
  isRefreshing
}) => {
  const regions = ['All Regions', 'North', 'South', 'East', 'West', 'Central'];

  const handleDatePreset = (preset: string) => {
    if (preset === 'all') {
      onFilterChange({ ...filters, startDate: undefined, endDate: undefined });
    } else if (preset === 'last30') {
      const now = new Date('2025-10-31');
      const start = new Date(now);
      start.setDate(now.getDate() - 30);
      onFilterChange({
        ...filters,
        startDate: start.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0]
      });
    } else if (preset === 'last90') {
      const now = new Date('2025-10-31');
      const start = new Date(now);
      start.setDate(now.getDate() - 90);
      onFilterChange({
        ...filters,
        startDate: start.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0]
      });
    } else if (preset === 'q3') {
      onFilterChange({ ...filters, startDate: '2025-07-01', endDate: '2025-09-30' });
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Filter Controls */}
      <div className="flex items-center gap-3">
        {/* Date Presets */}
        <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
          <Calendar className="w-4 h-4 text-slate-500 ml-2 mr-1" />
          <button
            onClick={() => handleDatePreset('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              !filters.startDate ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All History
          </button>
          <button
            onClick={() => handleDatePreset('last30')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              filters.startDate === '2025-10-01' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => handleDatePreset('last90')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              filters.startDate === '2025-08-02' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last 90 Days
          </button>
          <button
            onClick={() => handleDatePreset('q3')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              filters.startDate === '2025-07-01' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Q3 Review
          </button>
        </div>

        {/* Region Filter */}
        <div className="flex items-center bg-slate-100 rounded-lg px-2.5 py-1 border border-slate-200">
          <MapPin className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
          <select
            value={filters.region || 'All Regions'}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                region: e.target.value === 'All Regions' ? undefined : e.target.value
              })
            }
            aria-label="Filter by region"
            className="text-xs font-medium text-slate-700 bg-transparent focus:outline-hidden cursor-pointer"
          >
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Filter Button */}
        {(filters.startDate || filters.region) && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 px-2 py-1 hover:bg-slate-100 rounded-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Right: Actions, Refresh, AI Copilot Toggle */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center text-[11px] text-slate-500 gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Real-time DB Sync</span>
        </div>

        {/* Reset Demo Data Button */}
        <button
          onClick={onResetDemo}
          title="Restore baseline NovaMart Retail synthetic dataset"
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Reset Demo
        </button>

        {/* Copilot Toggle */}
        <button
          onClick={onToggleCopilot}
          className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-all shadow-sm ${
            isCopilotOpen
              ? 'bg-indigo-600 text-white'
              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>AI Analyst Copilot</span>
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
        </button>
      </div>
    </header>
  );
};
