// import { useState } from "react";

// const API_URL = "http://localhost:8000/predict";

// const FIELDS = [
//   { key: "age", label: "Age" },
//   { key: "monthly_income", label: "Monthly income (INR)" },
//   { key: "credit_score", label: "Credit score (300-900)" },
//   { key: "existing_emi", label: "Existing EMI per month (INR)" },
//   { key: "loan_amount", label: "Loan amount (INR)" },
//   { key: "tenure_months", label: "Tenure (months)" },
// ];

// const DEFAULTS = {
//   age: 24,
//   monthly_income: 45000,
//   credit_score: 710,
//   existing_emi: 26000,
//   loan_amount: 500000,
//   tenure_months: 36,
// };

// export default function App() {
//   const [form, setForm] = useState(DEFAULTS);
//   const [result, setResult] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const onChange = (key, value) => setForm({ ...form, [key]: value });

//   const run = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const payload = Object.fromEntries(
//         Object.entries(form).map(([k, v]) => [k, Number(v)])
//       );
//       const res = await fetch(API_URL, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       if (!res.ok) throw new Error("Server error: please check the input values");
//       setResult(await res.json());
//     } catch (e) {
//       setError(e.message || "Could not connect to the backend");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const approved = result?.decision === "Approved";

//   return (
//     <div className="page">
//       <header>
//         <div className="eyebrow">NEURO-SYMBOLIC AI DEMO</div>
//         <h1>Loan Decision Studio</h1>
//         <p className="sub">Neural prediction + rule-based reasoning + explanation</p>
//       </header>

//       <div className="grid">
//         <section className="card">
//           <h2>Applicant details</h2>
//           {FIELDS.map((f) => (
//             <div className="field" key={f.key}>
//               <label htmlFor={f.key}>{f.label}</label>
//               <input
//                 id={f.key}
//                 type="number"
//                 value={form[f.key]}
//                 onChange={(e) => onChange(f.key, e.target.value)}
//               />
//             </div>
//           ))}
//           <button className="primary" onClick={run} disabled={loading}>
//             {loading ? "Running..." : "Run decision"}
//           </button>
//           {error && <p className="error">{error}</p>}
//         </section>

//         <div className="col">
//           {!result && (
//             <section className="card muted">
//               Fill in the form and click "Run decision".
//             </section>
//           )}

//           {result && (
//             <>
//               <div className="two">
//                 <section className="card">
//                   <div className="tag teal">NEURAL MODEL</div>
//                   <p className="small">Approval probability learned from past loan data</p>
//                   <div className="big">{result.neural_score.toFixed(2)}</div>
//                   <div className="bar">
//                     <div style={{ width: `${result.neural_score * 100}%` }} />
//                   </div>
//                   <strong className={result.neural_only === "Approved" ? "green" : "red"}>
//                     Model says: {result.neural_only === "Approved" ? "Approve" : "Reject"}
//                   </strong>
//                 </section>

//                 <section className="card">
//                   <div className="tag amber">RULE ENGINE</div>
//                   {result.rules.map((r) => (
//                     <div key={r.id} className={`rule ${r.passed ? "pass" : "fail"}`}>
//                       <span>
//                         {r.id} &nbsp;{r.description} ({r.detail})
//                       </span>
//                       <strong>{r.passed ? "Pass" : "Fail"}</strong>
//                     </div>
//                   ))}
//                 </section>
//               </div>

//               <section className={`card decision ${approved ? "ok" : "no"}`}>
//                 <div className="tag">FINAL DECISION (REASONER)</div>
//                 <div className="verdict">{result.decision}</div>
//                 <p>{result.explanation}</p>
//               </section>

//               <div className="two">
//                 <section className="card">
//                   <div className="small bold">Neural only</div>
//                   <div className={`mid ${result.neural_only === "Approved" ? "green" : "red"}`}>
//                     {result.neural_only}
//                   </div>
//                 </section>
//                 <section className="card">
//                   <div className="small bold">Neuro-symbolic</div>
//                   <div className={`mid ${approved ? "green" : "red"}`}>{result.decision}</div>
//                 </section>
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }




















































import { useEffect, useRef, useState } from "react";
import "./App.css";
import DecisionPanel from "./DecisionPanel";

/* ====== BACKEND SETTINGS (adjust these to match your main.py) ====== */
const API_URL = "http://127.0.0.1:8000/predict";

// Match these field names with the request model in main.py
const toPayload = (v) => ({
  age: v.age,
  monthly_income: v.income,
  credit_score: v.credit,
  existing_emi: v.emi,
  loan_amount: v.loan,
  tenure_months: v.tenure,
});
/* =================================================================== */

const RULES = { minAge: 21, maxEmiRatio: 0.5, minCredit: 550 };
const THRESHOLD = 0.5;

const FIELDS = [
  { key: "age", label: "Age", min: 18, max: 70, step: 1 },
  { key: "income", label: "Monthly income", min: 10000, max: 300000, step: 1000, money: true },
  { key: "credit", label: "Credit score (300-900)", min: 300, max: 900, step: 5 },
  { key: "emi", label: "Existing EMI per month", min: 0, max: 150000, step: 500, money: true },
  { key: "loan", label: "Loan amount", min: 50000, max: 5000000, step: 10000, money: true },
  { key: "tenure", label: "Tenure (months)", min: 6, max: 120, step: 6 },
];

const PRESETS = [
  { name: "Strong profile", v: { age: 32, income: 90000, credit: 780, emi: 10000, loan: 400000, tenure: 48 } },
  { name: "High EMI burden", v: { age: 24, income: 45000, credit: 710, emi: 26000, loan: 500000, tenure: 36 } },
  { name: "Low credit score", v: { age: 29, income: 60000, credit: 480, emi: 8000, loan: 300000, tenure: 24 } },
  { name: "Too young", v: { age: 19, income: 30000, credit: 700, emi: 0, loan: 100000, tenure: 12 } },
];

const inr = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

/* ---------- Rule engine (runs instantly in the browser) ---------- */
function checkRules(v) {
  const ratio = v.income > 0 ? v.emi / v.income : Infinity;
  const pct = Number.isFinite(ratio) ? Math.round(ratio * 100) : "n/a";
  return [
    { id: "R1", text: `Age is ${RULES.minAge} or more`, detail: `age = ${v.age}`, pass: v.age >= RULES.minAge },
    {
      id: "R2",
      text: `EMI-to-income ratio is at most ${RULES.maxEmiRatio * 100}%`,
      detail: `actual = ${pct}%`,
      pass: ratio <= RULES.maxEmiRatio,
    },
    {
      id: "R3",
      text: `Credit score is ${RULES.minCredit} or more`,
      detail: `credit score = ${v.credit}`,
      pass: v.credit >= RULES.minCredit,
    },
  ];
}

/* ---------- Reasoner ---------- */
function decide(prob, rules) {
  const failed = rules.filter((r) => !r.pass);
  if (failed.length) {
    const list = failed.map((r) => `${r.id} (${r.text}, ${r.detail})`).join("; ");
    const lead = prob !== null ? `Neural model scored ${prob.toFixed(2)}, but hard` : "Hard";
    return {
      state: "rejected",
      title: "Rejected",
      text: `${lead} rule(s) violated: ${list}. Hard rules override the model score, so the application cannot be approved.`,
    };
  }
  if (prob === null) {
    return {
      state: "pending",
      title: "Waiting for model",
      text: "All hard rules passed. Waiting for the neural score.",
    };
  }
  if (prob >= THRESHOLD) {
    return {
      state: "approved",
      title: "Approved",
      text: `All hard rules passed and the neural model scored ${prob.toFixed(2)} (at least ${THRESHOLD.toFixed(2)}), so the application is approved.`,
    };
  }
  return {
    state: "rejected",
    title: "Rejected",
    text: `All hard rules passed, but the neural model scored ${prob.toFixed(2)}, below the ${THRESHOLD.toFixed(2)} threshold, so the application is rejected.`,
  };
}

/* ---------- Extract the probability from the backend response ---------- */
function findProb(obj) {
  if (obj === null || typeof obj !== "object") return null;
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "number" && /prob|score|neural/i.test(k) && v >= 0 && v <= 1) return v;
  }
  for (const v of Object.values(obj)) {
    const r = findProb(v);
    if (r !== null) return r;
  }
  return null;
}

async function fetchProbability(vals, signal) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toPayload(vals)),
    signal,
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg += ": " + JSON.stringify(j.detail ?? j);
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const prob = findProb(await res.json());
  if (prob === null) throw new Error("No probability found in the response");
  return prob;
}

/* ---------- Smooth number animation ---------- */
function useCountUp(target, ms = 600) {
  const [val, setVal] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (target === null) return;
    const start = performance.now();
    const a = from.current;
    let raf;
    const tick = (t) => {
      const p = Math.min((t - start) / ms, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const cur = a + (target - a) * eased;
      from.current = cur;
      setVal(cur);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return val;
}

export default function App() {
  const [values, setValues] = useState(PRESETS[0].v);
  const [submitted, setSubmitted] = useState(PRESETS[0].v);
  const [live, setLive] = useState(true);
  const [prob, setProb] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | ok | error
  const [error, setError] = useState("");

  const shown = live ? values : submitted;
  const stale = !live && JSON.stringify(values) !== JSON.stringify(submitted);

  async function run(vals, signal) {
    setStatus("loading");
    setError("");
    try {
      const p = await fetchProbability(vals, signal);
      setProb(p);
      setStatus("ok");
    } catch (e) {
      if (e.name === "AbortError") return;
      setStatus("error");
      setError(
        e.message === "Failed to fetch"
          ? "Cannot connect to the backend. Check that uvicorn is running."
          : e.message
      );
    }
  }

  // Live mode: call the backend 350ms after the last input change
  useEffect(() => {
    if (!live) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => run(values, ctrl.signal), 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [values, live]);

  const setField = (k, raw) => setValues((v) => ({ ...v, [k]: raw === "" ? 0 : Number(raw) }));
  const toggleLive = () => {
    if (live) setSubmitted(values);
    setLive(!live);
  };
  const runManual = () => {
    setSubmitted(values);
    run(values);
  };

  const rules = checkRules(shown);
  const decision = decide(prob, rules);
  const animated = useCountUp(prob);
  const neuralOnly = prob === null ? "—" : prob >= THRESHOLD ? "Approved" : "Rejected";
  const ratio = shown.income > 0 ? shown.emi / shown.income : 1;

  const pill =
    status === "error" ? { cls: "err", text: "Backend offline" }
    : !live ? { cls: "manual", text: "Manual mode" }
    : status === "loading" ? { cls: "busy", text: "Updating..." }
    : { cls: "on", text: "Live" };

  return (
    <div className="app">
      <header className="top">
        <div>
          <p className="eyebrow">AI + RULE-BASED LENDING</p>
          <h1>Loan Approval System</h1>
          <p className="sub">Neural prediction + rule-based reasoning + clear explanation</p>
        </div>
        <div className="live-box">
          <span className={`pill ${pill.cls}`}>
            <i className="dot" /> {pill.text}
          </span>
          <label className="switch">
            <input type="checkbox" checked={live} onChange={toggleLive} />
            <span className="track" />
            <span className="switch-label">Live mode</span>
          </label>
        </div>
      </header>

      <div className="layout">
        {/* ---------- Left: Inputs ---------- */}
        <section className="card form">
          <h2>Applicant details</h2>

          <div className="chips">
            {PRESETS.map((p) => (
              <button key={p.name} className="chip" onClick={() => setValues(p.v)}>
                {p.name}
              </button>
            ))}
          </div>

          {FIELDS.map((f) => (
            <div className="field" key={f.key}>
              <div className="field-top">
                <label htmlFor={f.key}>{f.label}</label>
                {f.money && <span className="val">{inr(values[f.key])}</span>}
              </div>
              <div className="field-row">
                <input
                  type="range"
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  value={values[f.key]}
                  onChange={(e) => setField(f.key, e.target.value)}
                />
                <input
                  id={f.key}
                  type="number"
                  className="num"
                  placeholder="0"
                  value={values[f.key] === 0 ? "" : values[f.key]}
                  onChange={(e) => setField(f.key, e.target.value)}
                />
              </div>
            </div>
          ))}

          <div className="actions">
            {live ? (
              <div className="live-note">Live mode is on. Results update automatically.</div>
            ) : (
              <button className="run" onClick={runManual} disabled={status === "loading"}>
                {status === "loading" ? "Running..." : stale ? "Run decision (inputs changed)" : "Run decision"}
              </button>
            )}
            <button className="ghost" onClick={() => setValues(PRESETS[0].v)}>
              Reset
            </button>
          </div>
        </section>

        {/* ---------- Right: Results ---------- */}
        <section className="results">
          {status === "error" && <div className="error-bar">{error}</div>}

          <div className="row2">
            <div className={`card ${status === "loading" ? "dim" : ""}`}>
              <p className="eyebrow teal">NEURAL MODEL</p>
              <p className="muted">Approval probability learned from past loan data</p>
              <div className="big">{prob === null ? "--" : animated.toFixed(2)}</div>
              <div className="gauge">
                <div
                  className={`gauge-fill ${prob !== null && prob >= THRESHOLD ? "good" : "bad"}`}
                  style={{ width: `${prob === null ? 0 : prob * 100}%` }}
                />
                <div className="gauge-mark" style={{ left: `${THRESHOLD * 100}%` }} title="Threshold 0.50" />
              </div>
              <p className={`says ${prob !== null && prob >= THRESHOLD ? "good" : "bad"}`}>
                {prob === null ? "Waiting for score" : `Model says: ${prob >= THRESHOLD ? "Approve" : "Reject"}`}
              </p>
            </div>

            <div className="card">
              <p className="eyebrow brown">RULE ENGINE</p>
              <div className="rules">
                {rules.map((r) => (
                  <div key={r.id} className={`rule ${r.pass ? "pass" : "fail"}`}>
                    <span>
                      <b>{r.id}</b> {r.text} ({r.detail})
                    </span>
                    <strong>{r.pass ? "Pass" : "Fail"}</strong>
                  </div>
                ))}
              </div>
              <p className="muted small">EMI burden (limit {RULES.maxEmiRatio * 100}%)</p>
              <div className="gauge thin">
                <div
                  className={`gauge-fill ${ratio <= RULES.maxEmiRatio ? "good" : "bad"}`}
                  style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                />
                <div className="gauge-mark" style={{ left: `${RULES.maxEmiRatio * 100}%` }} />
              </div>
            </div>
          </div>

          <DecisionPanel
            decision={decision}
            rules={rules}
            prob={prob}
            threshold={THRESHOLD}
            values={shown}
            limits={RULES}
            neuralOnly={neuralOnly}
          />
        </section>
      </div>
    </div>
  );
}