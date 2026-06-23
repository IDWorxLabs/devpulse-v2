# Chat Stress Concurrent Active Worker Tracking Repair Report

**Phase:** 26.87 — Chat Stress Concurrent Active Worker Tracking Repair V1  
**Success token:** `CHAT_STRESS_CONCURRENT_ACTIVE_WORKER_TRACKING_REPAIR_V1_PASS`

## Root cause

`simulateChatStressBatch()` runs up to four concurrent workers, but completion tracking used a single global `activeScenarioId`. When any watchdog fired, `forceWatchdogTimeout()` called `setActiveChatStressScenario(null)`, clearing the only active slot while other worker promises remained in-flight.

`reconcileChatStressRunnerIdleWithPending()` then observed `pendingCount > 0` and `activeScenarioId === null` and emitted false `CHAT_STRESS_RUNNER_IDLE_WITH_PENDING` events during normal concurrent execution.

See also: `architecture/CHAT_STRESS_RUNNER_IDLE_WITH_PENDING_ROOT_CAUSE_REPORT.md`.

## Before / after active tracking model

### Before

| Concept | Implementation |
|---------|----------------|
| Active worker | Single `activeScenarioId: string \| null` |
| Worker start | Overwrites previous active ID |
| Watchdog timeout | `setActiveChatStressScenario(null)` — global clear |
| Pending without worker | `activeScenarioId == null \|\| id !== activeScenarioId` |
| Idle detection | `activeScenarioId === null` |

### After

| Concept | Implementation |
|---------|----------------|
| Active workers | `activeScenarioIds: Set<string>` |
| Active count | `activeScenarioCount` in snapshot |
| Worker start | `addActiveChatStressScenario(id)` — no overwrite |
| Settlement / timeout | `removeActiveChatStressScenario(id)` — per scenario |
| Compatibility | `activeScenarioId` = last active scenario ID (display only) |
| Pending without worker | `pendingScenarioIds.filter(id => !activeScenarioIds.has(id))` |
| Idle detection | `activeScenarioCount === 0 && !aggregateComplete && pendingWithoutActiveWorker.length > 0` |

## Exact functions changed

| File | Function | Change |
|------|----------|--------|
| `chat-stress-completion-tracker.ts` | `addActiveChatStressScenario`, `removeActiveChatStressScenario`, `getActiveChatStressScenarioCount` | New concurrent active set API |
| `chat-stress-completion-tracker.ts` | `markChatStressScenarioStarted`, `recordTerminalStatus`, `buildChatStressCompletionSnapshot` | Use set-based tracking |
| `chat-response-simulator.ts` | `forceWatchdogTimeout`, `runOneScenario` | Per-scenario remove; no global clear |
| `live-chat-stress-runner-path.ts` | `reconcileChatStressRunnerIdleWithPending` | Guard on `activeScenarioCount === 0` |
| `chat-stress-settlement-boundary.ts` | `detectChatStressPendingLeak` | Use `activeScenarioCount > 0` |
| `chat-stress-authority.ts` | idle handler | Include `activeScenarioCount` in trace JSON |

## Why false idle detection is fixed

When four workers run `identity-01` … `identity-04`:

1. Each worker adds its scenario to `activeScenarioIds` (count = 4).
2. Watchdog fires on `identity-01` → only `identity-01` removed (count = 3).
3. `reconcileChatStressRunnerIdleWithPending()` sees `activeScenarioCount > 0` → **no idle event**.
4. Idle fires only when **zero** scenarios are actively tracked and pending scenarios have no assigned worker.

## Runtime diagnostics

Snapshot now exposes:

- `activeScenarioIds: readonly string[]`
- `activeScenarioCount: number`

Idle trace payload includes `activeScenarioCount` and `activeScenarioIds` for operator feed observability.

## Safety guarantees

- No scoring changes
- No scenario count reduction (12 preserved)
- No chat stress bypass
- No auto-pass for failed scenarios
- No timeout suppression
- No verdict logic changes
- Stage 2 completion tracking unchanged (still uses compatibility `activeScenarioId` for display)

## Validation

```bash
npm run validate:chat-stress-concurrent-active-worker-tracking
```

Expected output: `CHAT_STRESS_CONCURRENT_ACTIVE_WORKER_TRACKING_REPAIR_V1_PASS`
