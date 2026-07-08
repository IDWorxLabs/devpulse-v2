# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782826658520
- **Created:** 2026-06-30T13:37:38.518Z
- **Profile:** EXPENSE_TRACKER_WEB_V1
- **App:** Expense Tracker
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `e30a3118cf02c21cd8726a1e5d4318db74ac53b484f0a5b70fae014b3ac2c176`
- **Workspace hash:** `a8d099e1fea2dc58f761e71d55304410034f1a72840210ed613f4011952381db`
- **Comparison fingerprint:** `fae01be7ae5b1fda258f321712e7d994ad1486663a3b6c8389b91e3b1189aa5b`

## Prompt

Build an expense tracker where users add expenses, categorize spending, view monthly totals, and filter by date range.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782826658383/.generated-app-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782826658520

## Failure Reasons

- ASE-authorized materialization did not complete.
- ASE-authorized materialization did not complete.

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=118 |
| Profile selected | INFO | EXPENSE_TRACKER_WEB_V1 |
| Workspace generated | PASS | 1 files, 0 directories |
| Manifest written | PASS | manifestHash=e30a3118cf02… |
| Feature modules generated | FAIL | 0 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=FAIL validation=FAIL |
