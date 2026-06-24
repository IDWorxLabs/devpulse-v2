# CQI Integration Repair V1 Report

Generated: 2026-06-24T07:50:15.000Z

Pass token: `CQI_INTEGRATION_REPAIR_V1_PASS`

## Root Cause

Recent CQI Maturity V1 work extended requirement discovery evidence across Founder, Operator, and Launch Council surfaces. Two integration files lost required imports during consolidation:

- `canonical-live-preview-state.ts` referenced `assessLivePreviewReality` without importing it, breaking Live Preview state resolution during founder validation.
- `launch-council-founder-integration.ts` referenced `assessLaunchCouncil` and `buildLaunchCouncilArtifacts` without imports and contained a duplicate autonomous-founder import.

The base CQI validator also exceeded its 60s runtime guard once founder testing could execute again, and Launch Council registry integrity checks were stale (28 authorities registered, validator still expected 23).

## Files Repaired

- `src/one-prompt-live-preview/canonical-live-preview-state.ts`
- `src/launch-council/launch-council-founder-integration.ts`
- `src/clarifying-question-intelligence/clarifying-question-authority.ts`
- `scripts/validate-clarifying-question-intelligence.ts`
- `scripts/validate-cqi-integration-repair-v1.ts`
- `src/launch-council/launch-council-registry.ts`
- `src/launch-council/launch-council-validator.ts`

## Import Fixes

- Added `assessLivePreviewReality` import from `live-preview-reality/index.js`.
- Added `getLastCqiMaturityAssessment` import for Live Preview requirement discovery slice.
- Added `assessLaunchCouncil` and `buildLaunchCouncilArtifacts` imports in Launch Council founder integration.
- Removed duplicate `mapAutonomousFounderLaunchCouncilAuthority` import.

## Type / Wiring Fixes

- Extended `CanonicalLivePreviewWorkspaceSlice` with optional `requirementDiscovery` evidence passthrough (confidence, coverage summary, gap summary, open/resolved question counts).
- Wired `assessCqiMaturity()` into `buildClarifyingQuestionIntelligenceArtifacts()` so founder pipeline records maturity before Launch Council assembly.
- Enriched `mapClarifyingQuestionIntelligence()` findings with maturity confidence, coverage matrix, gap summary, and question counts.
- Updated Launch Council registry integrity count from 26 to 28 to match registered authorities.

## Validation Results

| Check | Result |
| --- | --- |
| Integration repair scenarios | 29/29 |
| `validate:clarifying-question-intelligence` | PASS |
| `validate:clarifying-question-intelligence-maturity-v1` | PASS |
| `validate:autonomous-founder-launch-authority-v1` | PASS |
| `validate:canonical-capability-ownership-v1` | PASS |
| `validate:founder-review-operator-dashboard-v1` | PASS |

Related pass tokens:

- `CLARIFYING_QUESTION_INTELLIGENCE_PASS`
- `CLARIFYING_QUESTION_INTELLIGENCE_MATURITY_V1_PASS`
- `AUTONOMOUS_FOUNDER_LAUNCH_AUTHORITY_V1_PASS`
- `CANONICAL_CAPABILITY_OWNERSHIP_V1_PASS`
- `FOUNDER_REVIEW_OPERATOR_DASHBOARD_V1_PASS`

## Regression Status

- CQI canonical owner: **Clarifying Question Intelligence**
- AFLA launch owner: **Autonomous Founder Launch Authority**
- Remaining duplicate-risk: **0**
- Founder dashboard Requirement Discovery panel: **present**
- Founder dashboard Founder Review panel: **present**

## Evidence Flow

```text
CQI assessCqiMaturity()
  ↓
Operator Requirement Discovery API
  ↓
Founder Evidence requirementDiscovery
  ↓
Launch Council mapClarifyingQuestionIntelligence()
  ↓
Live Preview canonical state requirementDiscovery slice
```
