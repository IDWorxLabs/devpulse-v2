# Live Preview Gatekeeper — Phase 24.7.5

## Purpose

The Live Preview Gatekeeper is a **read-only** product preview verification system for DevPulse V2. It answers:

> Is Live Preview actually useful, visible, understandable, responsive, and safe for founder/product verification?

It evaluates preview visibility, understandability, meaningfulness, founder verification support, responsive support, unavailable-state honesty, misleading risk, next actions, report connection, and product readiness. It does **not** modify UI, start servers, run browser automation, or mutate product state.

## Architecture

Module path: `src/product-reality-verification/live-preview-gatekeeper/`

| Component | Responsibility |
|-----------|----------------|
| `live-preview-types.ts` | Models, pass tokens, result types |
| `live-preview-cache.ts` | Bounded cache (256/map) + source text cache |
| `live-preview-registry.ts` | Record index and lookup |
| `bounded-history.ts` | Bounded history (128 entries) |
| `preview-context-builder.ts` | Seven preview review contexts |
| `*-analyzer.ts` (×10) | Preview domain scoring |
| `live-preview-authority-builder.ts` | Unified `LivePreviewAuthority` |
| `live-preview-evaluator.ts` | Final `LIVE_PREVIEW_RESULT` evaluation |
| `live-preview-report-builder.ts` | `LIVE_PREVIEW_REPORT` generation |
| `live-preview-gatekeeper.ts` | Orchestration and read-only bootstrap |
| `index.ts` | Public exports and test reset |

### Boundaries

- Read-only scan of `live-preview-runtime`, `mobile-preview-runtime`, and founder-reality surfaces
- Upstream chain: Live Preview Runtime → First-Impression Judge → Live Preview Gatekeeper
- Source text caching and bootstrap snapshot reuse
- No browser execution, HTTP server startup, or UI modification
- No automatic fixes or preview code mutation

## Preview Contexts

| Context | Intent |
|---------|--------|
| `DESKTOP_PREVIEW_REVIEW` | Verify desktop product surface at full viewport |
| `MOBILE_PREVIEW_REVIEW` | Verify mobile product reality on phone-sized viewport |
| `TABLET_PREVIEW_REVIEW` | Verify tablet-width layout and breakpoints |
| `FOUNDER_ACCEPTANCE_REVIEW` | Founder verifies completed work before acceptance |
| `UVL_REPORT_REVIEW` | Connect preview evidence to UVL verification rows |
| `WORLD2_PREVIEW_REVIEW` | Preview World 2 builder output |
| `PROJECT_BUILD_PREVIEW_REVIEW` | Preview project build output |

Each context includes preview intent, expected visible state, expected user action, readiness signal, confusion risks, and fallback when preview is unavailable.

## Analyzers

| Analyzer | Detections |
|----------|------------|
| Preview Visibility | `PREVIEW_ENTRY_HIDDEN`, `PREVIEW_STATE_HIDDEN`, `PREVIEW_RESULT_HIDDEN` |
| Preview Understandability | `PREVIEW_CONTEXT_UNCLEAR`, `PREVIEW_LIMITATION_UNCLEAR`, `PREVIEW_FRESHNESS_UNCLEAR` |
| Preview State Meaningfulness | `PREVIEW_NOT_MEANINGFUL`, `PREVIEW_PLACEHOLDER_RISK`, `PREVIEW_NOT_REPRESENTATIVE` |
| Founder Verification Support | `FOUNDER_PREVIEW_VALUE_WEAK`, `FOUNDER_VERIFICATION_BLOCKED`, `FOUNDER_NEXT_STEP_FROM_PREVIEW_UNCLEAR` |
| Responsive Preview Support | `RESPONSIVE_PREVIEW_WEAK`, `MOBILE_PREVIEW_UNUSABLE`, `VIEWPORT_SWITCHING_UNCLEAR` |
| Preview Unavailable Honesty | `PREVIEW_UNAVAILABLE_HIDDEN`, `PREVIEW_FALSE_READY`, `PREVIEW_FAILURE_REASON_MISSING` |
| Preview Misleading Risk | `PREVIEW_STALE_RISK`, `PREVIEW_FALSE_CONFIDENCE`, `PREVIEW_COMPLETION_MISLEADING` |
| Preview Next Action | `PREVIEW_NEXT_ACTION_MISSING`, `PREVIEW_TO_VERIFICATION_GAP`, `PREVIEW_TO_FIX_GAP` |
| Preview Report Connection | `PREVIEW_REPORT_DISCONNECTED`, `PREVIEW_EVIDENCE_NOT_TRACEABLE` |
| Product Readiness Preview | `PREVIEW_READINESS_WEAK`, `PREVIEW_LAUNCH_SIGNAL_MISSING` |

## Scoring

1. Each analyzer produces a 0–100 score and problem flags.
2. `LivePreviewAuthority` aggregates ten scores with equal weight.
3. Final `LIVE_PREVIEW_RESULT`:
   - **PASS** — score ≥ 80, no critical failures
   - **PASS_WITH_WARNINGS** — warnings or score 55–79
   - **FAIL** — score < 55, critical honesty/visibility failures, or governance blocked

## Report Format

`LIVE_PREVIEW_REPORT` includes all ten dimension scores, `previewContextRisks`, `founderPreviewRisks`, `responsivePreviewRisks`, `misleadingPreviewRisks`, `readinessGaps`, and `recommendedPriorityFixes`.

## Founder Verification Role

The Founder Verification Support Analyzer evaluates whether Lungelo can use preview to verify work, compare expected vs actual behavior, detect visual/UX issues, and decide next steps — without hidden blocked states or false-ready signals.

## Preview Honesty Role

The Preview Unavailable Honesty and Misleading Risk analyzers ensure DevPulse clearly states when preview is unavailable, explains why, avoids pretending preview succeeded, and does not overstate completion or hide stale/failed states.

## Limitations

- Metadata-based evaluation of runtime source and surface structure; no live browser preview
- Gap flags on `LivePreviewInput` drive penalty scoring for simulation
- Does not auto-fix preview surfaces or start preview servers
- Phase 24.7.6 out of scope

## Validation

```bash
npm run validate:live-preview-gatekeeper
npm run typecheck
```

Validates `LIVE_PREVIEW_GATEKEEPER_PASS`, `LIVE_PREVIEW_GATEKEEPER_V1_PASS`, all analyzer pass tokens, reporting, stress at 100/1000/5000 evaluations, bounded history (≤128), and bounded cache.
