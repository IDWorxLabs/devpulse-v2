# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782830543128
- **Created:** 2026-06-30T14:42:23.038Z
- **Profile:** EXPENSE_TRACKER_WEB_V1
- **App:** Expense Tracker
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `c3c415322d627e080bf722644ac54febf793eff7c40e74283ddf7ccfcfaa267a`
- **Workspace hash:** `d51b84c11b25bc4200fbb1f9dfd18430445b4fd8338757e2d230f61194f48d65`
- **Comparison fingerprint:** `15b0cf2f6458f9cde4e4a2b71ff9d39716a989dd0b642b5debc0127661f949af`

## Prompt

Build an expense tracker where users add expenses, categorize spending, view monthly totals, and filter by date range.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-preview-contract-expense-tracker-1782830524451/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-preview-contract-expense-tracker-1782830524451/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-preview-contract-expense-tracker-1782830524451/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-preview-contract-expense-tracker-1782830524451/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782830543128

## Failure Reasons

- registry missing modules: auth

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=118 |
| Profile selected | INFO | EXPENSE_TRACKER_WEB_V1 |
| Workspace generated | PASS | 111 files, 25 directories |
| Manifest written | PASS | manifestHash=c3c415322d62… |
| Feature modules generated | PASS | 11 modules |
| Build executed | PASS | npmBuildDurationMs=3637 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
