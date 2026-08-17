from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..engines.analytics_engine import generate_analytics

router = APIRouter(prefix="/api/analytics", tags=["Analytics Engine"])

@router.get("")
def get_analytics_data(db: Session = Depends(get_db)):
    return generate_analytics(db)
