# Chat Stress Hard Deadline and Stall Threshold Alignment Report

**Phase:** 26.88 — Chat Stress Hard Deadline and Stall Threshold Alignment V1  
**Success token:** `CHAT_STRESS_DEADLINE_STALL_ALIGNMENT_V1_PASS`

## Root cause

Phase 26.87 fixed false idle-with-pending during concurrent execution. The remaining Founder Test failure was **timing alignment**: Stage 2 and artifact sub-step stall detectors fired `STALLED` at **45 seconds** while the final chat stress wave (e.g. `cap-05`, `cap-06`) was still active and within the **15s per-scenario hard watchdog**.

Worst-case bounded batch window for founder-test defaults:

```
ceil(12 / 4) * (15_000ms + 2_000ms grace) + 5_000ms overhead = 56_000ms
```

Generic stall thresholds (`STALL_STALLED_THRESHOLD_MS`, `SIMULATION_STALLED_THRESHOLD_MS`) were **45_000ms** — **earlier** than the worst-case batch deadline.

## Timing constants (traced)

| Constant | Value | Module |
|----------|------:|--------|
| `CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS` | 15_000 | `product-readiness-simulation-budget.ts` |
| `CHAT_STRESS_SCENARIO_HARD_TIMEOUT_GRACE_MS` | 2_000 | `product-readiness-simulation-budget.ts` |
| `CHAT_STRESS_BATCH_DEADLINE_OVERHEAD_MS` | 5_000 | `product-readiness-simulation-budget.ts` |
| `CHAT_STRESS_WORST_CASE_BATCH_DEADLINE_MS` | 56_000 | derived (12 scenarios, concurrency 4) |
| `SIMULATION_BUDGET_MS` | 60_000 | product readiness / chat stress budget |
| `SIMULATION_STALLED_THRESHOLD_MS` | 45_000 | simulation budget (chat stress now overrides) |
| `STALL_STALLED_THRESHOLD_MS` | 45_000 | runtime monitor (intake uses batch deadline min) |
| `STALL_SLOW_THRESHOLD_MS` | 15_000 | runtime monitor |
| `INTAKE_VALIDATION` `STAGE_TIMEOUT_MS` | 120_000 | stage wall-clock |
| `FOUNDER_TEST_RESULT_FETCH_TIMEOUT_MS` | 3_000 | client result fetch |
| Artifact sub-step stall | 45_000 default; **56_000** for chat stress ops | artifact build tracer |

## Before / after stall model

### Before

- Single global 45s stall threshold applied during entire product-readiness + chat stress sub-step.
- Active scenarios (`cap-06` running) could coexist with `STALLED` health at 45s elapsed.
- No batch deadline finalizer; pending scenarios relied on worker/finalizer at batch end only.

### After

- `resolveChatStressWorstCaseBatchDeadlineMs()` drives minimum stall threshold for intake validation and chat stress artifact substeps.
- **Active scenario grace:** `pendingCount > 0 && activeScenarioCount > 0` → `SLOW` until active watchdog deadline expires.
- **Batch deadline finalizer:** when `batchDeadlineMs` exceeded, all pending scenarios force-settle as `TIMEOUT`; `pendingCount → 0`.
- Runtime snapshot exposes deadline visibility fields.

## Functions changed

| File | Function | Change |
|------|----------|--------|
| `product-readiness-simulation-budget.ts` | `resolveChatStressWorstCaseBatchDeadlineMs`, `resolveChatStressSimulationStalledThresholdMs` | Worst-case deadline math |
| `chat-stress-completion-tracker.ts` | `beginChatStressBatchDeadline`, `reconcileChatStressBatchDeadlineFinalizer`, `resolveChatStressStallHealth`, `shouldFlagChatStressPendingStage2Gap` | Batch tracking, finalizer, grace |
| `chat-response-simulator.ts` | `simulateChatStressBatch` | Registers batch deadline at start |
| `chat-stress-authority.ts` | `runFounderTestChatStressSimulation` | Aligned simulation stalled threshold |
| `runtime-stall-detector.ts` | `analyzeRuntimeStall` | Intake chat stress grace + min stalled threshold |
| `launch-readiness-artifact-build-tracer.ts` | `analyzeArtifactBuildSubstepStall` | Chat stress ops use batch deadline |
| `stage2-completion-tracker.ts` | `resolveChatStressRuntimeFields`, gap analysis | Deadline snapshot fields + grace |
| `founder-test-runtime-monitor.ts` | snapshot build | Passes chat stress context to stall detector |

## Runtime snapshot fields (new)

- `chatStressActiveScenarioIds`
- `chatStressActiveScenarioCount`
- `chatStressOldestPendingElapsedMs`
- `chatStressNextScenarioDeadlineMs`
- `chatStressMsUntilNextDeadline`
- `chatStressBatchDeadlineMs`
- `chatStressMsUntilBatchDeadline`

## Safety guarantees

- No scoring changes
- No scenario count reduction (12 preserved)
- No chat stress bypass
- No auto-pass for failed scenarios
- No timeout suppression (watchdog + batch finalizer still force TIMEOUT)
- No verdict logic changes

## Validation

```bash
npm run validate:chat-stress-deadline-stall-alignment
```

Expected output: `CHAT_STRESS_DEADLINE_STALL_ALIGNMENT_V1_PASS`
