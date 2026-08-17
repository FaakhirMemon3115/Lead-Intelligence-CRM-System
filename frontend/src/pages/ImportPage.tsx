import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export const ImportPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Preview & Validation, 3: Success Result
  const [previewData, setPreviewData] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handlePreviewUpload = async () => {
    if (!file) return;
    try {
      setLoading(true);
      const res = await api.uploadPreviewCSV(file);
      setPreviewData(res);
      setStep(2);
    } catch (err: any) {
      alert(err.message || 'Failed to parse CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!file) return;
    try {
      setLoading(true);
      const res = await api.executeCSVImport(file);
      setImportResult(res);
      setStep(3);
    } catch (err: any) {
      alert(err.message || 'Failed to execute import');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <UploadCloud className="h-6 w-6 text-cyan-400" />
            CSV Data Ingestion & Parser Wizard
          </h2>
          <p className="text-slate-400 text-sm">
            Upload CSV bulk lead files with automated validation, deduplication, and rule-based scoring.
          </p>
        </div>
      </div>

      {/* Stepper Progress */}
      <div className="grid grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl border font-mono text-xs flex items-center gap-3 ${
          step >= 1 ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-slate-900 border-slate-800 text-slate-500'
        }`}>
          <span className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center font-bold">1</span>
          <span>Upload CSV File</span>
        </div>
        <div className={`p-4 rounded-xl border font-mono text-xs flex items-center gap-3 ${
          step >= 2 ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-slate-900 border-slate-800 text-slate-500'
        }`}>
          <span className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center font-bold">2</span>
          <span>Validate & Preview</span>
        </div>
        <div className={`p-4 rounded-xl border font-mono text-xs flex items-center gap-3 ${
          step >= 3 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500'
        }`}>
          <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center font-bold">3</span>
          <span>Import & Score Results</span>
        </div>
      </div>

      {/* Step 1: File Dropzone */}
      {step === 1 && (
        <div className="glass-panel p-10 rounded-2xl border border-dashed border-slate-700 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/20">
            <UploadCloud className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Select or Drag CSV Lead File</h3>
            <p className="text-xs text-slate-400 mt-1">
              Supports standard column headers: <code className="text-cyan-400">first_name, last_name, email, company, country, industry, job_title</code>
            </p>
          </div>

          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="csvFileInput"
          />

          <div className="flex justify-center gap-3 pt-2">
            <label
              htmlFor="csvFileInput"
              className="px-5 py-2.5 text-xs font-bold rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:border-cyan-500/50 cursor-pointer transition"
            >
              Browse CSV File
            </label>
            {file && (
              <button
                onClick={handlePreviewUpload}
                disabled={loading}
                className="px-6 py-2.5 text-xs font-bold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition flex items-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                {loading ? 'Parsing...' : 'Analyze & Preview File'} <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {file && (
            <p className="text-xs font-mono text-cyan-400 pt-2">
              Selected File: <strong>{file.name}</strong> ({Math.round(file.size / 1024)} KB)
            </p>
          )}
        </div>
      )}

      {/* Step 2: Preview & Validation */}
      {step === 2 && previewData && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">CSV Validation & Normalization Report</h3>
              <p className="text-xs text-slate-400 font-mono">File: {previewData.filename}</p>
            </div>
            <div className="flex gap-2 font-mono text-xs">
              <span className="px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                {previewData.total_valid} Valid Rows
              </span>
              {previewData.total_errors > 0 && (
                <span className="px-3 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                  {previewData.total_errors} Errors Skipped
                </span>
              )}
            </div>
          </div>

          {/* Sample Rows Preview Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase">Top 5 Parsed Lead Preview Rows:</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 font-mono text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Lead Name</th>
                    <th className="py-2 px-3">Email</th>
                    <th className="py-2 px-3">Company</th>
                    <th className="py-2 px-3">Job Title</th>
                    <th className="py-2 px-3">Country</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {previewData.preview_rows.map((row: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-semibold text-white">{row.first_name} {row.last_name}</td>
                      <td className="py-2 px-3 font-mono text-cyan-400">{row.email}</td>
                      <td className="py-2 px-3 text-slate-300">{row.company_name}</td>
                      <td className="py-2 px-3 text-slate-400">{row.job_title}</td>
                      <td className="py-2 px-3 text-slate-400">{row.country}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs"
            >
              Cancel & Pick Another File
            </button>
            <button
              onClick={handleExecuteImport}
              disabled={loading}
              className="px-6 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              {loading ? 'Executing Python Engine Import...' : 'Confirm Import & Execute Scoring'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success Import Summary */}
      {step === 3 && importResult && (
        <div className="glass-panel p-8 rounded-2xl border border-emerald-500/30 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Import & Engine Scoring Completed!</h3>
            <p className="text-slate-300 text-xs mt-1">{importResult.message}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto font-mono text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p className="text-slate-400">Total Processed</p>
              <p className="text-xl font-bold text-white">{importResult.total_processed}</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p className="text-slate-400">Imported Leads</p>
              <p className="text-xl font-bold text-emerald-400">{importResult.imported_count}</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p className="text-slate-400">Duplicates Skipped</p>
              <p className="text-xl font-bold text-amber-400">{importResult.duplicate_count}</p>
            </div>
          </div>

          <button
            onClick={() => {
              setStep(1);
              setFile(null);
            }}
            className="px-5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold"
          >
            Import Another CSV File
          </button>
        </div>
      )}
    </div>
  );
};
