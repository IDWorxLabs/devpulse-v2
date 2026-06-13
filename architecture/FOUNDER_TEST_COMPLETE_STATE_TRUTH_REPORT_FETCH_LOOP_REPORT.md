# Founder Test COMPLETE State Truth + Report Fetch Loop Report

## Root Cause

- Internal runtime reached COMPLETE while trace fields still showed Report Generation running and Stage pending.
- Public API exposed COMPLETE before handoff reconciliation, while client fetch loop spun with duplicate Fetching Report controls.
- Client treated server COMPLETE as deliverable before bounded result fetch completed or failed.

## Impossible State (Screenshot)

- Badge: COMPLETE
- Current operation: Report Generation running
- Stage: pending
- Last completed: Founder Test Complete
- UI: duplicate Fetching Report buttons + Retry Fetch Result during active fetch

## Before / After State Model

| Layer | Before | After |
| --- | --- | --- |
| Public runtime | COMPLETE with stale ops | COMPLETING / REPORT_HANDOFF_PENDING until store + reconcile |
| Current operation | Stale Report Generation running | Report Handoff pending → Complete |
| Stage line | Stage pending / Report Generation | handoffStateLabel or All stages finished |
| Client badge | COMPLETE while fetching | REPORT_HANDOFF_PENDING until cache ready |
| Report buttons | Both say Fetching Report... | Single status line + Copy/Open Final Report (disabled) |

## Files Changed

- `src/founder-test-runtime-monitor/founder-test-complete-state-truth.ts` — public reconciliation
- `src/founder-test-runtime-monitor/founder-test-runtime-monitor.ts` — apply reconcile on status reads
- `src/founder-test-runtime-monitor/complete-report-preparing-stall.ts` — debug fields
- `src/founder-test-runtime-monitor/operator-feed-final-report-button-state-sync.ts` — single status contract
- `public/founder-reality/app.js` — bounded fetch, badge, handoff UI
- `server/founder-testing-handler.ts` — unchanged scoring/verdict; result endpoints JSON

## Endpoint Proof

- `/api/founder-test/result` — 200 with markdown, 202 when handoff pending, always JSON via sendFounderTestJson
- `/api/founder-test/result-debug` — routeReached, publicState, handoffState, currentOperation, store fields

## Client Bounded Retry Proof

- Max 3 attempts, 3000ms timeout per attempt, 600ms delay between attempts
- After exhaustion: stop Fetching Report..., show Copy Handoff Diagnostic, show Retry Fetch Result

## Duplicate Button Fix

- Single `#founder-test-report-handoff-status` line for Fetching Report...
- Copy/Open keep Final Report labels; Retry hidden until fetch fails

## Manual Verification Steps

1. Run Founder Test to completion.
2. During handoff: badge shows REPORT_HANDOFF_PENDING, handoff state visible, current operation not Report Generation running.
3. Single Fetching Report status line appears (not on both buttons).
4. After bounded failure: Copy Handoff Diagnostic + Retry Fetch Result appear; fetching stops.
5. After success: badge COMPLETE, Copy/Open Final Report enabled with report markdown.
6. `GET /api/founder-test/result-debug?runId=` includes publicState, handoffState, currentOperation.

---

Pass token: FOUNDER_TEST_COMPLETE_STATE_TRUTH_REPORT_FETCH_LOOP_V1_PASS
