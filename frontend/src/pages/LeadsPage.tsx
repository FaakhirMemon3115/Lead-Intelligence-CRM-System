import React, { useState, useEffect } from 'react';
import {
  Flame, Search, Filter, RefreshCw, Plus, Eye, Trash2, ArrowUpDown, ShieldCheck, Mail, MapPin, Building2, CheckCircle2, ChevronRight
} from 'lucide-react';
import { Lead } from '../types';
import { api } from '../services/api';
import { LeadDetailModal } from '../components/leads/LeadDetailModal';

interface LeadsPageProps {
  initialStatusFilter?: string;
}

export const LeadsPage: React.FC<LeadsPageProps> = ({ initialStatusFilter = 'ALL' }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [industryFilter, setIndustryFilter] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('ALL');

  // Selected Lead Modal
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const data = await api.getLeads({
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        country: countryFilter !== 'ALL' ? countryFilter : undefined,
        industry: industryFilter !== 'ALL' ? industryFilter : undefined,
        stage: stageFilter !== 'ALL' ? stageFilter : undefined
      });
      setLeads(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter, countryFilter, industryFilter, stageFilter]);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    try {
      await api.deleteLead(id);
      fetchLeads();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string, score: number) => {
    switch (status) {
      case 'HOT': return <span className="badge-hot"><Flame className="h-3 w-3 fill-rose-400" /> HOT ({score})</span>;
      case 'WARM': return <span className="badge-warm">WARM ({score})</span>;
      case 'COOL': return <span className="badge-cool">COOL ({score})</span>;
      default: return <span className="badge-cold">COLD ({score})</span>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Lead Management Directory
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {leads.length} Matching Leads
            </span>
          </h2>
          <p className="text-slate-400 text-sm">
            Search, filter, score, and view complete 360° lead profiles.
          </p>
        </div>
      </div>

      {/* Filter Bar Grid */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name, email, CTO, LD-10492..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">All Statuses (Hot/Warm/Cool/Cold)</option>
            <option value="HOT font-bold">🔥 HOT Only (Score ≥ 80)</option>
            <option value="WARM">🟡 WARM (Score 60-79)</option>
            <option value="COOL">🔵 COOL (Score 40-59)</option>
            <option value="COLD">⚪ COLD (Score &lt; 40)</option>
          </select>
        </div>

        {/* Country Filter */}
        <div>
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">All Countries</option>
            <option value="USA">USA</option>
            <option value="Canada">Canada</option>
            <option value="UK">UK</option>
            <option value="Germany">Germany</option>
          </select>
        </div>

        {/* Industry Filter */}
        <div>
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">All Industries</option>
            <option value="Software">Software</option>
            <option value="SaaS">SaaS</option>
            <option value="Fintech">Fintech</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Cloud">Cloud</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Lead Code</th>
                <th className="py-3 px-4">Prospect Name</th>
                <th className="py-3 px-4">Company & Title</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-center">Score / Status</th>
                <th className="py-3 px-4 text-center">Pipeline Stage</th>
                <th className="py-3 px-4 text-right">Deal Value</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading leads directory...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No leads found matching current filter criteria.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="hover:bg-slate-900/60 transition cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                      #{lead.lead_code}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-white">
                      <div className="flex items-center gap-2">
                        <span>{lead.first_name} {lead.last_name}</span>
                        {lead.email_verified && (
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" title="Verified Email" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{lead.email}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-200">{lead.company?.name || lead.industry}</p>
                      <p className="text-[11px] text-slate-400">{lead.job_title} ({lead.company_size})</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {lead.city}, {lead.country}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex justify-center">
                        {getStatusBadge(lead.status, lead.score)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-[11px]">
                      <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-medium">
                        {lead.stage}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                      ${lead.deal_value?.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLead(lead);
                          }}
                          className="p-1.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition"
                          title="View 360 Profile"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(lead.id, e)}
                          className="p-1.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition"
                          title="Delete Lead"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 360 Lead Detail Profile Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onRefresh={fetchLeads}
        />
      )}
    </div>
  );
};
