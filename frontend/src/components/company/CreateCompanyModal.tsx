import React, { useState } from 'react';
import { X, Building2, Layers, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { apiService } from '../../services/api';
import { Company } from '../../types';

interface CreateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompanyCreated: (newCompany: Company) => void;
}

export const CreateCompanyModal: React.FC<CreateCompanyModalProps> = ({
  isOpen,
  onClose,
  onCompanyCreated
}) => {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('RETAIL');
  const [customId, setCustomId] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!customId || customId === name.toLowerCase().replace(/[^a-z0-9]/g, '-')) {
      setCustomId(val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Company name is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const created = await apiService.createCompany({
        name: name.trim(),
        industry,
        id: customId.trim() || undefined,
        description: description.trim() || undefined
      });
      onCompanyCreated(created);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create company profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">New Organization Profile</h3>
              <p className="text-xs text-slate-400">Configure multi-tenant isolated enterprise analytics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Company / Entity Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Apex Direct Retail, Horizon Credit Bank"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Industry Vertical *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'RETAIL', label: 'Retail & E-Com', desc: 'Orders, AOV, Margins' },
                { id: 'BANKING', label: 'Banking & Finance', desc: 'Volume, Fraud, Default' },
                { id: 'MANUFACTURING', label: 'Manufacturing', desc: 'OEE, Scrap, Downtime' }
              ].map((ind) => (
                <button
                  type="button"
                  key={ind.id}
                  onClick={() => setIndustry(ind.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    industry === ind.id
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="text-xs font-semibold">{ind.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{ind.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Unique Organization Identifier (Slug)
            </label>
            <input
              type="text"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              placeholder="e.g. horizon-bank"
              className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-slate-50"
            />
            <p className="text-[11px] text-slate-400 mt-1">Used for database schema scoping and API tenant isolation.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description / Business Context
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide organizational scope, key product lines, or business division..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Create Organization</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
