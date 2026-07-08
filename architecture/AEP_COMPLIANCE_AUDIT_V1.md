# AEP Compliance Audit V1

**Generated:** 2026-06-26 (audit verified against live codebase)  
**Scope:** Full AiDevEngine codebase (`server/`, `src/`, `public/`, `scripts/`, orchestration, validators, founder UI)  
**Method:** Read-only static analysis + runtime path tracing (no fixes implemented)  
**Machine-readable findings:** `architecture/aep-compliance-audit-v1.json`  
**Pass token (validators):** `AEP_COMPLIANCE_AUDIT_V1_PASS`

---

## Executive Summary

AiDevEngine has extensive **validation infrastructure** and recent improvements (Prompt-Bounded Materialization, registry startup hydration, resume-state routing), but the **live one-prompt build path still pushes engineering responsibility onto the user**. The Autonomous Software Engineering Engine (ASE), live preview gate, launch readiness, auto-fix, and testing runtimes are largely **`simulationOnly`** — they report evidence without authoritatively blocking, repairing, or completing products.

The founder UI exposes **manual Resume/Repair buttons**, **execution traces**, **workspace paths**, and **operator instructions** (`npm run dev`, port 4321). A **`materializationProofReady` bypass** unlocks live preview when npm build + dev server succeed even when the live preview gate is locked — directly contradicting evidence-driven launch.

**Current AEP maturity score: 42 / 100**

| Severity | Count |
|----------|------:|
| BLOCKER | 8 |
| HIGH | 14 |
| MEDIUM | 20 |
| LOW | 8 |
| **Total findings** | **50** |

**Verdict:** AiDevEngine is **not yet AEP-compliant**. It behaves as a sophisticated builder **with validators and partial autonomy**, not as a system that reliably delivers **one prompt → autonomous end-to-end build → launch-ready app** (or a clear evidence-based blocker explanation without user debugging).

---

## AEP Definition

**Autonomous Engineering Principle (AEP):** AiDevEngine must autonomously understand, engineer, validate, repair, evolve, improve, and prove software from **one complete user prompt**, minimizing human debugging, manual continuation, repeated prompting, or project management.

**User-facing promise:** One prompt → autonomous end-to-end build → launch-ready app, **or** a clear evidence-based explanation of the remaining blocker.

**Product identity:** User explains product → AiDevEngine engineers software → User verifies finished result.

---

## Top 10 AEP Violations

| Rank | ID | Severity | Category | Title |
|-----:|----|----------|----------|-------|
| 1 | AEP-F-001 | BLOCKER → **MITIGATED** | AEP-6 | Live preview gate authority enforced (Phase 1) |
| 2 | AEP-F-002 | BLOCKER → **MITIGATED** | AEP-2 | ASE enforcement engine replaces simulationOnly (Phase 2) |
| 3 | AEP-F-003 | BLOCKER → **MITIGATED** | AEP-2 | Materialization gated by ASE authority (Phase 2) |
| 4 | AEP-F-004 | BLOCKER | AEP-1 | resumeExistingProject flag accepted but not honored |
| 5 | AEP-F-005 | BLOCKER | AEP-1 | Brain API projectResume not rendered in chat UI |
| 6 | AEP-F-006 | BLOCKER | AEP-2 | Autonomous debugging and auto-fix are simulation-only |
| 7 | AEP-F-007 | BLOCKER | AEP-6 | Launch readiness authority is simulation-only |
| 8 | AEP-F-008 | BLOCKER | AEP-4 | Preview unlock accepts partial product state |
| 9 | AEP-F-009 | HIGH | AEP-1 | Duplicate project detection blocks with manual confirm |
| 10 | AEP-F-010 | HIGH | AEP-2 | Manual Resume/Repair/Continue buttons in founder UI |

---

## Full Findings Table

| ID | Category | Severity | Title | Primary modules |
|----|----------|----------|-------|-----------------|
| AEP-F-001 | AEP-6 | BLOCKER | Live preview unlock bypasses evidence gate | `one-prompt-build-orchestrator.ts` |
| AEP-F-002 | AEP-2 | BLOCKER → **MITIGATED** | ASE registry declares simulationOnly | `ase-registry.ts`, `ase-enforcement-engine/` |
| AEP-F-003 | AEP-2 | BLOCKER → **MITIGATED** | ASE pipeline results ignored before materialization | `one-prompt-build-orchestrator.ts` |
| AEP-F-004 | AEP-1 | BLOCKER | resumeExistingProject not honored | `one-prompt-live-preview-types.ts` |
| AEP-F-005 | AEP-1 | BLOCKER | Brain projectResume not in chat UI | `brain-api-handler.ts`, `app.js` |
| AEP-F-006 | AEP-2 | BLOCKER | Auto-fix / debugging simulation-only | `auto-fix-runtime/` |
| AEP-F-007 | AEP-6 | BLOCKER | Launch readiness simulation-only | `launch-readiness-registry.ts` |
| AEP-F-008 | AEP-4 | BLOCKER | Preview accepts partial product | orchestrator + faithfulness |
| AEP-F-009 | AEP-1 | HIGH | Duplicate blocks on confirmProjectResume | build/brain handlers |
| AEP-F-010 | AEP-2 | HIGH | Manual Resume/Repair UI | `app.js` |
| AEP-F-011 | AEP-3 | HIGH | Execution trace primary UX | `index.html`, `app.js` |
| AEP-F-012 | AEP-8 | HIGH | Workspace paths on project cards | `app.js` |
| AEP-F-013 | AEP-6 | HIGH | canProceedToStage never enforced | `ase-stage-orchestrator.ts` |
| AEP-F-014 | AEP-1 | HIGH | storedPromptRequired 400 on resume | build/brain handlers |
| AEP-F-015 | AEP-10 | HIGH | Context alignment blocks user choice | alignment assessor |
| AEP-F-016 | AEP-3 | HIGH | Operator restart instructions | `app.js` |
| AEP-F-017 | AEP-7 | HIGH | Raw NEEDS_WORK badges | `app.js` |
| AEP-F-018 | AEP-4 | HIGH | Faithfulness WARN on missing modules | faithfulness validator |
| AEP-F-019 | AEP-5 | HIGH | PBM guard passes on any one module | PBM resolver |
| AEP-F-020 | AEP-2 | HIGH | Resume/repair same API path | app + orchestrator |
| AEP-F-021 | AEP-8 | HIGH | Project Files panel prominent | founder UI |
| AEP-F-022 | AEP-6 | HIGH | Live preview gate simulationOnly | gate registry |
| AEP-F-023 | AEP-7 | MEDIUM | Archive only, no autonomous rebuild | registry store |
| AEP-F-024 | AEP-7 | MEDIUM | Demo portfolio fallback | `app.js` |
| AEP-F-025 | AEP-1 | MEDIUM | start-fresh-copy duplicates | `app.js` |
| AEP-F-026 | AEP-9 | MEDIUM | Auto-fix never applied | auto-fix-runtime |
| AEP-F-027 | AEP-9 | MEDIUM | Testing runtime advisory only | testing-runtime |
| AEP-F-028 | AEP-4 | MEDIUM | Placeholder modules in apps | generated source |
| AEP-F-029 | AEP-5 | MEDIUM | Residual profile fallback leakage | PBM collector |
| AEP-F-030 | AEP-6 | MEDIUM | Stale evidence may satisfy gates | evidence registry |
| AEP-F-031 | AEP-3 | MEDIUM | Raw validator tokens in notifications | founder UI |
| AEP-F-032 | AEP-7 | MEDIUM | Hydration race / card flicker | hydration + app.js |
| AEP-F-033 | AEP-8 | MEDIUM | Trace engineering vocabulary | trace UI |
| AEP-F-034 | AEP-2 | MEDIUM | No npm build retry loop | orchestrator |
| AEP-F-035 | AEP-10 | MEDIUM | Unsafe domains not blocked | prompt-faithful gen |
| AEP-F-036 | AEP-4 | MEDIUM | NEEDS_WORK without completion plan | resume state |
| AEP-F-037 | AEP-5 | MEDIUM | Descriptor → folder drift risk | descriptor engine |
| AEP-F-038 | AEP-7 | MEDIUM | Inconsistent resumable flags | handlers |
| AEP-F-039 | AEP-8 | MEDIUM | UVL/validator controls in founder UI | command center |
| AEP-F-040 | AEP-9 | MEDIUM | UVL simulation-only | UVL |
| AEP-F-041 | AEP-9 | MEDIUM | Continuous improvement not applied | ASE + orchestrator |
| AEP-F-042 | AEP-1 | MEDIUM | Build history not resume authority | build-history |
| AEP-F-043 | AEP-3 | LOW | Noisy build routing notifications | `app.js` |
| AEP-F-044 | AEP-7 | LOW | Active/inactive label ambiguity | registry UI |
| AEP-F-045 | AEP-8 | LOW | Registry env in error messages | server handlers |
| AEP-F-046 | AEP-1 | LOW | confirmProjectResume API leak | build API |
| AEP-F-047 | AEP-4 | LOW | Universal blueprint pages | materialization |
| AEP-F-048 | AEP-6 | LOW | Build history disconnected from gate | build-history |
| AEP-F-049 | AEP-10 | LOW | Human review reasons not plain | founder test UI |
| AEP-F-050 | AEP-7 | LOW | Project memory not surfaced | shared memory |

See `architecture/aep-compliance-audit-v1.json` for descriptions, affected files, violations, recommended fixes, and implementation order.

---

## Key Code Evidence (verified)

### Preview gate authority (AEP-F-001) — **fixed Phase 1**

`materializationProofReady` bypass removed. Authority module: `src/aep-preview-gate-authority/`. Validator: `validate:aep-preview-gate-authority` → `AEP_PREVIEW_GATE_AUTHORITY_V1_PASS`.

### Preview optimism — server canonical state (AEP-F-001, AEP-F-008) — **removed**

Canonical state derives unlock from `onePromptPublic.livePreviewAvailable` only; locked dev server uses `buildLockedDevServerReality`.

### Preview optimism — client UI (AEP-F-001, AEP-F-008) — **removed**

`mergePreviewClientReality` no longer upgrades locked states when a URL exists; `isDevServerReachable` is diagnostic-only.

### ASE simulation-only (AEP-F-002) — **MITIGATED Phase 2**

`ase-registry.ts` sets `simulationOnly: false` and `enforcementEngine: true`. `src/ase-enforcement-engine/` authorizes materialization, routes decisions, and gates the one-prompt orchestrator via `runAutonomousEngineering` / `completeAutonomousEngineering`.

### ASE pre-materialization bypass (AEP-F-003) — **MITIGATED Phase 2**

Materialization runs only inside ASE-authorized host callback; orchestrator aborts when `materializationAuthorized` or `materializationExecuted` is false.

### Stored prompt gap (AEP-F-014)

`build-from-prompt-handler.ts` returns HTTP 400 `"Original prompt unavailable. Paste prompt to continue."` when resume cannot recover the stored prompt — user must re-paste.

### Manual recovery UX (AEP-F-010)

Project incomplete banner exposes Resume Build, Repair Build, Continue From Prompt, and Start Fresh Copy — user selects engineering recovery mode instead of autonomous continuation.

---

## Maturity Score Method

Score **42/100** reflects:

- **Strengths (+):** Prompt-bounded materialization guard, registry startup hydration, resume-state derivation, extensive validator corpus, one-prompt orchestrator skeleton, feature contract pipeline.
- **Deductions (−):** 8 blockers on core autonomy path; simulation-only ASE/launch/preview/auto-fix; preview gate bypass; manual recovery UX; engineering-state founder UI.

Formula used for planning (not automated): start 100, subtract weighted severity density on **runtime orchestration** (not validator count). Validators measure compliance; they do not yet **enforce** AEP at runtime.

---

## Recommended Implementation Phases

### Phase 1 — Restore evidence authority (orders 1–8, 13, 22)

Remove `materializationProofReady` preview bypass. Enforce `canProceedToStage` and live preview gate as hard blockers. Promote launch readiness from simulation to enforcement.

### Phase 2 — Real autonomous recovery (orders 2–3, 6, 10, 20, 26, 34)

Wire ASE blockers to materialization gate. Connect auto-fix to controlled apply + retry loops. Differentiate resume vs repair vs continue in orchestrator.

### Phase 3 — One-prompt continuity (orders 4–5, 9, 14, 25, 42, 46)

Honor `resumeExistingProject`. Persist prompts durably. Auto-resume duplicates. Wire brain `projectResume` to chat. Build history as resume authority.

### Phase 4 — Founder product UX (orders 11–12, 16–17, 21, 31, 33, 39, 43–45)

Product-language status default. Hide traces/files/paths. Remove operator instructions. Collapse manual recovery to optional Advanced.

### Phase 5 — Prompt-bounded completion (orders 18–19, 28–29, 36–37, 47)

Strict faithfulness FAIL. Full PBM coverage. Auto-complete NEEDS_WORK. Strip placeholders.

### Phase 6 — Quality hardening (orders 27, 40–41, 35, 49–50)

Execute smoke tests. Apply UVL findings. Surface project memory. Risk gate for unsafe domains.

---

## Validators Needed (post-audit implementation)

| Validator | Addresses |
|-----------|-----------|
| `validate:live-preview-gate-no-bypass` | AEP-F-001 |
| `validate:ase-runtime-enforcement` | AEP-F-002, AEP-F-013 |
| `validate:ase-pre-materialization-gate` | AEP-F-003 |
| `validate:one-prompt-resume-orchestration` | AEP-F-004 |
| `validate:brain-project-resume-ui` | AEP-F-005 |
| `validate:autonomous-debugging-real-repair` | AEP-F-006 |
| `validate:launch-readiness-enforcement` | AEP-F-007 |
| `validate:preview-requires-product-completion` | AEP-F-008 |
| `validate:duplicate-auto-resume` | AEP-F-009 |
| `validate:founder-ui-no-manual-recovery-default` | AEP-F-010 |
| `validate:founder-ui-product-language-default` | AEP-F-011 |
| `validate:project-card-product-language` | AEP-F-012 |
| `validate:stored-prompt-durability` | AEP-F-014 |
| `validate:resume-repair-differentiation` | AEP-F-020 |
| `validate:needs-work-auto-completion` | AEP-F-036 |
| `validate:high-risk-prompt-gate` | AEP-F-035 |

Audit artifact validators (this deliverable):

- `validate:aep-compliance-audit`
- `validate:aep-audit-report-exists`
- `validate:aep-audit-json-schema`
- `validate:aep-audit-finding-coverage`
- `validate:aep-audit-severity-ranking`
- `validate:aep-audit-implementation-order`

---

## Do Not Build Next (until AEP blockers addressed)

1. **Do not add more founder authority simulation engines** — ASE, launch, preview, and auto-fix must become enforcing runtimes first; new simulation layers increase validator debt without autonomy.
2. **Do not add preview bypass shortcuts** — `materializationProofReady`-style escapes undermine the product promise and mask gate failures.
3. **Do not expand manual recovery UI** — Resume/Repair/Continue buttons train users as operators; invest in autonomous resume instead.
4. **Do not nest more `validate:*` coverage chains** without runtime enforcement — validators already exceed runtime authority (see Validation Runtime Audit).
5. **Do not ship demo/fallback portfolio data** in founder path on API errors — hides real blockers.
6. **Do not expose UVL/execution trace as default UX** — diagnostics belong behind operator mode.

---

## Final Recommendation

**Stop treating validation pass tokens as product readiness.** AiDevEngine must converge on a single enforcing orchestration path:

1. One stored prompt → autonomous plan → guarded materialization → **ASE-enforced stages** → **real auto-fix retries** → **evidence-gated preview** → launch-ready verdict or plain-language blocker.

Until Phase 1–3 complete, the honest user-facing promise is: *"AiDevEngine builds and validates extensively, but may require you to resume, repair, or restart servers manually."* That is **not AEP-compliant** and should not be marketed as one-prompt autonomous launch.

**Next engineering priority:** Resume/repair autonomous continuation (AEP-F-004, AEP-F-005), real auto-fix enforcement (AEP-F-006), and launch readiness authority (AEP-F-007).

---

## Audit Validation

Run:

```bash
npm run validate:aep-compliance-audit
```

Expected pass token: **`AEP_COMPLIANCE_AUDIT_V1_PASS`**
