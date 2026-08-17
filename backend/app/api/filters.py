import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import FilterRule, Lead
from ..schemas import FilterRuleCreate, FilterRuleResponse, LeadResponse
from ..engines.filter_engine import filter_leads

router = APIRouter(prefix="/api/filters", tags=["Filter Engine"])

@router.get("", response_model=List[FilterRuleResponse])
def get_saved_filters(db: Session = Depends(get_db)):
    return db.query(FilterRule).order_by(FilterRule.created_at.desc()).all()


@router.post("", response_model=FilterRuleResponse)
def save_filter_rule(payload: FilterRuleCreate, db: Session = Depends(get_db)):
    rule = FilterRule(
        name=payload.name,
        description=payload.description,
        query_tree_json=json.dumps(payload.query_tree.dict()),
        is_favorite=payload.is_favorite
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.post("/execute", response_model=List[LeadResponse])
def execute_filter_tree(query_tree: Dict[str, Any], db: Session = Depends(get_db)):
    all_leads = db.query(Lead).order_by(Lead.score.desc()).all()
    matched = filter_leads(all_leads, query_tree)
    return matched


@router.delete("/{rule_id}")
def delete_filter_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.query(FilterRule).filter(FilterRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Filter rule not found")
    db.delete(rule)
    db.commit()
    return {"message": "Filter rule deleted successfully"}
