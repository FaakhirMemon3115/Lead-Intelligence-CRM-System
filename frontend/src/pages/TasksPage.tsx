import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, CheckCircle2, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { Task } from '../types';
import { api } from '../services/api';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await api.getTasks();
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleToggleTask = async (id: number) => {
    try {
      await api.toggleTask(id);
      fetchTasks();
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
            <CheckSquare className="h-6 w-6 text-cyan-400" />
            Tasks & Follow-ups Manager
          </h2>
          <p className="text-slate-400 text-sm">
            Action items and automated follow-ups triggered by dynamic lead scoring rules.
          </p>
        </div>
        <button
          onClick={fetchTasks}
          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5 text-cyan-400" /> Refresh Tasks
        </button>
      </div>

      {/* Tasks Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Task Title</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading tasks...</td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No scheduled tasks found.</td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr
                    key={task.id}
                    className={`hover:bg-slate-900/40 transition ${
                      task.status === 'COMPLETED' ? 'opacity-50 line-through' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className={`p-1 rounded-full transition ${
                          task.status === 'COMPLETED' ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-300'
                        }`}
                      >
                        <CheckCircle2 className="h-5 w-5" />
                      </button>
                    </td>
                    <td className="py-3 px-4 font-bold text-white">{task.title}</td>
                    <td className="py-3 px-4 text-slate-400">{task.description || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                        task.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        task.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{task.due_date || 'Today'}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {new Date(task.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
