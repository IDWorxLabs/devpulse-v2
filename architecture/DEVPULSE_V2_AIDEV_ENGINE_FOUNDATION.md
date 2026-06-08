# DevPulse V2 — AiDev Engine Foundation

**GF7 OMEGA — Phase 4 Foundation V1**  
**System ID:** `aidev_engine`  
**Phase:** 4

---

## Why AiDev Engine Exists

DevPulse V2's long-term goal is **prompt-to-product intelligence** — turning user intent into structured build work.

AiDev Engine is the **future builder identity** of DevPulse. Foundation V1 establishes ownership, state, intake, and reporting before any code generation or execution exists.

---

## Why This Foundation Does Not Generate Code Yet

Phase 4 begins with **identity and intake**, not building:

| Foundation V1 | Future phases |
|---------------|---------------|
| Accept build requests | Requirement Extractor |
| Normalize input | Product Architect |
| Attach intent summaries | Planning systems |
| Record timeline events | Execution systems |
| Report request state | Code generation |

Skipping intake would recreate V1 problems — builders that run before ownership and intent are clear.

---

## Intake Separated From Planning

**Intake** (this foundation):

- `createBuildRequest()` — receives user input
- `RECEIVED` → `ANALYZING` → `READY_FOR_PLANNING` | `REJECTED`
- No planning, no file creation, no project mutation

**Planning** (future):

- Requirement extraction
- Product architecture
- Build plans

AiDev Engine owns **requests**, not **plans** yet.

---

## Planning Separated From Execution

Even when planning arrives, it remains separate from **execution**:

- Execution modifies files and projects
- Execution runs under explicit authorities
- AiDev Foundation V1 has **zero execution paths**

---

## AiDev Is Not Answer Authority

| Chat Authority | AiDev Engine |
|----------------|--------------|
| Produces user-visible answers | Accepts build requests |
| Owns answer contract | Owns request records |
| Responds in chat | Reports request state |

Answer Authority Protection Policy still applies — AiDev never becomes visible answer owner.

---

## Preparing for Requirement Extractor and Product Architect

Foundation V1 produces:

```typescript
AiDevRequest {
  requestId, userInput, normalizedInput, status,
  intentId?, warnings, errors
}
```

Future systems consume `READY_FOR_PLANNING` requests to:

1. **Requirement Extractor** — pull structured requirements from intent + context
2. **Product Architect** — design product structure before code

Timeline Ledger records every request creation and status change for auditability.

---

## Integrations (Read-Only / API Only)

| System | Role |
|--------|------|
| Intent Architecture | Intent summaries attached to requests |
| Central Brain | AiDev summaries published read-only |
| Timeline Ledger | Request lifecycle events |
| Project Vault | **Not mutated** by AiDev V1 |

---

## Validation

```bash
npm run validate:aidev-engine
npm run typecheck
```

**Pass token:** `DEVPULSE_V2_AIDEV_ENGINE_FOUNDATION_V1_PASS`

**Validation mode:** `FAST_FEATURE_CHECK`

---

## Ownership

`aidev_engine` → `devpulse_v2_aidev_engine_authority`

Intake only. Non-generating. Non-executing. Non-answering. Non-autonomous.
