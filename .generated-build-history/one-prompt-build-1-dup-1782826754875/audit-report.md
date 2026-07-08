# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782826754875
- **Created:** 2026-06-30T13:39:14.873Z
- **Profile:** CRM_WEB_V1
- **App:** SaaS CRM
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `41c1f7914fa52f810d7c3368f9c48b2f027b3f47e134c605d53ac79a8c7b00e4`
- **Workspace hash:** `57ab867081481d5797ea5486a18ae227570bce398bf04cf8a8deb781aae9ed4e`
- **Comparison fingerprint:** `a0b4e65f01cbbeb772d20f5141de9e52ad437f3145aa96542374435aa3929ba2`

## Prompt

Build a SaaS CRM with customer records, deal pipeline, activity timeline, and team dashboard.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-saas-crm-1782826754758/.generated-app-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782826754875

## Failure Reasons

- ASE-authorized materialization did not complete.
- ASE-authorized materialization did not complete.

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=93 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 1 files, 0 directories |
| Manifest written | PASS | manifestHash=41c1f7914fa5… |
| Feature modules generated | FAIL | 0 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=FAIL validation=FAIL |
