# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782833347660
- **Created:** 2026-06-30T15:29:07.606Z
- **Profile:** EXPENSE_TRACKER_WEB_V1
- **App:** Expense Tracker
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `2d6093237189d5b1d5e9f7183138190053aeb87a3c3017cc78be2aadb6c42f49`
- **Workspace hash:** `080828f2f86ae64551ea63272d4bb128899f5bb055ddeaee0e5bf2c939a3686a`
- **Comparison fingerprint:** `2bfa479786ca59cbcb008fea8b93d83555acd86559335da4f404063177e93d37`

## Prompt

Build an expense tracker where users add expenses, categorize spending, view monthly totals, and filter by date range.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782833337544/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782833337544/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782833337544/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782833337544/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782833347660

## Failure Reasons

- registry missing modules: auth

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=118 |
| Profile selected | INFO | EXPENSE_TRACKER_WEB_V1 |
| Workspace generated | PASS | 111 files, 25 directories |
| Manifest written | PASS | manifestHash=2d6093237189… |
| Feature modules generated | PASS | 11 modules |
| Build executed | PASS | npmBuildDurationMs=2529 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
