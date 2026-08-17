import React, { useState, useEffect } from 'react';
import { KanbanSquare, Flame, DollarSign, MoveRight, RefreshCw, Plus, Eye, Building2 } from 'lucide-react';
import { PipelineStageBoard, Lead } from '../types';
import { api } from '../services/api';

export const PipelinePage: React.FC = () => {
  const [board, setBoard] = useState<PipelineStageBoard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBoard = async () => {
    try {
      setLoading(true);
      const data = await api.getPipelineBoard();
      setBoard(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoard();
  }, []);

  const handleStageMove = async (leadId: number, currentStageKey: string, direction: 'next' | 'prev') => {
    const stageKeys = ['NEW', 'CONTACTED', 'QUALIFIED', 'MEETING', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
    const currIdx = stageKeys.indexOf(currentStageKey);
    if (currIdx === -1) return;

    const newIdx = direction === 'next' ? currIdx + 1 : currIdx - 1;
    if (newIdx < 0 || newIdx >= stageKeys.length) return;

    const targetStage = stageKeys[newIdx];
    try {
      await api.updateLeadStage(leadId, targetStage);
      fetchBoard();
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
            <KanbanSquare className="h-6 w-6 text-cyan-400" />
            CRM Lead Pipeline Board
          </h2>
          <p className="text-slate-400 text-sm">
            Drag-and-drop lead stages across conversion steps (New → Won).
          </p>
        </div>
        <button
          onClick={fetchBoard}
          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5 text-cyan-400" /> Refresh Board
        </button>
      </div>

      {/* Kanban Board Horizontal Scroll */}
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[600px] scrollbar-thin">
        {loading ? (
          <div className="p-8 text-slate-400 font-mono text-xs">Loading CRM pipeline board...</div>
        ) : (
          board.map((col) => (
            <div
              key={col.stage_key}
              className="w-80 flex-shrink-0 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between"
            >
              {/* Column Header */}
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: col.color }}
                    ></span>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      {col.stage_name}
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-850 text-slate-300 border border-slate-800">
                    {col.lead_count}
                  </span>
                </div>

                {/* Stage Value Header */}
                <div className="text-[11px] font-mono text-slate-400 mb-3 flex items-center justify-between px-1">
                  <span>Stage Deal Value:</span>
                  <span className="font-bold text-emerald-400">${col.deal_total.toLocaleString()}</span>
                </div>

                {/* Lead Cards List */}
                <div className="space-y-3">
                  {col.leads.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-[11px] text-slate-500 font-mono">
                      No deals in {col.stage_name}
                    </div>
                  ) : (
                    col.leads.map((lead) => (
                      <div
                        key={lead.id}
                        className="glass-panel p-3.5 rounded-xl border border-slate-800 hover:border-cyan-500/40 transition space-y-2.5 group"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono text-[10px] font-bold text-cyan-400">
                              #{lead.lead_code}
                            </span>
                            <h4 className="text-xs font-bold text-white leading-snug">
                              {lead.first_name} {lead.last_name}
                            </h4>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Building2 className="h-3 w-3 text-slate-500" />
                              {lead.company?.name || lead.industry}
                            </p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            lead.status === 'HOT' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                            lead.status === 'WARM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          }`}>
                            {lead.score}/100
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
                          <span className="text-slate-300 font-medium">{lead.job_title}</span>
                          <span className="text-emerald-400 font-bold">${lead.deal_value?.toLocaleString()}</span>
                        </div>

                        {/* Move Actions */}
                        <div className="flex items-center justify-between pt-1 text-[10px]">
                          <button
                            onClick={() => handleStageMove(lead.id, lead.stage, 'prev')}
                            disabled={lead.stage === 'NEW'}
                            className="px-2 py-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition disabled:opacity-30"
                          >
                            ← Prev Stage
                          </button>
                          <button
                            onClick={() => handleStageMove(lead.id, lead.stage, 'next')}
                            disabled={lead.stage === 'WON' || lead.stage === 'LOST'}
                            className="px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 transition disabled:opacity-30 flex items-center gap-1 font-semibold"
                          >
                            Advance Stage →
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
