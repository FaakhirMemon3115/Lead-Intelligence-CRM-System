import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw, Sparkles, ToggleLeft, ToggleRight, Check } from 'lucide-react';
import { ScoringRule, RuleCondition } from '../types';
import { api } from '../services/api';

export const ScoringRulesPage: React.FC = () => {
  const [rules, setRules] = useState<ScoringRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [ruleName, setRuleName] = useState('');
  const [ruleDesc, setRuleDesc] = useState('');
  const [scoreValue, setScoreValue] = useState(20);
  const [setPriority, setSetPriority] = useState('HIGH');
  const [createTask, setCreateTask] = useState(true);
  const [taskTitle, setTaskTitle] = useState('Schedule Executive Product Demo Call');
  const [conditions, setConditions] = useState<RuleCondition[]>([
    { field: 'job_title', operator: 'contains', value: 'CTO' },
    { field: 'company_size', operator: 'in', value: '50-100' }
  ]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const data = await api.getScoringRules();
      setRules(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleAddCondition = () => {
    setConditions([...conditions, { field: 'country', operator: 'equals', value: 'USA' }]);
  };

  const handleConditionChange = (index: number, key: keyof RuleCondition, value: any) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [key]: value };
    setConditions(updated);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;

    try {
      await api.createScoringRule({
        name: ruleName,
        description: ruleDesc,
        conditions: conditions,
        action: 'increase_score',
        score_value: scoreValue,
        set_priority: setPriority,
        create_task: createTask,
        task_title: createTask ? taskTitle : undefined,
        priority: rules.length + 1,
        is_active: true
      });

      setShowCreateModal(false);
      setRuleName('');
      setRuleDesc('');
      fetchRules();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleRule = async (id: number) => {
    try {
      await api.toggleScoringRule(id);
      fetchRules();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRule = async (id: number) => {
    if (!window.confirm('Delete this scoring rule?')) return;
    try {
      await api.deleteScoringRule(id);
      fetchRules();
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
            <SlidersHorizontal className="h-6 w-6 text-cyan-400" />
            Dynamic Lead Scoring Rule Builder
          </h2>
          <p className="text-slate-400 text-sm">
            Define custom IF-THEN rules to award points, set priority tags, and trigger follow-up tasks automatically.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 text-xs font-bold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
        >
          <Plus className="h-4 w-4" /> Create New Rule
        </button>
      </div>

      {/* Rules List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`glass-panel p-5 rounded-2xl border ${
              rule.is_active ? 'border-slate-800' : 'border-slate-800/40 opacity-60'
            } space-y-4`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  Rule #{rule.priority}
                </span>
                <h3 className="text-base font-bold text-white leading-tight mt-0.5">{rule.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{rule.description || 'Custom scoring condition'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleRule(rule.id)}
                  className="p-1 rounded text-slate-400 hover:text-white transition"
                  title="Toggle Active Status"
                >
                  {rule.is_active ? (
                    <ToggleRight className="h-6 w-6 text-cyan-400" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-slate-600" />
                  )}
                </button>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="p-1 rounded text-rose-400 hover:bg-rose-500/10 transition"
                  title="Delete Rule"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* IF Conditions List */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5 font-mono">
              <span className="text-cyan-400 font-bold uppercase text-[10px]">IF CONDITIONS (AND):</span>
              {rule.conditions && rule.conditions.map((cond, idx) => (
                <div key={idx} className="flex items-center gap-2 text-slate-300">
                  <span className="text-slate-500">•</span>
                  <span className="text-amber-400 font-semibold">{cond.field}</span>
                  <span className="text-slate-400">{cond.operator}</span>
                  <span className="text-emerald-400 font-bold">"{String(cond.value)}"</span>
                </div>
              ))}
            </div>

            {/* THEN Actions Output */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <span className="text-emerald-400 font-bold font-mono uppercase text-[10px]">THEN ACTIONS:</span>
              <div className="flex items-center gap-2 text-slate-200">
                <span className="font-mono font-bold text-white bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded">
                  Score +{rule.score_value} Points
                </span>
                {rule.set_priority && (
                  <span className="font-mono text-[11px] text-amber-400 font-bold">
                    Set Priority = {rule.set_priority}
                  </span>
                )}
              </div>
              {rule.create_task && rule.task_title && (
                <p className="text-[11px] text-slate-400 flex items-center gap-1 font-mono pt-1">
                  <CheckCircle2 className="h-3 w-3 text-cyan-400" />
                  Auto Task: "{rule.task_title}"
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Rule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-400" /> Create Dynamic Scoring Rule
            </h3>

            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g. High Value CTO Rule"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <input
                  type="text"
                  value={ruleDesc}
                  onChange={(e) => setRuleDesc(e.target.value)}
                  placeholder="Brief rule explanation"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-500"
                />
              </div>

              {/* Conditions Builder */}
              <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-cyan-400 uppercase text-[10px]">IF CONDITIONS (Match ALL):</span>
                  <button
                    type="button"
                    onClick={handleAddCondition}
                    className="text-cyan-400 text-[10px] font-bold hover:underline"
                  >
                    + Add Condition
                  </button>
                </div>

                {conditions.map((cond, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={cond.field}
                      onChange={(e) => handleConditionChange(idx, 'field', e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
                    >
                      <option value="job_title">job_title</option>
                      <option value="company_size">company_size</option>
                      <option value="industry">industry</option>
                      <option value="country">country</option>
                      <option value="email_verified">email_verified</option>
                      <option value="visited_pricing_page">visited_pricing_page</option>
                      <option value="downloaded_proposal">downloaded_proposal</option>
                    </select>

                    <select
                      value={cond.operator}
                      onChange={(e) => handleConditionChange(idx, 'operator', e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
                    >
                      <option value="contains">contains</option>
                      <option value="equals">equals</option>
                      <option value="is_true">is_true</option>
                      <option value="is_false">is_false</option>
                      <option value="in">in</option>
                    </select>

                    <input
                      type="text"
                      value={String(cond.value)}
                      onChange={(e) => handleConditionChange(idx, 'value', e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
                    />

                    {conditions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCondition(idx)}
                        className="text-rose-400 hover:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Outputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Add Score Points (+)</label>
                  <input
                    type="number"
                    value={scoreValue}
                    onChange={(e) => setScoreValue(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Set Lead Priority</label>
                  <select
                    value={setPriority}
                    onChange={(e) => setSetPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200"
                  >
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="createTaskCheck"
                  checked={createTask}
                  onChange={(e) => setCreateTask(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-cyan-500"
                />
                <label htmlFor="createTaskCheck" className="text-slate-300">
                  Auto-create follow-up task when rule triggers
                </label>
              </div>

              {createTask && (
                <div>
                  <label className="block text-slate-400 mb-1">Task Title</label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                >
                  Save & Rescore Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
