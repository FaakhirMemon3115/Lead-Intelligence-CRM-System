import React, { useState } from 'react';
import { Filter, Play, Save, Code, CheckCircle2, Flame, Building2, ShieldCheck, Layers } from 'lucide-react';
import { QueryNode, Lead } from '../types';
import { api } from '../services/api';
import { LeadDetailModal } from '../components/leads/LeadDetailModal';

export const FilterStudioPage: React.FC = () => {
  const [operator, setOperator] = useState<'AND' | 'OR'>('AND');
  const [conditions, setConditions] = useState([
    { field: 'country', operator: 'equals', value: 'USA' },
    { field: 'industry', operator: 'in', value: ['SaaS', 'Software'] },
    { field: 'score', operator: '>=', value: 70 },
    { field: 'email_verified', operator: 'is_true', value: true }
  ]);

  const [matchedLeads, setMatchedLeads] = useState<Lead[]>([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const queryTree: QueryNode = {
    logical_operator: operator,
    conditions: conditions as any
  };

  const handleRunQuery = async () => {
    try {
      const results = await api.executeFilterTree(queryTree);
      setMatchedLeads(results);
      setHasQueried(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCondition = () => {
    setConditions([...conditions, { field: 'job_title', operator: 'contains', value: 'CTO' }]);
  };

  const handleConditionChange = (idx: number, key: string, val: any) => {
    const updated = [...conditions];
    updated[idx] = { ...updated[idx], [key]: val };
    setConditions(updated);
  };

  const handleRemoveCondition = (idx: number) => {
    setConditions(conditions.filter((_, i) => i !== idx));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Filter className="h-6 w-6 text-cyan-400" />
            Lead Filtering Engine & AST Studio
          </h2>
          <p className="text-slate-400 text-sm">
            Construct complex boolean logic query trees (nested AND/OR expressions) and extract high-intent leads instantly.
          </p>
        </div>
        <button
          onClick={handleRunQuery}
          className="px-5 py-2 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
        >
          <Play className="h-4 w-4 fill-slate-950" /> Execute Query Tree
        </button>
      </div>

      {/* Filter Tree Builder & Generated Query JSON Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols - Visual Tree Builder */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-mono">Root Group Logical Operator:</span>
              <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
                <button
                  onClick={() => setOperator('AND')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                    operator === 'AND' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  AND (All Match)
                </button>
                <button
                  onClick={() => setOperator('OR')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                    operator === 'OR' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  OR (Any Match)
                </button>
              </div>
            </div>
            <button
              onClick={handleAddCondition}
              className="text-xs text-cyan-400 font-bold hover:underline"
            >
              + Add Condition
            </button>
          </div>

          {/* Condition Row Cards */}
          <div className="space-y-3">
            {conditions.map((cond, idx) => (
              <div
                key={idx}
                className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center gap-3 text-xs"
              >
                <span className="font-mono text-[10px] text-slate-500 font-bold px-2 py-1 rounded bg-slate-900">
                  {idx === 0 ? 'WHERE' : operator}
                </span>

                <select
                  value={cond.field}
                  onChange={(e) => handleConditionChange(idx, 'field', e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-cyan-500"
                >
                  <option value="country">Country</option>
                  <option value="industry">Industry</option>
                  <option value="company_size">Company Size</option>
                  <option value="job_title">Job Title</option>
                  <option value="score">Lead Score</option>
                  <option value="status">Temperature Status</option>
                  <option value="email_verified">Email Verified</option>
                </select>

                <select
                  value={cond.operator}
                  onChange={(e) => handleConditionChange(idx, 'operator', e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-cyan-500"
                >
                  <option value="equals">=</option>
                  <option value="contains">contains</option>
                  <option value=">=">&gt;=</option>
                  <option value="<=">&lt;=</option>
                  <option value="in">in (list)</option>
                  <option value="is_true">is TRUE</option>
                </select>

                {cond.operator !== 'is_true' && (
                  <input
                    type="text"
                    value={Array.isArray(cond.value) ? cond.value.join(', ') : String(cond.value)}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleConditionChange(idx, 'value', val.includes(',') ? val.split(',').map(s => s.trim()) : val);
                    }}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 font-mono"
                  />
                )}

                <button
                  onClick={() => handleRemoveCondition(idx)}
                  className="text-rose-400 hover:text-rose-300 px-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col - Generated Query Tree AST JSON */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Code className="h-4 w-4 text-cyan-400" /> System Generated Query Tree (AST)
          </h3>
          <p className="text-[11px] text-slate-400 font-sans">
            This AST schema is compiled and evaluated by Python filter engine:
          </p>
          <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-emerald-400 overflow-x-auto text-[11px]">
            {JSON.stringify(queryTree, null, 2)}
          </pre>
        </div>
      </div>

      {/* Query Results Section */}
      {hasQueried && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Query Execution Result ({matchedLeads.length} Matching Leads Found)
            </h3>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded">
              High Priority Qualified Leads
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 font-mono uppercase border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Lead Name</th>
                  <th className="py-2.5 px-3">Title & Company</th>
                  <th className="py-2.5 px-3">Country</th>
                  <th className="py-2.5 px-3 text-center">Score</th>
                  <th className="py-2.5 px-3 text-right">ARR Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {matchedLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No leads matched the query tree criteria.
                    </td>
                  </tr>
                ) : (
                  matchedLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="hover:bg-slate-900/60 transition cursor-pointer"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">#{lead.lead_code}</td>
                      <td className="py-2.5 px-3 font-semibold text-white">{lead.first_name} {lead.last_name}</td>
                      <td className="py-2.5 px-3 text-slate-300">{lead.job_title} ({lead.company?.name || lead.industry})</td>
                      <td className="py-2.5 px-3 text-slate-400">{lead.country}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-rose-400 font-mono">{lead.score}/100</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-bold">${lead.deal_value?.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onRefresh={() => {}}
        />
      )}
    </div>
  );
};
