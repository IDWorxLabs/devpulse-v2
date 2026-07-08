# Build History Audit Report

- **Run ID:** one-prompt-build-4-dup-1782829311113
- **Created:** 2026-06-30T14:21:51.050Z
- **Profile:** CRM_WEB_V1
- **App:** Internal HR / Admin Tool
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `5594a1507280e63b9b553dcdd13809c5e2e0a7074e8d1b26134e952378dcf757`
- **Workspace hash:** `59e34190a3dbf3b4e7e9ab44090352c9fc86ead042ace4518c137e616b9cf6ae`
- **Comparison fingerprint:** `b730b2fb2b404f096a3b09fed9c6412dcc0d808b676c01555ae5784cfd9e74d7`

## Prompt

Build an HR admin tool with employee directory, onboarding checklist, time-off requests, and payroll summary.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-internal-hr-admin-1782829297955/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-internal-hr-admin-1782829297955/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-internal-hr-admin-1782829297955/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-internal-hr-admin-1782829297955/blueprint-manifest.json
- .generated-build-history/one-prompt-build-4-dup-1782829311113

## Failure Reasons

- registry missing modules: auth, leads, deals

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=109 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 99 files, 23 directories |
| Manifest written | PASS | manifestHash=5594a1507280… |
| Feature modules generated | PASS | 9 modules |
| Build executed | PASS | npmBuildDurationMs=3155 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
