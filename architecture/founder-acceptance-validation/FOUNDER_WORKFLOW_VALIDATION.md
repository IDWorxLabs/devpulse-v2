# Founder Workflow Validation — Phase 24.8.2

## Purpose

Founder Workflow Validation is the first actual validation authority within the Founder Acceptance stack. It answers:

> Can the founder complete real operational workflows in DevPulse without confusion, friction, or dead ends?

This phase evaluates founder workflows from the founder perspective using read-only analysis. It consumes the Founder Acceptance Framework (24.8.1) and applicable Product Reality outputs. It does **not** execute actions, mutate state, or modify UI.

## Architecture

Module path: `src/founder-acceptance-validation/founder-workflow-validation/`

| Component | Responsibility |
|-----------|----------------|
| `founder-workflow-types.ts` | Models, pass tokens, verdict types |
| `workflow-gap-model.ts` | Bounded gap helpers (max 64 gaps) |
| `founder-workflow-cache.ts` | Bounded LRU cache (256/map) + source text cache |
| `founder-workflow-registry.ts` | Record index and lookup |
| `bounded-history.ts` | Bounded evaluation history (128 entries) |
| `workflow-context-builder.ts` | Seven canonical founder workflow contexts |
| `workflow-clarity-validator.ts` | What to do, where to go, next step, expected outcome |
| `workflow-discoverability-validator.ts` | Capability, action, workflow, and path discovery |
| `workflow-continuity-validator.ts` | Transitions, context preservation, next-step continuity |
| `workflow-friction-validator.ts` | Unclear actions, hidden capabilities, dead ends, overhead |
| `workflow-recovery-validator.ts` | Recovery from mistakes, failures, confusion, lost context |
| `workflow-outcome-validator.ts` | Realistic path to intended workflow outcomes |
| `workflow-efficiency-validator.ts` | Efficiency, complexity, overhead, repetition |
| `workflow-gap-analyzer.ts` | Aggregated gap analysis with severity tiers |
| `workflow-roadmap-builder.ts` | Prioritized workflow improvement roadmap |
| `founder-workflow-authority-builder.ts` | Unified `FOUNDER_WORKFLOW_AUTHORITY` |
| `founder-workflow-evaluator.ts` | Final evaluation and `FOUNDER_WORKFLOW_SCORE` |
| `founder-workflow-report-builder.ts` | `FOUNDER_WORKFLOW_REPORT` generation |
| `founder-workflow-validation.ts` | Orchestration and read-only integrations |
| `index.ts` | Public exports and test reset |

### Boundaries

- Read-only validation — no execution, UI mutation, or state mutation
- No browser execution or HTTP server startup
- No automatic fixes or autonomous actions
- Phases 24.8.3–24.8.8 out of scope

## Workflow Contexts

Seven canonical `WorkflowContext` entries:

| Context ID | Name | Goal |
|------------|------|------|
| `IDEA_TO_PROJECT` | Idea to Project | Transform idea into structured project |
| `PROJECT_TO_BUILD` | Project to Build | Initiate and track build from founder direction |
| `BUILD_TO_VERIFICATION` | Build to Verification | Move from build to verification assessment |
| `VERIFICATION_TO_FIX` | Verification to Fix | Translate findings into actionable fixes |
| `FIX_TO_VALIDATION` | Fix to Validation | Re-validate after fixes applied |
| `VALIDATION_TO_RELEASE` | Validation to Release | Determine release readiness |
| `DISCOVERY_TO_ACTION` | Discovery to Action | Discover capabilities and take first action |

Each context defines `workflowId`, `workflowName`, `goal`, `expectedOutcome`, and `requiredCapabilities`.

## Validators

### Workflow Clarity

Evaluates whether the founder understands what to do, where to go, what happens next, and what outcome is expected.

Outputs: `WORKFLOW_CLARITY`, `CLARITY_SCORE`, `CLARITY_GAPS`

### Workflow Discoverability

Evaluates whether the founder can discover capabilities, actions, workflows, and available paths.

Outputs: `WORKFLOW_DISCOVERABILITY`, `DISCOVERABILITY_SCORE`, `DISCOVERABILITY_GAPS`

### Workflow Continuity

Evaluates workflow transitions, context preservation, and next-step continuity.

Outputs: `WORKFLOW_CONTINUITY`, `CONTINUITY_SCORE`, `CONTINUITY_GAPS`

### Workflow Friction

Detects unclear actions, hidden capabilities, workflow dead ends, excessive steps, and context switching.

Outputs: `WORKFLOW_FRICTION`, `FRICTION_SCORE`, `FRICTION_GAPS`

### Workflow Recovery

Evaluates recovery from mistakes, failed actions, confusing states, and lost context.

Outputs: `WORKFLOW_RECOVERY`, `RECOVERY_SCORE`, `RECOVERY_GAPS`

### Workflow Outcome

Evaluates whether workflows can realistically reach intended outcomes.

Outputs: `WORKFLOW_OUTCOME`, `OUTCOME_SCORE`, `OUTCOME_GAPS`

### Workflow Efficiency

Evaluates workflow efficiency, complexity, overhead, and repetition.

Outputs: `WORKFLOW_EFFICIENCY`, `EFFICIENCY_SCORE`, `EFFICIENCY_GAPS`

## Gap Analysis

`WORKFLOW_GAP_ANALYSIS` aggregates gaps from all validators:

- `CRITICAL_WORKFLOW_GAPS` — blocks founder workflow completion
- `MAJOR_WORKFLOW_GAPS` — significant friction or confusion
- `MINOR_WORKFLOW_GAPS` — polish and optimization opportunities

Gaps are bounded to 64 total across the pipeline.

## Roadmap Structure

`FOUNDER_WORKFLOW_ROADMAP` sections:

- **Critical Workflow Fixes** — must-fix before founder workflows are viable
- **High Priority Improvements** — significant workflow improvements
- **Medium Improvements** — moderate friction reduction
- **Future Workflow Optimization** — long-term efficiency gains

## Authority Structure

`FOUNDER_WORKFLOW_AUTHORITY` contains:

- `contexts` — all seven workflow contexts
- `clarity`, `discoverability`, `continuity`, `friction`, `recovery`, `outcome`, `efficiency` — validator results
- `gapAnalysis` — aggregated gap analysis
- `roadmap` — prioritized workflow roadmap
- `founderWorkflowScore`, `founderWorkflowResult`, `confidence`

## Scoring

`FOUNDER_WORKFLOW_SCORE` is weighted from:

| Dimension | Weight |
|-----------|--------|
| Clarity | 1/7 |
| Discoverability | 1/7 |
| Continuity | 1/7 |
| Friction | 1/7 × 0.85 (inverse impact modifier) |
| Recovery | 1/7 |
| Outcome | 1/7 |
| Efficiency | 1/7 |

Verdict thresholds:

- **PASS** — score ≥ 80, no critical gaps
- **PASS_WITH_WARNINGS** — score 55–79 or major/minor gaps present
- **FAIL** — score < 55, critical gaps, or governance blocked

## Report Structure

`FOUNDER_WORKFLOW_REPORT` includes:

- Overall score and result
- Per-validator scores
- Detected, critical, major, and minor workflow gaps
- `founderWorkflowRoadmap` with prioritized fixes
- `recommendedPriorityFixes`
- Runtime cache metrics and history size

## Upstream Dependencies

- **Founder Acceptance Framework** (24.8.1) — acceptance model and dimensions
- **Product Reality Orchestrator** (24.7.8) — product readiness signals
- **Product Experience Verification Engine** (24.7.7) — experience continuity
- **UX Heuristic Evaluator** — navigation, friction, usability scores
- **First Impression Judge** — action readiness
- **Live Preview Gatekeeper** — preview next-action signals

## Runtime Safeguards

- Bounded validators with LRU cache (256 entries per map)
- Shared fixture caching and source text caching
- Registry caching and bootstrap reuse
- Timeout protection and recursion protection via validation harness
- No unbounded scenario generation
- No repeated HTTP startups
- Bounded history (≤ 128 entries)

## Limitations

- Read-only static analysis of founder-reality surface and upstream reports
- Does not execute workflows or validate runtime behavior
- Friction and recovery scores are heuristic, not observational
- Does not produce founder acceptance verdict (reserved for 24.8.8)

## Validation

```bash
npm run validate:founder-workflow-validation
npm run typecheck
```

Validates all pass tokens, seven workflow contexts, seven validators, gap analysis, roadmap, authority, reporting, stress at 100/1000/5000 evaluations, bounded history (≤128), and runtime metrics.
