# Build History Audit Report

- **Run ID:** aee-profile-continuation-expense-tracker-1782828960625
- **Created:** 2026-06-30T14:16:01.740Z
- **Profile:** EXPENSE_TRACKER_WEB_V1
- **App:** Expense Tracker
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `4e9a5e3d8a08345c668d95dabcb68d71bf619d99184b0febf6f12e8ab4910de6`
- **Workspace hash:** `e24e332dbdccca3ce80633282c317a91de6cb591410fb77d80d678b3680e9a29`
- **Comparison fingerprint:** `6f29b0f2b9b932c20c4d026797f888cee1d7659e413372e3f2c5ac4f08fe1b19`

## Prompt

Build an expense tracker where users add expenses, categorize spending, view monthly totals, and filter by date range.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-expense-tracker-1782828960625/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-expense-tracker-1782828960625/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-expense-tracker-1782828960625/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-expense-tracker-1782828960625/blueprint-manifest.json
- .generated-build-history/aee-profile-continuation-expense-tracker-1782828960625

## Failure Reasons

- Banned fallback modules present in workspace: expenses
- Banned fallback modules present in workspace: expenses
- Banned fallback modules present in workspace: expenses

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=118 |
| Profile selected | INFO | EXPENSE_TRACKER_WEB_V1 |
| Workspace generated | PASS | 110 files, 25 directories |
| Manifest written | PASS | manifestHash=4e9a5e3d8a08… |
| Feature modules generated | FAIL | 10 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=FAIL validation=FAIL |
