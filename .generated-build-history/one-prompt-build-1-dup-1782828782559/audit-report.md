# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782828782559
- **Created:** 2026-06-30T14:13:02.557Z
- **Profile:** EXPENSE_TRACKER_WEB_V1
- **App:** Expense Tracker
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `7267be4bdd9fc2951d637138e8fc5329d07d44b4a6a0d5265836090d0a73a143`
- **Workspace hash:** `7690ca5639908db5da5db813ce13bf6b0b194e2abced9fed019e25ac704c601a`
- **Comparison fingerprint:** `552fc525582285070d7cf84f8c3accbe2dc81409cf68d9f94ed062a4a6964458`

## Prompt

Build an expense tracker where users add expenses, categorize spending, view monthly totals, and filter by date range.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-expense-tracker-1782828782215/.generated-app-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782828782559

## Failure Reasons

- Prompt is invalid or faithfulness did not pass — concrete pre-workspace blocker. AEE forbids PLANNING_FAILED after workspace evidence exists.
- Prompt is invalid or faithfulness did not pass — concrete pre-workspace blocker. AEE forbids PLANNING_FAILED after workspace evidence exists.

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=118 |
| Profile selected | INFO | EXPENSE_TRACKER_WEB_V1 |
| Workspace generated | PASS | 1 files, 0 directories |
| Manifest written | PASS | manifestHash=7267be4bdd9f… |
| Feature modules generated | FAIL | 0 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | FAIL | status=ABORTED validation=FAIL |
