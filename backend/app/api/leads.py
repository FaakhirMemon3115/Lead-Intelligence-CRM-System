from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Lead, Company, LeadActivity, ScoringRule, Task, AuditLog
from ..schemas import LeadResponse, LeadCreate, LeadUpdate, LeadActivityResponse
from ..engines.scoring_engine import calculate_lead_score

router = APIRouter(prefix="/api/leads", tags=["Leads"])

@router.get("", response_model=List[LeadResponse])
def list_leads(
    search: Optional[str] = None,
    status: Optional[str] = None,
    stage: Optional[str] = None,
    country: Optional[str] = None,
    industry: Optional[str] = None,
    min_score: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Lead)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (Lead.first_name.ilike(s)) |
            (Lead.last_name.ilike(s)) |
            (Lead.email.ilike(s)) |
            (Lead.lead_code.ilike(s)) |
            (Lead.job_title.ilike(s))
        )

    if status and status != "ALL":
        query = query.filter(Lead.status == status)

    if stage and stage != "ALL":
        query = query.filter(Lead.stage == stage)

    if country and country != "ALL":
        query = query.filter(Lead.country == country)

    if industry and industry != "ALL":
        query = query.filter(Lead.industry == industry)

    if min_score is not None:
        query = query.filter(Lead.score >= min_score)

    return query.order_by(Lead.score.desc(), Lead.id.desc()).all()


@router.get("/{lead_id}", response_model=LeadResponse)
def get_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.post("", response_model=LeadResponse)
def create_lead(payload: LeadCreate, db: Session = Depends(get_db)):
    max_id = db.query(Lead).count() + 1
    code = f"LD-{10000 + max_id}"

    company_id = None
    if payload.company_name:
        company = db.query(Company).filter(Company.name.ilike(payload.company_name)).first()
        if not company:
            company = Company(
                name=payload.company_name,
                industry=payload.industry,
                company_size=payload.company_size
            )
            db.add(company)
            db.flush()
        company_id = company.id

    lead = Lead(
        lead_code=code,
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        phone=payload.phone,
        country=payload.country,
        city=payload.city,
        industry=payload.industry,
        company_size=payload.company_size,
        job_title=payload.job_title,
        source=payload.source,
        email_verified=payload.email_verified,
        visited_pricing_page=payload.visited_pricing_page,
        downloaded_proposal=payload.downloaded_proposal,
        deal_value=payload.deal_value,
        company_id=company_id,
        assigned_to_id=payload.assigned_to_id,
        stage="NEW"
    )
    db.add(lead)
    db.flush()

    # Calculate score
    rules = db.query(ScoringRule).filter(ScoringRule.is_active == True).all()
    score, status, conv_prob, applied = calculate_lead_score(lead, rules, db)
    lead.score = score
    lead.status = status
    lead.conversion_probability = conv_prob

    # Create Activity Log
    act = LeadActivity(
        lead_id=lead.id,
        activity_type="Lead Created",
        description=f"Manual lead entry created ({code}). Scored {score}/100 ({status})."
    )
    db.add(act)
    db.commit()
    db.refresh(lead)

    return lead


@router.put("/{lead_id}", response_model=LeadResponse)
def update_lead(lead_id: int, payload: LeadUpdate, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    update_dict = payload.dict(exclude_unset=True)
    for field, val in update_dict.items():
        setattr(lead, field, val)

    # Rescore lead
    rules = db.query(ScoringRule).filter(ScoringRule.is_active == True).all()
    score, status, conv_prob, applied = calculate_lead_score(lead, rules, db)
    lead.score = score
    lead.status = status
    lead.conversion_probability = conv_prob

    act = LeadActivity(
        lead_id=lead.id,
        activity_type="Lead Updated",
        description=f"Updated profile details. Rescored → {score}/100 ({status})."
    )
    db.add(act)
    db.commit()
    db.refresh(lead)

    return lead


@router.post("/{lead_id}/rescore", response_model=LeadResponse)
def rescore_single_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    rules = db.query(ScoringRule).filter(ScoringRule.is_active == True).all()
    score, status, conv_prob, applied = calculate_lead_score(lead, rules, db)
    
    old_score = lead.score
    lead.score = score
    lead.status = status
    lead.conversion_probability = conv_prob

    act = LeadActivity(
        lead_id=lead.id,
        activity_type="Lead Scored",
        description=f"Manually rescored from {old_score} to {score} ({status}). Applied rules: {', '.join(applied) if applied else 'None'}"
    )
    db.add(act)
    db.commit()
    db.refresh(lead)

    return lead


@router.post("/rescore-all")
def rescore_all_leads(db: Session = Depends(get_db)):
    leads = db.query(Lead).all()
    rules = db.query(ScoringRule).filter(ScoringRule.is_active == True).all()
    
    rescored_count = 0
    for lead in leads:
        score, status, conv_prob, _ = calculate_lead_score(lead, rules, db)
        lead.score = score
        lead.status = status
        lead.conversion_probability = conv_prob
        rescored_count += 1

    db.commit()
    return {"message": f"Successfully rescored all {rescored_count} leads across active rules."}


@router.post("/{lead_id}/activities", response_model=LeadActivityResponse)
def add_lead_activity(lead_id: int, activity_type: str, description: str, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    act = LeadActivity(
        lead_id=lead.id,
        activity_type=activity_type,
        description=description
    )
    db.add(act)
    db.commit()
    db.refresh(act)
    return act


@router.delete("/{lead_id}")
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    db.delete(lead)
    db.commit()
    return {"message": "Lead deleted successfully"}
