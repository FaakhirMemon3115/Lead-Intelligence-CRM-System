from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import PipelineStage, Lead, LeadActivity
from ..schemas import LeadResponse

router = APIRouter(prefix="/api/pipeline", tags=["Pipeline Board"])

@router.get("/board")
def get_pipeline_board(db: Session = Depends(get_db)):
    stages = db.query(PipelineStage).order_by(PipelineStage.display_order.asc()).all()
    
    board = []
    for stage in stages:
        leads = db.query(Lead).filter(Lead.stage == stage.key).order_by(Lead.score.desc()).all()
        stage_deal_total = db.query(func.sum(Lead.deal_value)).filter(Lead.stage == stage.key).scalar() or 0.0
        
        board.append({
            "stage_id": stage.id,
            "stage_key": stage.key,
            "stage_name": stage.name,
            "color": stage.color,
            "display_order": stage.display_order,
            "lead_count": len(leads),
            "deal_total": stage_deal_total,
            "leads": leads
        })

    return board


@router.post("/update-stage", response_model=LeadResponse)
def update_lead_stage(
    lead_id: int = Body(...),
    new_stage: str = Body(...),
    db: Session = Depends(get_db)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    old_stage = lead.stage
    lead.stage = new_stage

    act = LeadActivity(
        lead_id=lead.id,
        activity_type="Stage Changed",
        description=f"Moved pipeline stage from {old_stage} to {new_stage}."
    )
    db.add(act)
    db.commit()
    db.refresh(lead)

    return lead
