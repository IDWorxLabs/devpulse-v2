# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782826659135
- **Created:** 2026-06-30T13:37:39.134Z
- **Profile:** CRM_WEB_V1
- **App:** Internal HR / Admin Tool
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `619af4a1ac9757484a4f59a2e1881414cbda4a3c94cbac5b554be726bc6c260d`
- **Workspace hash:** `dd2d383522df2f359aea9863dba7a9e0a40328be9f1578461941934e188bbb90`
- **Comparison fingerprint:** `387483e314e3024e787815dbf2fa1aa938893ba98834316a1f87d72a8734ada0`

## Prompt

Build an HR admin tool with employee directory, onboarding checklist, time-off requests, and payroll summary.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782826659028/.generated-app-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782826659135

## Failure Reasons

- ASE-authorized materialization did not complete.
- ASE-authorized materialization did not complete.

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=109 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 1 files, 0 directories |
| Manifest written | PASS | manifestHash=619af4a1ac97… |
| Feature modules generated | FAIL | 0 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=FAIL validation=FAIL |
