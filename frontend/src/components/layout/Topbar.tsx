import React, { useState } from 'react';
import { FilterState, Company } from '../../types';
import {
  RotateCcw,
  Sparkles,
  Calendar,
  MapPin,
  RefreshCw,
  Building2,
  ChevronDown,
  PlusCircle,
  Briefcase
} from 'lucide-react';

interface TopbarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onResetFilters: () => void;
  onResetDemo: () => void;
  isCopilotOpen: boolean;
  onToggleCopilot: () => void;
  isRefreshing?: boolean;
  companies: Company[];
  activeCompany?: Company;
  onSelectCompany: (companyId: string) => void;
  onOpenCreateCompany: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  onResetDemo,
  isCopilotOpen,
  onToggleCopilot,
  isRefreshing,
  companies,
  activeCompany,
  onSelectCompany,
  onOpenCreateCompany
}) => {
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const regions = ['All Regions', 'North', 'South', 'East', 'West', 'Central'];

  const getIndustryBadge = (industry?: string) => {
    const ind = (industry || 'RETAIL').toUpperCase();
    if (ind.includes('BANK')) {
      return <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Banking</span>;
    }
    if (ind.includes('MANUF')) {
      return <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">Manufacturing</span>;
    }
    return <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">Retail</span>;
  };

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
      {/* Left: Organization Selector & Filter Controls */}
      <div className="flex items-center gap-3">
        {/* Company / Organization Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-white text-slate-800 transition-all text-xs font-semibold shadow-2xs cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="truncate max-w-[160px]">{activeCompany ? activeCompany.name : filters.companyId}</span>
            {getIndustryBadge(activeCompany?.industry)}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {isCompanyDropdownOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsCompanyDropdownOpen(false)}></div>
              <div className="absolute left-0 top-full mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-40 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Select Organization (Multi-Tenant Isolated)
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {companies.map((comp) => {
                    const isSelected = comp.id === filters.companyId;
                    return (
                      <button
                        key={comp.id}
                        onClick={() => {
                          onSelectCompany(comp.id);
                          setIsCompanyDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                          isSelected ? 'bg-indigo-50/60 font-semibold text-indigo-900' : 'text-slate-700'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-xs truncate">{comp.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {comp.recordCount ? `${comp.recordCount.toLocaleString()} records` : 'No records loaded'}
                          </div>
                        </div>
                        {getIndustryBadge(comp.industry)}
                      </button>
                    );
                  })}
                </div>
                <div className="p-1.5 border-t border-slate-100 bg-slate-50">
                  <button
                    onClick={() => {
                      setIsCompanyDropdownOpen(false);
                      onOpenCreateCompany();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-200 transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+ New Organization</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Date Presets */}
        <div className="hidden md:flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
          <Calendar className="w-3.5 h-3.5 text-slate-500 ml-2 mr-1" />
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

        {/* Region Filter (only if retail) */}
        {(!activeCompany || !activeCompany.industry || activeCompany.industry.toUpperCase().includes('RETAIL')) && (
          <div className="hidden lg:flex items-center bg-slate-100 rounded-lg px-2.5 py-1 border border-slate-200">
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
        )}

        {/* Reset Filter Button */}
        {(filters.startDate || filters.region) && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 px-2 py-1 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Right: Actions, Refresh, AI Copilot Toggle */}
      <div className="flex items-center gap-3">
        {/* Reset Demo Data Button (for NovaMart) */}
        {filters.companyId === 'novamart' && (
          <button
            onClick={onResetDemo}
            title="Restore baseline NovaMart Retail synthetic dataset"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Reset Demo
          </button>
        )}

        {/* Copilot Toggle */}
        <button
          onClick={onToggleCopilot}
          className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer ${
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
