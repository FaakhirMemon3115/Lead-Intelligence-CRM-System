import React, { useState, useEffect } from 'react';
import { CopyCheck, RefreshCw, GitMerge, X, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
import { DuplicateGroup, Lead } from '../types';
import { api } from '../services/api';

export const DuplicatesPage: React.FC = () => {
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [activeGroup, setActiveGroup] = useState<DuplicateGroup | null>(null);

  // Field Merge Overrides (field_name -> lead_id)
  const [fieldOverrides, setFieldOverrides] = useState<Record<string, number>>({});

  const fetchDuplicates = async () => {
    try {
      setLoading(true);
      const data = await api.getDuplicates();
      setDuplicates(data);
      if (data.length > 0 && !activeGroup) {
        setActiveGroup(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, []);

  const handleScan = async () => {
    try {
      setScanning(true);
      await api.scanDuplicates();
      fetchDuplicates();
    } catch (err) {
      console.error(err);
    } finally {
      setScanning(false);
    }
  };

  const handleExecuteMerge = async () => {
    if (!activeGroup) return;
    try {
      // Primary lead is lead_1, Secondary lead is lead_2
      await api.mergeLeads(activeGroup.lead_1.id, activeGroup.lead_2.id, fieldOverrides);
      setActiveGroup(null);
      fetchDuplicates();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismiss = async (groupId: number) => {
    try {
      await api.dismissDuplicate(groupId);
      fetchDuplicates();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <CopyCheck className="h-6 w-6 text-amber-400" />
            Duplicate Detection & Resolution Studio
          </h2>
          <p className="text-slate-400 text-sm">
            Fuzzy matching engine detects duplicate leads across emails, names, and company entities.
          </p>
        </div>
        <button
          onClick={handleScan}
          disabled={scanning}
          className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Scanning Database...' : 'Run Fuzzy Scan'}
        </button>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col - Pending Duplicate Candidate Pairs List */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center justify-between">
            <span>Potential Duplicate Pairs</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {duplicates.length} Candidates
            </span>
          </h3>

          <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
            {duplicates.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 italic">
                No duplicate lead candidates detected. System is clean!
              </div>
            ) : (
              duplicates.map((group) => (
                <div
                  key={group.id}
                  onClick={() => setActiveGroup(group)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition ${
                    activeGroup?.id === group.id
                      ? 'bg-amber-500/10 border-amber-500/40 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] font-bold text-amber-400 uppercase">
                      Match Similarity: {intVal(group.similarity_score * 100)}%
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono font-normal">
                      #{group.lead_1.lead_code} vs #{group.lead_2.lead_code}
                    </span>
                  </div>
                  <p className="font-semibold text-white">
                    {group.lead_1.first_name} {group.lead_1.last_name}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{group.match_reason}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 2 Cols - Side-by-Side Comparison Studio */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          {!activeGroup ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              Select a duplicate group candidate from the list to review side-by-side comparison.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                    Duplicate Resolution Candidate #{activeGroup.id}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    Match Reason: {activeGroup.match_reason}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDismiss(activeGroup.id)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                  >
                    Keep Separate
                  </button>
                  <button
                    onClick={handleExecuteMerge}
                    className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                  >
                    <GitMerge className="h-4 w-4" /> Merge Leads into Primary
                  </button>
                </div>
              </div>

              {/* Side-by-Side Comparison Table */}
              <div className="grid grid-cols-2 gap-4">
                {/* Lead 1 (Primary) */}
                <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-mono text-xs font-bold text-cyan-400">Primary Lead #{activeGroup.lead_1.lead_code}</span>
                    <span className="badge-hot">Score: {activeGroup.lead_1.score}</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <p><span className="text-slate-500 font-mono">Name:</span> <strong className="text-white">{activeGroup.lead_1.first_name} {activeGroup.lead_1.last_name}</strong></p>
                    <p><span className="text-slate-500 font-mono">Email:</span> <span className="text-slate-200 font-mono">{activeGroup.lead_1.email}</span></p>
                    <p><span className="text-slate-500 font-mono">Company:</span> <span className="text-slate-200">{activeGroup.lead_1.company?.name || activeGroup.lead_1.industry}</span></p>
                    <p><span className="text-slate-500 font-mono">Job Title:</span> <span className="text-slate-200">{activeGroup.lead_1.job_title}</span></p>
                    <p><span className="text-slate-500 font-mono">Stage:</span> <span className="text-slate-200">{activeGroup.lead_1.stage}</span></p>
                  </div>
                </div>

                {/* Lead 2 (Secondary to be merged) */}
                <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-mono text-xs font-bold text-amber-400">Secondary Lead #{activeGroup.lead_2.lead_code}</span>
                    <span className="badge-warm">Score: {activeGroup.lead_2.score}</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <p><span className="text-slate-500 font-mono">Name:</span> <strong className="text-white">{activeGroup.lead_2.first_name} {activeGroup.lead_2.last_name}</strong></p>
                    <p><span className="text-slate-500 font-mono">Email:</span> <span className="text-slate-200 font-mono">{activeGroup.lead_2.email}</span></p>
                    <p><span className="text-slate-500 font-mono">Company:</span> <span className="text-slate-200">{activeGroup.lead_2.company?.name || activeGroup.lead_2.industry}</span></p>
                    <p><span className="text-slate-500 font-mono">Job Title:</span> <span className="text-slate-200">{activeGroup.lead_2.job_title}</span></p>
                    <p><span className="text-slate-500 font-mono">Stage:</span> <span className="text-slate-200">{activeGroup.lead_2.stage}</span></p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Merging will combine both activity logs, reassignment tasks, and preserve canonical email history.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

function intVal(num: number) {
  return Math.round(num);
}
