# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782833431540
- **Created:** 2026-06-30T15:30:31.484Z
- **Profile:** EXPENSE_TRACKER_WEB_V1
- **App:** Expense Tracker
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `c756aebacdd8b07cc24a86748c9a318e975969fd443dc82608c9d6802bbdb111`
- **Workspace hash:** `777ae33621d16de1920d800fa063baf5acb2f62e6f3a7d9a8f1242265310256c`
- **Comparison fingerprint:** `dd76aefbdc401cb57d3ef52416776200ae4aa9636bce60f5215fd7a9142cb422`

## Prompt

Build an expense tracker where users add expenses, categorize spending, view monthly totals, and filter by date range.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782833421673/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782833421673/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782833421673/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782833421673/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782833431540

## Failure Reasons

- registry missing modules: auth

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=118 |
| Profile selected | INFO | EXPENSE_TRACKER_WEB_V1 |
| Workspace generated | PASS | 111 files, 25 directories |
| Manifest written | PASS | manifestHash=c756aebacdd8… |
| Feature modules generated | PASS | 11 modules |
| Build executed | PASS | npmBuildDurationMs=2348 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
