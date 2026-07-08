# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782826755350
- **Created:** 2026-06-30T13:39:15.349Z
- **Profile:** CRM_WEB_V1
- **App:** Internal HR / Admin Tool
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `14fcafb74b2cb0d73e025c5b15ee62ee5d1560c078528ae77503e2354a0c426a`
- **Workspace hash:** `bb81837a8ca14f143e7ae8b735d714db0e5e6136ac2a3a73a65b10b16f700851`
- **Comparison fingerprint:** `eaf80a1316d5e5a819b8db05550ef17cd8bf70528598b8deeb27f0e1d04c4d09`

## Prompt

Build an HR admin tool with employee directory, onboarding checklist, time-off requests, and payroll summary.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782826755234/.generated-app-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782826755350

## Failure Reasons

- ASE-authorized materialization did not complete.
- ASE-authorized materialization did not complete.

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=109 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 1 files, 0 directories |
| Manifest written | PASS | manifestHash=14fcafb74b2c… |
| Feature modules generated | FAIL | 0 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=FAIL validation=FAIL |
