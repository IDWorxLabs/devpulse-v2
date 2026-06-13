# Founder Test Active Run Result Binding Repair Report

## Root Cause

- Runtime polling overwrote `lastFounderTestRuntimeSnapshot` with IDLE while the Operator Feed card kept stale RUNNING HTML.
- Copy/Open Report used the IDLE snapshot instead of the visible card runId.
- Result endpoint returned 404/IDLE diagnostics when global session was IDLE even though a runId was known.

## Active runId Binding Proof

- `resolveActiveFounderTestRunId()` priority: card snapshot → pinned runId → last active snapshot.
- Runtime card displays Run ID and binds actions to `founderTestRuntimeCardSnapshot`.
- Polling and retry fetch pass `?runId=` to runtime-status and result endpoints.

## Result Endpoint Proof

- `getFounderTestRuntimeStatusForRun(runId)` returns live or published snapshot for the requested run.
- `/api/founder-test/result?runId=` returns HTTP 202 running diagnostic with matching runId when active.

## Copy/Open Report Proof

- `buildFounderTestCopyPayload()` prefers active non-IDLE snapshot; never emits n/a while pinned run exists.
- Mismatch detector triggers refresh: "Runtime/report mismatch detected — refreshing active run result."

## Remaining Stage 2 Status

- Chat stress pending IDs preserved in runtime snapshot and diagnostic reports.
- After cap-06 settles, aggregate completion boundaries must still fire (chat stress → product readiness → Stage 2 advance).

## Validation Results

- Validator checks: 28

## Remaining Risks

- Server process restart still clears in-memory published snapshots; client retains last active snapshot until refresh fails.
- Full founder report remains unavailable until background run completes — running diagnostic is intentional.

---

Pass token: FOUNDER_TEST_ACTIVE_RUN_RESULT_BINDING_V1_PASS
