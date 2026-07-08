# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782829975984
- **Created:** 2026-06-30T14:32:55.901Z
- **Profile:** EXPENSE_TRACKER_WEB_V1
- **App:** Expense Tracker
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `f389033eb653b7ab7e71b66bcfc63de375ba929fbee9ebfb6269c40c4e79cda9`
- **Workspace hash:** `92ab7698f0bd618e7337ce0d0914dab77284c72670cca91aad565d34251e5c4f`
- **Comparison fingerprint:** `f3c2bcc6a5193e6da99cbe4983ade7714a708d5d5b94409fdbde5e6bfcbd0f48`

## Prompt

Build an expense tracker where users add expenses, categorize spending, view monthly totals, and filter by date range.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-build-autofix-expense-tracker-1782829956930/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-build-autofix-expense-tracker-1782829956930/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-build-autofix-expense-tracker-1782829956930/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-build-autofix-expense-tracker-1782829956930/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782829975984

## Failure Reasons

- registry missing modules: auth

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=118 |
| Profile selected | INFO | EXPENSE_TRACKER_WEB_V1 |
| Workspace generated | PASS | 111 files, 25 directories |
| Manifest written | PASS | manifestHash=f389033eb653… |
| Feature modules generated | PASS | 11 modules |
| Build executed | PASS | npmBuildDurationMs=3714 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
