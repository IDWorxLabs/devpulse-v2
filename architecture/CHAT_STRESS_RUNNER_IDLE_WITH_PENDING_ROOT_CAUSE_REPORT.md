# CHAT_STRESS_RUNNER_IDLE_WITH_PENDING — Root Cause Investigation

**Scope:** Investigation only. No repair. Stage 2 completion tracking unchanged.

**Symptom:** During live Founder Test chat stress (`concurrency=4`, 12 scenarios), the runtime feed emits `CHAT_STRESS_RUNNER_IDLE_WITH_PENDING` while `pendingCount > 0` and scenarios have not all reached terminal settlement.

---

## Executive summary

`CHAT_STRESS_RUNNER_IDLE_WITH_PENDING` is **not** emitted because the batch worker pool has shut down. It is emitted because idle detection equates **“no tracked active scenario”** (`activeScenarioId === null`) with **“runner is idle.”**

The batch runner (`simulateChatStressBatch`) runs up to four concurrent workers, but the completion tracker maintains **only one global `activeScenarioId` slot**. That slot is cleared when any tracked scenario settles, when a watchdog fires, or when a worker’s `finally` block runs — even while other workers remain in-flight on different scenarios.

When `activeScenarioId` becomes `null` with unsettled scenarios still in the queue, `reconcileChatStressRunnerIdleWithPending()` treats the runner as idle and emits the event. This is a **structural observability mismatch between concurrent execution and single-slot active-worker tracking**, not evidence that all workers have exited.

---

## Emission path (exact)

| Step | File | Function | What happens |
|------|------|----------|--------------|
| 1 | `chat-stress-authority.ts` | `runFounderTestChatStressSimulation()` | Registers `reconcileChatStressRunnerIdleWithPending` as a post-watchdog health reconciler (500 ms sweep) and calls it after every `onScenarioComplete`. |
| 2 | `chat-stress-completion-tracker.ts` | `reconcileChatStressWatchdogHealth()` | Every 500 ms (and on every `getChatStressCompletionSnapshot()`), invokes registered reconcilers. |
| 3 | `live-chat-stress-runner-path.ts` | `reconcileChatStressRunnerIdleWithPending()` | Reads snapshot; if idle conditions hold, builds event and invokes handler. |
| 4 | `chat-stress-authority.ts` | idle handler callback | Emits trace `chat-stress-runner-idle-with-pending` with label `CHAT_STRESS_RUNNER_IDLE_WITH_PENDING`. |

---

## Exact idle condition

**File:** `src/founder-test-chat-stress-simulation/live-chat-stress-runner-path.ts`  
**Function:** `reconcileChatStressRunnerIdleWithPending(nowMs?)`

All three guards must pass before emission:

```typescript
const snap = getChatStressCompletionSnapshot(nowMs);

if (snap.pendingCount <= 0) return null;                          // (A)
if (snap.activeScenarioId != null) return null;                   // (B)
if (snap.pendingWithoutActiveWorkerScenarioIds.length === 0) return null;  // (C)
```

When `(B)` fails (`activeScenarioId != null`), idle is suppressed.  
When `(B)` passes (`activeScenarioId === null`) and `(A)` passes (`pendingCount > 0`), guard `(C)` is **always satisfied** because of how `pendingWithoutActiveWorkerScenarioIds` is computed (see below).

**Therefore the operative condition is:**

> `pendingCount > 0` **AND** `activeScenarioId === null`

---

## How pending fields are derived

**File:** `src/founder-test-chat-stress-simulation/chat-stress-completion-tracker.ts`  
**Function:** `buildChatStressCompletionSnapshot(nowMs)`

```typescript
const pendingScenarioIds = orderedScenarioIds.filter((id) => {
  const entry = scenarios.get(id);
  return !entry || !entry.settled;   // unsettled OR never started
});
const pendingCount = pendingScenarioIds.length;

const pendingWithoutActiveWorkerScenarioIds = pendingScenarioIds.filter(
  (id) => activeScenarioId == null || id !== activeScenarioId,
);
```

**Interpretation:**

- `pendingScenarioIds` includes both **PENDING** (never started, no map entry) and **RUNNING** (started, not settled) scenarios.
- When `activeScenarioId === null`, **every** pending scenario is classified as `pendingWithoutActiveWorkerScenarioIds`.
- There is **no concurrent worker registry** — only the single `activeScenarioId` pointer.

---

## Worker pool vs active-worker registry

### Worker allocation and shutdown

**File:** `src/founder-test-chat-stress-simulation/chat-response-simulator.ts`  
**Function:** `simulateChatStressBatch()`

```typescript
const concurrency = Math.max(1, input.concurrency ?? 4);
// ...
const workers = Array.from(
  { length: Math.min(concurrency, input.scenarios.length) },
  () => worker(),
);
await Promise.allSettled(workers);
```

**Function:** `worker()` (inner)

```typescript
while (true) {
  const index = nextIndex;
  nextIndex += 1;
  if (index >= input.scenarios.length) return;   // worker shutdown — all indices dispatched
  await runOneScenario(scenario);
}
```

Workers shut down only when their loop exhausts the shared `nextIndex` counter. **Idle-with-pending fires mid-batch**, long before all workers return.

### Active worker registry (single slot)

**File:** `chat-stress-completion-tracker.ts`

| Function | Effect on `activeScenarioId` |
|----------|------------------------------|
| `markChatStressScenarioStarted(id)` | Sets `activeScenarioId = id` (overwrites previous) |
| `setActiveChatStressScenario(id)` | Sets `activeScenarioId = id` |
| `clearActiveChatStressScenarioIfMatches(id)` | Clears only if `activeScenarioId === id` |
| `recordTerminalStatus(id, …)` inside `tryMarkChatStressScenarioSettled` | Clears if `activeScenarioId === id` |
| `setActiveChatStressScenario(null)` in `forceWatchdogTimeout` | **Unconditional global clear** |

With `concurrency=4`, four workers run in parallel, but **only the most recently started scenario ID is stored**. Completing or watchdog-firing that scenario (or a different scenario if it was the tracked one) can null the slot while three other workers remain inside `await simulateChatStressResponse(...)`.

---

## Root cause: why runner appears idle while scenarios are pending

### Primary cause — single-slot active tracking under concurrent workers

**Exact mismatch:**

- **Execution model:** up to N concurrent async workers (`simulateChatStressBatch`, default N=4).
- **Observability model:** one `activeScenarioId` boolean proxy for “is any worker active?”

**Typical runtime state when idle fires (concurrency=4, hanging LLM):**

| Field | Example value |
|-------|----------------|
| `pendingCount` | 8–11 |
| `pendingScenarioIds` | `identity-02`, `identity-03`, …, `cap-06` (mix of RUNNING + PENDING) |
| `activeScenarioId` | `null` |
| `pendingWithoutActiveWorkerScenarioIds` | same as `pendingScenarioIds` |
| Workers still alive | 2–3 inside `runOneScenario` await |
| `forcedSettlementCount` | ≥ 0 from `forceSettlePendingStartedChatStressScenarios` |

**Sequence (observed in validation traces):**

1. Workers start `identity-01` … `identity-04`; last start wins → `activeScenarioId = identity-04`.
2. Watchdog fires on `identity-01` (250 ms timeout, hanging provider).
3. `forceWatchdogTimeout(identity-01)` runs → **`setActiveChatStressScenario(null)`** unconditionally.
4. `identity-01` settles → `onScenarioComplete` → `reconcileChatStressRunnerIdleWithPending()`.
5. Snapshot: `pendingCount > 0`, `activeScenarioId === null` → **idle event emitted**.
6. Workers for `identity-02` … `identity-04` are still in-flight; `identity-05+` not yet dispatched.

### Contributing cause — unconditional active clear on watchdog

**File:** `chat-response-simulator.ts`  
**Function:** `forceWatchdogTimeout(scenario)`

```typescript
setActiveChatStressScenario(null);   // line 234 — clears global slot regardless of other workers
```

This runs from the hard watchdog `onFired` callback registered in `runOneScenario()`. Any single scenario timeout clears the global active pointer even when other concurrent workers are actively running different scenarios.

### Contributing cause — settlement clears active for tracked scenario only

**File:** `chat-stress-completion-tracker.ts`  
**Function:** `recordTerminalStatus(scenarioId, terminalStatus)`

```typescript
if (activeScenarioId === scenarioId) {
  activeScenarioId = null;
}
```

When the **currently tracked** scenario settles (often the last-started of the in-flight wave), `activeScenarioId` becomes `null` while earlier-started siblings in the same wave may still be RUNNING (started, not settled).

### Contributing cause — worker `finally` clears active if matched

**File:** `chat-response-simulator.ts`  
**Function:** `runOneScenario()` → `finally`

```typescript
clearActiveChatStressScenarioIfMatches(scenario.id);
```

Same pattern: clearing is per-scenario and keyed to the single global slot, not to a worker count.

---

## forcedSettlementCount behavior on idle

When idle is detected, `reconcileChatStressRunnerIdleWithPending()` immediately calls:

**File:** `live-chat-stress-runner-path.ts`  
**Function:** `forceSettlePendingStartedChatStressScenarios(CHAT_STRESS_RUNNER_IDLE_WITH_PENDING_KIND)`

**File:** `chat-stress-completion-tracker.ts`  
**Function:** `forceSettlePendingStartedChatStressScenarios(reason)`

For each ordered scenario ID:

| Scenario state | Action |
|----------------|--------|
| `started && !settled` | Fire watchdog if armed; else force `TIMEOUT` terminal status |
| `!settled` and never started (no entry or `started: false`) | `markChatStressScenarioSkippedBudget(id)` — counts as `(never started)` in forced list |

`forcedSettlementCount` = length of returned forced array (included in trace JSON).

**Important:** Idle reconciliation is **reactive recovery**, not the reason the runner became idle. The runner is classified idle **before** forced settlement runs; forced settlement is invoked **because** idle was detected.

---

## What idle detection is *not*

| Misconception | Actual behavior |
|---------------|-----------------|
| All workers shut down | Workers remain in `while` loop / `await` when idle fires |
| Batch finalizer ran | `forceSettlePendingStartedChatStressScenarios(CHAT_STRESS_BATCH_FINALIZER_TIMEOUT_REASON)` runs only after `Promise.allSettled(workers)` at batch end |
| No scenarios in RUNNING state | Pending list includes started-but-unsettled scenarios still inside worker promises |
| Stage 2 stall | Out of scope; idle event is chat-stress-runner observability (Phase 26.81), separate from Stage 2 boundary tracking |

---

## Observed trace correlation

From live validation runs (`HangingLlmProvider`, `concurrency=4`, `perScenarioTimeoutMs=250`):

```
chat-stress-watchdog-fired:identity-01
chat-stress-scenario-settled:identity-01
chat-stress-pending-count-updated          ← pending still > 0
chat-stress-runner-idle-with-pending       ← idle while batch continues
chat-stress-scenario:identity-02           ← other workers still dispatching
…
chat-stress-completion-condition-satisfied ← eventual full settlement
```

This confirms idle is a **mid-batch transient classification**, not terminal batch failure.

---

## Exact answer checklist

| Question | Answer |
|----------|--------|
| **Exact file (detection)** | `src/founder-test-chat-stress-simulation/live-chat-stress-runner-path.ts` |
| **Exact function (detection)** | `reconcileChatStressRunnerIdleWithPending()` |
| **Exact condition** | `pendingCount > 0 && activeScenarioId === null` (plus redundant third guard) |
| **Exact file (active registry)** | `src/founder-test-chat-stress-simulation/chat-stress-completion-tracker.ts` |
| **Exact functions (active clears)** | `forceWatchdogTimeout()` in `chat-response-simulator.ts`; `recordTerminalStatus()`; `clearActiveChatStressScenarioIfMatches()` |
| **Exact runtime state** | Concurrent workers in-flight; one or more scenarios `started && !settled`; zero or more scenarios not yet dispatched; **`activeScenarioId === null`** |
| **Why idle before terminal settlement** | Single global active slot does not represent concurrent worker occupancy; clearing it makes idle detection believe no worker is active while pending scenarios remain |

---

## Design intent vs observed behavior

Phase 26.81 (`LIVE_CHAT_STRESS_RUNNER_PATH_ALIGNMENT_REPORT.md`) introduced idle-with-pending to detect **orphan pending scenarios when no active worker is tracked**, then force settlement. The intent was recovery when the runner appeared stuck with `activeScenario=n/a`.

Under default Founder Test settings (`concurrency=4`), the condition fires ** routinely during normal concurrent execution** because the active-worker model is single-slot, not because workers have actually stopped processing the batch.

---

## Safety note (investigation only)

This report does not propose a fix. A repair would need to address the active-worker representation (e.g., ref-count or per-worker registry) or narrow idle detection so it does not fire when concurrent workers are still in-flight — without modifying Stage 2 completion tracking per investigation scope.
