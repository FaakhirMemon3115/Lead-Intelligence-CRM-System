from typing import Dict, Any, List
from sqlalchemy.orm import Session
from ..models import Lead
from .scoring_engine import eval_condition

def evaluate_node(lead: Lead, node: Dict[str, Any]) -> bool:
    """
    Evaluates a nested filter query node against a lead model instance.
    Node schema:
    {
      "logical_operator": "AND" | "OR",
      "conditions": [ { "field": "country", "operator": "equals", "value": "USA" }, ... ],
      "sub_groups": [ { "logical_operator": "OR", "conditions": [...] } ]
    }
    """
    op = node.get("logical_operator", "AND").upper()
    conditions = node.get("conditions", [])
    sub_groups = node.get("sub_groups", [])

    results = []

    # Evaluate simple conditions
    for cond in conditions:
        results.append(eval_condition(lead, cond))

    # Evaluate sub-groups recursively
    for sub in sub_groups:
        results.append(evaluate_node(lead, sub))

    if not results:
        return True

    if op == "OR":
        return any(results)
    else: # Default AND
        return all(results)


def filter_leads(leads: List[Lead], query_tree: Dict[str, Any]) -> List[Lead]:
    """
    Filters a list of leads using the provided AST query tree.
    """
    if not query_tree:
        return leads

    matched = []
    for lead in leads:
        if evaluate_node(lead, query_tree):
            matched.append(lead)

    return matched
