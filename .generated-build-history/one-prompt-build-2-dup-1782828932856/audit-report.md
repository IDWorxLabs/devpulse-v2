# Build History Audit Report

- **Run ID:** one-prompt-build-2-dup-1782828932856
- **Created:** 2026-06-30T14:15:32.855Z
- **Profile:** CRM_WEB_V1
- **App:** SaaS CRM
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `33b1a27cffa25393851979d4c15319dcc8c2ebbb83986c4270806622da2ca8d1`
- **Workspace hash:** `06fa8afb984a0ce1c2c3f03301536bd068a45e61f2e59e54ff89530726f93d89`
- **Comparison fingerprint:** `013c20c70bf8da53bda30975bb69c8f0072567744c2d8e68cc988f117369c3fd`

## Prompt

Build a SaaS CRM with customer records, deal pipeline, activity timeline, and team dashboard.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-saas-crm-1782828932735/.generated-app-manifest.json
- .generated-build-history/one-prompt-build-2-dup-1782828932856

## Failure Reasons

- Prompt is invalid or faithfulness did not pass — concrete pre-workspace blocker.
- Prompt is invalid or faithfulness did not pass — concrete pre-workspace blocker.

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=93 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 1 files, 0 directories |
| Manifest written | PASS | manifestHash=33b1a27cffa2… |
| Feature modules generated | FAIL | 0 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | FAIL | status=ABORTED validation=FAIL |
