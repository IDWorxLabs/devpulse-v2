# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782826754681
- **Created:** 2026-06-30T13:39:14.679Z
- **Profile:** EXPENSE_TRACKER_WEB_V1
- **App:** Expense Tracker
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `662a51931fa45fd34e70982e78c2353b4c08e74fe813bbb190b4f5bede553a10`
- **Workspace hash:** `bcba9d632fce2d1138260930eccc32ace8acad9a9880d940d60b1e2d77b567f4`
- **Comparison fingerprint:** `c938e6170125c7c4f59244448188e33e101cf0f466a6ff205ecf160a300bec1b`

## Prompt

Build an expense tracker where users add expenses, categorize spending, view monthly totals, and filter by date range.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782826754557/.generated-app-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782826754681

## Failure Reasons

- ASE-authorized materialization did not complete.
- ASE-authorized materialization did not complete.

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=118 |
| Profile selected | INFO | EXPENSE_TRACKER_WEB_V1 |
| Workspace generated | PASS | 1 files, 0 directories |
| Manifest written | PASS | manifestHash=662a51931fa4… |
| Feature modules generated | FAIL | 0 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=FAIL validation=FAIL |
