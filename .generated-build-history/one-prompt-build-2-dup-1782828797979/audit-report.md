# Build History Audit Report

- **Run ID:** one-prompt-build-2-dup-1782828797979
- **Created:** 2026-06-30T14:13:17.978Z
- **Profile:** CRM_WEB_V1
- **App:** SaaS CRM
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `906767185c420655c4d02cd8bacfa4823b2965c0eb66fbaae3d51c25beeccbb0`
- **Workspace hash:** `0e25347efedcab3f87da774665a1bfb55d9304bb0a6a52e65c6b567dbfac3fcc`
- **Comparison fingerprint:** `521d4468b71dd3e2ab77c451cdc5a538866d2b15ccf956b09f4219ba6a09bedc`

## Prompt

Build a SaaS CRM with customer records, deal pipeline, activity timeline, and team dashboard.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-saas-crm-1782828797810/.generated-app-manifest.json
- .generated-build-history/one-prompt-build-2-dup-1782828797979

## Failure Reasons

- Prompt is invalid or faithfulness did not pass — concrete pre-workspace blocker. AEE forbids PLANNING_FAILED after workspace evidence exists.
- Prompt is invalid or faithfulness did not pass — concrete pre-workspace blocker. AEE forbids PLANNING_FAILED after workspace evidence exists.

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=93 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 1 files, 0 directories |
| Manifest written | PASS | manifestHash=906767185c42… |
| Feature modules generated | FAIL | 0 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | FAIL | status=ABORTED validation=FAIL |
