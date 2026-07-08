# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782838884673
- **Created:** 2026-06-30T17:01:24.555Z
- **Profile:** EXPENSE_TRACKER_WEB_V1
- **App:** Expense Tracker
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `5e2940ba56a74fc66736488c0b50f5109778b2ab6d2228fb86a550798eaa7841`
- **Workspace hash:** `4323e2c72dec1106752922e3cdccc3e935f2ab2935dd727daf1b19d51fd56f2e`
- **Comparison fingerprint:** `da4ce97cd225d990a676643adb6ce523d86715bdca0ea33d45408c70af670df2`

## Prompt

Build an expense tracker where users add expenses, categorize spending, view monthly totals, and filter by date range.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782838868496/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782838868496/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782838868496/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782838868496/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782838884673

## Failure Reasons

- registry missing modules: auth

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=118 |
| Profile selected | INFO | EXPENSE_TRACKER_WEB_V1 |
| Workspace generated | PASS | 111 files, 25 directories |
| Manifest written | PASS | manifestHash=5e2940ba56a7… |
| Feature modules generated | PASS | 11 modules |
| Build executed | PASS | npmBuildDurationMs=3961 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
