import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Package,
  Users,
  Boxes,
  Sparkles,
  LineChart,
  Sliders,
  Database,
  Settings,
  Building2,
  ShieldAlert,
  Factory
} from 'lucide-react';
import { Company } from '../../types';

interface SidebarProps {
  companyName: string;
  activeCompany?: Company;
}

export const Sidebar: React.FC<SidebarProps> = ({ companyName, activeCompany }) => {
  const industry = activeCompany?.industry?.toUpperCase() || 'RETAIL';
  const isBanking = industry.includes('BANK');
  const isMfg = industry.includes('MANUF');

  const navItems = [
    { name: 'Executive Overview', path: '/', icon: LayoutDashboard },
    {
      name: isBanking ? 'Transaction Intelligence' : isMfg ? 'Production & OEE' : 'Sales Analytics',
      path: '/sales',
      icon: TrendingUp
    },
    {
      name: isBanking ? 'Risk & Fraud Analytics' : isMfg ? 'Defect & Quality Control' : 'Product Intelligence',
      path: '/products',
      icon: isBanking ? ShieldAlert : isMfg ? Factory : Package
    },
    {
      name: isBanking ? 'Account & Customer Base' : isMfg ? 'Shift Performance' : 'Customer Analytics',
      path: '/customers',
      icon: Users
    },
    {
      name: isBanking ? 'Portfolio Assets' : isMfg ? 'Equipment Downtime' : 'Inventory Intelligence',
      path: '/inventory',
      icon: Boxes
    },
    { name: 'AI Insights & Root Cause', path: '/insights', icon: Sparkles },
    { name: 'Predictive Forecasting', path: '/forecast', icon: LineChart },
    { name: 'What-If Simulator', path: '/simulator', icon: Sliders },
    { name: 'Data Management', path: '/data', icon: Database },
    { name: 'Settings & Status', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 h-screen sticky top-0 select-none">
      {/* Brand & Geometric Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight text-white font-mono">NEXORA</span>
          <span className="block text-[10px] uppercase tracking-widest text-indigo-400 font-medium">Intelligence</span>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {isBanking ? 'Financial Decision Core' : isMfg ? 'Industrial Operations Core' : 'Analytics & Decision Core'}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Organization Badge Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700 shrink-0">
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-200 truncate">{companyName}</div>
            <div className="text-[10px] text-teal-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block animate-pulse"></span>
              <span className="truncate">{activeCompany?.industry || 'RETAIL'} Isolated DB</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
