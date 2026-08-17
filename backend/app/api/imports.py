from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..services.csv_service import parse_and_validate_csv, process_csv_import

router = APIRouter(prefix="/api/imports", tags=["CSV Ingestion Engine"])

@router.post("/upload-preview")
async def upload_preview_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    content = await file.read()
    valid_rows, errors = parse_and_validate_csv(content)
    
    return {
        "filename": file.filename,
        "total_valid": len(valid_rows),
        "total_errors": len(errors),
        "errors": errors[:10], # Return top 10 error snippets
        "preview_rows": valid_rows[:5] # Return top 5 preview rows
    }


@router.post("/execute")
async def execute_csv_import(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    content = await file.read()
    valid_rows, errors = parse_and_validate_csv(content)
    
    if not valid_rows:
        raise HTTPException(status_code=400, detail="No valid lead rows found in CSV.")

    result = process_csv_import(valid_rows, db)
    return result
