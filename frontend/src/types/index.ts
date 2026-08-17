export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface Company {
  id: number;
  name: string;
  domain?: string;
  industry?: string;
  company_size?: string;
  employee_count?: number;
  location?: string;
  website?: string;
}

export interface LeadActivity {
  id: number;
  lead_id: number;
  activity_type: string;
  description: string;
  metadata_json?: string;
  created_at: string;
}

export interface Task {
  id: number;
  lead_id: number;
  title: string;
  description?: string;
  due_date?: string;
  status: 'PENDING' | 'COMPLETED';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  assigned_to_id?: number;
  created_at: string;
}

export interface Lead {
  id: number;
  lead_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  country: string;
  city: string;
  industry: string;
  company_size: string;
  job_title: string;
  source: string;
  score: number;
  status: 'HOT' | 'WARM' | 'COOL' | 'COLD';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  stage: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'MEETING' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';
  email_verified: boolean;
  visited_pricing_page: boolean;
  downloaded_proposal: boolean;
  conversion_probability: number;
  deal_value: number;
  company_id?: number;
  assigned_to_id?: number;
  created_at: string;
  updated_at: string;
  company?: Company;
  assigned_to?: User;
  activities?: LeadActivity[];
  tasks?: Task[];
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'contains' | '>' | '<' | '>=' | '<=' | 'is_true' | 'is_false' | 'in';
  value: any;
}

export interface ScoringRule {
  id: number;
  name: string;
  description?: string;
  conditions: RuleCondition[];
  conditions_json: string;
  action: string;
  score_value: number;
  set_priority?: string;
  create_task: boolean;
  task_title?: string;
  priority: number;
  is_active: boolean;
  created_at: string;
}

export interface QueryNode {
  logical_operator: 'AND' | 'OR';
  conditions: RuleCondition[];
  sub_groups?: QueryNode[];
}

export interface FilterRule {
  id: number;
  name: string;
  description?: string;
  query_tree_json: string;
  is_favorite: boolean;
  created_at: string;
}

export interface DuplicateGroup {
  id: number;
  lead_1: Lead;
  lead_2: Lead;
  match_reason: string;
  similarity_score: number;
  status: 'PENDING' | 'MERGED' | 'DISMISSED';
  created_at: string;
}

export interface PipelineStageBoard {
  stage_id: number;
  stage_key: string;
  stage_name: string;
  color: string;
  display_order: number;
  lead_count: number;
  deal_total: number;
  leads: Lead[];
}

export interface AnalyticsSummary {
  kpis: {
    total_leads: number;
    new_leads: number;
    hot_leads: number;
    qualified_leads: number;
    converted_leads: number;
    conversion_rate: number;
    total_pipeline_value: number;
  };
  leads_by_day: { date: string; leads: number }[];
  leads_by_source: { source: string; count: number }[];
  leads_by_country: { country: string; count: number }[];
  leads_by_industry: { industry: string; count: number }[];
  temperature_distribution: { status: string; count: number }[];
  conversion_funnel: { stage: string; count: number }[];
  team_performance: {
    id: number;
    name: string;
    role: string;
    leads_managed: number;
    won_deals: number;
    revenue: number;
    conversion_rate: number;
  }[];
}
