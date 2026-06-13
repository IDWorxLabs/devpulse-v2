# Runtime Founder Execution Proof Hydration Report

**Phase:** 25.36 — Hydrate Runtime Founder Execution Proof Input  
**Pass token:** `RUNTIME_FOUNDER_EXECUTION_PROOF_HYDRATION_PASS`  
**Prior phase:** 25.35 identified live runtime blocking because `buildRuntimeFounderExecutionProofInput` returned `{ rootDir }` only.

## Root cause

Founder Execution Proof (25.31) requires full **connected execution assessment objects** from phases 25.26–25.30. History modules stored metadata only — not reusable assessment objects. The API path never ran the connected chain, so live founder test always hit `extractWorkspaceEvidence(null)` → `"No workspace creation assessment consumed"`.

## Files changed

| File | Change |
|------|--------|
| `src/connected-workspace-creation/connected-workspace-creation-history.ts` | Bounded full assessment store + `getLatestConnectedWorkspaceCreationAssessment()` |
| `src/connected-runtime-execution/connected-runtime-execution-history.ts` | Same pattern |
| `src/connected-live-preview-execution/connected-live-preview-execution-history.ts` | Same pattern |
| `src/connected-verification-execution/connected-verification-execution-history.ts` | Same pattern |
| `src/founder-test-integration/runtime-founder-execution-proof-hydration.ts` | **NEW** — `hydrateRuntimeFounderExecutionProofInput` |
| `src/founder-test-integration/founder-execution-connected-resolver.ts` | Sync/async builders use hydration |
| `src/founder-test-integration/index.ts` | Export hydration API |
| `src/founder-test-launch-readiness/founder-test-launch-readiness-types.ts` | Hydration fields on report/input |
| `src/founder-test-launch-readiness/founder-test-launch-readiness-authority.ts` | Hydration summary in report |
| `src/founder-test-launch-readiness/founder-test-launch-readiness-report-builder.ts` | Markdown section |
| `server/founder-testing-handler.ts` | Async full hydration on `/api/founder-test/run` |
| `scripts/validate-runtime-founder-execution-proof-hydration.ts` | **NEW** validator |
| `scripts/validate-live-execution-proof-generation.ts` | Updated for hydration behavior |
| `package.json` | `validate:runtime-founder-execution-proof-hydration` script |

## Hydration sources

### Priority A — `session-assessments`

When `recordConnected*Assessment()` has stored full in-process assessment objects (max 16 each), hydration reads:

1. Latest verification assessment (preferred — embeds full chain in `inputSnapshot`)
2. Else latest preview → runtime → workspace

### Priority B — `bounded-reassessment`

When controlled builder has **COMPLETED** session + substantive evidence (`SESSION_COMPLETED`, `FILE_CREATED`, `OUTPUT_GENERATED`), re-runs existing `assessConnectedVerificationExecution({ performRealVerification: false })` dry-run chain. Attaches real assessment objects — stages remain unproven unless contracts satisfy 25.31 thresholds.

### Priority C — `insufficient-evidence`

Returns `{ rootDir }` with `hydrated: false` and full missing-authority list.

## Proof rules (unchanged)

- No pass tokens, history scores, or report text used as proof
- Stage proven status derived via existing `extract*Evidence` from 25.31 aggregator
- Partial hydration does **not** set `founderExecutionProven=true`
- `executionConnected=true` only when bounded full chain proven (25.34 resolver)

## Failure behavior

| Condition | Hydration | Founder Execution Proof | executionConnected |
|-----------|-----------|---------------------------|-------------------|
| No in-process assessments | `insufficient-evidence` | All stages INSUFFICIENT_EVIDENCE | false |
| Partial (e.g. workspace only) | `session-assessments` | Blocked — missing stages | false |
| Full proven chain in store | `session-assessments` | `founderExecutionProven=true` | true |
| Controlled builder evidence, dry reassessment | `bounded-reassessment` | Objects attached; likely still blocked | false unless contracts proven |

Launch readiness verdict remains independent — hydration does not force LAUNCH_READY.

## Validation result

```bash
npm run validate:runtime-founder-execution-proof-hydration
npm run validate:live-execution-proof-generation
npm run validate:founder-execution-proof-propagation
npm run validate:founder-test-launch-readiness
```

Expected pass token: `RUNTIME_FOUNDER_EXECUTION_PROOF_HYDRATION_PASS`

## Remaining limitations

- Assessment stores are **in-process only** — server restart clears hydration Priority A
- Founder test button does not run connected execution chain; assessments appear only after prior connected runs in same process or Priority B dry reassessment
- Priority B dry-run attaches assessment objects but rarely proves all five stages without real execution + acceptance fixtures
- Sync hydration path (product snapshot, sync launch readiness) uses Priority A only — Priority B requires async API path
- Live score may remain BLOCKED for reasons beyond execution proof (acceptance, simulation, UI, etc.)

## Recommended next step (future phase)

Wire controlled builder session completion to run bounded `performReal*` connected chain when governance/acceptance preconditions are met — still using 25.26–25.30 authorities, storing assessments via existing `recordConnected*Assessment`.
