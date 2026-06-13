# Report Handoff RunId Propagation Report

## Root Cause

- Report handoff paths called result/result-debug endpoints with requested runId n/a while the visible Operator Feed runtime card already held a valid runId.
- runId resolution did not consistently prioritize `founderTestRuntimeCardSnapshot.runId`.

## Repair

- `resolveReportHandoffRunId` — card snapshot → pinned → active snapshots.
- `coerceReportHandoffRunId` — never hand off n/a when card has runId.
- Copy/Open/Retry/debug/fetch paths all coerce runId from visible card first.
- Handoff diagnostic exposes requested, card, pinned, resolved active, and runtime snapshot runIds.

## Files Changed

- `src/founder-test-runtime-monitor/report-handoff-runid-propagation.ts`
- `src/founder-test-runtime-monitor/complete-report-preparing-stall.ts`
- `public/founder-reality/app.js`

## Validation

- [x] file: public/founder-reality/app.js: present
- [x] file: src/founder-test-runtime-monitor/report-handoff-runid-propagation.ts: present
- [x] file: scripts/validate-report-handoff-runid-propagation.ts: present
- [x] resolveReportHandoffRunId helper: resolver
- [x] coerceReportHandoffRunId helper: coerce
- [x] card snapshot first: card first
- [x] pinned runId fallback: pinned
- [x] copy uses card runId: copy
- [x] open uses card runId: open
- [x] retry uses card runId: retry
- [x] result-debug includes runId: debug url
- [x] debug fetch coerces runId: debug coerce
- [x] forbidden n/a guard: n/a guard
- [x] diagnostic runtime card runId: diagnostic card
- [x] diagnostic pinned runId: diagnostic pinned
- [x] diagnostic resolved active runId: diagnostic resolved
- [x] diagnostic runtime snapshot runId: diagnostic snapshot
- [x] copy payload uses card runtime: payload card
- [x] fetch retry coerces runId: fetch coerce
- [x] no scoring edits: scoring
- [x] no verdict logic edits: verdict
- [x] no validator recursion: recursion
- [x] package script registered: script
- [x] card runId wins over explicit n/a: card wins
- [x] coerce uses card when resolved missing: coerce card
- [x] endpoint runId never n/a when card present: endpoint guard
- [x] diagnostic fields populated: fields
- [x] n/a is invalid handoff id: invalid n/a


SUCCESS: REPORT_HANDOFF_RUNID_PROPAGATION_REPAIR_V1_PASS
