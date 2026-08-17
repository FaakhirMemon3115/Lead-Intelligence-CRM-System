from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import DuplicateGroup, Lead
from ..schemas import MergeLeadsRequest, LeadResponse, DuplicateGroupResponse
from ..engines.duplicate_engine import find_duplicate_pairs, merge_leads

router = APIRouter(prefix="/api/duplicates", tags=["Duplicate Detection Engine"])

@router.get("/scan")
def scan_duplicates(db: Session = Depends(get_db)):
    groups = find_duplicate_pairs(db)
    return {"message": f"Scan completed. Found {len(groups)} potential duplicate pairs.", "groups_count": len(groups)}


@router.get("", response_model=List[DuplicateGroupResponse])
def get_duplicate_groups(db: Session = Depends(get_db)):
    # Auto-scan if none exist
    groups = db.query(DuplicateGroup).filter(DuplicateGroup.status == "PENDING").all()
    if not groups:
        groups = find_duplicate_pairs(db)

    result = []
    for g in groups:
        lead1 = db.query(Lead).filter(Lead.id == g.lead_id_1).first()
        lead2 = db.query(Lead).filter(Lead.id == g.lead_id_2).first()
        if lead1 and lead2:
            result.append(DuplicateGroupResponse(
                id=g.id,
                lead_1=LeadResponse.model_validate(lead1),
                lead_2=LeadResponse.model_validate(lead2),
                match_reason=g.match_reason,
                similarity_score=g.similarity_score,
                status=g.status,
                created_at=g.created_at
            ))
    return result



@router.post("/merge", response_model=LeadResponse)
def execute_merge(req: MergeLeadsRequest, db: Session = Depends(get_db)):
    try:
        primary = merge_leads(
            primary_id=req.primary_lead_id,
            secondary_id=req.secondary_lead_id,
            field_overrides=req.keep_field_source,
            db=db
        )
        return primary
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{group_id}/dismiss")
def dismiss_duplicate(group_id: int, db: Session = Depends(get_db)):
    group = db.query(DuplicateGroup).filter(DuplicateGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Duplicate group not found")

    group.status = "DISMISSED"
    db.commit()
    return {"message": "Duplicate candidate dismissed as separate leads."}
