# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782828932686
- **Created:** 2026-06-30T14:15:32.684Z
- **Profile:** EXPENSE_TRACKER_WEB_V1
- **App:** Expense Tracker
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `4194300faf39434fc52c0a21630b30746e05f7199584c1bac400a0580eeb04c2`
- **Workspace hash:** `c08a2b0318071b55e612a25186b342a4fe699f4223a8c3739b557e7c3ac673be`
- **Comparison fingerprint:** `dd86341d0239afac90cadb36633a6c227a8c48e7c55e8bb748aea60ab0fa7788`

## Prompt

Build an expense tracker where users add expenses, categorize spending, view monthly totals, and filter by date range.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-expense-tracker-1782828932429/.generated-app-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782828932686

## Failure Reasons

- Prompt is invalid or faithfulness did not pass — concrete pre-workspace blocker.
- Prompt is invalid or faithfulness did not pass — concrete pre-workspace blocker.

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=118 |
| Profile selected | INFO | EXPENSE_TRACKER_WEB_V1 |
| Workspace generated | PASS | 1 files, 0 directories |
| Manifest written | PASS | manifestHash=4194300faf39… |
| Feature modules generated | FAIL | 0 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | FAIL | status=ABORTED validation=FAIL |
