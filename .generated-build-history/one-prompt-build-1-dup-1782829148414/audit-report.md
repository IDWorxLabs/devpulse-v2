# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782829148414
- **Created:** 2026-06-30T14:19:08.291Z
- **Profile:** EXPENSE_TRACKER_WEB_V1
- **App:** Expense Tracker
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `267cf0f0bd58c72bf31c25a98181012b76e4fad3345ac5b78d1b32489cf560e8`
- **Workspace hash:** `1a10f27c96dedadd133439064ce42d168e0e385ce297ca50c64b75c4326e28fb`
- **Comparison fingerprint:** `539476fdbbe3bf3afb2c05e9e42731e11c5a7a78a60388e627dc00fe25a77b3f`

## Prompt

Build an expense tracker where users add expenses, categorize spending, view monthly totals, and filter by date range.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-expense-tracker-1782829129934/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-expense-tracker-1782829129934/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-expense-tracker-1782829129934/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-expense-tracker-1782829129934/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782829148414

## Failure Reasons

- registry missing modules: auth

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=118 |
| Profile selected | INFO | EXPENSE_TRACKER_WEB_V1 |
| Workspace generated | PASS | 111 files, 25 directories |
| Manifest written | PASS | manifestHash=267cf0f0bd58… |
| Feature modules generated | PASS | 11 modules |
| Build executed | PASS | npmBuildDurationMs=4824 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
