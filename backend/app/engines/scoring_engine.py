import json
from typing import List, Tuple, Dict, Any
from sqlalchemy.orm import Session
from ..models import Lead, ScoringRule, Task, LeadActivity

def eval_condition(lead: Lead, condition: Dict[str, Any]) -> bool:
    field = condition.get("field")
    operator = condition.get("operator", "equals")
    target_value = condition.get("value")

    # Resolve field value on lead object
    val = getattr(lead, field, None)
    if val is None and hasattr(lead, "company") and lead.company:
        val = getattr(lead.company, field, None)

    if val is None:
        return False

    val_str = str(val).lower().strip()
    target_str = str(target_value).lower().strip() if target_value is not None else ""

    if operator in ("equals", "=="):
        return val_str == target_str
    elif operator in ("contains", "like"):
        return target_str in val_str
    elif operator in (">", "gt"):
        try:
            return float(val) > float(target_value)
        except (ValueError, TypeError):
            return False
    elif operator in ("<", "lt"):
        try:
            return float(val) < float(target_value)
        except (ValueError, TypeError):
            return False
    elif operator in (">=", "gte"):
        try:
            return float(val) >= float(target_value)
        except (ValueError, TypeError):
            return False
    elif operator in ("<=", "lte"):
        try:
            return float(val) <= float(target_value)
        except (ValueError, TypeError):
            return False
    elif operator == "is_true":
        return bool(val) is True
    elif operator == "is_false":
        return bool(val) is False
    elif operator == "in":
        if isinstance(target_value, list):
            return val_str in [str(x).lower() for x in target_value]
        return val_str in target_str

    return False


def calculate_lead_score(lead: Lead, rules: List[ScoringRule], db: Session) -> Tuple[int, str, float, List[str]]:
    """
    Evaluates scoring rules against a lead.
    Returns (score, status, conversion_probability, list_of_applied_rule_names).
    """
    total_score = 0
    applied_rules = []

    # Default Base Scoring Rules (User Spec):
    # Company Size 100+ -> +15
    # Job Role CEO/CTO -> +20, Manager -> +10
    # Industry SaaS -> +15
    # Verified Email -> +10
    # Visited Pricing Page -> +15
    # Downloaded Proposal -> +10

    # Evaluate dynamic database rules
    for rule in rules:
        if not rule.is_active:
            continue

        try:
            conds = json.loads(rule.conditions_json)
        except Exception:
            conds = []

        if not conds:
            continue

        # Rule triggers if ALL conditions in the rule match (AND logic per rule)
        match_all = True
        for cond in conds:
            if not eval_condition(lead, cond):
                match_all = False
                break

        if match_all:
            applied_rules.append(rule.name)
            if rule.action == "increase_score":
                total_score += rule.score_value
            elif rule.action == "decrease_score":
                total_score -= rule.score_value

            if rule.set_priority:
                lead.priority = rule.set_priority

            if rule.create_task and rule.task_title:
                # Check if task already exists
                existing_task = db.query(Task).filter(
                    Task.lead_id == lead.id,
                    Task.title == rule.task_title
                ).first()
                if not existing_task:
                    new_task = Task(
                        lead_id=lead.id,
                        title=rule.task_title,
                        description=f"Auto-generated task from rule '{rule.name}'",
                        priority=rule.set_priority or "HIGH",
                        assigned_to_id=lead.assigned_to_id
                    )
                    db.add(new_task)

    # Cap score between 0 and 100
    final_score = max(0, min(100, total_score))

    # Map score to Status
    if final_score >= 80:
        status = "HOT"
    elif final_score >= 60:
        status = "WARM"
    elif final_score >= 40:
        status = "COOL"
    else:
        status = "COLD"

    # AI Conversion Probability calculation
    # Weighted logistic score calculation
    base_prob = final_score / 100.0
    if lead.email_verified:
        base_prob += 0.05
    if lead.visited_pricing_page:
        base_prob += 0.08
    if lead.downloaded_proposal:
        base_prob += 0.10
    if lead.stage in ("QUALIFIED", "MEETING", "PROPOSAL", "NEGOTIATION"):
        base_prob += 0.15
    elif lead.stage == "WON":
        base_prob = 1.0

    conversion_probability = round(min(0.99, max(0.05, base_prob)), 2)

    return final_score, status, conversion_probability, applied_rules
