# Founder Confidence Engine — Phase 24.8.3

## Purpose

The Founder Confidence Engine is the confidence validation authority within the Founder Acceptance stack. It answers:

> Does DevPulse give the founder confidence that the system understands the project, knows what it is doing, explains its reasoning, reports truthfully, and provides reliable next steps?

This phase evaluates founder confidence from the founder perspective using read-only analysis. It consumes the Founder Acceptance Framework (24.8.1), Founder Workflow Authority (24.8.2), and applicable Product Reality outputs. It does **not** execute actions, mutate state, or modify UI.

## Architecture

Module path: `src/founder-acceptance-validation/founder-confidence-engine/`

| Component | Responsibility |
|-----------|----------------|
| `founder-confidence-types.ts` | Models, pass tokens, verdict types |
| `confidence-gap-model.ts` | Bounded gap helpers (max 64 gaps) |
| `founder-confidence-cache.ts` | Bounded LRU cache (256/map) + source text cache |
| `founder-confidence-registry.ts` | Record index and lookup |
| `bounded-history.ts` | Bounded evaluation history (128 entries) |
| `confidence-context-builder.ts` | Seven canonical confidence contexts |
| `understanding-confidence-validator.ts` | Project, phase, goal, outcome understanding |
| `reasoning-visibility-validator.ts` | Visible reasoning without exposing internals |
| `progress-truth-validator.ts` | Evidence-backed progress claims |
| `next-step-confidence-validator.ts` | Next action clarity and priority |
| `decision-confidence-validator.ts` | Tradeoffs, assumptions, alternatives |
| `uncertainty-honesty-validator.ts` | Honest uncertainty and limitation admission |
| `founder-control-confidence-validator.ts` | Founder control and approval boundaries |
| `confidence-gap-analyzer.ts` | Aggregated gap analysis with severity tiers |
| `confidence-roadmap-builder.ts` | Prioritized confidence improvement roadmap |
| `founder-confidence-authority-builder.ts` | Unified `FOUNDER_CONFIDENCE_AUTHORITY` |
| `founder-confidence-evaluator.ts` | Final evaluation and `FOUNDER_CONFIDENCE_SCORE` |
| `founder-confidence-report-builder.ts` | `FOUNDER_CONFIDENCE_REPORT` generation |
| `founder-confidence-engine.ts` | Orchestration and read-only integrations |
| `index.ts` | Public exports and test reset |

### Boundaries

- Read-only validation — no execution, UI mutation, or state mutation
- No browser execution or HTTP server startup
- No automatic fixes or autonomous actions
- Phases 24.8.4–24.8.8 out of scope

## Confidence Contexts

Seven canonical `ConfidenceContext` entries:

| Context ID | Name | Intent |
|------------|------|--------|
| `PROJECT_UNDERSTANDING_CONFIDENCE` | Project Understanding | System understands project, phase, goal, constraints |
| `ACTION_REASONING_CONFIDENCE` | Action Reasoning | Visible reasoning for what and why without exposing internals |
| `PROGRESS_TRUTH_CONFIDENCE` | Progress Truth | Evidence-backed progress with built/wired/validated distinction |
| `NEXT_STEP_CONFIDENCE` | Next Step | Clear next action with priority and risk awareness |
| `DECISION_CONFIDENCE` | Decision | Tradeoffs, assumptions, and justified recommendations |
| `UNCERTAINTY_CONFIDENCE` | Uncertainty | Honest admission of uncertainty and missing evidence |
| `CONTROL_CONFIDENCE` | Founder Control | No hidden execution, clear approval boundaries |

Each context defines `contextId`, `contextName`, `confidenceIntent`, `expectedFounderSignal`, and `requiredEvidence`.

## Validators

### Understanding Confidence

Evaluates whether DevPulse makes the founder confident it understands the project, current phase, founder goal, intended outcome, and system constraints.

Outputs: `UNDERSTANDING_CONFIDENCE`, `UNDERSTANDING_CONFIDENCE_SCORE`, `UNDERSTANDING_CONFIDENCE_GAPS`

### Reasoning Visibility

Evaluates whether DevPulse explains what it is doing, why steps are needed, what evidence supports claims, and what changed — without vague authority claims.

Outputs: `REASONING_VISIBILITY`, `REASONING_VISIBILITY_SCORE`, `REASONING_VISIBILITY_GAPS`

### Progress Truth

Evaluates whether progress claims are truthful: no fake completion, no unsupported pass claims, clear validation evidence, accurate remaining work reporting.

Outputs: `PROGRESS_TRUTH`, `PROGRESS_TRUTH_SCORE`, `PROGRESS_TRUTH_GAPS`

### Next-Step Confidence

Evaluates next action clarity, priority order, risk awareness, rollback awareness, and validation command clarity.

Outputs: `NEXT_STEP_CONFIDENCE`, `NEXT_STEP_CONFIDENCE_SCORE`, `NEXT_STEP_CONFIDENCE_GAPS`

### Decision Confidence

Evaluates tradeoff visibility, recommendation justification, stated assumptions, visible alternatives, and honest uncertainty handling.

Outputs: `DECISION_CONFIDENCE`, `DECISION_CONFIDENCE_SCORE`, `DECISION_CONFIDENCE_GAPS`

### Uncertainty Honesty

Evaluates whether uncertain claims are marked, missing evidence acknowledged, limitations visible, and confidence inflation avoided.

Outputs: `UNCERTAINTY_HONESTY`, `UNCERTAINTY_HONESTY_SCORE`, `UNCERTAINTY_HONESTY_GAPS`

### Founder Control Confidence

Evaluates no unexpected action, no hidden execution, no silent mutation, clear approval boundaries, and rollback/safety visibility.

Outputs: `FOUNDER_CONTROL_CONFIDENCE`, `FOUNDER_CONTROL_CONFIDENCE_SCORE`, `FOUNDER_CONTROL_CONFIDENCE_GAPS`

## Gap Analysis

`CONFIDENCE_GAP_ANALYSIS` aggregates gaps from all validators:

- `CRITICAL_CONFIDENCE_GAPS` — undermines founder trust in system claims
- `MAJOR_CONFIDENCE_GAPS` — significant confidence erosion
- `MINOR_CONFIDENCE_GAPS` — polish and transparency opportunities

Gaps are bounded to 64 total across the pipeline.

## Roadmap Structure

`FOUNDER_CONFIDENCE_ROADMAP` sections:

- **Critical Confidence Fixes** — must-fix before founder can trust progress claims
- **High Priority Improvements** — significant confidence improvements
- **Medium Improvements** — moderate transparency gains
- **Future Confidence Optimization** — long-term trust building

## Authority Structure

`FOUNDER_CONFIDENCE_AUTHORITY` contains:

- `contexts` — all seven confidence contexts
- `understandingConfidence`, `reasoningVisibility`, `progressTruth`, `nextStepConfidence`, `decisionConfidence`, `uncertaintyHonesty`, `founderControlConfidence`
- `gapAnalysis` — aggregated gap analysis
- `roadmap` — prioritized confidence roadmap
- `founderConfidenceScore`, `founderConfidenceResult`, `confidence`

## Weighted Scoring

`FOUNDER_CONFIDENCE_SCORE` is weighted equally (1/7 each) from:

- Understanding confidence
- Reasoning visibility
- Progress truth
- Next-step confidence
- Decision confidence
- Uncertainty honesty
- Founder control confidence

Verdict thresholds:

- **PASS** — score ≥ 80, no critical gaps
- **PASS_WITH_WARNINGS** — score 55–79 or major/minor gaps present
- **FAIL** — score < 55, critical gaps, or governance blocked

## Report Structure

`FOUNDER_CONFIDENCE_REPORT` includes:

- Overall score and result
- Per-validator scores
- Detected, critical, major, and minor confidence gaps
- `founderConfidenceRoadmap` with prioritized fixes
- `recommendedPriorityFixes`
- Runtime cache metrics and history size

## Upstream Dependencies

- **Founder Acceptance Framework** (24.8.1) — acceptance model and dimensions
- **Founder Workflow Validation** (24.8.2) — workflow clarity and outcome signals
- **Product Reality Orchestrator** (24.7.8) — product readiness and launch blockers
- **Product Experience Verification Engine** (24.7.7) — experience continuity
- **UX Heuristic Evaluator** — trust, control, and usability scores
- **First Impression Judge** — action readiness
- **Live Preview Gatekeeper** — preview honesty and next-action signals

## Runtime Safeguards

- Bounded validators with LRU cache (256 entries per map)
- Shared fixture caching and source text caching
- Registry caching and bootstrap reuse
- No duplicate context aggregation (single `buildAllConfidenceContexts` cache)
- Timeout protection and recursion protection via validation harness
- No unbounded scenario generation
- No repeated HTTP startups
- Bounded history (≤ 128 entries)

## Limitations

- Read-only static analysis of founder-reality surface and upstream reports
- Does not observe runtime founder behavior or emotional response
- Confidence scores are heuristic, not observational
- Does not produce final founder acceptance verdict (reserved for 24.8.8)

## Validation

```bash
npm run validate:founder-confidence-engine
npm run typecheck
```

Validates all pass tokens, seven confidence contexts, seven validators, gap analysis, roadmap, authority, reporting, stress at 100/1000/5000 evaluations, bounded history (≤128), and runtime metrics.
