# Founder Friction Detector — Phase 24.8.6

## Purpose

Founder Friction Detector identifies everything that slows down, blocks, confuses, frustrates, or reduces founder effectiveness. It answers:

> What is actively getting in the founder's way?

Unlike Workflow, Confidence, Trust, and Productivity Validation, this phase focuses specifically on **negative founder experience signals**. It evaluates friction using read-only analysis. It consumes the Founder Acceptance Framework (24.8.1), Founder Workflow Authority (24.8.2), Founder Confidence Authority (24.8.3), Founder Trust Authority (24.8.4), Founder Productivity Authority (24.8.5), and applicable Product Reality outputs. It does **not** execute actions, mutate state, or modify UI.

## Architecture

Module path: `src/founder-acceptance-validation/founder-friction-detector/`

| Component | Responsibility |
|-----------|----------------|
| `founder-friction-types.ts` | Models, pass tokens, verdict types |
| `friction-gap-model.ts` | Bounded gap helpers (max 64 gaps) |
| `founder-friction-cache.ts` | Bounded LRU cache (256/map) + source text cache |
| `founder-friction-registry.ts` | Record index and lookup |
| `bounded-history.ts` | Bounded evaluation history (128 entries) |
| `friction-context-builder.ts` | Ten canonical friction contexts |
| `confusion-friction-detector.ts` | Unclear actions, next steps, outcomes |
| `workflow-friction-detector.ts` | Dead ends, loops, complexity |
| `decision-fatigue-detector.ts` | Excessive and repeated decisions |
| `context-switching-detector.ts` | Fragmentation and context loss |
| `hidden-capability-detector.ts` | Discoverability and hidden capabilities |
| `trust-breakdown-detector.ts` | Trust, transparency, evidence failures |
| `confidence-breakdown-detector.ts` | Confidence and progress truth failures |
| `productivity-blocker-detector.ts` | Throughput and overhead blockers |
| `verification-friction-detector.ts` | Validation confusion and bottlenecks |
| `launch-blocker-friction-detector.ts` | Launch and readiness blockers |
| `friction-gap-analyzer.ts` | Aggregated gap analysis with severity tiers |
| `friction-roadmap-builder.ts` | Prioritized friction removal roadmap |
| `founder-friction-authority-builder.ts` | Unified `FOUNDER_FRICTION_AUTHORITY` |
| `founder-friction-evaluator.ts` | Final evaluation and `FOUNDER_FRICTION_SCORE` |
| `founder-friction-report-builder.ts` | `FOUNDER_FRICTION_REPORT` generation |
| `founder-friction-detector.ts` | Orchestration and read-only integrations |
| `index.ts` | Public exports and test reset |

### Boundaries

- Read-only detection — no execution, UI mutation, or state mutation
- No browser execution or HTTP server startup
- Phases 24.8.7–24.8.8 out of scope

## Friction Contexts

Ten canonical `FrictionContext` entries:

| Context ID | Name | Intent |
|------------|------|--------|
| `CONFUSION_FRICTION` | Confusion Friction | Unclear actions, next steps, outcomes, ownership |
| `WORKFLOW_FRICTION` | Workflow Friction | Dead ends, broken continuity, loops, complexity |
| `DECISION_FATIGUE` | Decision Fatigue | Excessive, repeated, unsupported decisions |
| `CONTEXT_SWITCHING_FRICTION` | Context Switching | Fragmentation, context loss, navigation burden |
| `DISCOVERABILITY_FRICTION` | Discoverability | Hidden features, workflows, capabilities |
| `TRUST_BREAKDOWN_FRICTION` | Trust Breakdown | Trust, transparency, evidence visibility failures |
| `CONFIDENCE_BREAKDOWN_FRICTION` | Confidence Breakdown | Reasoning, progress truth, uncertainty failures |
| `PRODUCTIVITY_FRICTION` | Productivity Friction | Slowdown, manual work, throughput reduction |
| `VERIFICATION_FRICTION` | Verification Friction | Validation confusion, complexity, bottlenecks |
| `LAUNCH_FRICTION` | Launch Friction | Launch, readiness, release, adoption blockers |

Each context defines `contextId`, `contextName`, `frictionIntent`, `expectedNegativeSignal`, and `requiredEvidence`.

## Detectors

### Confusion Friction Detector

Detects unclear actions, next steps, outcomes, ownership, and workflows.

Outputs: `CONFUSION_FRICTION`, `CONFUSION_FRICTION_SCORE`, `CONFUSION_FRICTION_GAPS`

### Workflow Friction Detector

Detects workflow dead ends, broken continuity, loops, complexity, and inefficiency.

Outputs: `WORKFLOW_FRICTION`, `WORKFLOW_FRICTION_SCORE`, `WORKFLOW_FRICTION_GAPS`

### Decision Fatigue Detector

Detects excessive decisions, repeated decisions, prioritization burden, and recommendation gaps.

Outputs: `DECISION_FATIGUE`, `DECISION_FATIGUE_SCORE`, `DECISION_FATIGUE_GAPS`

### Context Switching Detector

Detects fragmented workflows, context loss, excessive navigation, and attention fragmentation.

Outputs: `CONTEXT_SWITCHING_FRICTION`, `CONTEXT_SWITCHING_SCORE`, `CONTEXT_SWITCHING_GAPS`

### Hidden Capability Detector

Detects discoverability failures, hidden features, hidden workflows, and inaccessible capabilities.

Outputs: `DISCOVERABILITY_FRICTION`, `DISCOVERABILITY_SCORE`, `DISCOVERABILITY_GAPS`

### Trust Breakdown Detector

Detects trust failures, verification trust failures, transparency failures, and evidence visibility failures.

Outputs: `TRUST_BREAKDOWN_FRICTION`, `TRUST_BREAKDOWN_SCORE`, `TRUST_BREAKDOWN_GAPS`

### Confidence Breakdown Detector

Detects confidence failures, reasoning visibility failures, progress truth failures, and uncertainty honesty failures.

Outputs: `CONFIDENCE_BREAKDOWN_FRICTION`, `CONFIDENCE_BREAKDOWN_SCORE`, `CONFIDENCE_BREAKDOWN_GAPS`

### Productivity Blocker Detector

Detects workflow slowdown, excessive manual work, throughput reduction, and overhead increases.

Outputs: `PRODUCTIVITY_FRICTION`, `PRODUCTIVITY_FRICTION_SCORE`, `PRODUCTIVITY_FRICTION_GAPS`

### Verification Friction Detector

Detects validation confusion, verification complexity, bottlenecks, and unclear verification outcomes.

Outputs: `VERIFICATION_FRICTION`, `VERIFICATION_FRICTION_SCORE`, `VERIFICATION_FRICTION_GAPS`

### Launch Blocker Friction Detector

Detects launch blockers, readiness blockers, release blockers, and adoption blockers.

Outputs: `LAUNCH_FRICTION`, `LAUNCH_FRICTION_SCORE`, `LAUNCH_FRICTION_GAPS`

## Gap Analysis

`FRICTION_GAP_ANALYSIS` aggregates gaps from all detectors:

- `CRITICAL_FRICTION_GAPS` — actively blocks founder effectiveness
- `MAJOR_FRICTION_GAPS` — significant friction erosion
- `MINOR_FRICTION_GAPS` — optimization opportunities

Gaps are bounded to 64 total across the pipeline.

## Roadmap Structure

`FOUNDER_FRICTION_ROADMAP` sections:

- **Critical Friction Removal** — must-fix before founder can operate effectively
- **High Priority Improvements** — significant friction reduction
- **Medium Improvements** — moderate friction reduction
- **Future Optimization** — long-term friction minimization

## Authority Structure

`FOUNDER_FRICTION_AUTHORITY` contains:

- `contexts` — all ten friction contexts
- `confusionFriction`, `workflowFriction`, `decisionFatigue`, `contextSwitching`, `discoverability`
- `trustBreakdowns`, `confidenceBreakdowns`, `productivityBlockers`, `verificationFriction`, `launchFriction`
- `gapAnalysis` — aggregated gap analysis
- `roadmap` — prioritized friction removal roadmap
- `founderFrictionScore`, `founderFrictionResult`, `confidence`

## Weighted Scoring

`FOUNDER_FRICTION_SCORE` is weighted from ten detectors (higher friction = lower score):

| Dimension | Weight |
|-----------|--------|
| Confusion friction | 1/10 |
| Workflow friction | 1/10 × 0.85 (friction impact modifier) |
| Decision fatigue | 1/10 |
| Context switching | 1/10 |
| Discoverability | 1/10 |
| Trust breakdowns | 1/10 |
| Confidence breakdowns | 1/10 |
| Productivity blockers | 1/10 |
| Verification friction | 1/10 |
| Launch friction | 1/10 |

Each detector score represents friction-free health (100 = no friction detected).

Verdict thresholds:

- **PASS** — score ≥ 80, no critical gaps
- **PASS_WITH_WARNINGS** — score 55–79 or major/minor gaps present
- **FAIL** — score < 55, critical gaps, or governance blocked

## Report Structure

`FOUNDER_FRICTION_REPORT` includes:

- Overall score and result
- Per-detector friction scores
- Detected, critical, major, and minor friction gaps
- `founderFrictionRoadmap` with prioritized fixes
- `recommendedPriorityFixes`
- Runtime cache metrics and history size

## Upstream Dependencies

- **Founder Acceptance Framework** (24.8.1)
- **Founder Workflow Validation** (24.8.2)
- **Founder Confidence Engine** (24.8.3)
- **Founder Trust Validation** (24.8.4)
- **Founder Productivity Validation** (24.8.5)
- **Product Reality Orchestrator** (24.7.8)
- **Product Experience Verification Engine** (24.7.7)
- **UX Heuristic Evaluator**

## Runtime Safeguards

- Bounded detectors with LRU cache (256 entries per map)
- Shared fixture caching and source text caching
- Registry caching and bootstrap reuse
- No duplicate context aggregation (single `buildAllFrictionContexts` cache)
- Timeout protection and recursion protection via validation harness
- No unbounded scenario generation
- No repeated HTTP startups
- Bounded history (≤ 128 entries)

## Limitations

- Read-only static analysis — does not observe live founder behavior
- Friction scores are heuristic, not observational
- Does not produce final founder acceptance verdict (reserved for 24.8.8)

## Validation

```bash
npm run validate:founder-friction-detector
npm run typecheck
```

Validates all pass tokens, ten friction contexts, ten detectors, gap analysis, roadmap, authority, reporting, stress at 100/1000/5000 evaluations, bounded history (≤128), and runtime metrics.
