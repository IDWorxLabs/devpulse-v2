# Operator Feed Final Report Button State Sync Report

## Root Cause

- Final report markdown existed in cache/notifications but Operator Feed buttons stayed on Fetching Report....
- Global fetch flags and trace-key dedupe prevented button re-render after report delivery.

## Repair

- Per-run fetch state map: idle | fetching | available | failed.
- `applyFounderTestFinalReport` sets available, clears fetch state, and re-renders Operator Feed card.
- Label resolver checks cache before fetch state; failed fetch cannot override available.
- Modal, notifications, and Operator Feed share `copyFounderTestFinalReportMarkdownShared`.

## Files Changed

- `src/founder-test-runtime-monitor/operator-feed-final-report-button-state-sync.ts`
- `public/founder-reality/app.js`

## Validation

- [x] file: public/founder-reality/app.js: present
- [x] file: src/founder-test-runtime-monitor/operator-feed-final-report-button-state-sync.ts: present
- [x] file: scripts/validate-operator-feed-final-report-button-state-sync.ts: present
- [x] applyFounderTestFinalReport bridge: bridge
- [x] per-run fetch state map: map
- [x] fetch state getter: getter
- [x] fetch state setter: setter
- [x] apply clears fetch state: clear
- [x] apply re-renders operator feed: rerender
- [x] label resolver checks cache first: cache first
- [x] fetching only without cache: fetching guard
- [x] single handoff status line: fetching status
- [x] cached report forces available: available
- [x] failed fetch guard: failed guard
- [x] failed cannot override available: override block
- [x] shared copy helper: shared copy
- [x] shared handoff copy resolver: handoff copy
- [x] modal uses shared copy: modal copy
- [x] notification uses shared copy: notification copy
- [x] trace key includes fetch state: trace key
- [x] buttons enable when available: enabled
- [x] no scoring edits: scoring
- [x] no verdict logic edits: verdict
- [x] no validator recursion: recursion
- [x] package script registered: script
- [x] cache forces available state: available from cache
- [x] failed blocked when cache exists: failed blocked
- [x] labels ready when cached: copy final
- [x] fetching status line without cache: Fetching Report.../Copy Final Report
- [x] no fetching label when cached: no fetch label


SUCCESS: OPERATOR_FEED_FINAL_REPORT_BUTTON_STATE_SYNC_V1_PASS
