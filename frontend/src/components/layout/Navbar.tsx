import React, { useState } from 'react';
import { Search, Bell, Sparkles, RefreshCw, UserCheck, ShieldCheck, Database, Zap } from 'lucide-react';
import { api } from '../../services/api';

interface NavbarProps {
  onSearchChange: (query: string) => void;
  onRefreshAll: () => void;
  activeTab: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearchChange, onRefreshAll, activeTab }) => {
  const [searchValue, setSearchValue] = useState('');
  const [isRescoring, setIsRescoring] = useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    onSearchChange(e.target.value);
  };

  const handleRescoreAll = async () => {
    try {
      setIsRescoring(true);
      await api.rescoreAllLeads();
      onRefreshAll();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRescoring(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between">
      {/* Page Title & Search Bar */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              Lead Intelligence & CRM
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">v1.0 Engine</span>
            </h1>
          </div>
        </div>

        {/* Global Search Input */}
        <div className="relative w-72 hidden md:block">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchValue}
            onChange={handleSearch}
            placeholder="Search leads, CTOs, emails..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition"
          />
        </div>
      </div>

      {/* Right Controls & User Info */}
      <div className="flex items-center gap-3">
        {/* Rescore All Rules Engine Button */}
        <button
          onClick={handleRescoreAll}
          disabled={isRescoring}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500/50 transition disabled:opacity-50"
          title="Trigger Python Scoring Engine to re-evaluate all rules on database"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-cyan-400 ${isRescoring ? 'animate-spin' : ''}`} />
          {isRescoring ? 'Rescoring Engine...' : 'Rescore All Rules'}
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
        </button>

        <div className="h-5 w-px bg-slate-800"></div>

        {/* Default Admin User Badge */}
        <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-md">
            AD
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-medium text-slate-200 leading-tight">Admin Account</p>
            <p className="text-[10px] text-cyan-400 font-mono">admin@admin.com</p>
          </div>
        </div>
      </div>
    </header>
  );
};
