import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import ScoringRule, Lead
from ..schemas import ScoringRuleCreate, ScoringRuleResponse
from ..engines.scoring_engine import calculate_lead_score

router = APIRouter(prefix="/api/scoring-rules", tags=["Scoring Rules"])

@router.get("", response_model=List[ScoringRuleResponse])
def get_scoring_rules(db: Session = Depends(get_db)):
    rules = db.query(ScoringRule).order_by(ScoringRule.priority.asc(), ScoringRule.id.asc()).all()
    res = []
    for r in rules:
        try:
            conds = json.loads(r.conditions_json)
        except Exception:
            conds = []
        res.append({
            "id": r.id,
            "name": r.name,
            "description": r.description,
            "conditions": conds,
            "conditions_json": r.conditions_json,
            "action": r.action,
            "score_value": r.score_value,
            "set_priority": r.set_priority,
            "create_task": r.create_task,
            "task_title": r.task_title,
            "priority": r.priority,
            "is_active": r.is_active,
            "created_at": r.created_at
        })
    return res


@router.post("", response_model=ScoringRuleResponse)
def create_scoring_rule(payload: ScoringRuleCreate, db: Session = Depends(get_db)):
    rule = ScoringRule(
        name=payload.name,
        description=payload.description,
        conditions_json=json.dumps([c.dict() for c in payload.conditions]),
        action=payload.action,
        score_value=payload.score_value,
        set_priority=payload.set_priority,
        create_task=payload.create_task,
        task_title=payload.task_title,
        priority=payload.priority,
        is_active=payload.is_active
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)

    # Automatically rescore leads with new rule
    all_leads = db.query(Lead).all()
    all_rules = db.query(ScoringRule).filter(ScoringRule.is_active == True).all()
    for lead in all_leads:
        score, status, conv_prob, _ = calculate_lead_score(lead, all_rules, db)
        lead.score = score
        lead.status = status
        lead.conversion_probability = conv_prob

    db.commit()

    return {
        "id": rule.id,
        "name": rule.name,
        "description": rule.description,
        "conditions": [c.dict() for c in payload.conditions],
        "conditions_json": rule.conditions_json,
        "action": rule.action,
        "score_value": rule.score_value,
        "set_priority": rule.set_priority,
        "create_task": rule.create_task,
        "task_title": rule.task_title,
        "priority": rule.priority,
        "is_active": rule.is_active,
        "created_at": rule.created_at
    }


@router.put("/{rule_id}/toggle")
def toggle_scoring_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.query(ScoringRule).filter(ScoringRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    rule.is_active = not rule.is_active
    db.commit()

    # Rescore all leads
    all_leads = db.query(Lead).all()
    all_rules = db.query(ScoringRule).filter(ScoringRule.is_active == True).all()
    for lead in all_leads:
        score, status, conv_prob, _ = calculate_lead_score(lead, all_rules, db)
        lead.score = score
        lead.status = status
        lead.conversion_probability = conv_prob

    db.commit()
    return {"message": f"Rule '{rule.name}' is now {'active' if rule.is_active else 'inactive'}."}


@router.delete("/{rule_id}")
def delete_scoring_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.query(ScoringRule).filter(ScoringRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    db.delete(rule)
    db.commit()
    return {"message": "Rule deleted successfully"}
