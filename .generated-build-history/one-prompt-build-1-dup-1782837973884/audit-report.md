# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782837973884
- **Created:** 2026-06-30T16:46:13.798Z
- **Profile:** CRM_WEB_V1
- **App:** SaaS CRM
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `5143e6edb80bd11fab99ad82efd048d1ca19363f05542279e7ed082cb49ac91f`
- **Workspace hash:** `da6ccba1b4c4b16cfc719603a3ae38bb5a6ebd7098c6fa90e5abc53ebc7a2a03`
- **Comparison fingerprint:** `91840bced9fe24f4c982ac6d910a5af38e581aaa462b1f60af3e29a75ddb77d4`

## Prompt

Build a SaaS CRM with customer records, deal pipeline, activity timeline, and team dashboard.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-saas-crm-1782837957764/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-saas-crm-1782837957764/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-saas-crm-1782837957764/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-saas-crm-1782837957764/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782837973884

## Failure Reasons

- registry missing modules: auth, leads

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=93 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 114 files, 26 directories |
| Manifest written | PASS | manifestHash=5143e6edb80b… |
| Feature modules generated | PASS | 10 modules |
| Build executed | PASS | npmBuildDurationMs=3534 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
