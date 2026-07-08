# Build History Audit Report

- **Run ID:** one-prompt-build-4-dup-1782828995461
- **Created:** 2026-06-30T14:16:35.378Z
- **Profile:** CRM_WEB_V1
- **App:** Internal HR / Admin Tool
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `eba9cf91253f54ef89074ce381e8752f8232aed42d1503274d7354d2ba5df78f`
- **Workspace hash:** `150523f60ce8b740f77f2ea281903d04cff6b139f54b54d46a910cd14e1c277b`
- **Comparison fingerprint:** `50af00a33ccb3d168a4c96e4fb3e55ba3d0a16a5009fd88f51f1f92f2ed19cfd`

## Prompt

Build an HR admin tool with employee directory, onboarding checklist, time-off requests, and payroll summary.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-internal-hr-admin-1782828979239/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-internal-hr-admin-1782828979239/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-internal-hr-admin-1782828979239/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-internal-hr-admin-1782828979239/blueprint-manifest.json
- .generated-build-history/one-prompt-build-4-dup-1782828995461

## Failure Reasons

- registry missing modules: auth, leads, deals

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=109 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 99 files, 23 directories |
| Manifest written | PASS | manifestHash=eba9cf91253f… |
| Feature modules generated | PASS | 9 modules |
| Build executed | PASS | npmBuildDurationMs=3911 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
