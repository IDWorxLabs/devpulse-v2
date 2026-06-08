# DevPulse V2 Root Cause Attribution Foundation V1

**System ID:** `root_cause_attribution`  
**Phase:** 5 (fifth and final Phase 5 foundation)  
**Owner:** `devpulse_v2_root_cause_attribution_authority`  
**Pass token:** `DEVPULSE_V2_ROOT_CAUSE_ATTRIBUTION_FOUNDATION_V1_PASS`

---

## Why Root Cause Attribution Exists

DevPulse V2 Phase 5 progresses from observation → reconstruction → foresight → **diagnostic reasoning**. Root Cause Attribution explains the **most likely cause** of a problem by combining:

- Evidence Registry records
- Reality and Session Replay history
- Self Vision observations
- Failure Prediction signals
- Verification Loop history

It answers: **"What most likely caused this?"** — not **"Fix it now."**

---

## Failure Prediction vs Root Cause Attribution

| Failure Prediction | Root Cause Attribution |
|--------------------|------------------------|
| Identifies **elevated future risk** | Explains **likely cause** of problems |
| Pattern detection and risk scoring | Cause category and confidence assignment |
| Foresight layer | Diagnostic reasoning layer |
| No causal explanation | Attribution with linked evidence |

Failure Prediction remains the owner of prediction records. Root Cause Attribution consumes prediction signals read-only.

---

## Verification Loop vs Root Cause Attribution

| Verification Loop | Root Cause Attribution |
|-------------------|------------------------|
| **Verifies** claims against evidence | **Attributes** likely causes from multiple sources |
| Pass/fail/partial verification status | Cause categories: UI_VISIBILITY, CLICKABILITY, VERIFICATION, etc. |
| Proof chain validation | Cross-source diagnostic synthesis |
| Does not explain root cause | Explains likely cause (not repair) |

The Verification Loop does not perform attribution. Root Cause Attribution consumes verification history without replacing verification decisions.

---

## Why Root Cause Attribution Is Read-Only

Root Cause Attribution is constrained to diagnostic reasoning:

- **No execution** — no automation or actions
- **No UI mutation** — no clicks or panel changes
- **No repair** — does not fix attributed failures
- **No recovery** — no rollback or recovery execution
- **No code generation** — no planning or implementation output
- **No answer authority** — chat remains the single answer source
- **No AI/LLM** — rule-based attribution only

---

## Why Root Cause Attribution Does Not Repair Failures

Attribution explains **what likely caused** a problem. Repair, recovery, and execution belong in Phase 6 systems that **consume** attribution results — they are intentionally separated so diagnostic reasoning stays trustworthy and non-autonomous.

Root Cause Attribution:

- Links evidence and predictions to cause categories
- Assigns confidence levels (LOW, MEDIUM, HIGH)
- Does **not** apply fixes
- Does **not** trigger recovery workflows

---

## How Phase 6 Systems Will Consume Attribution Results

### Execution Systems

Phase 6 execution systems will read `AttributionRecord` to prioritize what to address — without Root Cause Attribution executing actions itself.

### Recovery Systems

Recovery Strategy Planner and future recovery executors will consume attribution categories and confidence to shape recovery plans — attribution provides **diagnosis input**, not **recovery commands**.

### Operator Review

Operators receive `formatRootCauseAttributionReport()` output with category distribution, confidence levels, and linked evidence — enabling informed human decisions.

---

## Attribution Rules (Examples)

| Signals | Category | Confidence |
|---------|----------|------------|
| ≥2 NOT_CLICKABLE observations + browser WARNs + HIGH prediction | CLICKABILITY | HIGH |
| ≥2 HIDDEN UI observations | UI_VISIBILITY | MEDIUM/HIGH |
| ≥2 verification failures | VERIFICATION | HIGH |

---

## Ownership Remains With Source Systems

| Source system | Root Cause Attribution role |
|---------------|----------------------------|
| Failure Prediction | Consume prediction signals |
| Session Replay | Consume session replay history |
| Self Vision | Consume observation history |
| Verification Loop | Consume verification history |
| Evidence Registry | Consume evidence; contribute attribution evidence |
| Central Brain | Publish attribution summaries only |

Root Cause Attribution owns **attribution records**, **attribution reports**, **attribution summaries**, and **cause candidates**.

---

## Module Layout

```
src/root-cause-attribution/
  types.ts
  root-cause-attribution-scoring.ts
  root-cause-attribution-engine.ts
  attribution-prediction-bridge.ts
  attribution-session-replay-bridge.ts
  attribution-self-vision-bridge.ts
  attribution-verification-bridge.ts
  attribution-evidence-bridge.ts
  attribution-brain-bridge.ts
  root-cause-attribution-report.ts
  root-cause-attribution-authority.ts
  index.ts
```

---

## Phase 5 Complete

With Root Cause Attribution, Phase 5 foundations are complete:

1. **Self Vision** — observe UI reality  
2. **Reality Replay** — reconstruct events  
3. **Session Replay** — reconstruct sessions  
4. **Failure Prediction** — identify future risk  
5. **Root Cause Attribution** — explain likely causes  

---

## Validation

```bash
npm run validate:root-cause-attribution
npm run typecheck
```

Expected pass token: `DEVPULSE_V2_ROOT_CAUSE_ATTRIBUTION_FOUNDATION_V1_PASS`

---

## Example

Repeated NOT_CLICKABLE observations, browser WARN replay events, and HIGH failure predictions:

```
generateAttributions() →
  Likely Clickability Failure (CLICKABILITY, HIGH confidence)
  supportingEvidenceIds: [observation ids, replay evidence]
  supportingPredictionIds: [high-risk prediction ids]
```

Root Cause Attribution explains the likely cause. It does not click the button, repair the UI, or run recovery.
