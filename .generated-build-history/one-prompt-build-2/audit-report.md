# Build History Audit Report

- **Run ID:** one-prompt-build-2
- **Created:** 2026-06-30T14:13:02.759Z
- **Profile:** CRM_WEB_V1
- **App:** SaaS CRM
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `cd71657d915a6ed27c1e216d3031582870e0c48cda82440099e455fb967aa480`
- **Workspace hash:** `e8a8556216cc00d0da3cdcbecbefda68e0fdbe387593885fb51d18b1d581a718`
- **Comparison fingerprint:** `03d2d7372f61db9ee315856f2a89ac9f9847b893a25750ff55f4076bedac7222`

## Prompt

Build a SaaS CRM with customer records, deal pipeline, activity timeline, and team dashboard.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-saas-crm-1782828782610/.generated-app-manifest.json
- .generated-build-history/one-prompt-build-2

## Failure Reasons

- Prompt is invalid or faithfulness did not pass — concrete pre-workspace blocker. AEE forbids PLANNING_FAILED after workspace evidence exists.
- Prompt is invalid or faithfulness did not pass — concrete pre-workspace blocker. AEE forbids PLANNING_FAILED after workspace evidence exists.

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=93 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 1 files, 0 directories |
| Manifest written | PASS | manifestHash=cd71657d915a… |
| Feature modules generated | FAIL | 0 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | FAIL | status=ABORTED validation=FAIL |
