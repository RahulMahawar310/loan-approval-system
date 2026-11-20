"""Symbolic part: hard rules. To add a new rule, append an entry to the RULES list."""
from dataclasses import dataclass
from typing import Callable


@dataclass
class Rule:
    id: str
    description: str
    check: Callable[[dict], bool]      # True = pass
    detail: Callable[[dict], str]      # text showing the actual value


def emi_ratio(a: dict) -> float:
    return a["existing_emi"] / a["monthly_income"]


RULES = [
    Rule(
        "R1",
        "Age is 21 or more",
        lambda a: a["age"] >= 21,
        lambda a: f"age = {a['age']}",
    ),
    Rule(
        "R2",
        "EMI-to-income ratio is at most 50%",
        lambda a: emi_ratio(a) <= 0.50,
        lambda a: f"actual = {emi_ratio(a) * 100:.0f}%",
    ),
    Rule(
        "R3",
        "Credit score is 550 or more",
        lambda a: a["credit_score"] >= 550,
        lambda a: f"credit score = {a['credit_score']:.0f}",
    ),
]


def evaluate_rules(applicant: dict) -> list[dict]:
    results = []
    for r in RULES:
        results.append(
            {
                "id": r.id,
                "description": r.description,
                "passed": bool(r.check(applicant)),
                "detail": r.detail(applicant),
            }
        )
    return results
