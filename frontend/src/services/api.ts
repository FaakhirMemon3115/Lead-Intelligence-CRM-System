import {
  Lead, ScoringRule, FilterRule, DuplicateGroup, PipelineStageBoard, AnalyticsSummary, Task, QueryNode
} from '../types';

const API_BASE = 'http://localhost:8000/api';

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error('Invalid login credentials');
    return res.json();
  },

  getUsers: async () => {
    const res = await fetch(`${API_BASE}/auth/users`);
    return res.json();
  },

  // Leads
  getLeads: async (params?: { search?: string; status?: string; stage?: string; country?: string; industry?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/leads?${query}`);
    return res.json() as Promise<Lead[]>;
  },

  getLead: async (id: number) => {
    const res = await fetch(`${API_BASE}/leads/${id}`);
    return res.json() as Promise<Lead>;
  },

  createLead: async (data: Partial<Lead> & { company_name?: string }) => {
    const res = await fetch(`${API_BASE}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json() as Promise<Lead>;
  },

  updateLead: async (id: number, data: Partial<Lead>) => {
    const res = await fetch(`${API_BASE}/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json() as Promise<Lead>;
  },

  rescoreLead: async (id: number) => {
    const res = await fetch(`${API_BASE}/leads/${id}/rescore`, { method: 'POST' });
    return res.json() as Promise<Lead>;
  },

  rescoreAllLeads: async () => {
    const res = await fetch(`${API_BASE}/leads/rescore-all`, { method: 'POST' });
    return res.json();
  },

  addLeadActivity: async (leadId: number, activity_type: string, description: string) => {
    const res = await fetch(`${API_BASE}/leads/${leadId}/activities?activity_type=${encodeURIComponent(activity_type)}&description=${encodeURIComponent(description)}`, {
      method: 'POST'
    });
    return res.json();
  },

  deleteLead: async (id: number) => {
    const res = await fetch(`${API_BASE}/leads/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Pipeline
  getPipelineBoard: async () => {
    const res = await fetch(`${API_BASE}/pipeline/board`);
    return res.json() as Promise<PipelineStageBoard[]>;
  },

  updateLeadStage: async (leadId: number, newStage: string) => {
    const res = await fetch(`${API_BASE}/pipeline/update-stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: leadId, new_stage: newStage })
    });
    return res.json() as Promise<Lead>;
  },

  // Scoring Rules
  getScoringRules: async () => {
    const res = await fetch(`${API_BASE}/scoring-rules`);
    return res.json() as Promise<ScoringRule[]>;
  },

  createScoringRule: async (rule: Partial<ScoringRule>) => {
    const res = await fetch(`${API_BASE}/scoring-rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule)
    });
    return res.json() as Promise<ScoringRule>;
  },

  toggleScoringRule: async (id: number) => {
    const res = await fetch(`${API_BASE}/scoring-rules/${id}/toggle`, { method: 'PUT' });
    return res.json();
  },

  deleteScoringRule: async (id: number) => {
    const res = await fetch(`${API_BASE}/scoring-rules/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Filters Engine
  getSavedFilters: async () => {
    const res = await fetch(`${API_BASE}/filters`);
    return res.json() as Promise<FilterRule[]>;
  },

  saveFilterRule: async (name: string, description: string, query_tree: QueryNode) => {
    const res = await fetch(`${API_BASE}/filters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, query_tree })
    });
    return res.json() as Promise<FilterRule>;
  },

  executeFilterTree: async (query_tree: QueryNode) => {
    const res = await fetch(`${API_BASE}/filters/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query_tree)
    });
    return res.json() as Promise<Lead[]>;
  },

  // Duplicates
  scanDuplicates: async () => {
    const res = await fetch(`${API_BASE}/duplicates/scan`);
    return res.json();
  },

  getDuplicates: async () => {
    const res = await fetch(`${API_BASE}/duplicates`);
    return res.json() as Promise<DuplicateGroup[]>;
  },

  mergeLeads: async (primaryId: number, secondaryId: number, keepFields: Record<string, any>) => {
    const res = await fetch(`${API_BASE}/duplicates/merge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ primary_lead_id: primaryId, secondary_lead_id: secondaryId, keep_field_source: keepFields })
    });
    return res.json() as Promise<Lead>;
  },

  dismissDuplicate: async (groupId: number) => {
    const res = await fetch(`${API_BASE}/duplicates/${groupId}/dismiss`, { method: 'POST' });
    return res.json();
  },

  // CSV Import
  uploadPreviewCSV: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/imports/upload-preview`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },

  executeCSVImport: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/imports/execute`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },

  // Analytics
  getAnalytics: async () => {
    const res = await fetch(`${API_BASE}/analytics`);
    return res.json() as Promise<AnalyticsSummary>;
  },

  // Tasks
  getTasks: async () => {
    const res = await fetch(`${API_BASE}/tasks`);
    return res.json() as Promise<Task[]>;
  },

  createTask: async (task: { lead_id: number; title: string; description?: string; due_date?: string; priority?: string }) => {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
    return res.json() as Promise<Task>;
  },

  toggleTask: async (id: number) => {
    const res = await fetch(`${API_BASE}/tasks/${id}/toggle`, { method: 'PUT' });
    return res.json() as Promise<Task>;
  }
};
