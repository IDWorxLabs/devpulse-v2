# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782829172472
- **Created:** 2026-06-30T14:19:32.354Z
- **Profile:** EXPENSE_TRACKER_WEB_V1
- **App:** Expense Tracker
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `00fe711aaeeae8c66fe166a7363a0d203ca9f5783b1cbf58b07b81e2cc4d449c`
- **Workspace hash:** `3006b6c380ee8ea819b11a3fc9c5d5f7f275d2f9d9d273d1f045ee4da9a930fb`
- **Comparison fingerprint:** `c6799ea2f5cb7fcfa94d00466c00d1665bd995cfc13fac9f1d27fb09187fac07`

## Prompt

Build an expense tracker where users add expenses, categorize spending, view monthly totals, and filter by date range.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-expense-tracker-1782829149648/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-expense-tracker-1782829149648/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-expense-tracker-1782829149648/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-expense-tracker-1782829149648/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782829172472

## Failure Reasons

- registry missing modules: auth

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=118 |
| Profile selected | INFO | EXPENSE_TRACKER_WEB_V1 |
| Workspace generated | PASS | 111 files, 25 directories |
| Manifest written | PASS | manifestHash=00fe711aaeea… |
| Feature modules generated | PASS | 11 modules |
| Build executed | PASS | npmBuildDurationMs=4560 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
