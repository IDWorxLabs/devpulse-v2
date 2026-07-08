# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782826658731
- **Created:** 2026-06-30T13:37:38.729Z
- **Profile:** CRM_WEB_V1
- **App:** SaaS CRM
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `b27b2eeff1677dbbccba23d16e566e7f11414df5c09aa2345f8c8232a28102df`
- **Workspace hash:** `5df745ce9d2eb45edb8f9c5b9879edf337151e747dc5fed8589093ca51afd812`
- **Comparison fingerprint:** `8cc3542a2ca8716b7b6f2b2d2dbf1cd69f4995e95f93e933a6f68a6e584ff392`

## Prompt

Build a SaaS CRM with customer records, deal pipeline, activity timeline, and team dashboard.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-saas-crm-1782826658600/.generated-app-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782826658731

## Failure Reasons

- ASE-authorized materialization did not complete.
- ASE-authorized materialization did not complete.

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=93 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 1 files, 0 directories |
| Manifest written | PASS | manifestHash=b27b2eeff167… |
| Feature modules generated | FAIL | 0 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=FAIL validation=FAIL |
