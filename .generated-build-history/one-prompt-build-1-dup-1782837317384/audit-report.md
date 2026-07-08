# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782837317384
- **Created:** 2026-06-30T16:35:17.287Z
- **Profile:** CRM_WEB_V1
- **App:** Internal HR / Admin Tool
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `a4d41a46e1d875cb1962da0252f98617fdd09fe4cc8e2d0cbef260ced3e6b1c5`
- **Workspace hash:** `f5d2287848b420089d772d7630aa0fa611034b977d95df9aa93698bf1186526c`
- **Comparison fingerprint:** `f5a1c57b0776ca06c0c566eb685ed9a367188781610cf504a4845fb2f8513387`

## Prompt

Build an HR admin tool with employee directory, onboarding checklist, time-off requests, and payroll summary.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782837303169/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782837303169/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782837303169/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782837303169/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782837317384

## Failure Reasons

- registry missing modules: auth, leads, deals

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=109 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 123 files, 27 directories |
| Manifest written | PASS | manifestHash=a4d41a46e1d8… |
| Feature modules generated | PASS | 13 modules |
| Build executed | PASS | npmBuildDurationMs=3621 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
