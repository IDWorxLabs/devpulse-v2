# Chat Stress Deadline Runtime Trace Audit Report

**Run:** `founder-test-runtime-1781430231706`  
**Run started:** `2026-06-14T09:43:51.706Z` (epoch ms embedded in run id)  
**Dev server process:** pid 7888, started `2026-06-14T07:37:15.569Z` (terminal 45, `npm run dev`)  
**Success token:** `CHAT_STRESS_DEADLINE_RUNTIME_TRACE_AUDIT_V1_PASS`

## Executive summary

The failure message **"Running bounded chat stress inside product readiness has not advanced for 50s"** was **not** produced by `resolveChatStressStallHealth()`, `shouldFlagChatStressPendingStage2Gap()`, or `reconcileChatStressBatchDeadlineFinalizer()`.

It was produced by the **artifact build sub-step stall path** (`analyzeArtifactBuildSubstepStall` → `getFounderTestRuntimeStatus`), which runs **before** chat stress snapshot reconciliation in each monitor poll.

The **50s STALLED** emission is **inconsistent with Phase 26.88 code on disk** (chat stress artifact threshold = **56_000ms** would yield **SLOW** at 50s). It **is consistent with pre-26.88 behavior** (`stalledThresholdMs = 45_000`). The run occurred **after** the dev server start at 07:37 but **before** any confirmed process restart after Phase 26.88 landed on disk — the running `tsx` process likely still held pre-26.88 module cache.

---

## Audit answers

### 1. Was `CHAT_STRESS_DEADLINE_STALL_ALIGNMENT_V1` code active?

**No — not for the code path that emitted this failure.**

| Layer | Phase 26.88 active for this run? | Evidence |
|-------|----------------------------------|----------|
| Artifact sub-step stall (`analyzeArtifactBuildSubstepStall`) | **No** | 50s elapsed → STALLED requires threshold ≤ 50s. On-disk 26.88 uses **56_000ms** for chat stress ops → would be **SLOW** at 50s. |
| Stage-level stall (`analyzeRuntimeStall` + intake grace) | **Unknown / likely no reload** | Grace logic exists on disk but did not produce this message. |
| Batch deadline finalizer (`reconcileChatStressBatchDeadlineFinalizer`) | **Unknown** | Not on the message-producing path; no persisted snapshot for run. |
| `resolveChatStressStallHealth` | **Not involved** | Different message shape; used by Stage 2 gap logic, not artifact feed text. |

Phase 26.88 symbols exist on disk (`CHAT_STRESS_DEADLINE_STALL_ALIGNMENT_V1_PASS`, `resolveChatStressWorstCaseBatchDeadlineMs`, etc.) but the **observed runtime behavior matches pre-26.88 artifact threshold (45s)**.

---

### 2. What `stalledThresholdMs` was used?

**45_000ms** (`STALL_STALLED_THRESHOLD_MS`) — inferred from the emission.

Proof by threshold math:

| Threshold | Health at 50_000ms elapsed | Matches observed STALLED? |
|----------:|----------------------------|---------------------------|
| 45_000 (pre-26.88 default) | STALLED (50 ≥ 45) | **Yes** |
| 56_000 (26.88 chat stress artifact) | SLOW (50 ≥ 15 slow, 50 < 56) | **No** |

The on-disk Phase 26.88 path sets chat stress artifact ops to `resolveChatStressWorstCaseBatchDeadlineMs()` → **56_000ms**:

```114:119:src/founder-test-runtime-monitor/launch-readiness-artifact-build-tracer.ts
  const stalledThresholdMs =
    opId === 'product-readiness-chat-stress-started' ||
    opId.startsWith('product-readiness-chat-stress') ||
    opId === SUSPECTED_LAUNCH_READINESS_BLOCKING_OPERATION
      ? resolveChatStressWorstCaseBatchDeadlineMs()
      : STALL_STALLED_THRESHOLD_MS;
```

---

### 3. What was `chatStressMsUntilBatchDeadline` at the time STALLED was emitted?

**Not recoverable from persisted artifacts.** Runtime session state is in-memory; no snapshot for `founder-test-runtime-1781430231706` was found in the repo or via API (historical run).

**Inference only** (if batch tracking matched on-disk 26.88 and chat stress sub-step started ~50s before emission):

```
chatStressMsUntilBatchDeadline ≈ 56_000 − 50_000 = ~6_000ms
```

This field is populated by `buildChatStressCompletionSnapshot()` inside `getChatStressCompletionSnapshot()`, which runs **after** the artifact stall check in the same poll — so it was never consulted for this feed message regardless of value.

---

### 4. Why did the runtime monitor emit STALLED instead of SLOW while `activeScenarioCount > 0`?

Because the **artifact sub-step stall detector does not apply active-worker grace**.

Monitor poll order in `getFounderTestRuntimeStatus`:

1. **`analyzeArtifactBuildSubstepStall(nowMs)`** — elapsed time only; no `activeScenarioCount` check → can emit STALLED at 45s+.
2. **`getChatStressCompletionSnapshot(nowMs)`** — includes `reconcileChatStressBatchDeadlineFinalizer`.
3. **`analyzeRuntimeStall(... intakeChatStressContext ...)`** — Phase 26.88 grace: `activeScenarioCount > 0 && !hasActiveOverdueWatchdog` downgrades STALLED → SLOW.

The feed message came from step **1**, not step **3**. `resolveChatStressStallHealth()` (used by Stage 2 gap analysis) would return **SLOW** when `activeScenarioCount > 0` and no overdue watchdog — but that path was never reached for this string.

---

### 5. Was the report generated before the Phase 26.88 restart?

**Yes — before a post-26.88 process reload.**

| Event | Timestamp |
|-------|-----------|
| Dev server start (pid 7888) | `2026-06-14T07:37:15.569Z` |
| Run `founder-test-runtime-1781430231706` | `2026-06-14T09:43:51.706Z` |
| Phase 26.88 landed on disk | Same session, after 07:37 start |
| Confirmed restart after 26.88 | **None observed** in terminal 45 |

The run was **after** the 07:37 server boot but **before** any restart that would reload `launch-readiness-artifact-build-tracer.ts` with the 56s chat stress threshold. The 50s STALLED observation confirms the **running process** used pre-26.88 artifact stall logic.

---

### 6. Exact code path for the message

```
product-readiness-orchestrator.ts
  runProductReadinessSimulation()
    onSimulationTrace({ operationId: 'product-readiness-chat-stress-started',
                        operationLabel: 'Running bounded chat stress inside product readiness',
                        phase: 'RUNNING' })
      ↓
launch-readiness-artifact-build-tracer.ts (bridge handler)
  beginArtifactBuildSubstep({ operationId, operationLabel })
    → activeArtifactBuildSubstep = { startedAt, ... }
      ↓
founder-test-runtime-monitor.ts
  getFounderTestRuntimeStatus()  [periodic poll]
    analyzeArtifactBuildSubstepStall(nowMs)
      elapsedMs = nowMs - activeArtifactBuildSubstep.startedAt
      if elapsedMs >= stalledThresholdMs (45_000 in this run):
        reason = `${label} has not advanced for ${Math.round(elapsedMs / 1000)}s`
        → "Running bounded chat stress inside product readiness has not advanced for 50s"
    if health === 'STALLED' && shouldEmitArtifactBuildSubstepStall():
      emitSessionTrace({ operationId: 'artifact-substep-stalled:product-readiness-chat-stress-started', ... })
      session.feedEvents ← reason  (WARNING feed)
```

**Not on this path:**

| Function | Role | Produces this message? |
|----------|------|------------------------|
| `resolveChatStressStallHealth()` | Stage 2 / pending health | No — different reason format |
| `shouldFlagChatStressPendingStage2Gap()` | Stage 2 completion gap flag | No — boolean gate only |
| `reconcileChatStressBatchDeadlineFinalizer()` | Force-settle after batch deadline | No — settlement side effect |

---

## Remaining gap (post-26.88)

Even with Phase 26.88 loaded, `analyzeArtifactBuildSubstepStall` still lacks `activeScenarioCount` grace. After restart, chat stress artifact STALL would fire at **56s+** regardless of active workers — but **not at 50s**. A follow-up repair could align artifact sub-step grace with `analyzeRuntimeStall` / `resolveChatStressStallHealth`.

---

## Validation

```bash
npm run validate:chat-stress-deadline-runtime-trace-audit
```

Expected token: `CHAT_STRESS_DEADLINE_RUNTIME_TRACE_AUDIT_V1_PASS`
