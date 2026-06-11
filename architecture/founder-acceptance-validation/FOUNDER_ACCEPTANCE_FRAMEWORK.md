# Founder Acceptance Framework — Phase 24.8.1

## Purpose

The Founder Acceptance Framework establishes the foundational model for the Founder Acceptance Validation stack. It answers the structural question:

> If DevPulse were used by the founder today, what determines whether it is acceptable or unacceptable?

This phase provides acceptance models, dimensions, criteria, categories, evidence structures, scoring foundations, and reporting foundations. It does **not** produce a founder acceptance verdict — downstream phases (24.8.2–24.8.8) consume this framework to perform validation and final acceptance orchestration.

## Architecture

Module path: `src/founder-acceptance-validation/founder-acceptance-framework/`

| Component | Responsibility |
|-----------|----------------|
| `founder-acceptance-types.ts` | Models, pass tokens, framework types |
| `founder-acceptance-cache.ts` | Bounded cache (256/map) + source text cache |
| `founder-acceptance-registry.ts` | Record index and lookup |
| `bounded-history.ts` | Bounded history (128 entries) |
| `founder-acceptance-dimensions.ts` | 10 canonical acceptance dimensions |
| `founder-acceptance-criteria-registry.ts` | 9 criteria groups with weighted criteria |
| `founder-acceptance-category-builder.ts` | 7 acceptance categories |
| `founder-acceptance-evidence-model.ts` | Evidence source slots for stack integration |
| `founder-acceptance-scoring-model.ts` | Scoring foundation (no execution) |
| `founder-acceptance-report-model.ts` | Report foundation (no generation) |
| `founder-acceptance-authority-builder.ts` | Unified framework authority + stack integration roadmap |
| `founder-acceptance-evaluator.ts` | Framework completeness evaluation |
| `founder-acceptance-framework.ts` | Orchestration and read-only integrations |
| `index.ts` | Public exports and test reset |

### Boundaries

- Framework construction only — no acceptance validation
- No verdicts, workflow evaluation, confidence evaluation, or trust evaluation
- No browser execution, HTTP server startup, or UI modification
- No automatic fixes, copy mutation, or state mutation

## Dimensions

Ten canonical `FOUNDER_ACCEPTANCE_DIMENSION` entries:

| Dimension | Focus |
|-----------|-------|
| `FOUNDER_CLARITY` | Progress, readiness, and next-action clarity |
| `FOUNDER_CONFIDENCE` | Trust in recommendations and readiness claims |
| `FOUNDER_PRODUCTIVITY` | Operational efficiency and low friction |
| `FOUNDER_TRUST` | Honesty, evidence visibility, completion clarity |
| `FOUNDER_CONTROL` | Accept, fix, escalate decision control |
| `FOUNDER_VISIBILITY` | Intelligence, risks, and status visibility |
| `FOUNDER_UNDERSTANDING` | Comprehension of product and intelligence |
| `FOUNDER_RELIABILITY` | Consistent, predictable daily behavior |
| `FOUNDER_CONTINUITY` | End-to-end experience continuity |
| `FOUNDER_ACCEPTANCE` | Holistic operational acceptability |

Each dimension defines `dimensionId`, `dimensionName`, `description`, `evaluationIntent`, and `futureDependencies`.

## Criteria

Nine criteria groups with weighted `AcceptanceCriterion` entries:

- Clarity, Confidence, Trust, Productivity, Control, Reliability, Understanding, Continuity, Visibility

Each criterion contains `criterionId`, `title`, `description`, `weight`, and `dimension`.

## Categories

Seven `FOUNDER_ACCEPTANCE_CATEGORY` entries:

- Workflow Acceptance, Trust Acceptance, Product Acceptance, Productivity Acceptance, Reliability Acceptance, Visibility Acceptance, Launch Acceptance

Each category links `acceptanceCriteria` and `relatedDimensions`.

## Evidence Model

`FOUNDER_ACCEPTANCE_EVIDENCE` registers evidence sources consumed by the completed stack:

- Product Reality Verification (24.7.8)
- Founder Workflow Validation (24.8.2)
- Founder Confidence Engine (24.8.3)
- Founder Trust Validation (24.8.4)
- Founder Productivity Validation (24.8.5)
- Founder Friction Detector (24.8.6)
- Founder Readiness Authority (24.8.7)
- Founder Acceptance Orchestrator (24.8.8)

Framework only — no evidence evaluation in this phase.

## Scoring Model

`FOUNDER_ACCEPTANCE_SCORE_MODEL` supports:

- Dimension score slots with weights
- Category score slots with weights
- Overall acceptance score placeholder
- Blended weighting strategy
- Scoring input hooks consumed by downstream validation phases

No actual scoring execution in this phase.

## Report Model

`FOUNDER_ACCEPTANCE_REPORT_MODEL` defines report sections used by the completed stack:

- Summary, dimensions, criteria, categories, evidence, scores, recommendations, verdict placeholders

Placeholder verdicts: `FOUNDER_ACCEPTABLE`, `FOUNDER_ACCEPTABLE_WITH_WARNINGS`, `FOUNDER_NOT_ACCEPTABLE`, `FOUNDER_LAUNCH_ACCEPTABLE`.

## Authority Structure

`FOUNDER_ACCEPTANCE_FRAMEWORK_AUTHORITY` contains:

- `dimensions`, `criteria`, `categories`
- `evidenceModel`, `scoreModel`, `reportModel`
- `futureRoadmap` — integration points for phases 24.8.2–24.8.8 (completed stack)

## Stack Integrations

| Phase | Module | Target |
|-------|--------|--------|
| 24.8.2 | Founder Workflow Validation | Workflow Acceptance |
| 24.8.3 | Founder Confidence Engine | Confidence Criteria |
| 24.8.4 | Founder Trust Validation | Trust Acceptance |
| 24.8.5 | Founder Productivity Validation | Productivity Acceptance |
| 24.8.6 | Founder Friction Detector | Friction Evidence |
| 24.8.7 | Founder Readiness Authority | Launch Acceptance |
| 24.8.8 | Founder Acceptance Orchestrator | Founder Acceptance |

Upstream: Product Reality Orchestrator (24.7.8) registered as available evidence source.

## Limitations

- Framework establishment only — no founder acceptance verdict
- No workflow, confidence, trust, or productivity validation in this phase
- Downstream validation and orchestration performed by phases 24.8.2–24.8.8

## Validation

```bash
npm run validate:founder-acceptance-framework
npm run typecheck
```

Validates all pass tokens, 10 dimensions, 9 criteria groups, 7 categories, evidence/scoring/report models, authority, future roadmap, stress at 100/1000/5000 builds, bounded history (≤128), and runtime metrics.
