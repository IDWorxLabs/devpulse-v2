# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782830137011
- **Created:** 2026-06-30T14:35:36.923Z
- **Profile:** EXPENSE_TRACKER_WEB_V1
- **App:** Expense Tracker
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `292dffe18eda74cebd88b9753ac13512ba2767ec0bf69c35397a97c7c4bd3539`
- **Workspace hash:** `d8d235057e5aa4ff5b46a9a7315efdb4b73eb67e3cdfb571652f8e2199358cd6`
- **Comparison fingerprint:** `5117bab8025c9baea466b1f8e1838a0f13531a0abe026bb67c110e3a866b0195`

## Prompt

Build an expense tracker where users add expenses, categorize spending, view monthly totals, and filter by date range.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-build-autofix-expense-tracker-1782830119679/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-build-autofix-expense-tracker-1782830119679/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-build-autofix-expense-tracker-1782830119679/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-build-autofix-expense-tracker-1782830119679/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782830137011

## Failure Reasons

- registry missing modules: auth

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=118 |
| Profile selected | INFO | EXPENSE_TRACKER_WEB_V1 |
| Workspace generated | PASS | 111 files, 25 directories |
| Manifest written | PASS | manifestHash=292dffe18eda… |
| Feature modules generated | PASS | 11 modules |
| Build executed | PASS | npmBuildDurationMs=5465 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
