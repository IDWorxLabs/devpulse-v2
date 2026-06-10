# Visual QA Engine — Phase 24.7.1

## Purpose

The Visual QA Engine is a **read-only** visual product evaluation system for DevPulse V2. It answers:

> Does the product visually meet production-quality standards?

The engine analyzes screenshots, live preview states, rendered UI surfaces, and product layouts. It produces a structured visual quality report. It does **not** modify UI, execute fixes, or rewrite code.

## Architecture

Module path: `src/product-reality-verification/visual-qa-engine/`

| Component | Responsibility |
|-----------|----------------|
| `visual-qa-types.ts` | Models, pass tokens, result types |
| `visual-qa-cache.ts` | Bounded LRU cache (256 entries per map) |
| `visual-qa-registry.ts` | Record index and lookup |
| `bounded-history.ts` | Bounded evaluation history (128 entries) |
| `*-analyzer.ts` (×12) | Domain-specific visual scoring |
| `visual-qa-authority-builder.ts` | Unified `VisualQAAuthority` |
| `visual-qa-evaluator.ts` | Production readiness evaluation |
| `visual-qa-report-builder.ts` | `VISUAL_QA_REPORT` generation |
| `visual-qa-engine.ts` | Orchestration and read-only surface bootstrap |
| `index.ts` | Public exports and test reset |

### Boundaries

- Read-only surface scan of `public/founder-reality/` (CSS/HTML metadata only)
- No recursion, no self-expanding analysis
- No execution, mutation, or UI modification
- Timeout guards via validation harness (5 min max runtime)

## Analyzers

| Analyzer | Score / Detection |
|----------|-------------------|
| Visual Hierarchy | `HIERARCHY_SCORE` 0–100; primary action, navigation, status |
| Layout Quality | Panel structure; `LAYOUT_IMBALANCE`, `LAYOUT_FRAGMENTATION`, `LAYOUT_CONFUSION` |
| Spacing Consistency | Rhythm; `INCONSISTENT_SPACING`, `CROWDED_LAYOUT`, `WASTED_SPACE` |
| Alignment Consistency | `ALIGNMENT_DRIFT`, `MISALIGNED_COMPONENTS` |
| Typography Quality | `TYPOGRAPHY_SCORE`; hierarchy and readability |
| Color Consistency | `COLOR_CONFLICT`, `LOW_CONTRAST`, `THEME_INCONSISTENCY` |
| Visual Clutter | `CLUTTER_SCORE`; overcrowding and density |
| Empty Space Utilization | `DEAD_SPACE`, `UNUSED_REAL_ESTATE` |
| Mobile Visual | `MOBILE_LAYOUT_FAILURE`, `MOBILE_DISCOVERABILITY_RISK`, `MOBILE_OVERFLOW_RISK` |
| Desktop Visual | `DESKTOP_LAYOUT_FAILURE`, `DESKTOP_UNUSED_SPACE` |
| First Impression | `FIRST_IMPRESSION_SCORE`; modern, intelligent, trustworthy, polished, premium |
| Product Professionalism | `PROFESSIONALISM_SCORE`; founder, customer, investor acceptability |

## Scoring

1. Each analyzer produces a 0–100 score and problem flags.
2. `VisualQAAuthority` aggregates twelve analyzer scores with equal weight.
3. `evaluateVisualQA` maps authority to `VISUAL_QA_RESULT`:
   - **PASS** — score ≥ 80, no critical failures
   - **PASS_WITH_WARNINGS** — warnings present or score 55–79
   - **FAIL** — score < 55, critical layout/contrast failures, or governance blocked

## Reports

`generateVisualQAReport` produces `VISUAL_QA_REPORT` including:

- Overall Score, Visual Quality, Hierarchy, Layout, Spacing, Alignment
- Typography, Color, Clutter, Mobile, Desktop, First Impression, Professionalism
- Detected Problems, Improvement Opportunities, Recommended Priority Fixes

## Limitations

- Evaluates structural and signal-based visual metadata; does not render pixels or run browser automation
- Gap flags on `VisualQAInput` drive penalty scoring for validation and simulation
- Does not auto-fix or deploy UI changes
- Phase 24.7.2+ (screenshot capture pipelines) are out of scope for 24.7.1

## Validation

```bash
npm run validate:visual-qa-engine
npm run typecheck
```

Pass tokens:

- `VISUAL_QA_ENGINE_V1_PASS`
- `VISUAL_HIERARCHY_PASS`
- `LAYOUT_QUALITY_PASS`
- `SPACING_ANALYSIS_PASS`
- `ALIGNMENT_ANALYSIS_PASS`
- `TYPOGRAPHY_ANALYSIS_PASS`
- `COLOR_ANALYSIS_PASS`
- `MOBILE_VISUAL_PASS`
- `DESKTOP_VISUAL_PASS`
- `FIRST_IMPRESSION_PASS`
- `PROFESSIONALISM_PASS`
- `REPORTING_PASS`

Stress tests: 100 / 1000 / 5000 scenarios with history bounded at 128.
