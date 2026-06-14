# Chat Stress Settlement and Completion Boundary Repair Report

Phase 26.79 — `CHAT_STRESS_SETTLEMENT_BOUNDARY_REPAIR_V1_PASS`

## Root Cause

Founder Test stalled at Stage 2 (Intake Validation) during bounded chat stress because scenario settlement was incomplete after timeouts:

- Identity scenarios (`identity-01` … `identity-06`) fired watchdog timeouts correctly.
- Capability scenarios (`cap-01` … `cap-06`) remained **pending** in the tracker even though no worker was active.
- `forceSettlePendingStartedChatStressScenarios` and `reconcileChatStressWatchdogHealth` recorded orphaned started scenarios in diagnostic arrays but **did not call** `tryMarkChatStressScenarioSettled(..., 'TIMEOUT')` when no watchdog record existed.
- Without terminal settlement, `pendingCount` never reached zero, so `chat-stress-simulation-complete` and `product-readiness-simulation-complete` never emitted as PASSED boundaries.
- Stage 2 completion tracker treated the run as permanently stalled waiting on pending chat stress scenarios.

## Lifecycle Model

Every chat stress scenario follows:

```
PENDING → RUNNING → SETTLED
```

Terminal results (scoring only — not completion blockers):

- `PASSED`
- `FAILED`
- `TIMEOUT`
- `SKIPPED_BUDGET` / `SKIPPED_WITH_REASON` / `ERROR`

All outcomes must reach **SETTLED**. No scenario may remain permanently pending.

## Timeout Handling

When a per-scenario hard watchdog fires or a batch finalizer runs:

1. Scenario state becomes `TIMEOUT` (or `SKIPPED_BUDGET` if never started).
2. Scenario is marked **SETTLED** in the completion tracker.
3. `pendingCount` decreases.
4. Settlement summary and completion evaluation run.

Orphan started scenarios without watchdog records are now force-settled via `tryMarkChatStressScenarioSettled(scenarioId, 'TIMEOUT')` in both the health reconcile path and the batch finalizer.

## Settlement Model

`ChatStressSettlementSummary` aggregates:

| Field | Meaning |
| --- | --- |
| `totalScenarios` | Registered scenario count (unchanged) |
| `startedCount` | Scenarios that entered RUNNING |
| `settledCount` | Scenarios with terminal settlement |
| `passedCount` / `failedCount` / `timedOutCount` | Terminal status tallies |
| `pendingCount` | Scenarios not yet SETTLED |
| `completionBoundaryReached` | All scenarios settled, pending = 0 |
| `generatedAt` | ISO timestamp |

Failed and timed-out scenarios affect **scoring** only. They do not block completion.

## Completion Boundary

`ChatStressSimulationComplete` (`isChatStressSimulationComplete`) emits when:

- `pendingCount === 0`
- Every registered scenario is SETTLED

The `chat-stress-simulation-complete` trace emits with phase **PASSED** when the boundary is reached, regardless of pass/fail mix. Partial/degraded outcomes remain disclosed via separate budget/partial traces and report fields.

Product readiness continues when `completionBoundaryReached === true`, emitting `product-readiness-simulation-complete` as PASSED so Intake Validation can advance to Planning Gate.

## Leak Detection

`detectChatStressPendingLeak()` emits `CHAT_STRESS_PENDING_LEAK` when:

- `pendingCount > 0`, and
- No active running scenario exists

Payload includes `pendingScenarioIds`, `lastStateByScenarioId`, and `lastUpdateTimeByScenarioId`.

## Runtime Feed Visibility

New feed/trace events:

- `chat-stress-scenario-settled:{id}` — Scenario settled
- `chat-stress-scenario-timed-out-settled:{id}` — Scenario timed out and settled
- `chat-stress-pending-count-updated` — Pending count updated
- `chat-stress-simulation-complete` — Chat stress simulation complete (PASSED boundary)
- `product-readiness-simulation-complete` — Product readiness simulation complete (PASSED boundary)

## Files Changed

| File | Change |
| --- | --- |
| `src/founder-test-chat-stress-simulation/chat-stress-completion-tracker.ts` | Force TIMEOUT settlement for orphans; lifecycle state + lastUpdateTime |
| `src/founder-test-chat-stress-simulation/chat-stress-settlement-boundary.ts` | **New** — summary, completion boundary, leak detector |
| `src/founder-test-chat-stress-simulation/chat-stress-simulation-types.ts` | `ChatStressSettlementSummary` on report |
| `src/founder-test-chat-stress-simulation/chat-stress-authority.ts` | Settlement traces, boundary guard, PASSED complete emit |
| `src/founder-test-chat-stress-simulation/index.ts` | Exports |
| `src/founder-test-product-readiness/product-readiness-orchestrator.ts` | PASSED product readiness complete after boundary |
| `src/founder-test-runtime-monitor/stage2-completion-tracker.ts` | Uses `isChatStressSimulationComplete` |
| `src/founder-test-runtime-monitor/launch-readiness-artifact-build-tracer.ts` | Skip new settlement feed events |
| `scripts/validate-chat-stress-settlement-boundary.ts` | **New** validator |
| `package.json` | Validator script registration |

## Before / After Runtime Behavior

### Before

1. Chat stress started (12 scenarios).
2. Identity scenarios timed out; capability scenarios stayed pending.
3. `activeScenarioId = n/a`, pending count > 0.
4. No completion boundary reached.
5. Product readiness never completed; Founder Test stuck at Intake Validation.

### After

1. Chat stress started (12 scenarios — count unchanged).
2. All scenarios settle (PASSED, FAILED, TIMEOUT, or SKIPPED).
3. Pending count reaches zero.
4. `chat-stress-simulation-complete` and `product-readiness-simulation-complete` emit as PASSED boundaries.
5. Founder Test advances beyond Intake Validation to Planning Gate.
6. Failed/timed-out scenarios still reduce chat stress score and may block launch readiness — scoring and verdict logic unchanged.

## Constraints Preserved

- No Founder Test scoring changes
- No scenario count reduction
- No chat stress bypass
- No auto-pass for failed scenarios
- No product readiness skip
- No launch verdict logic changes

## Success Token

`CHAT_STRESS_SETTLEMENT_BOUNDARY_REPAIR_V1_PASS`
