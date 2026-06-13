# Founder Test COMPLETE Handoff Boundary Report

## Root Cause

- COMPLETE was emitted while the result store had no report markdown for the runId.
- Clients saw COMPLETE runtime + failed result fetch (`routeReached: false`, empty store) — an order-of-operations handoff bug, not slow generation.

## Server Boundary Repair

1. **Report markdown exists** — `executeFounderTestRunCore` rejects completion without trimmed markdown (`FAILED`, never `COMPLETE`).
2. **Result store receives markdown under exact runId** — `storeFounderTestRunResult` runs before `finishFounderTestRuntime({ state: COMPLETE })`.
3. **result-debug route reachable** — `GET /api/founder-test/result-debug?runId=` exposes store + runtime diagnostics.
4. **Result endpoint returns stored markdown** — HTTP 200 only when `shouldReturnCompleteResultHttp200(stored)`; otherwise HTTP 202 `COMPLETING`.
5. **COMPLETE only after boundary passes** — `canEmitFounderTestRuntimeComplete({ runId, reportMarkdown })` gates `finishFounderTestRuntime({ state: COMPLETE })`.

## Public Runtime Masking

- `resolvePublicFounderTestRuntimeSnapshot` masks internal COMPLETE → COMPLETING until store verification passes.
- Prevents UI/Operator Feed from advertising COMPLETE while result store is still empty.

## Endpoint Contract

| Condition | `/result` status | Public runtime state |
| --- | --- | --- |
| Stored markdown for runId | 200 + reportMarkdown | COMPLETE |
| Stored ok, no markdown | 202 preparing | COMPLETING |
| No store, runtime completing | 202 preparing | COMPLETING |
| Missing markdown at completion | FAILED | FAILED |

## Manual Verification

1. Run Founder Test to completion.
2. Before Copy Final Report, call `GET /api/founder-test/result-debug?runId=<runId>` — `hasReportMarkdown: true`.
3. Call `GET /api/founder-test/result?runId=<runId>` — HTTP 200 with full markdown.
4. Runtime status shows COMPLETE only after step 3 would succeed.

---

Pass token: FOUNDER_TEST_COMPLETE_HANDOFF_BOUNDARY_V1_PASS
