# Neuro-Symbolic Loan Approval System

Neural model (MLP) + symbolic rule engine + reasoner = explainable loan decision.

## Folder structure
```
backend/   -> Python FastAPI (data_gen.py, train.py, rules.py, reasoner.py, main.py)
frontend/  -> React (Vite) UI
```

## How to run (VS Code, Windows)

### 1. Backend
```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python train.py
uvicorn main:app --reload --port 8000
```
Open http://localhost:8000/docs in the browser to test the API.

### 2. Frontend (in a new terminal)
```
cd frontend
npm install
npm run dev
```
Open http://localhost:5173.

## Demo case (for the seminar)
With the default values (income 45000, EMI 26000, credit score 710), the neural model approves the
application, but Rule R2 (EMI ratio 58% > 50%) fails, so the final decision is "Rejected".

## Adding a new rule
Add another `Rule(...)` entry to the `RULES` list in `backend/rules.py`. Nothing else needs to change.

## Using the Kaggle dataset
Load your own CSV in `train.py` instead of calling `make_dataset()` from `data_gen.py`
(required columns: age, monthly_income, credit_score, existing_emi, loan_amount, tenure_months, approved).
