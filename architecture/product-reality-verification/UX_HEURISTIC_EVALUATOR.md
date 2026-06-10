# UX Heuristic Evaluator — Phase 24.7.3

## Purpose

The UX Heuristic Evaluator is a **read-only** product experience evaluation system for DevPulse V2. It answers:

> Does DevPulse make sense to use from a real user experience perspective?

It evaluates whether the product feels understandable, discoverable, useful, and trustworthy. It does **not** modify UI, rewrite UX flows, execute actions, or mutate product state.

## Architecture

Module path: `src/product-reality-verification/ux-heuristic-evaluator/`

| Component | Responsibility |
|-----------|----------------|
| `ux-heuristic-types.ts` | Models, pass tokens, result types |
| `ux-heuristic-cache.ts` | Bounded cache (256/map) + source text cache |
| `ux-heuristic-registry.ts` | Record index and lookup |
| `bounded-history.ts` | Bounded history (128 entries) |
| `*-analyzer.ts` (×12) | Heuristic domain scoring |
| `ux-heuristic-authority-builder.ts` | Unified `UXHeuristicAuthority` |
| `ux-heuristic-evaluator.ts` | Founder acceptance evaluation |
| `ux-heuristic-report-builder.ts` | `UX_HEURISTIC_REPORT` generation |
| `ux-heuristic-engine.ts` | Orchestration and read-only bootstrap |
| `index.ts` | Public exports and test reset |

### Boundaries

- Read-only scan of `public/founder-reality/index.html` and `app.js`
- Source text caching to avoid repeated disk reads
- Bootstrap snapshot reuse (no repeated startup loops)
- No browser execution, HTTP server startup, or UI modification

## Analyzers

| Analyzer | Detections |
|----------|------------|
| Navigation Clarity | `NAVIGATION_CONFUSION`, `UNCLEAR_PRODUCT_AREA`, `MISSING_LOCATION_CONTEXT` |
| Feature Discoverability | `FEATURE_HIDDEN`, `FEATURE_DISCOVERABILITY_RISK`, `UNLABELED_CAPABILITY` |
| Action Clarity | `UNCLEAR_ACTION`, `AMBIGUOUS_BUTTON`, `PRIMARY_ACTION_HIDDEN` |
| Feedback Quality | `MISSING_FEEDBACK`, `WEAK_PROGRESS_FEEDBACK`, `ACTION_RESULT_UNCLEAR` |
| System Status Visibility | `STATUS_HIDDEN`, `STATUS_MISLEADING`, `READINESS_CONFUSION` |
| Error Prevention | `ERROR_PREVENTION_RISK`, `DESTRUCTIVE_ACTION_RISK`, `RECOVERY_PATH_UNCLEAR` |
| User Control | `USER_CONTROL_WEAKNESS`, `NO_CLEAR_ESCAPE_PATH`, `CONTROL_VISIBILITY_RISK` |
| Cognitive Load | `COGNITIVE_OVERLOAD`, `TECHNICAL_LANGUAGE_RISK`, `UX_NOISE` |
| Trust Clarity | `TRUST_GAP`, `UNSUPPORTED_CONFIDENCE`, `COMPLETION_CLARITY_RISK` |
| Workflow Continuity | `WORKFLOW_BREAK`, `NEXT_STEP_UNCLEAR`, `CONTEXT_LOSS` |
| Intelligence Visibility | `INTELLIGENCE_HIDDEN`, `REASONING_NOT_VISIBLE`, `SMART_SYSTEM_FEELS_STATIC` |
| Founder Usability | `FOUNDER_USABILITY_RISK`, `FOUNDER_CONFUSION_RISK`, `FOUNDER_TRUST_RISK` |

## Scoring

1. Each analyzer produces a 0–100 score and problem flags.
2. `UXHeuristicAuthority` aggregates twelve scores with equal weight.
3. Final `UX_HEURISTIC_RESULT`:
   - **PASS** — score ≥ 80, no critical failures
   - **PASS_WITH_WARNINGS** — warnings or score 55–79
   - **FAIL** — score < 55, critical intelligence/founder failures, or governance blocked

## Report Format

`UX_HEURISTIC_REPORT` includes all twelve dimension scores, detected problems, founder friction risks, trust risks, hidden intelligence risks, recommended priority fixes, and founder acceptance notes.

## Intelligence Visibility Role

DevPulse must visibly communicate intelligence to the founder — not only contain it internally. The Intelligence Visibility Analyzer checks whether users can see what DevPulse knows, checks, recommends, and will do next.

## Founder Usability Role

The Founder Usability Analyzer evaluates daily use without architecture knowledge: chat direction, system status comprehension, report trust, progress visibility, and output usefulness.

## Limitations

- Metadata-based evaluation of HTML/JS structure; no live user testing
- Gap flags on `UXHeuristicInput` drive penalty scoring for simulation
- Does not auto-fix UX or modify product surfaces
- Phase 24.7.4+ out of scope

## Validation

```bash
npm run validate:ux-heuristic-evaluator
npm run typecheck
```

Pass tokens: `UX_HEURISTIC_EVALUATOR_PASS`, `UX_HEURISTIC_EVALUATOR_V1_PASS`, plus per-analyzer and `REPORTING_PASS` tokens.

Stress: 100 / 1000 / 5000 evaluations with history ≤ 128 and cache ≤ 256 per map.
