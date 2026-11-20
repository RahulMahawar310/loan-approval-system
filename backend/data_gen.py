"""Synthetic loan dataset generator (so the project runs without downloading a Kaggle dataset)."""
import numpy as np
import pandas as pd

FEATURES = ["age", "monthly_income", "credit_score", "existing_emi", "loan_amount", "tenure_months"]


def make_dataset(n=6000, seed=42):
    rng = np.random.default_rng(seed)
    age = rng.integers(18, 66, n)
    income = np.clip(rng.lognormal(10.6, 0.5, n), 12000, 250000)
    credit = np.clip(rng.normal(680, 90, n), 300, 900)
    emi = income * rng.uniform(0.0, 0.8, n)
    loan = rng.integers(50_000, 2_000_001, n)
    tenure = rng.choice([12, 24, 36, 48, 60], n)

    # Simulated past "human" decisions: they depend mostly on credit score and income, and only weakly on EMI.
    # Because of this, a purely neural model sometimes approves applicants who violate the EMI rule.
    z = (
        1.2
        + 0.010 * (credit - 650)
        + 0.00003 * (income - 40000)
        - 0.0000012 * (loan - 400000)
        - 0.8 * (emi / income)
        + rng.normal(0, 0.5, n)
    )
    p = 1 / (1 + np.exp(-z))
    approved = (rng.random(n) < p).astype(int)

    return pd.DataFrame(
        {
            "age": age,
            "monthly_income": income.round(0),
            "credit_score": credit.round(0),
            "existing_emi": emi.round(0),
            "loan_amount": loan,
            "tenure_months": tenure,
            "approved": approved,
        }
    )


if __name__ == "__main__":
    df = make_dataset()
    df.to_csv("loan_data.csv", index=False)
    print(df.head(), "\nApproval rate:", df.approved.mean().round(3))
