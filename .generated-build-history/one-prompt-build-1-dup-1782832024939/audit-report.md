# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782832024939
- **Created:** 2026-06-30T15:07:04.886Z
- **Profile:** EXPENSE_TRACKER_WEB_V1
- **App:** Expense Tracker
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `6bd95172013cd1616675ee8952f97994e2e806ae9c615e4d48574ccd36e7c977`
- **Workspace hash:** `74bcf344bb14d00717f21113818e13561ac98e3a50548d1245751bdc87f51eee`
- **Comparison fingerprint:** `9d33e1331d8ef8d253d2ac68396ba7db61a0b939030ab45126e51b7055e1ad34`

## Prompt

Build an expense tracker where users add expenses, categorize spending, view monthly totals, and filter by date range.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782832015781/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782832015781/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782832015781/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782832015781/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782832024939

## Failure Reasons

- registry missing modules: auth

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=118 |
| Profile selected | INFO | EXPENSE_TRACKER_WEB_V1 |
| Workspace generated | PASS | 111 files, 25 directories |
| Manifest written | PASS | manifestHash=6bd95172013c… |
| Feature modules generated | PASS | 11 modules |
| Build executed | PASS | npmBuildDurationMs=2481 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
