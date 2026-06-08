# DevPulse V2 Self Vision Foundation

**System ID:** `self_vision`  
**Phase:** 5  
**Owner:** `devpulse_v2_self_vision_authority`  
**Pass token:** `DEVPULSE_V2_SELF_VISION_FOUNDATION_V1_PASS`

---

## Why Self Vision Exists

DevPulse V2 needs a structured way to **observe and describe visible UI reality** without acting on it. Self Vision is the first foundation of Phase 5. It establishes an observation layer that future systems — replay, diagnostics, trust scoring, and operator tooling — can consume as structured facts about what the UI appears to be.

Self Vision answers questions like:

- Is this registered element visible?
- Is it clickable?
- What did the browser harness last verify?
- What observation sessions ran, and what did they record?

It does **not** answer user chat questions, fix broken UI, or decide what to build next.

---

## Observation vs Repair

| Self Vision (observation) | Repair / execution systems |
|---------------------------|----------------------------|
| Records what is seen      | Changes UI or code         |
| Read-only consumption     | Mutates state              |
| Structured observation records | Remediation actions   |
| No side effects           | Side effects expected      |

When Self Vision detects a hidden or non-clickable element, it records that fact. Downstream repair, recovery, or execution systems may **consume** those observations. Self Vision itself never repairs.

---

## Self Vision vs Browser Verification Harness

| Browser Verification Harness | Self Vision |
|------------------------------|-------------|
| **Owner** of browser reality checks | **Consumer** of harness results |
| Runs foundation browser checks | Observes harness output read-only |
| Pass/fail verification gate | Structured observation records |
| Measures latency, DOM presence | Maps checks to observation status |

The harness **verifies** that Phase 1 stack behavior meets expectations. Self Vision **describes** UI reality in a reusable observation model for the wider system. Self Vision does not replace the harness.

---

## Self Vision vs Visible UI Clickability Guard

| Visible UI Guard | Self Vision |
|------------------|-------------|
| **Owner** of UI element registration | **Consumer** of registry and check results |
| Registers mount targets and selectors | Observes registered elements |
| Runs clickability/visibility checks | Creates observation records and sessions |
| Guardrail for prompt/UI completeness | Observation layer for future systems |

The guard remains the authority for registration and clickability proof. Self Vision reads registry state and check results without taking ownership.

---

## Why Self Vision Is Read-Only

Self Vision is intentionally constrained:

- **No execution** — no actions, automation, or recovery
- **No mutation** — no UI changes, clicks, or panel creation
- **No code generation** — no planning or implementation output
- **No answer authority** — chat remains the single answer source
- **No replay** — replay systems will consume observations later; Self Vision does not replay
- **No AI vision / screenshot analysis** — rule-based observation from registered UI and harness outputs only

These boundaries keep observation separate from action, preventing observation layers from silently becoming repair or execution layers.

---

## How Future Replay Systems Will Consume Observations

Replay and diagnostics systems will consume:

- `ObservationRecord` — per-element status (`VISIBLE`, `HIDDEN`, `CLICKABLE`, `NOT_CLICKABLE`, `UNKNOWN`)
- `ObservationSession` — grouped observations from a read-only pass
- `ObservationSummary` — counts and narrative summary published to Central Brain
- Timeline events — when observations were recorded
- Evidence records — observation proof in the Evidence Registry

Replay can reconstruct **what was observed** at a point in time without Self Vision re-executing UI actions. Observations become durable inputs for diffing, regression analysis, and operator review.

---

## Ownership Remains With Source Systems

Self Vision bridges preserve upstream ownership:

| Source system | Self Vision role |
|---------------|------------------|
| Visible UI Guard | Read registry and check results |
| Browser Verification Harness | Read last verification result |
| Timeline Ledger | Record observation events (ledger owns events) |
| Evidence Registry | Publish observation evidence (registry owns evidence) |
| Central Brain | Publish summaries only (brain owns awareness) |

Self Vision owns **observation sessions**, **observation reports**, and **observation summaries** under `devpulse_v2_self_vision_authority`. It does not own UI registration, browser checks, ledger events, evidence records, or brain state.

---

## Module Layout

```
src/self-vision/
  types.ts                      — ObservationStatus, ObservationRecord, ObservationSession
  self-vision-engine.ts         — observeRegisteredUi, observeElement, observeVisibleUi, summarizeObservations
  self-vision-ui-bridge.ts      — Visible UI Guard integration
  self-vision-browser-bridge.ts — Browser Harness integration
  self-vision-timeline-bridge.ts — Timeline Ledger integration
  self-vision-evidence-bridge.ts — Evidence Registry integration
  self-vision-brain-bridge.ts   — Central Brain integration
  self-vision-report.ts         — formatSelfVisionReport
  self-vision-authority.ts      — createDevPulseV2SelfVisionAuthority
  index.ts
```

---

## Validation

```bash
npm run validate:self-vision
npm run typecheck
```

Expected pass token: `DEVPULSE_V2_SELF_VISION_FOUNDATION_V1_PASS`

---

## Example

Registered element `ExpensePanel` with selector `#expense-panel`, interactive, present in HTML snapshot:

```
Observed: CLICKABLE (visible + interactive + clickable patterns detected)
Result: ObservationRecord created in session
```

Self Vision records the fact. It does not click Submit, fix the panel, or generate code to add one.
