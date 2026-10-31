import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { DatasetItem } from '../types';
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
  Sparkles
} from 'lucide-react';

export const DataManagementPage: React.FC<{ companyId?: string; onDataRefreshed?: () => void }> = ({
  companyId = 'novamart',
  onDataRefreshed
}) => {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [replaceExisting, setReplaceExisting] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
      setToastMessage(`Dataset "${resp.filename}" processed and validated successfully!`);
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            Data Management & Ingestion Engine
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Guided upload pipeline for CSV and Excel spreadsheets with schema detection, automated column mapping, and data quality scoring.
          </p>
        </div>

        <button
          onClick={handleResetDemo}
          className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3.5 py-2 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restore Benchmark Dataset</span>
        </button>
      </div>

      {/* Upload Zone */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-5">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500">
          Upload New Enterprise Dataset
        </h2>

        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors bg-slate-50/50">
          <input
            type="file"
            id="fileInput"
            accept=".csv, .xlsx, .xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="fileInput" className="cursor-pointer space-y-2 block">
            <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mx-auto">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-800">
              {selectedFile ? selectedFile.name : 'Click to select CSV or XLSX file'}
            </div>
            <p className="text-xs text-slate-400">
              Supports Orders, Customers, Products, Inventory, or Combined Excel workbooks up to 50MB
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
                Replace existing company orders with this upload (recommended for clean versioning)
              </label>
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
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
            <span className="text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-bold">
              Quality Score: {uploadResult.qualityScore} / 100
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-500 block">File Name</span>
              <span className="font-mono font-bold text-slate-900">{uploadResult.filename}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-500 block">Rows Processed</span>
              <span className="font-mono font-bold text-slate-900">{uploadResult.rowsProcessed.toLocaleString()}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-500 block">Validation Status</span>
              <span className="font-mono font-bold text-emerald-600">{uploadResult.validationStatus}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-500 block">Dataset ID</span>
              <span className="font-mono text-slate-700">{uploadResult.datasetId}</span>
            </div>
          </div>

          {/* Column Mapping confirmation */}
          {uploadResult.columnMapping && Object.keys(uploadResult.columnMapping).length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Confirmed Schema Field Mapping
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(uploadResult.columnMapping).map(([k, v], idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-mono bg-slate-100 text-slate-800 px-2 py-1 rounded border border-slate-200"
                  >
                    "{k}" &rarr; <strong className="text-indigo-600">{String(v)}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dataset Version History Table */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Ingestion Audit & Version History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Dataset ID</th>
                <th className="py-2.5 px-3">Filename</th>
                <th className="py-2.5 px-3 text-right">Rows</th>
                <th className="py-2.5 px-3 text-center">Version</th>
                <th className="py-2.5 px-3 text-right">Quality Score</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {datasets.map((ds, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-900">{ds.id}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>{ds.filename}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">{ds.rowCount.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-center font-mono">v{ds.version}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                    {ds.qualityScore} / 100
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                      {ds.validationStatus}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400 text-[11px]">
                    {new Date(ds.createdAt).toLocaleString()}
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
