# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782831128701
- **Created:** 2026-06-30T14:52:08.619Z
- **Profile:** EXPENSE_TRACKER_WEB_V1
- **App:** ExpenseTracker
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `756d694b6d08504ee6dcac83c259179ff8f86e2166583580592efa59f0111823`
- **Workspace hash:** `d1424575c32564be244810fbdd0e960be1bdc62727d2e5cf5aab991686f2a7b3`
- **Comparison fingerprint:** `a56bdc287863dc0ef851f1d89378ac7f041b6809f8754b0d0c6f111b7c0a81ab`

## Prompt

Build a modern expense tracking web application called ExpenseTracker with categories, receipts, monthly budgets, and spending reports. Begin build execution now.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/expense-tracker-ui-1/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/expense-tracker-ui-1/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/expense-tracker-ui-1/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/expense-tracker-ui-1/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782831128701

## Failure Reasons

- registry missing modules: auth

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=162 |
| Profile selected | INFO | EXPENSE_TRACKER_WEB_V1 |
| Workspace generated | PASS | 105 files, 24 directories |
| Manifest written | PASS | manifestHash=756d694b6d08… |
| Feature modules generated | PASS | 10 modules |
| Build executed | PASS | npmBuildDurationMs=3542 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
