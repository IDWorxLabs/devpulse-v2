# DevPulse V2 — Task Governor Foundation

**GF7 OMEGA — Runtime Foundation V1**  
**System ID:** `task_governor`  
**Phase:** 1  
**Status:** First runtime foundation module

---

## Why Task Governor Exists

DevPulse V1 failed because every subsystem scheduled its own work without coordination:

- 3600+ scripts loaded in overlapping batches on the main thread
- UVL panel render, timing inspector, preflight scan, and deferred loader all started simultaneously
- 15–30 second clickability delays despite visible UI paint
- Chrome "page unresponsive" dialogs from sustained blocking
- Diagnostics competed with chat for main-thread time

**Task Governor is the sole approved scheduling authority for non-trivial work in DevPulse V2.** No background loader, audit, intelligence scan, or diagnostic may bypass it.

---

## V1 Failures This Prevents

| V1 failure | Task Governor protection |
|------------|-------------------------|
| Startup overload | Priority tiers + queue limits + budget exhaustion |
| Page freezing | Slice budgets, continuous work caps, interaction protection |
| Long answer delays | P0/P1 preempt background tiers |
| Main-thread monopolization | `maxContinuousWorkMs: 50`, long-task warnings |
| Uncontrolled diagnostics | P3/P4 deferred during interaction; heavy work sliced |
| Overlapping idle work | Single queue, priority ordering, idle-only P4 |

---

## Priority Model

| Priority | Name | Behavior |
|----------|------|----------|
| **P0** | `P0_VISIBLE_USER_PATH` | Runs immediately if budget allows — answer path, visible UI |
| **P1** | `P1_CORE_INTERACTION` | Runs immediately if budget allows — click, submit, focus |
| **P2** | `P2_LIGHT_BACKGROUND` | Yields when interaction active |
| **P3** | `P3_HEAVY_BACKGROUND` | Runs in slices (`defaultSliceBudgetMs: 25`); deferred under interaction |
| **P4** | `P4_IDLE_ONLY` | Runs only after `idleOnlyDelayMs` (250ms) without interaction |

### Interaction protection

When `setInteractionActive(true)`:

- **P0 / P1** — allowed (protects typing, clicking, chat response)
- **P2 / P3 / P4** — deferred
- Responsiveness state → **PROTECTED**
- Stale tasks with `cancelWhenStale` are cancelled

---

## Budget Model

| Constant | Value | Purpose |
|----------|-------|---------|
| `defaultSliceBudgetMs` | 25 | Max slice for P3 heavy tasks |
| `maxContinuousWorkMs` | 50 | Max continuous work before yield |
| `maxQueueSize` | 100 | Queue depth limit |
| `idleOnlyDelayMs` | 250 | Idle threshold for P4 |
| `longTaskWarningMs` | 50 | Long-task warning threshold |

When a task exceeds `longTaskWarningMs`:

- Warning recorded in state
- Long-task count incremented
- Future P0/P1 tasks are **not** blocked — governor continues scheduling user-path work

---

## Stale Task Cancellation

Tasks with `cancelWhenStale: true` are cancelled when:

1. `staleAfterMs` exceeded since `createdAt`
2. A newer task with the same `label` supersedes them
3. Governor enters **PROTECTED** state (interaction active)

Use `cancelStaleTasks()` to sweep the queue.

---

## Public API

```typescript
import {
  createDevPulseV2TaskGovernor,
  getDevPulseV2TaskGovernor,
} from './src/task-governor/index.js';

const governor = createDevPulseV2TaskGovernor();

governor.enqueueTask({
  id: 'task-1',
  label: 'load-module',
  priority: 'P3_HEAVY_BACKGROUND',
  estimatedCostMs: 30,
  createdAt: Date.now(),
  run: async () => { /* work */ },
});

governor.setInteractionActive(true, 'user typing');
await governor.runNextTask();
governor.setInteractionActive(false);

console.log(governor.getState());
console.log(formatTaskGovernorReport(governor.getReport()));
```

### Methods

| Method | Purpose |
|--------|---------|
| `enqueueTask(task)` | Add task to priority queue |
| `runNextTask()` | Execute highest-priority runnable task |
| `runUntilBudgetExhausted(budgetMs?)` | Run until continuous budget exhausted |
| `pause(reason)` / `resume(reason)` | Halt / resume scheduling |
| `cancelTask(id)` | Cancel queued task |
| `cancelStaleTasks()` | Cancel stale tasks |
| `setInteractionActive(active, reason?)` | Protect user interaction path |
| `getState()` | Current governor state |
| `getReport()` | Founder-readable report data |

### Responsiveness states

| State | Meaning |
|-------|---------|
| `RESPONSIVE` | Idle, low queue pressure |
| `BUSY` | Tasks running or queued |
| `PROTECTED` | User interaction active — background deferred |
| `DEGRADED` | High queue pressure or repeated long tasks |

---

## How Future Systems Must Use It

**Every non-trivial operation must register with Task Governor:**

| Future system | Priority tier |
|---------------|---------------|
| Chat answer generation | P0 |
| Shell focus / click handlers | P1 |
| Operator Feed updates | P1 or P2 |
| Lazy module loading | P3 (sliced) |
| Readiness polling | P3 or P4 |
| Diagnostics / audits | P4 (idle only) |
| Trust Engine scans | P3/P4 (never startup critical path) |

### Prohibited patterns

- Direct `setTimeout` chains for module loading
- Unregistered `requestIdleCallback` for heavy work
- Sync script injection outside governor
- Diagnostics on startup critical path
- Background work during P0 answer path

---

## Build Gate Requirement

Task Governor implementation must pass build gate before merge:

```typescript
runDevPulseV2BuildGate({
  phase: 1,
  systems: ['task_governor'],
  eagerModuleCount: 1,
  answerAuthorities: [],
  browserVerificationPresent: false,
  buildStage: 'foundation',
});
```

---

## Validation

```bash
npm run validate:task-governor
npm run validate:foundation
```

Pass token:

```
DEVPULSE_V2_TASK_GOVERNOR_FOUNDATION_V1_PASS
```

---

## Why No Future Work May Bypass Governor

Bypassing Task Governor recreates V1's scheduling chaos within a single PR. The constitutional requirement (System Law S-6, Performance Law P-3) mandates one queue authority. Enforcement layer validates phase and ownership; Task Governor validates runtime behavior.

**Shell, Chat, and Operator Feed must enqueue all non-trivial work through Task Governor when implemented.**

---

## Related Documents

- `DEVPULSE_V2_PERFORMANCE_LAWS.md`
- `DEVPULSE_V2_STARTUP_LAWS.md`
- `DEVPULSE_V2_FOUNDATION_ENFORCEMENT_LAYER.md`
- `DEVPULSE_V2_REBUILD_BLUEPRINT.md`
