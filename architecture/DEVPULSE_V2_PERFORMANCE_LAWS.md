# DevPulse V2 — Performance Laws

**Authority:** GF7 OMEGA Constitution V1  
**Scope:** All main-thread work, background queues, rendering, and pressure response

---

## Purpose

V1 collapsed under main-thread monopolization: thousands of script loads, synchronous HTML rebuilds, and uncoordinated idle work produced 15–30 s clickability delays and post-run freeze risk. These laws enforce measurable budgets and automatic pressure response.

---

## LAW P-1 — Main-Thread Budget

The main thread is a shared resource. DevPulse may not monopolize it.

| Context | Max continuous blocking | Max single long task |
|---------|------------------------|---------------------|
| Startup Phase 0–1 | 800 ms total | 50 ms |
| Chat answer path | 200 ms total | 30 ms |
| Operator Feed update | 50 ms | 16 ms |
| Route open (any surface) | 100 ms before first yield | 50 ms |
| Background poll tick | 16 ms | 16 ms |

**Enforcement:** Task Governor rejects registrations exceeding budget. Long tasks logged to pressure telemetry.

**V1 violation:** `deriveDevPulseUvlRunTimingIntelligenceV1` + `buildUvlReadinessInspectorV1` ran synchronously on every poll tick.

---

## LAW P-2 — Background Work Budget

Background work runs through Task Governor queues with tier-based budgets.

| Priority tier | Queue | Concurrent budget | Preemptible by |
|---------------|-------|-------------------|----------------|
| `ANSWER` | answer | 1 task, 500 ms wall | User input |
| `INTERACTION` | ui | 2 tasks, 200 ms each | ANSWER, user input |
| `FEED` | feed | 1 task, 100 ms | ANSWER, INTERACTION |
| `DIAGNOSTIC` | diagnostic | 1 task, 50 ms | All above |
| `IDLE` | idle | 1 task, unlimited wall, 16 ms slices | All above |

Background work must **yield every 16 ms** minimum when total slice count exceeds 3.

**V1 violation:** Deferred loader, preflight, and coverage recovery ran concurrently without tier separation.

---

## LAW P-3 — Queue System Requirements

DevPulse V2 must implement exactly **one** task queue system: Task Governor.

| Requirement | Detail |
|-------------|--------|
| Single queue authority | No parallel ad-hoc schedulers |
| Registration mandatory | All async work registers before execution |
| Priority preemption | Higher tier cancels or pauses lower tier |
| Visibility | Queue depth exposed to Operator Feed on pressure |
| Startup integration | Queue respects startup phase gates |

**Prohibited:** Direct `setTimeout` chains for module loading, unregistered `requestIdleCallback` handlers, parallel loader systems.

---

## LAW P-4 — Task Governor Requirements

Task Governor is a Phase 0 module. It is not optional and not deferrable.

### Core capabilities (mandatory)

1. **Register(task)** — accepts owner, tier, estimated cost, cancel token
2. **Schedule(task)** — places in appropriate queue
3. **Preempt(tier)** — pauses lower tiers on pressure
4. **BudgetRemaining(context)** — returns ms left for context
5. **PressureLevel()** — returns NORMAL | ELEVATED | HIGH | CRITICAL

### Pressure response (automatic)

| Level | Trigger | Response |
|-------|---------|----------|
| NORMAL | Default | All tiers run |
| ELEVATED | 2 long tasks in 3 s | Pause IDLE tier |
| HIGH | 3 long tasks in 2 s OR queue depth > 10 | Pause DIAGNOSTIC + IDLE; slow INTERACTION |
| CRITICAL | 5 s sustained blocking OR NR dialog risk | Pause all except ANSWER; cancel in-flight diagnostics |

**V1 violation:** No central governor — each subsystem scheduled its own work, causing overlapping pressure.

---

## LAW P-5 — Render Budget Requirements

DOM updates must be incremental and budgeted.

| Rule | Limit |
|------|-------|
| Full innerHTML replace | **Prohibited** on polling surfaces |
| Max DOM nodes added per tick | 50 |
| Poll interval (readiness, status) | ≥ 2400 ms when idle |
| Poll pause under HIGH pressure | Required |
| Inspector/detail panels | Lazy mount on user expand only |

**V1 violation:** `renderDevPulseUvlRunTimingPanelV1` replaced entire HTML each poll; giant readiness inspector always in DOM.

---

## LAW P-6 — Maximum Blocking Thresholds

Hard thresholds that trigger automatic protective action — not logging alone.

| Metric | Threshold | Automatic action |
|--------|-----------|------------------|
| Long task duration | > 50 ms | Log + pressure increment |
| Long task duration | > 200 ms | Preempt background tiers |
| Time to first click | > 2000 ms | Block Phase 2+ advancement |
| Time to first answer byte | > 3000 ms | Escalate ANSWER tier, cancel diagnostics |
| Sustained blocking | > 5000 ms | CRITICAL pressure, cancel all non-ANSWER |
| Freeze risk score | CRITICAL | Pause all polling, show feed warning |

**V1 violation:** Chrome "page unresponsive" dialog appeared because queue depth exceeded ~5 s sustained blocking.

---

## LAW P-7 — Automatic Pressure Detection

Task Governor continuously monitors:

- `PerformanceObserver` longtask entries
- `requestAnimationFrame` starvation (missed frames > 3)
- Input event queue delay (keydown to handler > 100 ms)
- Queue depth and tier saturation
- Startup budget consumption rate

Telemetry keys (required):
- `__DEVPULSE_V2_PRESSURE_LEVEL`
- `__DEVPULSE_V2_LAST_LONG_TASK_MS`
- `__DEVPULSE_V2_QUEUE_DEPTH`
- `__DEVPULSE_V2_FIRST_CLICK_READY_AT`

---

## LAW P-8 — Automatic Pressure Prevention

Prevention runs **before** work executes, not after damage occurs.

| Check | When | Action |
|-------|------|--------|
| Estimated cost vs budget | Registration | Reject or defer |
| Phase gate | Registration | Reject if wrong phase |
| Pressure level | Schedule | Downgrade or defer |
| Duplicate work | Registration | Dedupe by owner+operation key |
| Startup budget | Registration | Defer to Phase 3 if exhausted |

**V1 violation:** V1 patched scheduling after freezes (uiYield, batch size reduction) instead of preventing registration.

---

## LAW P-9 — Chat Answer Performance Priority

Answer generation holds the `ANSWER` tier — highest priority.

| Rule | Detail |
|------|--------|
| Answer work preempts all diagnostics | Automatic |
| No diagnostic may run during answer path | Governor enforced |
| Visible answer first byte ≤ 3000 ms | Browser verified (warm) |
| Full answer stream ≤ 8000 ms | Target, not gate |
| Post-answer audits | FEED or DIAGNOSTIC tier only |

**V1 violation:** Audits and CCIR recovery ran on the answer path; vault intercept skipped quality judge but still delayed path resolution.

---

## LAW P-10 — No Main-Thread Script Avalanche

Script loading must be paced.

| Rule | Value |
|------|-------|
| Max scripts per batch | 3 (first 10 s), 5 (after) |
| Yield between batches | ≥ 16 ms |
| Max concurrent script loads | 2 |
| Sync script tags after Phase 0 | **Prohibited** |
| Module group load | Must register with Task Governor |

**V1 violation:** 3634 boot scripts + 125 deferred scripts loaded in overlapping batches on main thread.

---

## Verification Requirements

Performance changes must demonstrate:

1. Long task count in first 10 s ≤ 5
2. `firstClickReadyAt` ≤ 2000 ms (cold)
3. First answer byte ≤ 3000 ms (warm, simple query)
4. No CRITICAL pressure during normal startup
5. User submit during background load — answer still delivered

Browser DevTools Performance trace required for any PR touching loading, polling, or rendering.

---

## Related Documents

- `DEVPULSE_V2_STARTUP_LAWS.md` — Startup phase budgets
- `DEVPULSE_V2_SYSTEM_LAWS.md` — Chat and diagnostic priority
- `DEVPULSE_V2_REBUILD_BLUEPRINT.md` — Task Governor as Phase 1 deliverable
