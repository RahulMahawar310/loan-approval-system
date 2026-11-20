import { useState } from "react";

const inr = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(n)));

/* ---------- Build "what to change" suggestions ---------- */
function buildFixes(values, limits, prob, threshold) {
  const fixes = [];

  if (values.age < limits.minAge) {
    const d = limits.minAge - values.age;
    fixes.push({
      id: "R1",
      title: "Applicant is below the minimum age",
      tip: `Minimum age is ${limits.minAge}. The applicant can reapply in ${d} year${d > 1 ? "s" : ""}.`,
    });
  }

  const ratio = values.income > 0 ? values.emi / values.income : Infinity;
  if (ratio > limits.maxEmiRatio) {
    const maxEmi = values.income * limits.maxEmiRatio;
    const cut = values.emi - maxEmi;
    const needIncome = values.emi / limits.maxEmiRatio;
    fixes.push({
      id: "R2",
      title: "EMI burden is too high",
      tip: `Reduce existing EMI by ${inr(cut)} (down to ${inr(maxEmi)}), or raise monthly income to at least ${inr(needIncome)}.`,
    });
  }

  if (values.credit < limits.minCredit) {
    fixes.push({
      id: "R3",
      title: "Credit score is too low",
      tip: `Improve the credit score by ${limits.minCredit - values.credit} points (from ${values.credit} to at least ${limits.minCredit}).`,
    });
  }

  if (prob !== null && prob < threshold) {
    fixes.push({
      id: "NN",
      title: "Neural score is below the threshold",
      tip: `The model scored ${prob.toFixed(2)} but needs at least ${threshold.toFixed(2)}. Try a smaller loan amount or a different tenure and watch the score change in Live mode.`,
    });
  }

  return fixes;
}

function StatusIcon({ state }) {
  return (
    <svg key={state} className={`dp-icon ${state}`} viewBox="0 0 52 52">
      <circle className="dp-circle" cx="26" cy="26" r="24" />
      {state === "approved" && <path className="dp-mark" d="M14 27l8 8 16-17" />}
      {state === "rejected" && <path className="dp-mark" d="M17 17l18 18M35 17L17 35" />}
      {state === "pending" && <path className="dp-mark" d="M26 14v13l8 5" />}
    </svg>
  );
}

export default function DecisionPanel({ decision, rules, prob, threshold, values, limits, neuralOnly }) {
  const [tab, setTab] = useState("why");
  const [openRule, setOpenRule] = useState(null);
  const [copied, setCopied] = useState(false);

  const failed = rules.filter((r) => !r.pass);
  const passedCount = rules.length - failed.length;
  const fixes = buildFixes(values, limits, prob, threshold);

  const steps = [
    {
      label: "Hard rules",
      value: `${passedCount}/${rules.length} passed`,
      st: failed.length ? "fail" : "pass",
    },
    {
      label: "Neural score",
      value: prob === null ? "--" : prob.toFixed(2),
      st: prob === null ? "wait" : prob >= threshold ? "pass" : "fail",
    },
    {
      label: "Final decision",
      value: decision.state === "pending" ? "Waiting" : decision.title,
      st: decision.state === "approved" ? "pass" : decision.state === "rejected" ? "fail" : "wait",
    },
  ];

  const overridden = neuralOnly === "Approved" && decision.state === "rejected";

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(`${decision.title}: ${decision.text}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard not available */
    }
  }

  return (
    <div className={`card dp ${decision.state}`}>
      {/* ---------- Header ---------- */}
      <div className="dp-head">
        <StatusIcon state={decision.state} />
        <div className="dp-head-text">
          <p className="eyebrow">FINAL DECISION (REASONER)</p>
          <h3>{decision.title}</h3>
          {overridden && <span className="dp-badge">Rules overrode the model</span>}
        </div>
        <button className="dp-copy" onClick={copySummary}>
          {copied ? "Copied!" : "Copy summary"}
        </button>
      </div>

      {/* ---------- Decision flow ---------- */}
      <div className="dp-flow">
        {steps.map((s, i) => (
          <div className="dp-flow-item" key={s.label}>
            <div className={`dp-step ${s.st}`}>
              <span className="dp-step-dot">{s.st === "pass" ? "✔" : s.st === "fail" ? "✖" : i + 1}</span>
              <span className="dp-step-label">{s.label}</span>
              <span className="dp-step-value">{s.value}</span>
            </div>
            {i < steps.length - 1 && <span className={`dp-line ${s.st}`} />}
          </div>
        ))}
      </div>

      {/* ---------- Tabs ---------- */}
      <div className="dp-tabs">
        <button className={tab === "why" ? "active" : ""} onClick={() => setTab("why")}>
          Why this decision?
        </button>
        <button className={tab === "fix" ? "active" : ""} onClick={() => setTab("fix")}>
          What to change {fixes.length > 0 && <span className="dp-count">{fixes.length}</span>}
        </button>
      </div>

      <div className="dp-body" key={tab}>
        {tab === "why" && (
          <>
            <p className="dp-text">{decision.text}</p>
            <div className="dp-rules">
              {rules.map((r) => (
                <div key={r.id} className={`dp-rule ${r.pass ? "pass" : "fail"}`}>
                  <button className="dp-rule-head" onClick={() => setOpenRule(openRule === r.id ? null : r.id)}>
                    <span>
                      <b>{r.id}</b> {r.text}
                    </span>
                    <span className="dp-rule-right">
                      <strong>{r.pass ? "Pass" : "Fail"}</strong>
                      <i className={`dp-chev ${openRule === r.id ? "open" : ""}`}>▾</i>
                    </span>
                  </button>
                  {openRule === r.id && (
                    <div className="dp-rule-detail">
                      Current value: <b>{r.detail}</b>.{" "}
                      {r.pass
                        ? "This rule is satisfied."
                        : "This is a hard rule, so it blocks approval regardless of the neural score."}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "fix" &&
          (fixes.length === 0 ? (
            <div className="dp-ok">
              {decision.state === "pending"
                ? "Waiting for the neural score."
                : "No changes needed. All rules pass and the model score is above the threshold."}
            </div>
          ) : (
            <div className="dp-fixes">
              {fixes.map((f) => (
                <div className="dp-fix" key={f.id}>
                  <span className="dp-fix-id">{f.id}</span>
                  <div>
                    <p className="dp-fix-title">{f.title}</p>
                    <p className="dp-fix-tip">{f.tip}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
      </div>

      {/* ---------- Neural vs Neuro-symbolic ---------- */}
      <div className="dp-compare">
        <div className="dp-cmp">
          <span>Neural only</span>
          <strong className={neuralOnly === "Approved" ? "good" : neuralOnly === "Rejected" ? "bad" : ""}>
            {neuralOnly}
          </strong>
        </div>
        <span className="dp-arrow">{overridden ? "⚠ overridden by rules" : "→"}</span>
        <div className="dp-cmp">
          <span>Neuro-symbolic</span>
          <strong className={decision.state === "approved" ? "good" : decision.state === "rejected" ? "bad" : ""}>
            {decision.state === "pending" ? "—" : decision.title}
          </strong>
        </div>
      </div>
    </div>
  );
}