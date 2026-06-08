# DevPulse V2 — Central Brain Foundation

**GF7 OMEGA — Intelligence Layer Foundation V1**  
**System ID:** `central_brain`  
**Phase:** 3

---

## Why Central Brain Exists

DevPulse V2 now has multiple Phase 2 foundations — Trust Engine, Project Vault, Evidence Registry, Timeline Ledger — each with its own authority and truth domain.

**Central Brain is the first shared awareness layer.** It answers coordination questions without owning source data:

- What systems exist?
- What state are they in?
- What summaries should be shared between them?

This is **coordination metadata**, not intelligence decisions.

---

## Why It Is Not Chat Authority

| Chat Authority | Central Brain |
|----------------|---------------|
| Owns user message intake | Does not generate user answers |
| Owns answer contract | Does not become answer authority |
| Responds to the user | Observes system state only |

Central Brain must never replace `devpulse_v2_chat_authority` or duplicate answer ownership.

---

## Why It Is Not AiDev

AiDev (future) will plan and propose builds. Central Brain:

- Does **not** plan builds
- Does **not** generate code
- Does **not** create autonomous behavior
- Does **not** execute actions

It only **reads** summaries from source authorities.

---

## Coordination Only

Central Brain produces:

- `BrainSystemSummary` — per-system status and summary string
- `BrainCoordinationSummary` — ready / warn / fail counts and overall status
- Founder-readable reports with recommendations

It does **not**:

- Calculate trust (Trust Engine owns scoring)
- Store projects (Project Vault owns records)
- Store evidence (Evidence Registry owns proof)
- Write timeline events (Timeline Ledger owns chronology)

---

## Ownership Stays With Source Systems

Central Brain adapters are **read-only**:

| System | Owner Module |
|--------|--------------|
| Trust Engine | `devpulse_v2_trust_engine_authority` |
| Project Vault | `devpulse_v2_project_vault_authority` |
| Evidence Registry | `devpulse_v2_evidence_registry_authority` |
| Timeline Ledger | `devpulse_v2_timeline_ledger_authority` |
| Central Brain | `devpulse_v2_central_brain_authority` |

No mutation. No ownership transfer. No execution.

---

## Why V2 Separates Awareness From Execution

V1 problems often came from **one module doing everything** — answering, trusting, executing, and coordinating in one prompt.

V2 law:

1. **One authority per domain**
2. **Awareness reads; execution acts**
3. **Trust scores; brain coordinates**
4. **Chat answers; brain observes**

Central Brain Foundation is the coordination layer that makes multi-system awareness possible without recreating V1's duplicate-authority failures.

---

## Validation

```bash
npm run validate:central-brain
npm run typecheck
```

**Pass token:** `DEVPULSE_V2_CENTRAL_BRAIN_FOUNDATION_V1_PASS`

**Validation mode:** `FAST_FEATURE_CHECK` — no nested full-stack validator chain.

---

## Dependencies

Requires completed Phase 2 foundations:

- Trust Engine Foundation
- Project Vault Foundation
- Evidence Registry Foundation
- Timeline Ledger Foundation
- Validation Budget Policy
