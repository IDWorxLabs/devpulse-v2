# DevPulse V2 — Context Arbitration Foundation

**GF7 OMEGA — Intelligence Layer Foundation V1**  
**System ID:** `context_arbitration`  
**Phase:** 3

---

## Why Context Arbitration Exists

DevPulse V2 accumulates context from many systems — intent records, system awareness, project memory, evidence, timeline events, trust observations.

**Not all context matters for every request.** Feeding everything into downstream systems causes:

- Context overload
- Context conflicts
- Duplicate context ownership
- Irrelevant context pollution

Context Arbitration **selects which context matters** and **which should be ignored**.

---

## Context Arbitration vs Intent Architecture

| Intent Architecture | Context Arbitration |
|---------------------|---------------------|
| Understands what the user wants | Decides which context serves that intent |
| Produces `IntentRecord` | Produces `ContextArbitrationResult` |
| Intent owner | Context selection owner |
| Classifies input | Prioritizes and filters candidates |

Intent Architecture answers **"what is the user trying to do?"**  
Context Arbitration answers **"which context should we use?"**

---

## Context Arbitration vs Central Brain

| Central Brain | Context Arbitration |
|---------------|---------------------|
| System awareness owner | Context arbitration owner |
| Observes all system summaries | Selects relevant subset per intent |
| Coordination metadata | Selected vs ignored context lists |
| Read-only across foundations | Read-only consumption of intent + candidates |

Central Brain knows **what exists**. Context Arbitration decides **what matters now**.

---

## Separated From Answering

Context Arbitration:

- Does **not** generate user answers
- Does **not** become answer authority
- Does **not** replace Chat Authority

It produces `selectedContext` and `ignoredContext` lists — Chat Authority still owns responses.

---

## Why Context Overload Caused V1 Problems

V1 often dumped **all available context** into every decision path:

- Historical timeline mixed with active build intent
- Unrelated evidence polluted analysis
- Duplicate summaries from competing modules
- No clear owner for "which context wins"

Context Arbitration prevents this by **intent-aware prioritization**:

| Intent | High priority | Ignored |
|--------|---------------|---------|
| `BUILD_REQUEST` | Intent, Project Vault | Historical timeline |
| `QUESTION` | Intent, Central Brain | Unrelated evidence |
| `ANALYSIS_REQUEST` | Evidence, Central Brain, Intent | — |

---

## Preparing for Future AiDev

Future AiDev systems will receive **curated context**, not raw dumps:

```typescript
ContextArbitrationResult {
  selectedContext: ContextCandidate[]  // HIGH + MEDIUM
  ignoredContext: ContextCandidate[]   // LOW + IGNORE
}
```

AiDev can plan from **relevant context only** — reducing hallucination risk and authority drift.

---

## Context Sources

- `INTENT_ARCHITECTURE`
- `CENTRAL_BRAIN`
- `PROJECT_VAULT`
- `TIMELINE_LEDGER`
- `EVIDENCE_REGISTRY`
- `TRUST_ENGINE`

Priority levels: `HIGH` | `MEDIUM` | `LOW` | `IGNORE`

Rule-based only — no AI, LLM, or external services in Foundation V1.

---

## Validation

```bash
npm run validate:context-arbitration
npm run typecheck
```

**Pass token:** `DEVPULSE_V2_CONTEXT_ARBITRATION_FOUNDATION_V1_PASS`

**Validation mode:** `FAST_FEATURE_CHECK`

---

## Dependencies

- Central Brain Foundation
- Intent Architecture Foundation
- Trust Engine Foundation
- Project Vault Foundation
- Evidence Registry Foundation
- Timeline Ledger Foundation
- Validation Budget Policy

---

## Ownership

`context_arbitration` → `devpulse_v2_context_arbitration_authority`

Context selection only. Non-answering. Non-executing. Non-generating.
