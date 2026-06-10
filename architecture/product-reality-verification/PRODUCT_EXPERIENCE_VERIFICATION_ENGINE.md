# Product Experience Verification Engine — Phase 24.7.7

## Purpose

The Product Experience Verification Engine is the **master product verification authority** for DevPulse V2. It answers:

> Does DevPulse function as one coherent product experience?

It evaluates whether DevPulse feels like **one product** rather than a collection of independent systems. It does **not** modify UI, execute fixes, mutate product state, or rewrite reports.

## Architecture

Module path: `src/product-reality-verification/product-experience-verification-engine/`

| Component | Responsibility |
|-----------|----------------|
| `product-experience-types.ts` | Models, pass tokens, result types |
| `product-experience-cache.ts` | Bounded cache (256/map) + source text cache |
| `product-experience-registry.ts` | Record index and lookup |
| `bounded-history.ts` | Bounded history (128 entries) |
| `experience-gap-model.ts` | Bounded `EXPERIENCE_GAP` model |
| `experience-context-builder.ts` | Seven workflow context definitions |
| `*-verifier.ts` (×10) | Continuity verification per domain |
| `experience-gap-analyzer.ts` | Cross-system gap detection |
| `experience-roadmap-builder.ts` | `PRODUCT_EXPERIENCE_ROADMAP` generation |
| `product-experience-authority-builder.ts` | Unified `ProductExperienceAuthority` |
| `product-experience-evaluator.ts` | Final `PRODUCT_EXPERIENCE_RESULT` evaluation |
| `product-experience-report-builder.ts` | `PRODUCT_EXPERIENCE_REPORT` generation |
| `product-experience-verification-engine.ts` | Orchestration and upstream chain |
| `index.ts` | Public exports and test reset |

### Boundaries

- Operates **above** Visual QA, UX Heuristics, First Impression, Live Preview, and Auto-Polish Loop
- Consumes read-only upstream report outputs
- Bounded gap generation (max 64 total, 8 per verifier)
- No browser execution, HTTP server startup, or UI modification
- No automatic fixes, copy mutation, or state mutation

## Upstream Dependencies

| Upstream System | Consumed Signals |
|-----------------|------------------|
| Visual QA Engine | Overall score, desktop/mobile ratings, hierarchy |
| UX Heuristic Evaluator | Navigation, workflow, intelligence visibility, trust, founder usability |
| First-Impression Judge | Product identity, trust, action readiness, launch perception |
| Live Preview Gatekeeper | Preview connection, honesty, next action |
| Auto-Polish Loop | Product coherence, polish scores, opportunities |
| Responsive Reality (via Visual QA + Live Preview) | Desktop/tablet/mobile continuity signals |

## Experience Contexts

`ExperienceContextBuilder` defines seven contexts:

- `FOUNDER_DAILY_USE`
- `FIRST_TIME_USER`
- `VERIFICATION_WORKFLOW`
- `PROJECT_BUILD_WORKFLOW`
- `PRODUCT_REVIEW_WORKFLOW`
- `MOBILE_USAGE_WORKFLOW`
- `DESKTOP_USAGE_WORKFLOW`

Each context includes expected goals, actions, transitions, trust signals, intelligence visibility, and success outcomes.

## Verifiers

| Verifier | Detection Codes |
|----------|-----------------|
| Product Coherence | `PRODUCT_FRAGMENTATION`, `DISCONNECTED_EXPERIENCE`, `DUPLICATED_CONCEPTS` |
| Experience Continuity | `EXPERIENCE_BREAK`, `CONTEXT_LOSS`, `JOURNEY_FRAGMENTATION` |
| Intelligence Continuity | `INTELLIGENCE_FRAGMENTATION`, `INTELLIGENCE_VISIBILITY_GAPS` |
| Workflow Continuity | `WORKFLOW_BREAK`, `WORKFLOW_DEAD_END`, `WORKFLOW_LOOP_CONFUSION` |
| Navigation Continuity | `NAVIGATION_FRAGMENTATION`, `NAVIGATION_CONTEXT_LOSS` |
| Verification Continuity | `VERIFICATION_SILO`, `VERIFICATION_DISCONNECTION` |
| Founder Experience | `FOUNDER_EXPERIENCE_BREAK`, `FOUNDER_CLARITY_GAP`, `FOUNDER_CONFIDENCE_RISK` |
| Trust Continuity | `TRUST_FRAGMENTATION`, `TRUST_GAP` |
| Product Identity | `PRODUCT_IDENTITY_DRIFT`, `GENERIC_TOOL_FEEL` |
| Launch Readiness | `LAUNCH_CONTINUITY_RISK`, `READINESS_MISMATCH` |

## Gap Analysis

`ExperienceGapAnalyzer` identifies missing connections between systems:

- Report generated but no next action
- Preview disconnected from verification
- Operator Feed disconnected from workflow
- Chat disconnected from recommendations

## Roadmap Generation

`PRODUCT_EXPERIENCE_ROADMAP` sections:

1. **Critical Experience Fixes** — CRITICAL gaps
2. **High Impact Improvements** — HIGH severity continuity gaps
3. **Product Coherence Improvements** — fragmentation and identity gaps
4. **Launch Readiness Improvements** — launch continuity risks
5. **Future Enhancements** — LOW/MEDIUM refinements

## Scoring

1. Each verifier produces a 0–100 continuity score and bounded gaps.
2. `ProductExperienceAuthority` aggregates ten scores with equal weight (0.1 each).
3. Final `PRODUCT_EXPERIENCE_RESULT`:
   - **PASS** — score ≥ 80, no critical gaps
   - **PASS_WITH_WARNINGS** — warnings or score 55–79
   - **FAIL** — score < 55, critical gaps, or governance blocked

## Report Format

`PRODUCT_EXPERIENCE_REPORT` includes:

- Overall Product Experience Score
- Ten dimension scores (coherence, continuity, intelligence, workflow, navigation, verification, founder, trust, identity, launch)
- Detected Experience Gaps
- Critical Experience Risks, Founder Risks, Trust Risks, Launch Risks
- Product Experience Roadmap
- Recommended Priority Fixes

## Limitations

- Read-only metadata analysis over upstream report outputs
- No browser automation or runtime UI inspection
- Responsive Reality Tester not yet implemented — responsive signals derived from Visual QA and Live Preview
- Phase 24.7.8 out of scope

## Validation

```bash
npm run validate:product-experience-verification-engine
npm run typecheck
```

Validates all pass tokens, context/verifier/gap/roadmap generation, stress at 100/1000/5000 evaluations, bounded history (≤128), and bounded cache.
