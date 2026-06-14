# Live Chat Stress Runner Path Alignment Repair Report

Phase 26.81 — `LIVE_CHAT_STRESS_RUNNER_PATH_ALIGNMENT_V1_PASS`

## Root Cause

Live Founder Test showed `started=4`, `settled=2`, `pending=10`, `activeScenario=n/a`, and runtime feed stuck on “Running bounded chat stress inside product readiness” with no per-scenario settlement markers.

Two issues:

### 1. Live feed propagation blocked (Phase 26.80 regression)

`skipsRuntimeTracePropagation` delegated to `skipsArtifactSubstepMutation`, which listed `chat-stress-scenario-settled:*`, `chat-stress-pending-count-updated`, and related markers as **skip**. Settlement traces reached the chat stress authority but never reached the runtime monitor feed during live runs.

### 2. Idle runner with pending scenarios

When all workers release `activeScenarioId` but scenarios remain pending (slow LLM, hung await, or orphan started state), no reconciliation fired until batch end. Stage 2 saw tracker settlement lag and missing completion boundary.

## Live Call Path (verified)

```
runFounderTestingModeV4
  → executeFounderTestLaunchReadinessOrchestration (founder-testing-handler)
    → buildFounderTestLaunchReadinessArtifactsAsync
      → runFullProductReadinessSimulation
        → runFounderTestChatStressSimulation (founderTestContext: true)
          → simulateChatStressBatch
            → simulateChatStressResponse + registerChatStressScenarioHardWatchdog
            → tryMarkChatStressScenarioSettled / forceSettlePendingStartedChatStressScenarios
            → buildChatStressSettlementSummary / isChatStressSimulationComplete
            → chat-stress-completion-propagation registry
```

## Repair

| Component | Change |
| --- | --- |
| `live-chat-stress-runner-path.ts` | Live path marker, idle-with-pending reconciliation, feed propagation allowlist |
| `launch-readiness-artifact-build-tracer.ts` | `shouldPropagateLiveChatStressRuntimeFeed` — settlement markers reach runtime feed |
| `chat-stress-authority.ts` | Emits `live-chat-stress-runner-path:repaired-settlement-v1`; registers idle handler + health reconciler |
| `chat-stress-completion-tracker.ts` | Post-watchdog health reconciler hook for live idle settlement |
| `runtime-trace-registry.ts` | Pin live path + idle-with-pending operation IDs |

## Live Path Marker

When repaired founder-test path is active:

`live-chat-stress-runner-path:repaired-settlement-v1`

## Idle With Pending

When `activeScenarioId === null` and `pendingCount > 0`:

- Emit `CHAT_STRESS_RUNNER_IDLE_WITH_PENDING`
- Call `forceSettlePendingStartedChatStressScenarios`
- Update pending count and completion evaluation

## Runtime Feed (live)

Now propagates:

- Live path marker
- `chat-stress-scenario-settled:{id}`
- `chat-stress-scenario-timed-out-settled:{id}`
- `chat-stress-pending-count-updated`
- `chat-stress-completion-condition-satisfied`
- Completion chain boundaries (pinned)

## Before / After

### Before

- Feed: only “Running bounded chat stress inside product readiness”
- Tracker: partial settlement visible, no completion boundary
- Stage 2: SLOW stall, missing chat stress simulation complete

### After

- Feed: live path marker + per-scenario settlement + pending count updates
- Idle-with-pending forces overdue settlement when no active worker
- All 12 scenarios settle with hard deadlines
- Completion chain propagates to product readiness → intake → planning gate

## Constraints Preserved

- No scoring changes
- No scenario count reduction (12)
- No chat stress bypass
- No auto-pass failures
- No verdict logic changes

## Success Token

`LIVE_CHAT_STRESS_RUNNER_PATH_ALIGNMENT_V1_PASS`
