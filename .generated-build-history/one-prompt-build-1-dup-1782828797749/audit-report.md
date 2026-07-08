# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782828797749
- **Created:** 2026-06-30T14:13:17.747Z
- **Profile:** EXPENSE_TRACKER_WEB_V1
- **App:** Expense Tracker
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `913b336563b014383a2efc4f1c3f5208fefc6bbe699c69e01b50e8108a2fd6e6`
- **Workspace hash:** `0fce35cfbc501b53d7cdd5e7ee2abe1c8b73870d12fbfb16504251d0c0c5bd1b`
- **Comparison fingerprint:** `3b2e18cb74c1fd833610187a75f8edbaf885dc17fea0fa232ba26af6bb70fd6c`

## Prompt

Build an expense tracker where users add expenses, categorize spending, view monthly totals, and filter by date range.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-expense-tracker-1782828797443/.generated-app-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782828797749

## Failure Reasons

- Prompt is invalid or faithfulness did not pass — concrete pre-workspace blocker. AEE forbids PLANNING_FAILED after workspace evidence exists.
- Prompt is invalid or faithfulness did not pass — concrete pre-workspace blocker. AEE forbids PLANNING_FAILED after workspace evidence exists.

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=118 |
| Profile selected | INFO | EXPENSE_TRACKER_WEB_V1 |
| Workspace generated | PASS | 1 files, 0 directories |
| Manifest written | PASS | manifestHash=913b336563b0… |
| Feature modules generated | FAIL | 0 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | FAIL | status=ABORTED validation=FAIL |
