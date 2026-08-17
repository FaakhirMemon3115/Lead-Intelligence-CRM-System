from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Task, Lead, LeadActivity
from ..schemas import TaskCreate, TaskResponse

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

@router.get("", response_model=List[TaskResponse])
def list_tasks(db: Session = Depends(get_db)):
    return db.query(Task).order_by(Task.due_date.asc(), Task.id.desc()).all()


@router.post("", response_model=TaskResponse)
def create_task(payload: TaskCreate, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == payload.lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    task = Task(
        lead_id=payload.lead_id,
        title=payload.title,
        description=payload.description,
        due_date=payload.due_date,
        priority=payload.priority,
        assigned_to_id=payload.assigned_to_id or lead.assigned_to_id,
        status="PENDING"
    )
    db.add(task)

    # Activity log
    act = LeadActivity(
        lead_id=lead.id,
        activity_type="Follow-up Scheduled",
        description=f"Task scheduled: '{payload.title}' ({payload.due_date or 'No due date'})"
    )
    db.add(act)

    db.commit()
    db.refresh(task)
    return task


@router.put("/{task_id}/toggle", response_model=TaskResponse)
def toggle_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.status = "COMPLETED" if task.status == "PENDING" else "PENDING"
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}
