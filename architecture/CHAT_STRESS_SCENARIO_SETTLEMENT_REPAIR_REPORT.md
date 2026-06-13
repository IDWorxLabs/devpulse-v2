# Chat Stress Scenario Settlement Repair Report

## Root Cause

- cap-05 could remain pending when the provider promise never resolved and the worker pool continued with later scenarios.
- Promise.race timeout alone did not guarantee tracker settlement independent of the hung worker await.

## CAP-05 HARD SETTLEMENT ESCALATION

### Root Cause

- cap-05 started but hung inside LLM provider; cap-06 settled on another worker while cap-05 had no terminal event.

### Watchdog Behavior

- Hard watchdog timer registers immediately on scenario start.
- Fires TIMEOUT without waiting for provider promise; emits `Chat stress scenario timeout: cap-05`.
- Batch finalizer runs `BATCH_FINALIZER_TIMEOUT` for any remaining pending scenarios.

## CHAT STRESS WATCHDOG RUNTIME FIRING REPAIR

### Root Cause

- Watchdog timer existed but could be starved or cleared when another worker cleared activeScenarioId.
- Stage 2 flagged STALLED at ~14s before the 15s hard timeout could fire.

### Runtime Firing Fix

- 500ms health sweep calls `reconcileChatStressWatchdogHealth` independent of provider/worker await.
- Traces: `Chat stress watchdog armed: cap-05` then `Chat stress watchdog timeout fired: cap-05`.
- Snapshot exposes armed/deadline/overdue scenario IDs; orphan pending overdue force-settles from health path.
- Stage 2 pending stall waits until hard timeout + 2s grace or watchdog overdue.

### Idempotent Settlement Proof

- `tryMarkChatStressScenarioSettled` rejects late PASSED after TIMEOUT.
- Duplicate provider results emit debug-only duplicate ignored trace.

### Validation Proof

- Validator checks: 59

## Timeout Behavior

- Soft warning at 8s; hard watchdog at 15s (configurable in tests).
- Founder report includes `CHAT_STRESS_SCENARIO_TIMEOUT: cap-05` when applicable.

## Remaining Risks

- Hung provider promises still consume memory until GC; abort wiring remains future work.

---

Pass tokens: CHAT_STRESS_SCENARIO_SETTLEMENT_REPAIR_V1_PASS / CAP_05_HARD_SETTLEMENT_ESCALATION_V1_PASS / CHAT_STRESS_WATCHDOG_RUNTIME_FIRING_REPAIR_V1_PASS
