# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782833275272
- **Created:** 2026-06-30T15:27:55.271Z
- **Profile:** CRM_WEB_V1
- **App:** Internal HR / Admin Tool
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `a201ee325199c7943f86219be22ed20050adcdb29ce701703dd898ce85e2f7ff`
- **Workspace hash:** `da7a25deea97df13e736303ea8d191ac9d6b4b140f9d2b236fd1d49356884292`
- **Comparison fingerprint:** `5c901f37ac6e893824508528ec4f0be09afe1af9498af58c3ff228b8cbcd6227`

## Prompt

Build an HR admin tool with employee directory, onboarding checklist, time-off requests, and payroll summary.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782833275177/.generated-app-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782833275272

## Failure Reasons

- Unexpected build error: resolveOutcome is not defined
- resolveOutcome is not defined
- Unexpected build error: resolveOutcome is not defined

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=109 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 1 files, 0 directories |
| Manifest written | PASS | manifestHash=a201ee325199… |
| Feature modules generated | FAIL | 0 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=FAIL validation=FAIL |
