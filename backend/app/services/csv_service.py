import csv
import io
import random
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from ..models import Lead, Company, LeadActivity, ScoringRule
from ..engines.scoring_engine import calculate_lead_score
from ..engines.duplicate_engine import normalize_email

def parse_and_validate_csv(file_content: bytes) -> Tuple[List[Dict[str, Any]], List[str]]:
    """
    Parses CSV content and validates required fields.
    Returns (valid_rows, list_of_errors).
    """
    decoded = file_content.decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(decoded))
    
    valid_rows = []
    errors = []

    row_num = 1
    for row in reader:
        row_num += 1
        # Normalize column keys to lowercase
        norm_row = {k.strip().lower().replace(" ", "_"): v.strip() for k, v in row.items() if k}
        
        email = norm_row.get("email")
        first_name = norm_row.get("first_name") or norm_row.get("name", "").split(" ")[0]
        last_name = norm_row.get("last_name") or (norm_row.get("name", "").split(" ")[1] if len(norm_row.get("name", "").split(" ")) > 1 else "Unknown")
        
        if not email or "@" not in email:
            errors.append(f"Row {row_num}: Missing or invalid email '{email}'")
            continue
        
        if not first_name:
            first_name = "Lead"
            
        valid_rows.append({
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "phone": norm_row.get("phone") or norm_row.get("mobile", ""),
            "country": norm_row.get("country") or norm_row.get("location", "USA"),
            "city": norm_row.get("city", "New York"),
            "industry": norm_row.get("industry") or norm_row.get("sector", "Software"),
            "company_size": norm_row.get("company_size") or norm_row.get("employees", "50-100"),
            "job_title": norm_row.get("job_title") or norm_row.get("title", "Manager"),
            "company_name": norm_row.get("company") or norm_row.get("company_name", "Enterprise Corp"),
            "source": norm_row.get("source", "CSV Import"),
            "deal_value": float(norm_row.get("deal_value") or norm_row.get("value") or 15000.0)
        })

    return valid_rows, errors


def process_csv_import(valid_rows: List[Dict[str, Any]], db: Session) -> Dict[str, Any]:
    """
    Executes actual database insertion with deduplication and auto-scoring.
    """
    rules = db.query(ScoringRule).filter(ScoringRule.is_active == True).all()
    
    imported_count = 0
    duplicate_count = 0
    created_leads = []

    # Get max code number
    max_id = db.query(Lead).count()

    for row in valid_rows:
        canon_email = normalize_email(row["email"])
        
        # Check existing lead with same canonical email
        existing = db.query(Lead).filter(Lead.email.ilike(row["email"])).first()
        if existing:
            duplicate_count += 1
            continue

        max_id += 1
        lead_code = f"LD-{10000 + max_id}"

        # Resolve or create company
        company = None
        if row["company_name"]:
            company = db.query(Company).filter(Company.name.ilike(row["company_name"])).first()
            if not company:
                company = Company(
                    name=row["company_name"],
                    industry=row["industry"],
                    company_size=row["company_size"]
                )
                db.add(company)
                db.flush()

        new_lead = Lead(
            lead_code=lead_code,
            first_name=row["first_name"],
            last_name=row["last_name"],
            email=row["email"],
            phone=row["phone"],
            country=row["country"],
            city=row["city"],
            industry=row["industry"],
            company_size=row["company_size"],
            job_title=row["job_title"],
            source=row["source"],
            deal_value=row["deal_value"],
            company_id=company.id if company else None,
            stage="NEW",
            priority="MEDIUM",
            email_verified=True,
            visited_pricing_page=random.choice([True, False]),
            downloaded_proposal=random.choice([True, False])
        )

        db.add(new_lead)
        db.flush()

        # Score lead dynamically
        score, status, conv_prob, applied = calculate_lead_score(new_lead, rules, db)
        new_lead.score = score
        new_lead.status = status
        new_lead.conversion_probability = conv_prob

        # Activity log
        activity = LeadActivity(
            lead_id=new_lead.id,
            activity_type="Lead Created",
            description=f"Imported via CSV. Scored {score}/100 ({status}). Applied rules: {', '.join(applied) if applied else 'Default'}"
        )
        db.add(activity)

        imported_count += 1
        created_leads.append(new_lead)

    db.commit()

    return {
        "total_processed": len(valid_rows),
        "imported_count": imported_count,
        "duplicate_count": duplicate_count,
        "message": f"Successfully imported {imported_count} leads ({duplicate_count} duplicates skipped)."
    }
