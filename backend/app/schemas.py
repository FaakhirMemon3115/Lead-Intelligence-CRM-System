import datetime
from typing import List, Optional, Any, Union
from pydantic import BaseModel, EmailStr, Field

# User Schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = "Sales Rep"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    token: str
    user: UserResponse

# Company Schemas
class CompanyBase(BaseModel):
    name: str
    domain: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = "50-100"
    employee_count: Optional[int] = 50
    location: Optional[str] = "New York, USA"
    website: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyResponse(CompanyBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Lead Schemas
class LeadBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    country: str = "USA"
    city: str = "New York"
    industry: str = "Software"
    company_size: str = "50-100"
    job_title: str = "CTO"
    source: str = "Website"
    email_verified: bool = True
    visited_pricing_page: bool = False
    downloaded_proposal: bool = False
    deal_value: float = 15000.0
    company_name: Optional[str] = None

class LeadCreate(LeadBase):
    assigned_to_id: Optional[int] = None

class LeadUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    job_title: Optional[str] = None
    source: Optional[str] = None
    stage: Optional[str] = None
    priority: Optional[str] = None
    email_verified: Optional[bool] = None
    visited_pricing_page: Optional[bool] = None
    downloaded_proposal: Optional[bool] = None
    deal_value: Optional[float] = None
    assigned_to_id: Optional[int] = None

class LeadActivityResponse(BaseModel):
    id: int
    lead_id: int
    activity_type: str
    description: str
    metadata_json: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class TaskResponse(BaseModel):
    id: int
    lead_id: int
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    status: str
    priority: str
    assigned_to_id: Optional[int] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class LeadResponse(LeadBase):
    id: int
    lead_code: str
    score: int
    status: str
    priority: str
    stage: str
    conversion_probability: float
    company_id: Optional[int] = None
    assigned_to_id: Optional[int] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    company: Optional[CompanyResponse] = None
    assigned_to: Optional[UserResponse] = None
    activities: List[LeadActivityResponse] = []
    tasks: List[TaskResponse] = []

    class Config:
        from_attributes = True

# Rule Schemas
class RuleCondition(BaseModel):
    field: str
    operator: str  # equals, contains, >, <, >=, <=, is_true, is_false, in
    value: Any

class ScoringRuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    conditions: List[RuleCondition]
    action: str = "increase_score"
    score_value: int = 15
    set_priority: Optional[str] = None
    create_task: bool = False
    task_title: Optional[str] = None
    priority: int = 1
    is_active: bool = True

class ScoringRuleResponse(ScoringRuleCreate):
    id: int
    conditions_json: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Filter Engine Schemas
class QueryNode(BaseModel):
    logical_operator: Optional[str] = "AND" # AND / OR
    conditions: Optional[List[RuleCondition]] = []
    sub_groups: Optional[List["QueryNode"]] = []

class FilterRuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    query_tree: QueryNode
    is_favorite: bool = False

class FilterRuleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    query_tree_json: str
    is_favorite: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Duplicate Schemas
class DuplicateGroupResponse(BaseModel):
    id: int
    lead_1: LeadResponse
    lead_2: LeadResponse
    match_reason: str
    similarity_score: float
    status: str
    created_at: datetime.datetime

class MergeLeadsRequest(BaseModel):
    primary_lead_id: int
    secondary_lead_id: int
    keep_field_source: dict  # field_name -> lead_id

# Analytics Schemas
class AnalyticsSummary(BaseModel):
    total_leads: int
    new_leads: int
    hot_leads: int
    qualified_leads: int
    converted_leads: int
    conversion_rate: float
    total_pipeline_value: float

class TaskCreate(BaseModel):
    lead_id: int
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: str = "MEDIUM"
    assigned_to_id: Optional[int] = None
