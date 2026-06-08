# DevPulse V2 — Startup Laws

**Authority:** GF7 OMEGA Constitution V1  
**Scope:** All code executed between navigation start and declared `STARTUP_COMPLETE`

---

## Purpose

V1 startup failed because thousands of scripts, synchronous derives, and diagnostic gates ran before the user could see or click anything. These laws enforce a **user-first boot sequence** with hard budgets and phased initialization.

---

## LAW ST-1 — Visibility Before Diagnostics

The shell UI must be **painted and visible** before any diagnostic, audit, intelligence scan, or readiness derive executes.

| Milestone | Maximum time from navigation start |
|-----------|-------------------------------------|
| First paint (shell frame) | **800 ms** |
| Chat input visible | **1200 ms** |
| Operator Feed placeholder visible | **1500 ms** |

**Enforcement:** Browser timing probe records `shellVisibleAt`. Failure aborts startup phase advancement.

**V1 violation:** Full UVL panel render + timing inspector mounted synchronously before yield (~3–15 s before meaningful UI).

---

## LAW ST-2 — Clickability Before Diagnostics

The shell must be **interactive** (chat input focusable, send enabled) before any non-Phase-0 work begins.

| Milestone | Maximum time |
|-----------|--------------|
| Chat input focusable | **1500 ms** |
| Send button clickable | **1500 ms** |
| First user input accepted | **2000 ms** |

**Enforcement:** `firstClickReadyAt` probe. No diagnostic module may register a synchronous listener before this milestone.

**V1 violation:** 15–30 s to first accepted input due to deferred loader batches and coverage recovery on main thread.

---

## LAW ST-3 — Chat Usable Before Diagnostics

A user must be able to **type and submit** a chat message before any background diagnostic completes.

| Rule | Detail |
|------|--------|
| Chat submit handler registered in Phase 0 | Non-negotiable |
| Answer may be "initializing" stub | Honest, not routing narration |
| Diagnostics failure cannot disable submit | Chat remains functional |

**V1 violation:** Startup readiness signal blocked perceived readiness at ~92% with `INTERACTIVE_BOOT_LOADING` even when chat route was intentionally deferred.

---

## LAW ST-4 — Maximum Startup Budget

Total blocking main-thread work during startup phases 0–1 is capped.

| Budget | Limit |
|--------|-------|
| Phase 0 (shell + chat wiring) | **500 ms** main-thread blocking |
| Phase 1 (Operator Feed skeleton) | **300 ms** additional blocking |
| **Total startup blocking** | **800 ms** hard cap |
| Long-task threshold | No single task **> 50 ms** during Phase 0–1 |

Exceeding budget triggers automatic deferral via Task Governor — not a warning.

**V1 violation:** Boot group of 3600+ scripts + deferred group of 125+ scripts produced sustained 50 ms+ long tasks.

---

## LAW ST-5 — Mandatory Lazy Loading

All modules beyond Phase 0–1 core **must** lazy-load. Eager loading is prohibited except for the Phase 0 manifest.

| Phase 0 eager manifest (maximum) | |
|----------------------------------|---|
| Shell renderer | 1 module |
| Chat surface + submit wiring | 1 module |
| Task Governor core | 1 module |
| Operator Feed shell | 1 module |
| **Total eager modules** | **≤ 6** (including bootstrap loader) |

**V1 violation:** `safe_real_main_route_runtime_v11` grew to 92 scripts; connect modules added 4–7 scripts per version.

---

## LAW ST-6 — Background Initialization Requirements

Phase 2+ initialization must satisfy all of:

1. **Scheduled through Task Governor** — no ad-hoc `setTimeout` chains
2. **Yield between batches** — `requestIdleCallback` or equivalent with minimum 16 ms yield
3. **Batch size cap** — max 3 scripts per batch during first 10 s after shell interactive
4. **Non-blocking** — background init never `await`ed on critical path
5. **Cancellable** — user interaction preempts low-priority background work

**V1 violation:** `loadParityScripts` loaded thousands of script tags in batched loads without sufficient yield.

---

## LAW ST-7 — No Diagnostic May Block Startup

The following are **explicitly forbidden** on the startup critical path:

- UVL orchestrator load or derive
- Coverage recovery / parity script loading
- Dependency preflight scan
- Readiness inspector build
- Timing intelligence derive
- Central Brain cognition stack derive
- Console intelligence capture
- Any audit that reads filesystem or repo state synchronously

**V1 violation:** `runUvlModuleLoadCoverageRecoveryV1` ran eagerly on main thread during startup.

---

## LAW ST-8 — No Audit May Block Startup

Audits are post-startup citizens. An audit may begin only after `STARTUP_COMPLETE` is declared.

| Audit type | Earliest start |
|------------|----------------|
| Self-diagnostic | Phase 3 (background) |
| Backend integrity check | Phase 3 (background) |
| Module load coverage | Phase 3 (background) |
| Readiness scoring | Phase 2 (non-blocking poll only) |

---

## LAW ST-9 — No Intelligence Scan May Block Startup

Intelligence scans (context fusion, vault hydration, brain derive, intent classification caches) are **post-interaction** unless required to answer the user's first message — and even then, only the minimal slice for that message via Task Governor priority tier `ANSWER`.

**V1 violation:** Full cognition architecture derive chain ran during UVL preflight before user interaction.

---

## LAW ST-10 — Startup Phases

Startup is divided into enforced phases. A phase may not begin until the prior phase's gates pass.

### Phase 0 — Shell (`SHELL_INTERACTIVE`)
- Paint shell frame
- Mount chat input + send
- Register Task Governor
- Register submit handler (stub answer acceptable)
- **Gate:** `shellVisibleAt` ≤ 800 ms, `firstClickReadyAt` ≤ 2000 ms

### Phase 1 — Conversation Core (`CHAT_READY`)
- Wire chat answer pipeline (single authority path)
- Mount inline Operator Feed skeleton
- Enable real answer routing (not stub)
- **Gate:** First browser-verified answer ≤ 5000 ms from submit (warm path)

### Phase 2 — Background Enrichment (`BACKGROUND_ACTIVE`)
- Schedule lazy module groups via Task Governor
- Non-blocking readiness polling (display only, no gates)
- **Gate:** No main-thread long task > 100 ms for 5 consecutive seconds

### Phase 3 — Diagnostics (`DIAGNOSTICS_IDLE`)
- Audits, scans, coverage recovery
- All work via Task Governor low-priority queue
- **Gate:** User interaction always preempts Phase 3 work

### `STARTUP_COMPLETE`
Declared when Phase 2 gate passes. Phase 3 runs indefinitely in background.

**V1 violation:** V1 had no enforced phases — boot, deferred, preflight, and UVL all ran concurrently from route open.

---

## LAW ST-11 — Startup Budget Enforcement

The Task Governor maintains a startup budget counter.

| Mechanism | Behavior |
|-----------|----------|
| Budget counter | Decrements on main-thread blocking work registration |
| Budget exhausted | All new work deferred to Phase 3 |
| Pressure detection | 3 long tasks in 2 s → freeze Phase 2+ advancement |
| Telemetry | `startupBudgetRemainingMs`, `startupPhase`, `startupGateFailures[]` |

Startup budget enforcement is **automatic** — no manual override in production builds.

---

## LAW ST-12 — No Startup Script Avalanche

Adding scripts to the eager manifest requires constitutional review.

| Threshold | Action |
|-----------|--------|
| Eager manifest > 6 modules | **Blocked** — extract or lazy-load |
| Single lazy group > 20 modules | **Warning** — split group |
| Lazy group > 50 modules | **Blocked** — mandatory extraction |
| Connect-module pattern (V1) | **Prohibited** — no "connect vN" script chains |

**V1 violation:** Connect modules V15–V20 each extended manifest by 4–7 scripts without extraction.

---

## Verification Requirements

Every startup change must pass:

1. **Cold load test** — hard reload, measure to `firstClickReadyAt`
2. **Warm load test** — repeat navigation, measure regression
3. **Submit during boot test** — user submits at T+500 ms; chat must accept and respond
4. **Diagnostic failure test** — disable background worker; chat must remain functional

All tests run in **real browser** — not Node VM.

---

## Related Documents

- `DEVPULSE_V2_PERFORMANCE_LAWS.md` — Main-thread budgets
- `DEVPULSE_V2_SYSTEM_LAWS.md` — Chat primacy and diagnostic subordination
- `DEVPULSE_V2_REBUILD_BLUEPRINT.md` — Phase 1 build scope
