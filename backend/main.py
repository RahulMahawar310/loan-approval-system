"""FastAPI server: POST /predict"""
import joblib
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from data_gen import FEATURES
from reasoner import decide
from rules import evaluate_rules

app = FastAPI(title="Neuro-Symbolic Loan Approval")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = joblib.load("model.pkl")


class Applicant(BaseModel):
    age: int = Field(ge=18, le=100)
    monthly_income: float = Field(gt=0)
    credit_score: float = Field(ge=300, le=900)
    existing_emi: float = Field(ge=0)
    loan_amount: float = Field(gt=0)
    tenure_months: int = Field(gt=0)


@app.get("/")
def health():
    return {"status": "ok"}


@app.post("/predict")
def predict(a: Applicant):
    data = a.model_dump()
    score = float(model.predict_proba(pd.DataFrame([data])[FEATURES])[0][1])
    rule_results = evaluate_rules(data)
    result = decide(score, rule_results)
    return {"neural_score": round(score, 3), "rules": rule_results, **result}
