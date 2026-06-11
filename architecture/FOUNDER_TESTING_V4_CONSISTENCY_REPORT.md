# Founder Testing V4 vs Validator Consistency Report

**Date:** 2026-06-10  
**Scope:** Source-of-truth mismatch between Founder Testing V4 analyzers and standalone validators  
**Constraints honored:** No UI changes, no scoring changes, no launch-readiness calculation changes, no new features

---

## Executive Summary

Standalone validators passed while Founder Testing V4 still reported three resolved issues. Root cause was **analyzer input selection**, not missing UI copy or stale cache.

| Finding | Verdict | Root cause |
|---------|---------|------------|
| Project Memory vs Project Insights confusion | **EXTRACTOR_ISSUE** → fixed | `detectHumanConfusion()` used brittle `appJs`-only string checks with wrong casing; ignored `assessProjectIntelligenceClarity()` |
| Live Preview: "No Live Preview Running" missing | **EXTRACTOR_ISSUE** → fixed | `screenSurfaceSnippet()` matched `el('live-preview-surface')` first and truncated at 2500 chars before empty-state copy |
| Live Preview: "Next action" missing | **EXTRACTOR_ISSUE** → fixed | Same truncated snippet as above |

**Final verdict:** `FOUNDER_TESTING_V4_CONSISTENCY_PASS`

---

## Investigation Answers

### Q1 — Do V4 and standalone validators analyze the same source?

**Partially.** Both read `public/founder-reality/app.js` and `index.html`, but they used different extraction windows:

| Analyzer path | Extraction | Full file? |
|---------------|------------|------------|
| `validate:live-preview-reality` | `appJs.includes('No Live Preview Running')` | Yes |
| `validate:project-intelligence-clarity` | `assessProjectIntelligenceClarity({ appJs, html })` | Function blocks + sidebar HTML |
| V4 V1 `checkScreenStatic` | `screenSurfaceSnippet()` — first `el('…')` match, 2500 chars | No |
| V4 V2 `evaluateScreenPurpose` | `surfaceSnippet()` — `function render…`, 4000 chars | No |
| V4 V3 `detectHumanConfusion` | Duplicate bespoke `appJs` string checks | `appJs` only (ignored `html`) |

Validators and V4 disagreed because V4 static screen checks read **helper fragments**, not the full render function body.

### Q2 — Was V4 using stale extraction paths?

**Yes.** `screenSurfaceSnippet()` in `founder-testing-screen-checker.ts` preferred `el('live-preview-surface')` over `function renderLivePreviewSurface`, returning a 2500-character window that ended before lines 1155–1157 in `app.js` where empty-state copy lives.

`detectHumanConfusion()` did not use `renderProjectMemorySurface` / `renderProjectInsightsSurface` at all; it used inline string checks that did not match sidebar copy in `index.html`.

### Q3 — Was cached validation data involved?

**No.** V4 orchestrators call `readFileSync` on shell sources each run. No snapshot reuse, report reuse, or confusion-result persistence was found. Findings were regenerated from current files but analyzed through broken extractors.

### Q4 — Per-finding trace

#### Finding 1: Project Memory vs Project Insights confusion

| Field | Detail |
|-------|--------|
| **Analyzer** | `detectHumanConfusion()` → promoted to issues via `buildV3Issues()` |
| **Source file** | `src/founder-testing-mode/human-behavior-simulation-engine.ts` |
| **Check** | Bespoke `distinguished` block required `appJs.includes('project knowledge, requirements, and history')` (lowercase `project`) |
| **Evidence analyzed** | `app.js` only; sidebar help lives in `index.html` as `Project knowledge, requirements, and history.` (capital `P`) |
| **Failure reason** | Case-sensitive mismatch + `html` not consulted; `assessProjectIntelligenceClarity()` already returned `confusionSeverity: NONE` |
| **Current UI state** | Memory hero ("Everything AiDevEngine knows"), Insights hero ("Everything AiDevEngine thinks"), relationship flow, sidebar nav-help all present |
| **Verdict** | **EXTRACTOR_ISSUE** (false positive) |

#### Finding 2: Live Preview — "No Live Preview Running" missing

| Field | Detail |
|-------|--------|
| **Analyzer** | `checkScreenStatic()` → `screenIssuesFromResults()` → V1/V2/V3/V4 `issues` |
| **Source file** | `src/founder-testing-mode/founder-testing-screen-checker.ts` |
| **Check** | `purposeKeywords` includes `'No Live Preview Running'`; searched in `screenSurfaceSnippet()` output |
| **Evidence analyzed** | First 2500 chars from `el('live-preview-surface')` — ended ~line 1100, before `renderProductCard('No Live Preview Running', …)` at line 1155 |
| **Failure reason** | Wrong extraction anchor + insufficient window size |
| **Current UI state** | Empty preview shows card title `No Live Preview Running` with honest copy |
| **Verdict** | **EXTRACTOR_ISSUE** (false positive) |

#### Finding 3: Live Preview — "Next action" missing

| Field | Detail |
|-------|--------|
| **Analyzer** | Same as Finding 2 |
| **Source file** | `src/founder-testing-mode/founder-testing-screen-checker.ts` |
| **Check** | `purposeKeywords` includes `'Next action'`; same truncated snippet |
| **Evidence analyzed** | Same 2500-char window missing `'<p><strong>Next action:</strong> Start a preview…'` at line 1157 |
| **Failure reason** | Same extractor bug |
| **Current UI state** | Next action line visible in empty preview state |
| **Verdict** | **EXTRACTOR_ISSUE** (false positive) |

---

## Fixes Applied

### 1. `screenSurfaceSnippet()` — prefer render functions

**File:** `src/founder-testing-mode/founder-testing-screen-checker.ts`

- Prefer `function render{Surface}` extraction first (aligned with `surfaceSnippet()` in `founder-proxy-evaluator.ts`)
- Increase window to 5200 characters
- Fall back to `id="…"` / `el('…')` only when render function is absent

### 2. `surfaceSnippet()` window alignment

**File:** `src/founder-testing-mode/founder-proxy-evaluator.ts`

- Increased snippet window from 4000 → 5200 chars for consistency across V1/V2 extractors

### 3. `detectHumanConfusion()` — delegate to clarity module

**File:** `src/founder-testing-mode/human-behavior-simulation-engine.ts`

- Removed bespoke `distinguished` string block (wrong source + wrong casing)
- Replaced with `assessProjectIntelligenceClarity({ appJs, html })` — same source as `detectConfusionRisks()` and `validate:project-intelligence-clarity`
- HIGH confusion finding only when `confusionSeverity` is `HIGH` or `CRITICAL`

---

## Before / After Findings

| Finding | Before fix | After fix |
|---------|------------|-----------|
| Project Memory vs Project Insights (HIGH) | Present in V4 `issues` | **Absent** |
| Live Preview: "No Live Preview Running" missing | Present in V4 `issues` | **Absent** |
| Live Preview: "Next action" missing | Present in V4 `issues` | **Absent** |
| V4 total issues (investigation run) | 12 | **11** (only legitimate items remain) |
| V3 HIGH memory-vs-insights confusion count | 1 | **0** |

Fresh report generated at: `architecture/FOUNDER_TESTING_V4_FRESH_REPORT.md`  
Confirmed: no occurrences of the three false-positive strings in the fresh markdown.

---

## Validation Results (post-fix)

| Command | Result | Scenarios |
|---------|--------|-----------|
| `npm run validate:project-intelligence-clarity` | **PASS** | 29/29 |
| `npm run validate:live-preview-reality` | **PASS** | 31/31 |
| `npm run validate:verification-results-visibility` | **PASS** | 34/34 |
| `npm run validate:founder-testing-mode-v4` | **PASS** | 34/34 |

Key consistency signals:

- `PROJECT_INTELLIGENCE_CLARITY_PASS` — confusion severity `NONE`, V3 HIGH memory-vs-insights count **0**
- `FOUNDER_TESTING_MODE_V4_PASS` — scenario `31b` confusion=**0**, human readiness **81**
- Investigation script `scripts/investigate-v4-consistency.ts` — **VERDICT CLEAN**

---

## Affected Analyzers

| Analyzer | Role | Fix |
|----------|------|-----|
| `screenSurfaceSnippet()` | V1 static purpose-marker checks | Render-function-first extraction, 5200-char window |
| `surfaceSnippet()` | V2 `evaluateScreenPurpose()` | Window aligned to 5200 chars |
| `detectHumanConfusion()` | V3 human confusion → V4 issues | Uses `assessProjectIntelligenceClarity()` instead of duplicate `appJs`-only checks |

**Not changed:** `detectConfusionRisks()`, scoring, launch readiness calculations, UI copy, validation scenario counts.

---

## Root Cause (single sentence)

Founder Testing V4 static and human-confusion analyzers read **truncated or wrong source fragments** while standalone validators read **full file content or the shared clarity module** — producing false positives for UI copy that was already correct.

---

## Final Verdict

**FOUNDER_TESTING_V4_CONSISTENCY_PASS**

Founder Testing V4 and standalone validators now agree on the three investigated findings. Remaining V4 issues represent other legitimate product-readiness items (execution reality gaps, verification state, navigation breadth, etc.), not stale or wrong-source false positives.
