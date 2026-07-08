# Build History Audit Report

- **Run ID:** one-prompt-build-4-dup-1782829227755
- **Created:** 2026-06-30T14:20:27.679Z
- **Profile:** CRM_WEB_V1
- **App:** Internal HR / Admin Tool
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `986fa7cba707cb57fe59cb63684a69177f309e24ba3e6907571d92c643102c17`
- **Workspace hash:** `c884efe666402128bcc0e2599cc718a423872af2a72a4833f63a4a401dd37b74`
- **Comparison fingerprint:** `d9191705b0e7d9c1fced0ed1fb4d52598ecb9b9bafddda2d00be3ce0f4b57426`

## Prompt

Build an HR admin tool with employee directory, onboarding checklist, time-off requests, and payroll summary.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-internal-hr-admin-1782829210716/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-internal-hr-admin-1782829210716/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-internal-hr-admin-1782829210716/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-internal-hr-admin-1782829210716/blueprint-manifest.json
- .generated-build-history/one-prompt-build-4-dup-1782829227755

## Failure Reasons

- registry missing modules: auth, leads, deals

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=109 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 99 files, 23 directories |
| Manifest written | PASS | manifestHash=986fa7cba707… |
| Feature modules generated | PASS | 9 modules |
| Build executed | PASS | npmBuildDurationMs=4318 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
