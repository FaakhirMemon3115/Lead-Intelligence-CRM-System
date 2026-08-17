import React from 'react';
import { Settings, ShieldCheck, UserCheck, Key, Database, Server, Info, Lock } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Settings className="h-6 w-6 text-cyan-400" />
          Settings & Admin Control Panel
        </h2>
        <p className="text-slate-400 text-sm">
          Database connection status, security credentials, and system engine configurations.
        </p>
      </div>

      {/* Credentials Banner */}
      <div className="bg-gradient-to-r from-cyan-950/60 to-slate-900 border border-cyan-500/30 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Default Development Admin Credentials</h3>
            <p className="text-xs text-slate-400">
              Pre-seeded for instant demonstration & access control evaluation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 font-mono text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-500 uppercase text-[10px]">Admin Email</span>
            <p className="text-sm font-bold text-cyan-400">admin@admin.com</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-500 uppercase text-[10px]">Admin Password</span>
            <p className="text-sm font-bold text-amber-400">admin@access.com</p>
          </div>
        </div>
      </div>

      {/* Core System Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Backend Status */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Server className="h-4 w-4 text-emerald-400" />
            FastAPI Intelligence Engine Server
          </h3>
          <p className="text-slate-400">
            Running on <code className="text-cyan-400 font-mono">http://localhost:8000</code>. Python 3.13 backend handling lead scoring, fuzzy deduplication, AST query tree parsing, and CSV parsing.
          </p>
        </div>

        {/* Database Status */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Database className="h-4 w-4 text-indigo-400" />
            SQLite Database Instance
          </h3>
          <p className="text-slate-400">
            Path: <code className="text-cyan-400 font-mono">backend/app/crm.db</code>. SQLAlchemy 2.0 ORM pre-seeded with leads, companies, pipeline stages, and scoring rules.
          </p>
        </div>
      </div>
    </div>
  );
};
