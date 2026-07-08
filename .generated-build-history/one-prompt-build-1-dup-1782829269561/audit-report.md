# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782829269561
- **Created:** 2026-06-30T14:21:09.480Z
- **Profile:** EXPENSE_TRACKER_WEB_V1
- **App:** Expense Tracker
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `84b4ed6069970607602afe55584529c257e67b42bf5091619423b83e9a578b27`
- **Workspace hash:** `27d75f1e417930044a7e36751ee348c3596328a646ea7ef2f193cce94c48a8ff`
- **Comparison fingerprint:** `ee93f1d68d1ce3c651604a51b00905bade8d6c83da4e68612b5f948760e94ff7`

## Prompt

Build an expense tracker where users add expenses, categorize spending, view monthly totals, and filter by date range.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-expense-tracker-1782829252638/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-expense-tracker-1782829252638/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-expense-tracker-1782829252638/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-expense-tracker-1782829252638/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782829269561

## Failure Reasons

- registry missing modules: auth

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=118 |
| Profile selected | INFO | EXPENSE_TRACKER_WEB_V1 |
| Workspace generated | PASS | 111 files, 25 directories |
| Manifest written | PASS | manifestHash=84b4ed606997… |
| Feature modules generated | PASS | 11 modules |
| Build executed | PASS | npmBuildDurationMs=3818 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
