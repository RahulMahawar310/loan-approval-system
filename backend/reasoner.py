"""Reasoner: combines the neural score and the symbolic rules into a final decision with an explanation."""
APPROVE_THRESHOLD = 0.5


def decide(neural_score: float, rule_results: list[dict]) -> dict:
    failed = [r for r in rule_results if not r["passed"]]
    neural_only = "Approved" if neural_score >= APPROVE_THRESHOLD else "Rejected"

    if failed:
        ids = ", ".join(r["id"] for r in failed)
        reasons = "; ".join(f"{r['id']} ({r['description']}, {r['detail']})" for r in failed)
        decision = "Rejected"
        explanation = (
            f"Neural model scored {neural_score:.2f}, but hard rule(s) violated: {reasons}. "
            f"Hard rules override the model score, so the application cannot be approved ({ids})."
        )
    elif neural_score >= APPROVE_THRESHOLD:
        decision = "Approved"
        explanation = (
            f"Neural model scored {neural_score:.2f} and all rules passed, so the application is approved."
        )
    else:
        decision = "Rejected"
        explanation = (
            f"All rules passed, but the neural model scored only {neural_score:.2f} "
            f"(below {APPROVE_THRESHOLD}), so the application is rejected."
        )

    return {"decision": decision, "neural_only": neural_only, "explanation": explanation}
