# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782833463688
- **Created:** 2026-06-30T15:31:03.628Z
- **Profile:** CRM_WEB_V1
- **App:** Internal HR / Admin Tool
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `c55b5a2a182638a06df052c457e757752d2d9f3a1cc2e2d0f0d8054e1ceb50b3`
- **Workspace hash:** `7f9515671cda0cf4fbc5bc52642ea5f90659ce8523c2b7e8d652109ff20955d2`
- **Comparison fingerprint:** `0715dddcad7527a19cbf5573c922f07692431bd08e7f369ebacc4edfac729074`

## Prompt

Build an HR admin tool with employee directory, onboarding checklist, time-off requests, and payroll summary.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782833453965/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782833453965/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782833453965/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782833453965/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782833463688

## Failure Reasons

- registry missing modules: auth, leads, deals

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=109 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 123 files, 27 directories |
| Manifest written | PASS | manifestHash=c55b5a2a1826… |
| Feature modules generated | PASS | 13 modules |
| Build executed | PASS | npmBuildDurationMs=2557 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
