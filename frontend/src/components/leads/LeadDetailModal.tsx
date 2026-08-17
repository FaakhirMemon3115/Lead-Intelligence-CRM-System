import React, { useState } from 'react';
import {
  X, Flame, ShieldCheck, Mail, Phone, MapPin, Building, Briefcase, Calendar, Award, Clock, Plus, CheckCircle2, AlertCircle, RefreshCw, Send, FileText
} from 'lucide-react';
import { Lead } from '../../types';
import { api } from '../../services/api';

interface LeadDetailModalProps {
  lead: Lead | null;
  onClose: () => void;
  onRefresh: () => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ lead, onClose, onRefresh }) => {
  const [newActivityType, setNewActivityType] = useState('Note Added');
  const [newActivityDesc, setNewActivityDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRescoring, setIsRescoring] = useState(false);

  if (!lead) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'HOT': return <span className="badge-hot"><Flame className="h-3 w-3 fill-rose-400" /> HOT ({lead.score}/100)</span>;
      case 'WARM': return <span className="badge-warm">WARM ({lead.score}/100)</span>;
      case 'COOL': return <span className="badge-cool">COOL ({lead.score}/100)</span>;
      default: return <span className="badge-cold">COLD ({lead.score}/100)</span>;
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityDesc.trim()) return;
    try {
      setIsSubmitting(true);
      await api.addLeadActivity(lead.id, newActivityType, newActivityDesc);
      setNewActivityDesc('');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRescore = async () => {
    try {
      setIsRescoring(true);
      await api.rescoreLead(lead.id);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRescoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded">
              #{lead.lead_code}
            </span>
            <h2 className="text-xl font-bold text-white">
              {lead.first_name} {lead.last_name}
            </h2>
            {getStatusBadge(lead.status)}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRescore}
              disabled={isRescoring}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-850 text-slate-300 border border-slate-700 hover:text-white hover:border-cyan-500/50 transition flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-cyan-400 ${isRescoring ? 'animate-spin' : ''}`} />
              Rescore Lead
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/60 p-5 rounded-xl border border-slate-800/80">
            {/* Contact Details */}
            <div className="space-y-2 text-xs">
              <p className="text-[11px] font-mono uppercase text-slate-400 font-bold mb-2">Contact Info</p>
              <p className="flex items-center gap-2 text-slate-200">
                <Mail className="h-3.5 w-3.5 text-cyan-400" />
                <span>{lead.email}</span>
                {lead.email_verified && (
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5" title="Verified email">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </span>
                )}
              </p>
              <p className="flex items-center gap-2 text-slate-300">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>{lead.phone || 'N/A'}</span>
              </p>
              <p className="flex items-center gap-2 text-slate-300">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>{lead.city}, {lead.country}</span>
              </p>
            </div>

            {/* Company & Role */}
            <div className="space-y-2 text-xs">
              <p className="text-[11px] font-mono uppercase text-slate-400 font-bold mb-2">Company Profile</p>
              <p className="flex items-center gap-2 text-slate-200 font-semibold">
                <Building className="h-3.5 w-3.5 text-indigo-400" />
                <span>{lead.company?.name || 'ABC Technologies'}</span>
              </p>
              <p className="flex items-center gap-2 text-slate-300">
                <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                <span>{lead.job_title}</span>
              </p>
              <p className="text-slate-400">
                Industry: <span className="text-slate-200 font-medium">{lead.industry}</span> | Size: <span className="text-slate-200 font-medium">{lead.company_size}</span>
              </p>
            </div>

            {/* Score & AI Probability */}
            <div className="space-y-2 text-xs bg-slate-900 p-3 rounded-lg border border-slate-800">
              <p className="text-[11px] font-mono uppercase text-slate-400 font-bold">Intelligence Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white font-mono">{lead.score}</span>
                <span className="text-slate-400 font-mono">/ 100</span>
              </div>
              <p className="text-[11px] text-slate-300">
                AI Conversion Probability: <span className="text-emerald-400 font-bold font-mono">{Math.round((lead.conversion_probability || 0.5) * 100)}%</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Estimated Deal Value: <span className="text-white font-mono font-bold">${lead.deal_value?.toLocaleString()}</span>
              </p>
            </div>
          </div>

          {/* Activity Timeline Section (User Requirement 3) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyan-400" /> Activity Timeline
              </h3>
              <span className="text-xs text-slate-400 font-mono">History Log</span>
            </div>

            {/* Add Activity Input */}
            <form onSubmit={handleAddActivity} className="flex gap-2">
              <select
                value={newActivityType}
                onChange={(e) => setNewActivityType(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="Note Added">Note Added</option>
                <option value="Email Sent">Email Sent</option>
                <option value="Call Made">Call Made</option>
                <option value="Meeting Scheduled">Meeting Scheduled</option>
              </select>
              <input
                type="text"
                value={newActivityDesc}
                onChange={(e) => setNewActivityDesc(e.target.value)}
                placeholder="Log activity note (e.g. Sent pricing proposal)..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSubmitting || !newActivityDesc.trim()}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition disabled:opacity-50 flex items-center gap-1"
              >
                <Send className="h-3.5 w-3.5" /> Log
              </button>
            </form>

            {/* Timeline Stream */}
            <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
              {lead.activities && lead.activities.length > 0 ? (
                lead.activities.map((act) => (
                  <div key={act.id} className="relative pl-8 flex items-start justify-between text-xs group">
                    <div className="absolute left-1.5 top-1 h-4 w-4 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-cyan-400"></div>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200 flex items-center gap-2">
                        {act.activity_type}
                        <span className="text-[10px] text-slate-500 font-mono font-normal">
                          {new Date(act.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </p>
                      <p className="text-slate-400 mt-0.5">{act.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="pl-8 text-xs text-slate-500 italic py-2">No activity events recorded yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
