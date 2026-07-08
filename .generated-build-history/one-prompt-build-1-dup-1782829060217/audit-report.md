# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782829060217
- **Created:** 2026-06-30T14:17:40.097Z
- **Profile:** EXPENSE_TRACKER_WEB_V1
- **App:** Expense Tracker
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `53233f6919d478da0608e53975b216588d16e90f2ed1532f118649bfacc0e238`
- **Workspace hash:** `426965291d83378995916d05808c677ec2e0ea91929c55187440baa0508d0a6b`
- **Comparison fingerprint:** `7008843c198a26bbeb00d719960865993aa387da656bb98f326a9e31a0a88f52`

## Prompt

Build an expense tracker where users add expenses, categorize spending, view monthly totals, and filter by date range.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-expense-tracker-1782829042209/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-expense-tracker-1782829042209/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-expense-tracker-1782829042209/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-expense-tracker-1782829042209/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782829060217

## Failure Reasons

- registry missing modules: auth

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=118 |
| Profile selected | INFO | EXPENSE_TRACKER_WEB_V1 |
| Workspace generated | PASS | 111 files, 25 directories |
| Manifest written | PASS | manifestHash=53233f6919d4… |
| Feature modules generated | PASS | 11 modules |
| Build executed | PASS | npmBuildDurationMs=4438 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
