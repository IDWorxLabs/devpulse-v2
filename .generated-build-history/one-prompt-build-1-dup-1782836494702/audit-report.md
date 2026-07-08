# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782836494702
- **Created:** 2026-06-30T16:21:34.631Z
- **Profile:** EXPENSE_TRACKER_WEB_V1
- **App:** Expense Tracker
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `035006f7691867e5c4c72a91ef2610a06aa5e8e3c2a487f718da8444875d7ce8`
- **Workspace hash:** `f82bfaf10389955770eaa8519856e3b65951a677d8564137ad2e8986c1046707`
- **Comparison fingerprint:** `a86146464bac1ce49541432d1a3d4677594e32bb7371a30179c1eb69263021ee`

## Prompt

Build an expense tracker where users add expenses, categorize spending, view monthly totals, and filter by date range.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782836482813/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782836482813/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782836482813/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782836482813/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782836494702

## Failure Reasons

- registry missing modules: auth

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=118 |
| Profile selected | INFO | EXPENSE_TRACKER_WEB_V1 |
| Workspace generated | PASS | 111 files, 25 directories |
| Manifest written | PASS | manifestHash=035006f76918… |
| Feature modules generated | PASS | 11 modules |
| Build executed | PASS | npmBuildDurationMs=2935 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
