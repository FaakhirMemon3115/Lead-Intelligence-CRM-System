import datetime
import json
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="Sales Rep")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    assigned_leads = relationship("Lead", back_populates="assigned_to")
    assigned_tasks = relationship("Task", back_populates="assigned_to")


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    domain = Column(String(150), nullable=True)
    industry = Column(String(100), nullable=True, index=True)
    company_size = Column(String(50), nullable=True)
    employee_count = Column(Integer, default=5000)
    location = Column(String(100), nullable=True)
    website = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    leads = relationship("Lead", back_populates="company")


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    lead_code = Column(String(30), unique=True, index=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(150), index=True, nullable=False)
    phone = Column(String(50), nullable=True)
    country = Column(String(100), default="USA", index=True)
    city = Column(String(100), default="New York")
    
    industry = Column(String(100), default="Software", index=True)
    company_size = Column(String(50), default="50-100")
    job_title = Column(String(100), default="CTO")
    
    source = Column(String(50), default="Website", index=True)
    score = Column(Integer, default=50, index=True)
    status = Column(String(20), default="WARM", index=True) # HOT, WARM, COOL, COLD
    priority = Column(String(20), default="MEDIUM") # HIGH, MEDIUM, LOW
    stage = Column(String(30), default="NEW", index=True) # NEW, CONTACTED, QUALIFIED, MEETING, PROPOSAL, NEGOTIATION, WON, LOST
    
    email_verified = Column(Boolean, default=True)
    visited_pricing_page = Column(Boolean, default=False)
    downloaded_proposal = Column(Boolean, default=False)
    conversion_probability = Column(Float, default=0.5) # 0.0 to 1.0 (AI metric)
    deal_value = Column(Float, default=15000.0) # Estimated ARR/Value
    
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    company = relationship("Company", back_populates="leads")
    assigned_to = relationship("User", back_populates="assigned_leads")
    activities = relationship("LeadActivity", back_populates="lead", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="lead", cascade="all, delete-orphan")


class LeadActivity(Base):
    __tablename__ = "lead_activities"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    activity_type = Column(String(50), nullable=False) # Created, Email Verified, Scored, Assigned, Email Sent, Follow-up Scheduled, Stage Changed, Note Added
    description = Column(Text, nullable=False)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    lead = relationship("Lead", back_populates="activities")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(String(50), nullable=True)
    status = Column(String(30), default="PENDING") # PENDING, COMPLETED
    priority = Column(String(20), default="MEDIUM") # HIGH, MEDIUM, LOW
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    lead = relationship("Lead", back_populates="tasks")
    assigned_to = relationship("User", back_populates="assigned_tasks")


class ScoringRule(Base):
    __tablename__ = "scoring_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    conditions_json = Column(Text, nullable=False) # Store array of condition dicts
    action = Column(String(50), default="increase_score")
    score_value = Column(Integer, default=15)
    set_priority = Column(String(20), nullable=True) # HIGH, MEDIUM, LOW
    create_task = Column(Boolean, default=False)
    task_title = Column(String(200), nullable=True)
    priority = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class FilterRule(Base):
    __tablename__ = "filter_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    query_tree_json = Column(Text, nullable=False) # JSON structure for nested AND/OR rules
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class PipelineStage(Base):
    __tablename__ = "pipeline_stages"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    display_order = Column(Integer, nullable=False)
    color = Column(String(30), default="#3b82f6")


class DuplicateGroup(Base):
    __tablename__ = "duplicate_groups"

    id = Column(Integer, primary_key=True, index=True)
    lead_id_1 = Column(Integer, ForeignKey("leads.id"), nullable=False)
    lead_id_2 = Column(Integer, ForeignKey("leads.id"), nullable=False)
    match_reason = Column(String(150), nullable=False) # Email Match, Company Match, Name Similarity
    similarity_score = Column(Float, default=0.90)
    status = Column(String(30), default="PENDING") # PENDING, MERGED, DISMISSED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String(150), nullable=False)
    action = Column(String(100), nullable=False)
    target_type = Column(String(50), nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
