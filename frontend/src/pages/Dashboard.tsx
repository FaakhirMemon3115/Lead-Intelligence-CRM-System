import React from 'react';
import {
  Users, UserPlus, Flame, Target, Trophy, Percent, DollarSign, ArrowUpRight, TrendingUp, Sparkles, Building2
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { AnalyticsSummary } from '../types';

interface DashboardProps {
  analytics: AnalyticsSummary | null;
  onNavigateToLeads: (statusFilter?: string) => void;
}

const COLORS = ['#0284c7', '#3b82f6', '#8b5cf6', '#eab308', '#f97316', '#22c55e', '#ec4899'];
const TEMP_COLORS: Record<string, string> = {
  HOT: '#ef4444',
  WARM: '#f59e0b',
  COOL: '#06b6d4',
  COLD: '#64748b'
};

export const Dashboard: React.FC<DashboardProps> = ({ analytics, onNavigateToLeads }) => {
  if (!analytics) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[500px]">
        <div className="flex items-center gap-3 text-cyan-400">
          <div className="h-6 w-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-medium text-slate-300">Loading Lead Intelligence Analytics...</span>
        </div>
      </div>
    );
  }

  const { kpis, leads_by_day, leads_by_source, leads_by_country, leads_by_industry, temperature_distribution, conversion_funnel, team_performance } = analytics;

  const kpiCards = [
    { label: 'Total Leads', value: kpis.total_leads.toLocaleString(), change: '+12.4%', icon: Users, color: 'from-blue-500/20 to-cyan-500/10 text-cyan-400 border-cyan-500/30', actionFilter: 'ALL' },
    { label: 'New Leads', value: kpis.new_leads.toLocaleString(), change: '+8.1%', icon: UserPlus, color: 'from-sky-500/20 to-blue-500/10 text-sky-400 border-sky-500/30', actionFilter: 'ALL' },
    { label: 'Hot Leads', value: kpis.hot_leads.toLocaleString(), change: '+18.5%', icon: Flame, color: 'from-rose-500/20 to-amber-500/10 text-rose-400 border-rose-500/30', actionFilter: 'HOT' },
    { label: 'Qualified Deals', value: kpis.qualified_leads.toLocaleString(), change: '+15.2%', icon: Target, color: 'from-indigo-500/20 to-purple-500/10 text-indigo-400 border-indigo-500/30', actionFilter: 'ALL' },
    { label: 'Converted', value: kpis.converted_leads.toLocaleString(), change: '+22.0%', icon: Trophy, color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30', actionFilter: 'ALL' },
    { label: 'Conversion Rate', value: `${kpis.conversion_rate}%`, change: '+1.4%', icon: Percent, color: 'from-amber-500/20 to-yellow-500/10 text-amber-400 border-amber-500/30', actionFilter: 'ALL' },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            Lead Intelligence Dashboard
            <span className="text-xs font-mono font-normal px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Engine Active
            </span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Real-time pipeline analytics, lead temperature distribution, and AI conversion signals.
          </p>
        </div>
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-4">
          <div>
            <p className="text-xs text-slate-400 uppercase font-mono">Pipeline Total ARR</p>
            <p className="text-xl font-extrabold text-emerald-400 font-mono">
              ${kpis.total_pipeline_value.toLocaleString()}
            </p>
          </div>
          <div className="h-8 w-px bg-slate-800"></div>
          <button
            onClick={() => onNavigateToLeads('HOT')}
            className="px-3.5 py-2 text-xs font-bold rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition flex items-center gap-1.5 shadow-lg shadow-rose-500/10"
          >
            <Flame className="h-4 w-4 text-rose-400 fill-rose-400/30" /> View Hot Leads
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigateToLeads(card.actionFilter)}
              className={`glass-panel p-4 rounded-xl border bg-gradient-to-b ${card.color} cursor-pointer hover:border-cyan-500/50 transition group`}
            >
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium text-slate-300">{card.label}</span>
                <Icon className="h-4 w-4 group-hover:scale-110 transition" />
              </div>
              <p className="text-2xl font-extrabold text-white tracking-tight">{card.value}</p>
              <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <TrendingUp className="h-3 w-3" />
                <span>{card.change} vs last month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid - Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads by Day Area Chart */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-cyan-400" />
                Leads Growth Velocity (Leads by Day)
              </h3>
              <p className="text-xs text-slate-400">Daily lead ingestion across website, forms, & APIs</p>
            </div>
            <span className="text-xs font-mono bg-slate-900 px-2.5 py-1 rounded text-slate-400 border border-slate-800">Past 14 Days</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={leads_by_day} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff' }}
                />
                <Area type="monotone" dataKey="leads" stroke="#0284c7" strokeWidth={3} fillOpacity={1} fill="url(#leadGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hot / Warm / Cold Temperature Distribution Pie */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Flame className="h-4 w-4 text-rose-400" />
              Lead Temperature Distribution
            </h3>
            <p className="text-xs text-slate-400">Automated 0-100 scoring segmentation</p>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={temperature_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="status"
                >
                  {temperature_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={TEMP_COLORS[entry.status] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff' }}
                />
                <Legend formatter={(val) => <span className="text-xs text-slate-300 font-medium">{val}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Grid - Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Leads by Source Bar */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white">Leads by Channel Source</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leads_by_source} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="source" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leads by Country Bar */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white">Leads by Geography / Country</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leads_by_country} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="country" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leads by Industry Bar */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white">Leads by Industry Sector</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leads_by_industry} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="industry" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem' }} />
                <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3 - Sales Conversion Funnel & Team Performance Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Conversion Pipeline Funnel */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-400" />
            Sales Conversion Funnel
          </h3>
          <div className="space-y-2.5">
            {conversion_funnel.map((item, idx) => {
              const maxCount = Math.max(...conversion_funnel.map(f => f.count), 1);
              const percentage = Math.round((item.count / maxCount) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-300 font-mono">{item.stage}</span>
                    <span className="text-slate-400 font-mono">{item.count} leads ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sales Rep Performance Leaderboard */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              Sales Representative Performance Leaderboard
            </h3>
            <span className="text-xs text-slate-400 font-mono">Team ARR Metrics</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Sales Rep</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3 text-center">Leads</th>
                  <th className="py-2.5 px-3 text-center">Won Deals</th>
                  <th className="py-2.5 px-3 text-right">Revenue ARR</th>
                  <th className="py-2.5 px-3 text-right">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {team_performance.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-3 font-semibold text-white flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px]">
                        {rep.name.substring(0, 2).toUpperCase()}
                      </div>
                      {rep.name}
                    </td>
                    <td className="py-3 px-3 text-slate-400">{rep.role}</td>
                    <td className="py-3 px-3 text-center font-mono font-medium">{rep.leads_managed}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-emerald-400">{rep.won_deals}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-white">${rep.revenue.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right font-mono">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        {rep.conversion_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
