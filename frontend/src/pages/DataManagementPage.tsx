import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { DatasetItem, Company } from '../types';
import { LoadingSkeleton, ErrorBanner } from '../components/common/LoadingSkeleton';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Clock,
  Layers,
  Sparkles,
  Building2,
  HelpCircle
} from 'lucide-react';

interface DataManagementPageProps {
  companyId?: string;
  activeCompany?: Company;
  onDataRefreshed?: () => void;
}

export const DataManagementPage: React.FC<DataManagementPageProps> = ({
  companyId = 'novamart',
  activeCompany,
  onDataRefreshed
}) => {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [replaceExisting, setReplaceExisting] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const industry = (activeCompany?.industry || 'RETAIL').toUpperCase();
  const isBanking = industry.includes('BANK');
  const isMfg = industry.includes('MANUF');

  const fetchDatasets = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await apiService.listDatasets(companyId);
      setDatasets(list);
    } catch (err: any) {
      setError(err.message || 'Failed to load dataset history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, [companyId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const resp = await apiService.uploadDataset(formData, companyId, replaceExisting);
      setUploadResult(resp);
      setToastMessage(`Dataset "${resp.filename}" processed and validated successfully for ${activeCompany?.name || companyId}!`);
      setSelectedFile(null);
      await fetchDatasets();
      if (onDataRefreshed) onDataRefreshed();
    } catch (err: any) {
      setError(err.message || 'Error occurred during data ingestion pipeline.');
    } finally {
      setUploading(false);
    }
  };

  const handleResetDemo = async () => {
    setLoading(true);
    try {
      await apiService.resetDemoData();
      setToastMessage('NovaMart Retail synthetic benchmark successfully restored.');
      setUploadResult(null);
      await fetchDatasets();
      if (onDataRefreshed) onDataRefreshed();
    } catch (err: any) {
      setError(err.message || 'Failed to reset demo data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && datasets.length === 0) return <LoadingSkeleton />;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex justify-between items-center text-xs font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
            &times;
          </button>
        </div>
      )}

      {error && <ErrorBanner message={error} onRetry={fetchDatasets} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
              {industry} Mode
            </span>
            <span className="text-xs text-slate-500 font-mono">Organization: {activeCompany?.name || companyId}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono mt-1">
            Data Management & Ingestion Pipeline
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload CSV, Excel spreadsheets, or ZIP archives with automatic canonical schema mapping, quality profiling, and tenant isolation.
          </p>
        </div>

        {companyId === 'novamart' && (
          <button
            onClick={handleResetDemo}
            className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3.5 py-2 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Benchmark Dataset</span>
          </button>
        )}
      </div>

      {/* Industry Canonical Schema Guide */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <HelpCircle className="w-4 h-4 text-indigo-500" />
          <span>Expected Schema for {activeCompany?.name || companyId} ({industry}):</span>
        </div>
        <div className="text-xs text-slate-600 flex flex-wrap gap-2">
          {isBanking && (
            <>
              <code className="bg-white px-2 py-1 rounded border border-slate-200 font-mono text-[11px]">transaction_id</code>
              <code className="bg-white px-2 py-1 rounded border border-slate-200 font-mono text-[11px]">transaction_date</code>
              <code className="bg-white px-2 py-1 rounded border border-slate-200 font-mono text-[11px]">amount</code>
              <code className="bg-white px-2 py-1 rounded border border-slate-200 font-mono text-[11px]">transaction_type</code>
              <code className="bg-white px-2 py-1 rounded border border-slate-200 font-mono text-[11px]">is_fraud</code>
              <code className="bg-white px-2 py-1 rounded border border-slate-200 font-mono text-[11px]">is_default</code>
              <code className="bg-white px-2 py-1 rounded border border-slate-200 font-mono text-[11px]">risk_score</code>
              <code className="bg-white px-2 py-1 rounded border border-slate-200 font-mono text-[11px]">channel</code>
            </>
          )}
          {isMfg && (
            <>
              <code className="bg-white px-2 py-1 rounded border border-slate-200 font-mono text-[11px]">batch_id</code>
              <code className="bg-white px-2 py-1 rounded border border-slate-200 font-mono text-[11px]">production_date</code>
              <code className="bg-white px-2 py-1 rounded border border-slate-200 font-mono text-[11px]">work_center</code>
              <code className="bg-white px-2 py-1 rounded border border-slate-200 font-mono text-[11px]">product_code</code>
              <code className="bg-white px-2 py-1 rounded border border-slate-200 font-mono text-[11px]">planned_quantity</code>
              <code className="bg-white px-2 py-1 rounded border border-slate-200 font-mono text-[11px]">produced_quantity</code>
              <code className="bg-white px-2 py-1 rounded border border-slate-200 font-mono text-[11px]">defective_quantity</code>
              <code className="bg-white px-2 py-1 rounded border border-slate-200 font-mono text-[11px]">downtime_minutes</code>
              <code className="bg-white px-2 py-1 rounded border border-slate-200 font-mono text-[11px]">efficiency_pct</code>
            </>
          )}
          {!isBanking && !isMfg && (
            <>
              <code className="bg-white px-2 py-1 rounded border border-slate-200 font-mono text-[11px]">order_id</code>
              <code className="bg-white px-2 py-1 rounded border border-slate-200 font-mono text-[11px]">order_date</code>
              <code className="bg-white px-2 py-1 rounded border border-slate-200 font-mono text-[11px]">quantity</code>
              <code className="bg-white px-2 py-1 rounded border border-slate-200 font-mono text-[11px]">unit_price</code>
              <code className="bg-white px-2 py-1 rounded border border-slate-200 font-mono text-[11px]">sales</code>
              <code className="bg-white px-2 py-1 rounded border border-slate-200 font-mono text-[11px]">profit</code>
              <code className="bg-white px-2 py-1 rounded border border-slate-200 font-mono text-[11px]">region</code>
            </>
          )}
        </div>
      </div>

      {/* Upload Zone */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-5">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500">
          Upload Dataset for {activeCompany?.name || companyId}
        </h2>

        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors bg-slate-50/50">
          <input
            type="file"
            id="fileInput"
            accept=".csv, .xlsx, .xls, .zip"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="fileInput" className="cursor-pointer space-y-2 block">
            <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mx-auto">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-800">
              {selectedFile ? selectedFile.name : 'Click to select CSV, XLSX, or ZIP file'}
            </div>
            <p className="text-xs text-slate-400">
              Files will be automatically scoped and isolated to {activeCompany?.name || companyId} (up to 50MB)
            </p>
          </label>
        </div>

        {selectedFile && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                id="replaceCheck"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                className="rounded accent-indigo-600 cursor-pointer"
              />
              <label htmlFor="replaceCheck" className="text-slate-700 cursor-pointer">
                Replace existing records for this organization (uncheck to Append)
              </label>
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {uploading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Profiling & Ingesting...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Process Dataset</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Upload Result & Quality Report Scorecard */}
      {uploadResult && (
        <div className="bg-white rounded-xl p-6 border border-emerald-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Ingestion Complete: Dataset Version {uploadResult.version}</span>
            </div>
            <div className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800">
              Quality Score: {Number(uploadResult.qualityScore).toFixed(1)} / 100
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-400 block">Filename</span>
              <span className="font-semibold text-slate-800 truncate block">{uploadResult.filename}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-400 block">Rows Processed</span>
              <span className="font-semibold text-slate-800 font-mono">{uploadResult.rowsProcessed?.toLocaleString()}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-400 block">Validation Status</span>
              <span className="font-semibold text-emerald-600">{uploadResult.validationStatus}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-400 block">Dataset ID</span>
              <span className="font-semibold text-slate-800 font-mono truncate block">{uploadResult.datasetId}</span>
            </div>
          </div>

          {uploadResult.columnMapping && Object.keys(uploadResult.columnMapping).length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Automated Schema Synonym Mappings Detected:
              </h3>
              <div className="flex flex-wrap gap-2 text-xs">
                {Object.entries(uploadResult.columnMapping).map(([orig, canon]) => (
                  <span key={orig} className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px]">
                    <span className="text-slate-500 font-sans">"{orig}"</span> &rarr; <span className="font-semibold text-indigo-600">{String(canon)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dataset Version History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Dataset Version History</h2>
            <p className="text-xs text-slate-500">Immutable audit log of all uploads for {activeCompany?.name || companyId}</p>
          </div>
          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
            {datasets.length} Versions Recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Filename</th>
                <th className="py-3 px-4 text-right">Row Count</th>
                <th className="py-3 px-4 text-center">Quality Score</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ingested At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {datasets.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">v{d.version}</td>
                  <td className="py-3 px-4 font-medium text-slate-900 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>{d.filename}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono">{d.rowCount?.toLocaleString()}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                        d.qualityScore >= 90
                          ? 'bg-emerald-100 text-emerald-800'
                          : d.qualityScore >= 75
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {Number(d.qualityScore).toFixed(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-slate-700">
                      {d.validationStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400 font-mono">
                    {new Date(d.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
