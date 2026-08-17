import React from 'react';
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  SlidersHorizontal,
  Filter,
  CopyCheck,
  UploadCloud,
  CheckSquare,
  BarChart3,
  Settings,
  Flame,
  BrainCircuit,
  DatabaseZap
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  hotLeadsCount?: number;
  duplicateCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  hotLeadsCount = 0,
  duplicateCount = 0
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Lead Management', icon: Users, badge: hotLeadsCount > 0 ? `${hotLeadsCount} HOT` : null, badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
    { id: 'pipeline', label: 'CRM Pipeline (Kanban)', icon: KanbanSquare },
    { id: 'scoring-rules', label: 'Rule Builder (Scoring)', icon: SlidersHorizontal, highlight: 'AI Rule Engine' },
    { id: 'filter-studio', label: 'Filter Engine Studio', icon: Filter, highlight: 'AST Queries' },
    { id: 'duplicates', label: 'Duplicate Resolution', icon: CopyCheck, badge: duplicateCount > 0 ? `${duplicateCount}` : null, badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    { id: 'import', label: 'CSV Data Importer', icon: UploadCloud },
    { id: 'tasks', label: 'Tasks & Follow-ups', icon: CheckSquare },
    { id: 'settings', label: 'Settings & Admin', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {/* Core Engines Branding Header */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
          <p className="text-[11px] font-mono uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
            <BrainCircuit className="h-3.5 w-3.5 text-cyan-400" />
            4 Core System Engines
          </p>
          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-medium text-slate-300">
            <span className="bg-slate-850 px-2 py-1 rounded border border-slate-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> Data Engine
            </span>
            <span className="bg-slate-850 px-2 py-1 rounded border border-slate-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Intelligence
            </span>
            <span className="bg-slate-850 px-2 py-1 rounded border border-slate-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> CRM Engine
            </span>
            <span className="bg-slate-850 px-2 py-1 rounded border border-slate-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> Analytics
            </span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase text-slate-500 tracking-wider mb-2">Main Menu</p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/5'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
                {item.highlight && !item.badge && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {item.highlight}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer System Status */}
      <div className="mt-8 bg-slate-900/40 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-400 space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            FastAPI Connected
          </span>
          <span className="font-mono text-[10px] text-slate-500">Port 8000</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-normal">
          Rule-based Lead Intelligence Engine active & rescoring in real-time.
        </p>
      </div>
    </aside>
  );
};
