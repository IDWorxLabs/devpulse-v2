# Live Execution Proof Generation Audit

**Phase:** 25.35 — Live Execution Proof Generation Audit (diagnostic only)  
**Pass token:** `LIVE_EXECUTION_PROOF_GENERATION_AUDIT_PASS`  
**Prior phase:** 25.34 fixed propagation — `executionConnected` is no longer hardcoded false when proof exists.

## Executive conclusion

**The live runtime path fails because `buildRuntimeFounderExecutionProofInput` (`src/founder-test-integration/founder-execution-connected-resolver.ts`) returns only `{ rootDir }`, and `/api/founder-test/run` never invokes the connected execution chain (Phases 25.26–25.30) that produces the assessments Founder Execution Proof requires.**

Propagation (25.34) works correctly: when injected connected assessments prove the chain, Requirement Reality rises from 39 → 84 and `executionConnected` resolves true. Live orchestration at 55/100 (BLOCKED) is not a propagation regression — it is **missing runtime evidence generation**, not missing wiring.

---

## SECTION 1 — Current Runtime Path

### Founder-triggered flow

```
UI: runFounderTest()  [public/founder-reality/app.js]
  → runFounderTestLiveChecks() + runFounderTestInteractionChecks()
  → POST /api/founder-test/run  { liveResults, liveSection }
       │
       ├─ executeFounderTestLaunchReadinessOrchestration()     [server/founder-testing-handler.ts]
       │    → buildRuntimeFounderExecutionProofInput(ROOT_DIR)  → { rootDir } ONLY
       │    → buildFounderTestLaunchReadinessArtifacts()
       │         → runFounderTestLaunchReadiness()
       │              → assessFounderTestIntegration({ rootDir, founderExecutionProofInput })
       │                   ① assessFounderExecutionProof(proofInput)     ← NO connected assessments
       │                   ② resolveFounderExecutionConnected(proof)     → executionConnected=false
       │                   ③ runFounderTestIntegration(resolvedExecutionConnected=false)
       │                        → Requirement/Preview/Verification/Founder Reality (foundation scores)
       │                   ④ assessFounderExecutionProof(with founderTestAssessment) → summary
       │              → assessFounderAcceptanceGate, Launch Council, verdict
       │
       └─ executeUnifiedFounderTestV5()                          [parallel path — NOT fed to proof input]
            → runFounderTestingModeV5({ liveResults, ... })
            → buildProductWorkspaceSnapshot() → resolveExecutionConnectedForRoot(rootDir)
            → change intelligence, action center, sensemaking
```

### Proof-specific sub-chain (live)

| Step | Module | Function | Live input |
|------|--------|----------|------------|
| 1 | `founder-execution-connected-resolver.ts` | `buildRuntimeFounderExecutionProofInput` | `{ rootDir }` only |
| 2 | `founder-execution-proof-authority.ts` | `assessFounderExecutionProof` | No connected assessments |
| 3 | `execution-proof-aggregator.ts` | `aggregateFounderExecutionProofBundle` | All stage inputs null |
| 4 | `execution-proof-aggregator.ts` | `extract*Evidence` × 5 | Each → `INSUFFICIENT_EVIDENCE` |
| 5 | `execution-proof-aggregator.ts` | `buildQuestionAnswers` | `founderExecutionProven=false` |
| 6 | `founder-execution-connected-resolver.ts` | `resolveFounderExecutionConnected` | `source: not-proven` |
| 7 | `founder-test-integration-orchestrator.ts` | `executeParticipatingAuthorities` | `executionConnected=false` |
| 8 | `founder-test-launch-readiness-authority.ts` | `deriveLaunchReadinessVerdict` | BLOCKED (critical blockers) |

**Ordering (25.34):** Correct — proof is assessed before authorities. Failure is **empty proof input**, not ordering.

**UI `liveResults`:** Passed to V5 orchestration only. Not passed to `founderExecutionProofInput` or connected execution authorities.

---

## SECTION 2 — Evidence Requirements

Founder Execution Proof (25.31) derives stage proof from **connected execution assessment contracts** in `execution-proof-aggregator.ts`:

| Stage | Required assessment | Proven when |
|-------|---------------------|-------------|
| **Workspace** | `ConnectedWorkspaceCreationAssessment` | `workspaceCreationProven=true`, `realFileMutationPerformed=true`, `filesystemEvidence.creationSuccessful=true`, state `WORKSPACE_CREATED*` |
| **Build** | Build contract on runtime input snapshot | `realBuildPerformed=true` AND `buildSuccessful=true` |
| **Runtime** | `ConnectedRuntimeExecutionAssessment` | `runtimeActivationProven=true`, `realRuntimeLaunchPerformed=true`, `startupSucceeded=true`, state `RUNTIME_ACTIVATED*` |
| **Preview** | `ConnectedLivePreviewExecutionAssessment` | `previewActivationProven=true`, `realPreviewLaunchPerformed=true`, `previewEndpointAvailable=true`, state `PREVIEW_ACTIVATED*` |
| **Verification** | `ConnectedVerificationExecutionAssessment` | `realVerificationExecutionPerformed=true`, `verificationSucceeded=true`, state `VERIFICATION_EXECUTED*` |

**Aggregate conditions:**

- `founderExecutionProven=true` — all five stages proven AND `executionChainConnected=true` (`buildQuestionAnswers`)
- `executionConnected=true` (25.34 resolver) — bounded 25.31 proven + no critical blockers

**Missing-authority detection** (`aggregateFounderExecutionProofBundle` lines 642–649): if assessments absent, records `connected-workspace-creation`, `connected-build-execution`, `connected-runtime-execution`, `connected-live-preview-execution`, `connected-verification-execution`.

---

## SECTION 3 — Runtime Reality

Measured via live diagnostic (same path as `assessFounderTestIntegration({ rootDir, founderExecutionProofInput: buildRuntimeFounderExecutionProofInput(rootDir) })`):

| Evidence requirement | PASS / FAIL / UNKNOWN | Live runtime value |
|---------------------|----------------------|-------------------|
| Workspace creation assessment | **FAIL** | `null` → "No workspace creation assessment consumed" |
| Build execution contract | **FAIL** | `null` → "No connected build execution contract consumed" |
| Runtime activation assessment | **FAIL** | `null` → "No runtime execution assessment consumed" |
| Preview activation assessment | **FAIL** | `null` → "No live preview execution assessment consumed" |
| Verification execution assessment | **FAIL** | `null` → "No verification execution assessment consumed" |
| Execution chain assessment (optional) | **FAIL** | `null` — chain derived from stages; 0/5 proven |
| `founderExecutionProven` | **FAIL** | `false` |
| `executionChainConnected` | **FAIL** | `false` |
| `executionConnected` (resolver) | **FAIL** | `false` (`source: not-proven`) |
| Proof summary produced | **PASS** | Yes — `INSUFFICIENT_EVIDENCE` state, ~0% stage percents |
| Propagation to authorities | **PASS** | Works — receives `resolvedExecutionConnected=false` honestly |
| Connected execution history (in-process) | **FAIL** | All history sizes `0` on fresh process |
| UI liveResults → proof input | **FAIL** | Not wired |
| V5 results → proof input | **FAIL** | Not wired |

---

## SECTION 4 — First Failure Point

**First failure:** `extractWorkspaceEvidence(null)` in `src/founder-execution-proof/execution-proof-aggregator.ts` (line ~94).

**Immediate cause:** `buildRuntimeFounderExecutionProofInput` in `src/founder-test-integration/founder-execution-connected-resolver.ts` returns `{ rootDir }` without `connectedWorkspaceCreationAssessment` or any downstream connected assessments.

**Upstream cause:** `/api/founder-test/run` orchestration in `server/founder-testing-handler.ts` never calls:

- `assessConnectedWorkspaceCreation`
- connected build execution
- `assessConnectedRuntimeExecution`
- `assessConnectedLivePreviewExecution`
- `assessConnectedVerificationExecution`

The founder test button runs **read-only portfolio assessment**, not the connected execution chain validators use.

---

## SECTION 5 — Why Validators Pass

`scripts/validate-founder-execution-proof.ts` and `scripts/validate-founder-execution-proof-propagation.ts`:

1. **Execute** the connected chain via `buildVerificationScenario()` → workspace → preview → runtime → verification (async, real or bounded fixtures).
2. **Inject** full assessments into `founderExecutionProofInput`:
   - `connectedWorkspaceCreationAssessment`
   - `connectedRuntimeExecutionAssessment`
   - `connectedLivePreviewExecutionAssessment`
   - `connectedVerificationExecutionAssessment`
   - optional `endToEndExecutionProofAssessment`, `founderTestExecutionChainAssessment`
3. **Pass** to `assessFounderTestIntegration({ founderExecutionProofInput })`.
4. Aggregator receives non-null contracts → all stages `proven=true` → `founderExecutionProven=true` → resolver `executionConnected=true` → Requirement Reality 84.

Validators **manufacture the evidence** the live path never generates.

---

## SECTION 6 — Why Live Runtime Blocks

Live orchestration **55/100 (BLOCKED)** is expected given current architecture:

1. **No connected execution assessments** → all proof stages fail → `executionConnected=false`.
2. **Requirement Reality** stays at foundation score (~39) — execution disconnected blockers remain.
3. **Founder Reality** upstream bundle capped (`builderExecutionConnected=false`) — workflow score ceiling ~46.
4. **Other authorities** (UI, mobile, simulation, preview leaf inputs, verification leaf inputs) contribute real blockers on top.
5. **Founder acceptance / launch council** add additional BLOCKED signals.
6. **`deriveFounderTestVerdict`** → `BLOCKED` when `criticalBlockerCount > 0`.
7. **Launch Readiness** → `BLOCKED` when founder test verdict is BLOCKED.

This is **honest bounded behavior** — the system correctly reports it cannot prove founder execution without connected execution evidence. The problem is not that proof is discarded or ordering is wrong; **proof input is never populated**.

### What is NOT the cause

| Ruled out | Evidence |
|-----------|----------|
| Propagation regression (25.34) | Injected proof raises Requirement Reality 39→84 |
| Hardcoded `executionConnected: false` | Removed in 25.34; resolver used |
| Proof authority never reached | Live path calls `assessFounderExecutionProof` twice |
| Proof generated then discarded | Summary attached to assessment; `source: not-proven` not missing |
| Optimistic pass logic missing | By design — would violate bounded honesty |

---

## SECTION 7 — Recommended Fix

**Smallest possible fix (no new authorities, no duplicate execution systems):**

Extend `buildRuntimeFounderExecutionProofInput` in `founder-execution-connected-resolver.ts` to **hydrate** `AssessFounderExecutionProofInput` from existing in-process connected execution state when available:

1. If connected execution history/registries contain recent full assessments from a prior connected run in the same server session, pass them into proof input (may require storing full `Connected*Assessment` objects alongside history entries — history currently stores metadata only).
2. If no prior connected run exists in-process, return `{ rootDir }` and fail honestly (current behavior).

**Optional second step (still minimal):** In `executeFounderTestLaunchReadinessOrchestration`, when controlled builder sessions with completed evidence exist (`isControlledBuilderExecutionConnected()` or session registry), invoke existing `assessConnected*` read-only re-assessment using session context — **reuse 25.26–25.30 authorities**, do not create new ones.

**Do not:** Add optimistic pass logic, fake stage contracts, or UI-only execution flags.

**Expected outcome after fix:** Founder test run after a successful connected build session in the same process would populate proof input → `founderExecutionProven=true` → propagation raises Requirement Reality → live score improves proportionally to real evidence.

---

## Validation

```bash
npm run validate:live-execution-proof-generation
```

Pass token: `LIVE_EXECUTION_PROOF_GENERATION_AUDIT_PASS`

Verifies:

- Proof authority reached on live path
- Runtime proof input builder executes (rootDir-only)
- Proof summary and resolver output produced
- Launch readiness receives integration with resolved proof
- Exact first failure stage and reason identified
- Validator vs live path contrast documented in assertions

---

## Appendix — Key files

| Role | Path |
|------|------|
| API entry | `server/founder-testing-handler.ts` |
| Runtime proof input (gap) | `src/founder-test-integration/founder-execution-connected-resolver.ts` |
| Proof aggregation | `src/founder-execution-proof/execution-proof-aggregator.ts` |
| Resolver | `src/founder-test-integration/founder-execution-connected-resolver.ts` |
| Integration ordering | `src/founder-test-integration/founder-test-integration-authority.ts` |
| Validator reference chain | `scripts/validate-founder-execution-proof.ts` |
