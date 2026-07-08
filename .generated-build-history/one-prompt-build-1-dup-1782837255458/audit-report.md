# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782837255458
- **Created:** 2026-06-30T16:34:15.361Z
- **Profile:** EXPENSE_TRACKER_WEB_V1
- **App:** Expense Tracker
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `6684fe45cd1f4abed73a2ee336ae08555928f1630c96eeb65295de71bb3d9ee9`
- **Workspace hash:** `83b1b24af73e6d25f58124f5b3fa27e807f1c740ec8ea7a81e8bcbbd4a71150d`
- **Comparison fingerprint:** `5379b242e686e5a2eb53072cafb8e51c65189256e5237ee945ffb51a31197fb2`

## Prompt

Build an expense tracker where users add expenses, categorize spending, view monthly totals, and filter by date range.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782837236670/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782837236670/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782837236670/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782837236670/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782837255458

## Failure Reasons

- registry missing modules: auth

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=118 |
| Profile selected | INFO | EXPENSE_TRACKER_WEB_V1 |
| Workspace generated | PASS | 111 files, 25 directories |
| Manifest written | PASS | manifestHash=6684fe45cd1f… |
| Feature modules generated | PASS | 11 modules |
| Build executed | PASS | npmBuildDurationMs=3702 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
