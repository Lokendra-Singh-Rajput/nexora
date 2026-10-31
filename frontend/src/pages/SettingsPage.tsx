import React from 'react';
import { Server, Database, Brain, ShieldCheck, CheckCircle2, Cpu, Globe } from 'lucide-react';

export const SettingsPage: React.FC<{ companyId?: string }> = ({ companyId = 'novamart' }) => {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
          System Architecture & Health Status
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Operational telemetry and modular service infrastructure status for NEXORA Platform.
        </p>
      </div>

      {/* Services Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Spring Boot Backend */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Server className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              <CheckCircle2 className="w-3 h-3" />
              ONLINE
            </span>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Application Core</div>
            <div className="font-bold text-sm text-slate-900">Java 17 Spring Boot 3</div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">Port 8080 • REST APIs & JPA</p>
          </div>
        </div>

        {/* Python Analytics Engine */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              <CheckCircle2 className="w-3 h-3" />
              ONLINE
            </span>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Analytics Engine</div>
            <div className="font-bold text-sm text-slate-900">Python 3.11 + FastAPI</div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">Statsmodels, Pandas, Scikit-learn</p>
          </div>
        </div>

        {/* Database */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Database className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              <CheckCircle2 className="w-3 h-3" />
              CONNECTED
            </span>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Persistence Layer</div>
            <div className="font-bold text-sm text-slate-900">MySQL 8 / H2 Engine</div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">Flyway Migration V1 Verified</p>
          </div>
        </div>

        {/* AI Model */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Brain className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
              READY
            </span>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Decision Intelligence</div>
            <div className="font-bold text-sm text-slate-900">Google Gemini & Fallback</div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">Grounded Tool Calling Architecture</p>
          </div>
        </div>
      </div>

      {/* Engineering Principles & Architecture Box */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500">
          Core Engineering Principles Enforced
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900">1. Grounded Empirical Intelligence</span>
            <p className="text-slate-600 leading-relaxed">
              No numbers or business trends are ever hallucinated by LLMs. All metrics derive from verified statistical formulas in the Python engine.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900">2. Graceful Degradation</span>
            <p className="text-slate-600 leading-relaxed">
              If the Gemini API key is unset or external network services are disrupted, the platform automatically utilizes deterministic rule-based explainability.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900">3. Dynamic Refresh Pipeline</span>
            <p className="text-slate-600 leading-relaxed">
              Every newly uploaded dataset triggers automated profiling, column mapping, database versioning, and recalculates affected dashboard metrics without frontend rebuilds.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900">4. Multi-Tenant Enterprise Isolation</span>
            <p className="text-slate-600 leading-relaxed">
              All transactions, forecasts, and snapshots are scoped by organization ID to guarantee data isolation across companies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
