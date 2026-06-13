# Founder Test Reality Sweep Type Drift Repair Report

## Root Cause

- Validator fixtures in `scripts/validate-founder-test-reality-sweep.ts` lagged behind Phase 24A live-preview and verification type model updates.
- Stale enum literals and legacy assessment fields remained after canonical types tightened evidence ladders.

## Stale Fields / Enums Found

| Location | Stale value | Canonical replacement |
| -------- | ----------- | --------------------- |
| `portfolioSubscores` | `buildToPreview` | `builderIntegration` |
| `analyzers.runtimeEvidence` | `RUNTIME_MISSING` | `RUNTIME_CLAIMED` (blocked fixture) |
| `analyzers.previewUsability` | `PREVIEW_UNUSABLE` | `PREVIEW_UNPROVEN` |
| `analyzers` | `previewEvidence`, `founderBottleneck` | removed — not in `LivePreviewAnalyzerResults` |
| `founderBottleneck` / report | `PREVIEW_NOT_USABLE` | `PREVIEW` |
| `legacyAssessment` | `connectivity`, `contentRendered`, `buildToPreview`, `runtimeEvidence`, `founderViewability`, `previewRealityScore`, `previewRealityPass`, `insufficientInfo*` | `loadReality`, `freshness`, `validationReady`, `validationReadyReason`, `falsePositiveReadiness` |
| `report` | `previewStatus` | removed — not in `LivePreviewReport` |
| verification status / inventory | `VERIFICATION_PARTIAL` | `VERIFICATION_CLAIMED` (blocked fixture) |

## Validation Results

- Founder test reality sweep: 44/44 checks passed
- Command center UI wiring: run separately via `npm run validate:command-center-ui-wiring-founder-report-delivery`

## Scoring / Verdict Confirmation

- No changes to founder-test scoring modules.
- No changes to founder-test verdict logic or launch verdict computation.
- Fixture alignment only — all scenario assertions preserved.

---

Pass token: FOUNDER_TEST_REALITY_SWEEP_TYPE_DRIFT_REPAIR_V1_PASS
