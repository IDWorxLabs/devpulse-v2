# Validation Runtime Audit

**Date:** 2026-06-11  
**Scope:** Founder authority validators (Phases 24.9.x) and cascading `npm run validate:*` coverage chains  
**Method:** Read-only static analysis of validator scripts + measured wall-clock runs on current workspace  
**No code changes were made.**

---

## Executive Summary

Validator runtime grew from **seconds/minutes to hundreds of seconds** because later phase validators adopted a **“Preserving existing validator coverage…”** pattern: each new engine validator re-runs prior validators via `execSync('npm run validate:…')`. That creates a **transitive cascade** (not a flat chain), so work is repeated many times per top-level run.

The dominant costs are:

1. **Nested subprocess spawns** (`npm` → `tsx` → TypeScript compile → run) — ~40 validator process trees for one `validate:adoption-prediction-engine` run.
2. **`runFounderTestingModeV5()` repeated ~32–40 times** per adoption run — each invocation runs the full V4 orchestrator (V3 + all authority engines).
3. **Caches are process-local or keyed by `Date.now()`**, so they do not dedupe work across nested validators or repeated snapshot builds.

Measured reference (this machine, current tree):

| Command | Wall-clock |
|---------|------------|
| `validate:founder-sensemaking-engine` | **22s** |
| `validate:first-time-user-reality` | **25s** |
| `validate:customer-journey-simulation` | **25s** |
| `validate:founder-testing-v5` | **45s** |
| `validate:promise-reality-engine` | **123s** |
| `validate:visual-quality-authority` | **250s** |
| `validate:launch-day-simulation-engine` | **499s** |
| `validate:adoption-prediction-engine` | **986s** (~16.4 min) |

Early validators (e.g. `validate:evidence-registry-foundation.ts`) explicitly document **“no nested npm run validate:* dependency chain”** and remain fast. The regression is localized to the **founder authority stack** introduced in Phases 24.9.13–24.9.19.

---

## 1. Validator Dependency Graph

### 1.1 Direct `execSync` edges (coverage preservation)

Only **four** founder engine validators nest other validators. None of the leaf validators nest.

```
validate:first-time-user-reality          (leaf)
validate:founder-sensemaking-engine       (leaf)
validate:customer-journey-simulation      (leaf)
validate:founder-testing-v5               (leaf)

validate:promise-reality-engine
  ├── validate:first-time-user-reality
  ├── validate:founder-sensemaking-engine
  ├── validate:customer-journey-simulation
  └── validate:founder-testing-v5

validate:visual-quality-authority
  ├── validate:first-time-user-reality
  ├── validate:founder-sensemaking-engine
  ├── validate:customer-journey-simulation
  ├── validate:promise-reality-engine      ← re-runs entire promise subtree
  └── validate:founder-testing-v5

validate:launch-day-simulation-engine
  ├── validate:first-time-user-reality
  ├── validate:founder-sensemaking-engine
  ├── validate:customer-journey-simulation
  ├── validate:promise-reality-engine
  ├── validate:visual-quality-authority    ← re-runs entire visual subtree
  └── validate:founder-testing-v5

validate:adoption-prediction-engine
  ├── validate:first-time-user-reality
  ├── validate:founder-sensemaking-engine
  ├── validate:customer-journey-simulation
  ├── validate:promise-reality-engine
  ├── validate:visual-quality-authority
  ├── validate:launch-day-simulation-engine  ← re-runs entire launch subtree
  └── validate:founder-testing-v5
```

### 1.2 Transitive invocation counts (from `validate:adoption-prediction-engine`)

| Validator script | Times `execSync`’d |
|------------------|-------------------|
| `validate:adoption-prediction-engine` | 1 |
| `validate:launch-day-simulation-engine` | 1 |
| `validate:visual-quality-authority` | 2 |
| `validate:promise-reality-engine` | 4 |
| `validate:customer-journey-simulation` | 8 |
| `validate:founder-sensemaking-engine` | 8 |
| `validate:first-time-user-reality` | 8 |
| `validate:founder-testing-v5` | 8 |

**Total nested validator subprocess trees:** 40 (including the root).

### 1.3 Engines repeatedly recomputed

Each `runFounderTestingModeV5()` → `runFounderTestingModeV4()` runs the **full authority stack** (interaction sim, first-time, trust, friction, customer journey, visual quality, launch day, adoption, promise, enrichments, report assembly).

Estimated executions when running **`validate:adoption-prediction-engine`**:

| Engine / operation | Approx. executions |
|--------------------|-------------------|
| `runFounderTestingModeV5()` | **~32–40** |
| `buildProductWorkspaceSnapshot()` | **~32** |
| `assessCustomerJourneySimulation()` (direct in scripts + via V4) | **~60+** |
| `assessPromiseRealityEngine()` | **~50+** |
| `assessVisualQualityAuthority()` | **~45+** |
| `assessLaunchDaySimulation()` | **~40+** |
| `assessAdoptionPrediction()` | **~40+** |

Leaf validators also call `runFounderTestingModeV5()` once in their own body **before** coverage nesting, multiplying cost further.

---

## 2. Duplicate Report / File Loading

### 2.1 Architecture reports

Validators check report existence with `existsSync(join(ROOT, 'architecture', …))` — cheap metadata reads, not full report parsing. **No evidence of full markdown report re-parsing** in hot paths.

Examples:

- `validate:founder-sensemaking-engine` → `FOUNDER_SENSEMAKING_ENGINE_REPORT.md`
- `validate:founder-testing-v5` → multiple `architecture/*.md` existence checks
- `validate:first-time-user-reality` → separation + action-path reports

These are **one stat call per check**, not repeated parsing of report bodies.

### 2.2 Hot files read repeatedly (high impact)

| File(s) | Read pattern |
|---------|--------------|
| `public/founder-reality/app.js`, `index.html`, `styles.css` | Every validator static section + every `runFounderTestingModeV4()` (via `readFileSync` in orchestrator) |
| `package.json` | Every validator process |
| `src/**/**-authority.ts`, orchestrator sources | Static wiring checks via `readText()` per process |

**Per adoption run:** shell files alone are read on the order of **100+ times** (40 validator processes × local reads + ~32 V4 orchestrator reads).

### 2.3 In-process `textCache`

Scripts such as `validate-adoption-prediction-engine.ts` use:

```ts
const textCache = new Map<string, string>();
function readText(relativePath: string) { /* cache hit within process */ }
```

| Cache | Scope | Effect |
|-------|-------|--------|
| `textCache` | Single validator process | **~100% hit** after first read **within that process** |
| `textCache` | Across `execSync` children | **0% hit** — new process every nested validator |
| `getCachedFounderSensemaking()` | Module singleton | **~0% effective** — cache key is `sensemaking-${generatedAt}` and `generatedAt` is `Date.now()` on each `buildProductWorkspaceSnapshot()` |

---

## 3. Duplicate Engine Execution

### 3.1 Customer Journey Simulation

| Context | Executions (adoption root) |
|---------|---------------------------|
| Direct `assessCustomerJourneySimulation()` in validator bodies | ~22 |
| Inside each `runFounderTestingModeV5()` | ~32–40 |
| **Total** | **~55–65** |

Confirmed in: `validate-customer-journey-simulation.ts` (2× local), `validate-promise-reality-engine.ts`, `validate-launch-day-simulation-engine.ts`, `validate-adoption-prediction-engine.ts`, plus V4 orchestrator on every V5 run.

### 3.2 Promise Reality Engine

| Context | Executions (adoption root) |
|---------|---------------------------|
| Direct `assessPromiseRealityEngine()` in scripts | ~12 |
| Via V4 on each V5 run | ~32–40 |
| **Total** | **~45–50** |

### 3.3 Visual Quality Authority

| Context | Executions (adoption root) |
|---------|---------------------------|
| Direct in scripts | ~6 |
| Via V4 on each V5 run | ~32–40 |
| **Total** | **~40–45** |

### 3.4 Launch Day & Adoption (same pattern)

- Launch day: ~3 direct + ~32–40 via V4 ≈ **35–43**
- Adoption: ~2 direct + ~32–40 via V4 ≈ **34–42**

---

## 4. Cascading Validation

**Yes — `validate:X` triggers `validate:Y` internally** via `execSync('npm run ${script}')` in the “Preserving existing validator coverage…” block.

Cascade depth by entry point:

| Entry validator | Max nesting depth |
|-----------------|-------------------|
| `validate:promise-reality-engine` | 2 (promise → leaf) |
| `validate:visual-quality-authority` | 3 (visual → promise → leaf) |
| `validate:launch-day-simulation-engine` | 4 (launch → visual → promise → leaf) |
| `validate:adoption-prediction-engine` | **5** (adoption → launch → visual → promise → leaf) |

Each deeper validator **re-executes the entire subtree** below it. This is the primary runtime regression mechanism.

**Does not cascade:** `validate:first-time-user-reality`, `validate:founder-sensemaking-engine`, `validate:customer-journey-simulation`, `validate:founder-testing-v5` (no `runValidator` / `execSync validate:*`).

---

## 5. Cache Effectiveness

| Mechanism | Intended use | Measured effectiveness |
|-----------|--------------|------------------------|
| `textCache` in validator scripts | Dedupe file reads in one run | **High in-process, zero cross-process** |
| `getCachedFounderSensemaking` | Dedupe sensemaking assessment | **~0% hit rate** — key includes millisecond timestamp |
| `buildProductWorkspaceSnapshot` | Shared fixture | **Rebuilt ~32× per adoption run** — no cross-validator sharing |
| `tsx`/Node module cache | Faster re-import | **Cold start every nested `npm run`** |

**Estimated cache hit rates (adoption root run):**

| Cache | Hit rate | Miss rate |
|-------|----------|-----------|
| Per-validator `textCache` | ~90% within each of 40 processes | 100% on first read per process |
| Sensemaking snapshot cache | **~0%** | **~100%** |
| Cross-validator engine memoization | **0%** | **100%** |

**Repeated text parsing:** `JSON.parse(readText('package.json'))` runs **once per validator process** (40× on adoption run). Shell sources parsed/ scanned by regex in every engine assessment.

---

## 6. Runtime Breakdown

### 6.1 Standalone validator runtimes (measured)

| Validator | Calls (standalone) | Runtime | Notes |
|-----------|-------------------|---------|-------|
| `validate:founder-sensemaking-engine` | 1 | **22s** | No nested validators |
| `validate:first-time-user-reality` | 1 | **25s** | 1× V5 |
| `validate:customer-journey-simulation` | 1 | **25s** | 1× V5 |
| `validate:founder-testing-v5` | 1 | **45s** | 1× V5 + HTTP server probe |
| `validate:promise-reality-engine` | 1 | **123s** | 4 nested validators |
| `validate:visual-quality-authority` | 1 | **250s** | 5 nested validators |
| `validate:launch-day-simulation-engine` | 1 | **499s** | 6 nested validators |
| `validate:adoption-prediction-engine` | 1 | **986s** | 7 nested validators |

### 6.2 Wall-clock attribution — `validate:adoption-prediction-engine` (986s total)

Sequential top-level coverage section (one direct child call each; children still re-run their own subtrees internally):

| Validator | Top-level calls | Est. wall-clock | % total |
|-----------|-----------------|-----------------|---------|
| `validate:adoption-prediction-engine` (local scenarios) | 1 | ~12s | **1.2%** |
| `validate:first-time-user-reality` | 1 | ~25s | **2.5%** |
| `validate:founder-sensemaking-engine` | 1 | ~22s | **2.2%** |
| `validate:customer-journey-simulation` | 1 | ~25s | **2.5%** |
| `validate:promise-reality-engine` | 1 | ~123s | **12.5%** |
| `validate:visual-quality-authority` | 1 | ~250s | **25.4%** |
| `validate:launch-day-simulation-engine` | 1 | ~499s | **50.6%** |
| `validate:founder-testing-v5` | 1 | ~45s | **4.6%** |
| **Total** | | **~986s** | **100%** |

The **launch-day subtree consumes ~half** of adoption validation time because it re-runs promise + visual + all leaf validators again.

### 6.3 Cumulative duplicate work (same adoption run)

| Validator | Total subprocess invocations | Cumulative if each ran standalone |
|-----------|------------------------------|-----------------------------------|
| `validate:first-time-user-reality` | 8 | ~200s |
| `validate:founder-sensemaking-engine` | 8 | ~176s |
| `validate:customer-journey-simulation` | 8 | ~200s |
| `validate:founder-testing-v5` | 8 | ~360s |
| `validate:promise-reality-engine` | 4 | ~492s |
| `validate:visual-quality-authority` | 2 | ~500s |
| `validate:launch-day-simulation-engine` | 1 | ~499s |

Cumulative duplicate work **far exceeds** 986s wall-clock because nested runs overlap — but this table shows **why** wall-clock grew super-linearly as phases stacked.

### 6.4 Growth timeline (design cause)

| Phase | Validator added | Nested coverage | Approx. standalone runtime |
|-------|-------------------|-----------------|----------------------------|
| 24.9.13 | Customer Journey | None | ~25s |
| 24.9.16 | Promise Reality | 4 validators | ~123s |
| 24.9.17 | Visual Quality | + promise chain | ~250s |
| 24.9.18 | Launch Day | + visual chain | ~500s |
| 24.9.19 | Adoption Prediction | + launch chain | ~986s |

Each phase preserved prior coverage **by re-invoking prior scripts**, not by shared in-process fixtures.

---

## 7. Recommended Fixes

Prioritized by impact vs. effort. **Recommendations only — no implementation in this audit.**

### P0 — Break the transitive cascade

1. **Remove nested `execSync('npm run validate:*')` from engine validators.**  
   Replace with one orchestrator script, e.g. `validate:founder-authority-stack`, that runs leaf validators **once each** in a fixed order and aggregates pass tokens.

2. **Leaf validators validate only their engine.**  
   Parent phase validators should import engine functions and assert pass tokens locally — not re-run entire downstream npm scripts.

3. **CI matrix parallelism.**  
   Run independent leaf validators in parallel jobs instead of serial nesting inside one process.

**Expected impact:** adoption run drops from **~986s → ~150–200s** (sum of leaf runtimes + one V5), ~**80% reduction**.

### P1 — Dedupe engine execution inside a single validation session

4. **Session-level memoization** for `runFounderTestingModeV5()`, `buildProductWorkspaceSnapshot()`, and shell `readText` fixtures — keyed by content hash, not `Date.now()`.

5. **Fix sensemaking cache key** to stable inputs (e.g. hash of shell sources + snapshot version), so repeated snapshot builds in one process hit cache.

6. **Single shared fixture module** loaded once per top-level validator; pass snapshot into direct `assess*` calls instead of rebuilding.

**Expected impact:** additional **30–50%** reduction within any remaining multi-engine script.

### P2 — Reduce per-run overhead

7. **Replace `execSync('npm run …')` with in-process imports** (`await import('../scripts/validate-…')` or shared `runValidationScenarios()` exports) to eliminate ~2–5s tsx startup × 40.

8. **Stop calling `runFounderTestingModeV5()` in every leaf validator** when a higher orchestrator already ran it; use targeted unit scenarios instead.

9. **Split “coverage preservation” from “engine proof”** — document pass tokens in a manifest; top-level CI checks tokens, engine scripts only prove their layer.

### P3 — Observability & guardrails

10. **Per-scenario timing logs** (already partially present via `Runtime: ${runtimeMs}ms`) — extend to nested child attribution.

11. **Enforce validation budget policy** already in repo: `validate-validation-budget-policy.ts` flags **forbidden nested `npm run validate:*`** — apply to founder authority validators.

12. **Cap `MAX_RUNTIME_MS` escalation** — raising limits (720s → 900s → 1_080s) prevented timeouts but masked cascade growth; fix graph first, then tighten limits.

---

## Appendix: Key Files Reviewed

| File | Role in runtime issue |
|------|------------------------|
| `scripts/validate-adoption-prediction-engine.ts` | Deepest cascade (7 nested validators) |
| `scripts/validate-launch-day-simulation-engine.ts` | 6 nested validators |
| `scripts/validate-visual-quality-authority.ts` | 5 nested validators |
| `scripts/validate-promise-reality-engine.ts` | 4 nested validators |
| `scripts/validate-founder-testing-v5.ts` | Heavy V5 + server; invoked 8× per adoption run |
| `src/founder-testing-mode/founder-testing-v4-orchestrator.ts` | Full stack on every V5 call |
| `server/product-workspace-snapshot.ts` | Expensive snapshot; sensemaking cache keyed by timestamp |
| `scripts/validate-validation-budget-policy.ts` | Documents anti-pattern for nested validators |

---

## Audit Verdict

**Root cause:** Transitive **`execSync` validator nesting** + **`runFounderTestingModeV5()` fan-out**, not slow individual engines in isolation.

**Secondary causes:** Process-bound caches, timestamp-based cache keys, repeated shell/snapshot loading.

**Single-engine validators remain fast (~22–45s).** Runtime explosion is **architectural duplication** in coverage preservation, not engine algorithm cost.
