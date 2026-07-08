# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782837956753
- **Created:** 2026-06-30T16:45:56.652Z
- **Profile:** EXPENSE_TRACKER_WEB_V1
- **App:** Expense Tracker
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `03c41d77d5386151f6092960df40a37800888f6cf5f9e8c43896b6802ea84c46`
- **Workspace hash:** `d79dcb97158f26c21b7b17b2a739636a4fab71ccebe4312defe12d7596b9cd49`
- **Comparison fingerprint:** `bb71d545237679db7cb70ed2487a53de059f964a62e8d15c2bcb4f952f268d69`

## Prompt

Build an expense tracker where users add expenses, categorize spending, view monthly totals, and filter by date range.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782837942553/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782837942553/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782837942553/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782837942553/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782837956753

## Failure Reasons

- registry missing modules: auth

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=118 |
| Profile selected | INFO | EXPENSE_TRACKER_WEB_V1 |
| Workspace generated | PASS | 111 files, 25 directories |
| Manifest written | PASS | manifestHash=03c41d77d538… |
| Feature modules generated | PASS | 11 modules |
| Build executed | PASS | npmBuildDurationMs=3640 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
