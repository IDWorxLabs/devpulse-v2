# DevPulse V2 — Intent Architecture Foundation

**GF7 OMEGA — Intelligence Layer Foundation V1**  
**System ID:** `intent_architecture`  
**Phase:** 3

---

## Why Intent Architecture Exists

Users speak in natural language. Systems need structured intent.

**Intent Architecture transforms user requests into structured intent representations** that later systems can understand — without answering, executing, or generating code.

It is the **understanding layer** of DevPulse V2's intelligence stack.

---

## Intent Architecture vs Chat Authority

| Chat Authority | Intent Architecture |
|----------------|---------------------|
| Owns user message intake | Reads/transforms input into intent |
| Owns answer contract | Does **not** generate user answers |
| Responds to the user | Produces `IntentRecord` structures |
| Single answer authority | Never becomes answer authority |

Chat answers. Intent Architecture understands.

---

## Intent Architecture vs Central Brain

| Central Brain | Intent Architecture |
|---------------|---------------------|
| System awareness owner | User intent owner |
| Observes system state summaries | Classifies what the user wants |
| Coordination metadata | Structured intent records |
| Read-only across foundations | Rule-based extraction only |

Central Brain knows **what systems exist**. Intent Architecture knows **what the user is trying to achieve**.

The **intent-brain bridge** publishes intent summaries for read-only coordination — no ownership transfer.

---

## Separated From Execution

Intent Architecture:

- Does **not** execute actions
- Does **not** mutate Project Vault
- Does **not** calculate trust
- Does **not** create autonomous behavior

Understanding happens here. Action happens elsewhere — under explicit future authorities.

---

## Separated From Code Generation

Intent Architecture:

- Does **not** generate code
- Does **not** build products
- Does **not** build AiDev

A `BUILD_REQUEST` intent is classified and summarized — not implemented. Code generation belongs to future build/execution systems with their own authorities.

---

## Preparing for Future AiDev

Future AiDev systems will need structured input:

```typescript
IntentRecord {
  intentType: 'BUILD_REQUEST' | 'ANALYSIS_REQUEST' | ...
  extractedGoals: string[]
  extractedConstraints: string[]
  confidence: 'LOW' | 'MEDIUM' | 'HIGH'
}
```

Intent Architecture produces this **before** planning or building begins — so AiDev can plan from clear intent rather than raw chat text.

---

## Intent Types

| Type | Example |
|------|---------|
| `QUESTION` | "What is DevPulse?" |
| `BUILD_REQUEST` | "Build me a mobile app" |
| `ANALYSIS_REQUEST` | "Analyze this architecture" |
| `PROJECT_REQUEST` | "Start a new project" |
| `INFORMATION_REQUEST` | "Tell me about trust engine" |
| `UNKNOWN` | Ambiguous input |

Classification is **rule-based only** — no AI, LLM, or external services in Foundation V1.

---

## Validation

```bash
npm run validate:intent-architecture
npm run typecheck
```

**Pass token:** `DEVPULSE_V2_INTENT_ARCHITECTURE_FOUNDATION_V1_PASS`

**Validation mode:** `FAST_FEATURE_CHECK`

---

## Dependencies

- Central Brain Foundation
- Trust Engine Foundation
- Project Vault Foundation
- Evidence Registry Foundation
- Timeline Ledger Foundation
- Validation Budget Policy

---

## Ownership

`intent_architecture` → `devpulse_v2_intent_architecture_authority`

Understanding only. Non-answering. Non-executing. Non-generating.
