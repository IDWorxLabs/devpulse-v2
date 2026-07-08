# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782835244280
- **Created:** 2026-06-30T16:00:44.226Z
- **Profile:** EXPENSE_TRACKER_WEB_V1
- **App:** Expense Tracker
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `4bfd1558327f41e6593596b84ea86894b5442d26548abb6ff64eeb2d18d2b08e`
- **Workspace hash:** `60ee20c38848eec0336b7b1d58c439cb81c5433d085729c113f38565ac81af9a`
- **Comparison fingerprint:** `15bfd2fba5ffd14a41a19a9f3e90d6ecbea5960a7d0c47f955f2beda1518cd12`

## Prompt

Build an expense tracker where users add expenses, categorize spending, view monthly totals, and filter by date range.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782835235082/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782835235082/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782835235082/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782835235082/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782835244280

## Failure Reasons

- registry missing modules: auth

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=118 |
| Profile selected | INFO | EXPENSE_TRACKER_WEB_V1 |
| Workspace generated | PASS | 111 files, 25 directories |
| Manifest written | PASS | manifestHash=4bfd1558327f… |
| Feature modules generated | PASS | 11 modules |
| Build executed | PASS | npmBuildDurationMs=2514 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
