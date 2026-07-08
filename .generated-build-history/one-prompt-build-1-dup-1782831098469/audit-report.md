# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782831098469
- **Created:** 2026-06-30T14:51:38.399Z
- **Profile:** EXPENSE_TRACKER_WEB_V1
- **App:** ExpenseTracker
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `b2037a84d13ec0afd8debec8b5c3a56aacab1330e0c87b0d13c7dfd691b07fc1`
- **Workspace hash:** `76157d7849e5bf455277a7114c62acd3dab49c332be8dc25e6f3a77fe027e690`
- **Comparison fingerprint:** `b2838011af4a04a3b2916af381e8b6d589333d74ef57d03689d7f5be6cd70be7`

## Prompt

Build a modern expense tracking web application called ExpenseTracker with categories, receipts, monthly budgets, and spending reports. Begin build execution now.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/expense-tracker-ui-1/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/expense-tracker-ui-1/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/expense-tracker-ui-1/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/expense-tracker-ui-1/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782831098469

## Failure Reasons

- registry missing modules: auth

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=162 |
| Profile selected | INFO | EXPENSE_TRACKER_WEB_V1 |
| Workspace generated | PASS | 105 files, 24 directories |
| Manifest written | PASS | manifestHash=b2037a84d13e… |
| Feature modules generated | PASS | 10 modules |
| Build executed | PASS | npmBuildDurationMs=3289 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
