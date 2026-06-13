# Founder Report Access + Operator Feed State Report

## Operator Feed Flip Root Cause

- Layout toggled via implicit runtime snapshot checks without a persistent `operatorFeedMode` owner.
- Legacy feed renderers (`renderOperatorFeed`, `appendFeedStreamLog`) still ran during founder test and restored Planning/Execution/Verification cards.
- `syncOperatorFeedLayout(null)` cleared founder-test mode during transient IDLE/missing-runId poll frames.

## Missing Notification Root Cause

- `deliverFounderTestReportNotification` returned early when markdown was empty before runtime diagnostic fallback was guaranteed.
- Notification drawer did not show unread badge/count after delivery.
- GET `/api/founder-test/result` returned 404 while run was still active, so async clients had nothing to deliver.

## Files Changed

- public/founder-reality/app.js
- public/founder-reality/index.html
- public/founder-reality/styles.css
- server/founder-testing-handler.ts
- src/founder-test-runtime-monitor/stage2-completion-tracker.ts
- src/founder-test-runtime-monitor/index.ts
- package.json
- scripts/validate-founder-report-access-operator-feed-state.ts

## Report Fallback Proof

- Runtime card exposes Copy Latest Report / Open Report / Retry Fetch Result independent of Notifications drawer.
- Copy priority: full report → partial → runtime failure → minimal diagnostic.
- Server returns `runtimeDiagnosticMarkdown` with HTTP 202 while run is active.

## Manual Verification Steps

1. Run Founder Test — Operator Feed stays on Founder Test Runtime (no flip to legacy cards).
2. Use Copy Latest Report / Open Report on runtime card without opening Notifications.
3. Retry Fetch Result while running — diagnostic markdown appears; notification badge increments.
4. Open Notifications — report entry persists after closing founder test modal; badge clears on open.
5. Dismiss runtime card — legacy feed returns only after explicit Dismiss.

## Remaining Risks

- Running diagnostic notification fires after 45s threshold, not immediately.
- Result store peek keeps completed results in memory until next run overwrites store.
- Very long reports truncate in notification preview (full copy still available).

---

Pass token: FOUNDER_REPORT_ACCESS_OPERATOR_FEED_STATE_V1_PASS
