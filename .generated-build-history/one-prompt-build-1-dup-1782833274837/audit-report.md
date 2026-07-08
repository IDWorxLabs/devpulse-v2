# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782833274837
- **Created:** 2026-06-30T15:27:54.837Z
- **Profile:** EXPENSE_TRACKER_WEB_V1
- **App:** Expense Tracker
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `288940299d1a3ff6f739b0a11ecebe52fd6077b74741d387f3ed1d0a9ef02703`
- **Workspace hash:** `c897b3914910c18f59ce06b3ecfda79f5ecf9ca4b65f8bc528dae12dbb03a886`
- **Comparison fingerprint:** `1a74a15ce11adeba5c6ed1ed8f81c2fc3511ac5d9ef466d2e7fde37572afb195`

## Prompt

Build an expense tracker where users add expenses, categorize spending, view monthly totals, and filter by date range.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-expense-tracker-1782833274738/.generated-app-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782833274837

## Failure Reasons

- Unexpected build error: resolveOutcome is not defined
- resolveOutcome is not defined
- Unexpected build error: resolveOutcome is not defined

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=118 |
| Profile selected | INFO | EXPENSE_TRACKER_WEB_V1 |
| Workspace generated | PASS | 1 files, 0 directories |
| Manifest written | PASS | manifestHash=288940299d1a… |
| Feature modules generated | FAIL | 0 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=FAIL validation=FAIL |
