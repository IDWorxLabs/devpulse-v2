# Auto-Polish Loop — Phase 24.7.6

## Purpose

The Auto-Polish Loop is a **read-only** product polish evaluation system for DevPulse V2. It answers:

> What should be polished before DevPulse is considered production quality?

It identifies polish opportunities, ranks them, groups them, and produces a structured polish roadmap. It does **not** modify UI, apply fixes, rewrite layouts, or execute automatic improvements.

## Architecture

Module path: `src/product-reality-verification/auto-polish-loop/`

| Component | Responsibility |
|-----------|----------------|
| `auto-polish-types.ts` | Models, pass tokens, result types |
| `auto-polish-cache.ts` | Bounded cache (256/map) + source text cache |
| `auto-polish-registry.ts` | Record index and lookup |
| `bounded-history.ts` | Bounded history (128 entries) |
| `polish-opportunity-model.ts` | Unified `POLISH_OPPORTUNITY` model |
| `*-analyzer.ts` (×10) | Category polish opportunity scoring |
| `polish-priority-analyzer.ts` | Priority 1–4 ranking |
| `polish-roadmap-builder.ts` | `POLISH_ROADMAP` generation |
| `auto-polish-authority-builder.ts` | Unified `AutoPolishAuthority` |
| `auto-polish-evaluator.ts` | Final `AUTO_POLISH_RESULT` evaluation |
| `auto-polish-report-builder.ts` | `AUTO_POLISH_REPORT` generation |
| `auto-polish-loop.ts` | Orchestration and upstream chain |
| `index.ts` | Public exports and test reset |

### Boundaries

- Consumes read-only outputs from Visual QA, UX Heuristic, First-Impression Judge, and Live Preview Gatekeeper
- Bounded opportunity generation (max 64 total, 8 per analyzer)
- No browser execution, HTTP server startup, or UI modification
- No automatic fixes or copy mutation

## Opportunity Model

`POLISH_OPPORTUNITY` fields:

- `opportunityId`, `category`, `title`, `description`
- `impactLevel`: LOW | MEDIUM | HIGH | CRITICAL
- `founderImpact`, `userImpact`, `effortEstimate`, `urgency`
- `sourceAnalyzer`, `recommendedPriority`, `detectionCode`

## Analyzers

| Analyzer | Detection Code | Upstream |
|----------|----------------|----------|
| Visual Polish | `VISUAL_POLISH_OPPORTUNITY` | Visual QA Engine |
| UX Polish | `UX_POLISH_OPPORTUNITY` | UX Heuristic Evaluator |
| Responsive Polish | `RESPONSIVE_POLISH_OPPORTUNITY` | Visual QA + Live Preview |
| Preview Polish | `PREVIEW_POLISH_OPPORTUNITY` | Live Preview Gatekeeper |
| Discoverability Polish | `DISCOVERABILITY_POLISH_OPPORTUNITY` | Surface scan |
| Founder Usability Polish | `FOUNDER_POLISH_OPPORTUNITY` | UX + First-Impression |
| Trust Polish | `TRUST_POLISH_OPPORTUNITY` | First-Impression Judge |
| Intelligence Visibility Polish | `INTELLIGENCE_VISIBILITY_POLISH_OPPORTUNITY` | UX + First-Impression |
| Workflow Polish | `WORKFLOW_POLISH_OPPORTUNITY` | UX + Live Preview |
| Product Coherence Polish | `PRODUCT_COHERENCE_POLISH_OPPORTUNITY` | First-Impression + UX |

## Priority System

`PolishPriorityAnalyzer` ranks opportunities using founder impact, user impact, urgency, and impact level into Priority 1–4 and identifies launch blockers (CRITICAL).

## Roadmap Generation

`POLISH_ROADMAP` sections:

1. **Critical Before Launch** — CRITICAL and Priority 1 blockers
2. **High Impact Improvements** — Priority 1–2 high-impact items
3. **Quality Improvements** — Priority 2–3 refinements
4. **Optional Future Improvements** — Priority 4 polish

## Scoring

1. Each analyzer produces a 0–100 polish score and bounded opportunities.
2. `AutoPolishAuthority` aggregates ten scores with equal weight.
3. Final `AUTO_POLISH_RESULT`:
   - **PASS** — score ≥ 80, no critical polish blockers
   - **PASS_WITH_WARNINGS** — warnings or score 55–79
   - **FAIL** — score < 55, critical blockers, or governance blocked

## Report Format

`AUTO_POLISH_REPORT` includes all ten dimension scores, opportunity counts by priority, launch blockers, full polish roadmap, and recommended next improvements.

## Limitations

- Identifies polish opportunities only; does not apply changes
- Upstream report consumption is metadata-based simulation
- Phase 24.7.7 out of scope

## Validation

```bash
npm run validate:auto-polish-loop
npm run typecheck
```

Validates all pass tokens, priority/roadmap generation, stress at 100/1000/5000 evaluations, bounded history (≤128), and bounded cache.
