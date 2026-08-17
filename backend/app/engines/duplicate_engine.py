import re
from difflib import SequenceMatcher
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from ..models import Lead, DuplicateGroup, LeadActivity, Task

def normalize_email(email: str) -> str:
    if not email:
        return ""
    email = email.lower().strip()
    parts = email.split("@")
    if len(parts) == 2:
        username, domain = parts
        # For gmail/standard domains, remove dots
        if domain in ("gmail.com", "googlemail.com"):
            username = username.replace(".", "")
            if "+" in username:
                username = username.split("+")[0]
        return f"{username}@{domain}"
    return email

def name_similarity(name1: str, name2: str) -> float:
    n1 = re.sub(r'[^a-zA-Z0-9]', '', name1.lower())
    n2 = re.sub(r'[^a-zA-Z0-9]', '', name2.lower())
    return SequenceMatcher(None, n1, n2).ratio()

def find_duplicate_pairs(db: Session) -> List[DuplicateGroup]:
    """
    Scans leads table and creates/updates DuplicateGroup entries.
    """
    leads = db.query(Lead).all()
    created_groups = []

    # Clear existing pending groups
    db.query(DuplicateGroup).filter(DuplicateGroup.status == "PENDING").delete()
    db.commit()

    seen_pairs = set()

    for i in range(len(leads)):
        for j in range(i + 1, len(leads)):
            l1, l2 = leads[i], leads[j]
            pair_key = tuple(sorted([l1.id, l2.id]))

            if pair_key in seen_pairs:
                continue

            match_reason = None
            similarity = 0.0

            # 1. Email Match / Canonical Email Match
            e1 = normalize_email(l1.email)
            e2 = normalize_email(l2.email)
            if e1 == e2:
                match_reason = "Exact Email Match"
                similarity = 1.0
            else:
                # 2. Name similarity + Company Match
                company_1 = (l1.company.name if l1.company else l1.industry or "").lower()
                company_2 = (l2.company.name if l2.company else l2.industry or "").lower()

                full_name_1 = f"{l1.first_name} {l1.last_name}"
                full_name_2 = f"{l2.first_name} {l2.last_name}"
                
                sim = name_similarity(full_name_1, full_name_2)
                
                if company_1 and company_2 and company_1 == company_2 and sim >= 0.75:
                    match_reason = f"Company & High Name Similarity ({int(sim*100)}%)"
                    similarity = round(sim, 2)
                elif sim >= 0.88:
                    match_reason = f"Very High Name Similarity ({int(sim*100)}%)"
                    similarity = round(sim, 2)

            if match_reason:
                seen_pairs.add(pair_key)
                group = DuplicateGroup(
                    lead_id_1=l1.id,
                    lead_id_2=l2.id,
                    match_reason=match_reason,
                    similarity_score=similarity,
                    status="PENDING"
                )
                db.add(group)
                created_groups.append(group)

    db.commit()
    return created_groups


def merge_leads(primary_id: int, secondary_id: int, field_overrides: Dict[str, Any], db: Session) -> Lead:
    """
    Merges secondary lead into primary lead.
    - Re-assigns secondary lead activities and tasks to primary lead.
    - Updates primary lead with field_overrides if provided.
    - Deletes secondary lead.
    """
    primary = db.query(Lead).filter(Lead.id == primary_id).first()
    secondary = db.query(Lead).filter(Lead.id == secondary_id).first()

    if not primary or not secondary:
        raise ValueError("Primary or Secondary lead not found")

    # Apply overrides
    for field, val in field_overrides.items():
        if hasattr(primary, field) and val is not None:
            setattr(primary, field, val)

    # Reassign activities
    db.query(LeadActivity).filter(LeadActivity.lead_id == secondary.id).update(
        {LeadActivity.lead_id: primary.id}
    )

    # Reassign tasks
    db.query(Task).filter(Task.lead_id == secondary.id).update(
        {Task.lead_id: primary.id}
    )

    # Create activity log for merge
    merge_activity = LeadActivity(
        lead_id=primary.id,
        activity_type="Lead Merged",
        description=f"Merged lead {secondary.lead_code} ({secondary.first_name} {secondary.last_name}) into this lead.",
        metadata_json=f'{{"merged_lead_id": {secondary.id}, "merged_code": "{secondary.lead_code}"}}'
    )
    db.add(merge_activity)

    # Update duplicate groups status
    db.query(DuplicateGroup).filter(
        ((DuplicateGroup.lead_id_1 == primary_id) & (DuplicateGroup.lead_id_2 == secondary_id)) |
        ((DuplicateGroup.lead_id_1 == secondary_id) & (DuplicateGroup.lead_id_2 == primary_id))
    ).update({DuplicateGroup.status: "MERGED"})

    # Delete secondary lead
    db.delete(secondary)
    db.commit()
    db.refresh(primary)

    return primary
