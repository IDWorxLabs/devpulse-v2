# Founder Launch Decision Authority

**Phase 26.14** — Read-only founder-facing decision authority that answers: *Should I launch this project right now?*

## Core Question

Should I launch this project right now?

This authority consumes existing proof-chain evidence and produces an honest founder launch decision — **LAUNCH**, **WAIT**, **FIX_BLOCKERS**, **RUN_MORE_PROOF**, or **REJECT_LAUNCH**.

## Architecture

```
Live Idea-To-Launch Execution Runner
Connected Launch / Runtime / Preview / Build / Verification proofs
Founder Test Launch Readiness
Founder Test Reality Sweep
Launch Council
Project Vault
Requirements-to-Plan Contract
  → Proof Chain Signal Analyzer
  → Launch Risk Analyzer
  → Blocker Priority Analyzer
  → Founder Decision Verdict Engine
  → Founder Launch Decision Report
```

## Decision Model

| Decision | When |
|----------|------|
| LAUNCH | LAUNCH_READY, runtime proven, launch readiness confirmed, no critical blockers, high confidence |
| WAIT | Promising but incomplete evidence; founder review needed |
| FIX_BLOCKERS | Launch possible after resolving actionable blockers |
| RUN_MORE_PROOF | Missing, stale, weak, or contradictory evidence |
| REJECT_LAUNCH | Critical blockers, failed validation, unproven runtime, negative launch readiness |

## Strict LAUNCH Gates

LAUNCH is **never** recommended from:

- Roadmap entries alone
- Source code alone
- Generated artifacts alone
- Optimistic assumptions
- Screenshots alone
- Founder intent alone

LAUNCH requires proof: runtime confirmed, launch readiness confirmed, no critical blockers.

## Scoring

- `proofChainScore` (0–100)
- `launchReadinessScore` (0–100)
- `runtimeConfidenceScore` (0–100)
- `riskScore` (0–100)
- `founderDecisionConfidence` (0–100)

## Safety

- Advisory only — founder remains final human decision-maker
- No deploy, execute, or project mutation
- Does not mark launch approved without evidence

## Pass Token

FOUNDER_LAUNCH_DECISION_AUTHORITY_PASS
