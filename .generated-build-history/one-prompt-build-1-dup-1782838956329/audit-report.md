# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782838956329
- **Created:** 2026-06-30T17:02:36.206Z
- **Profile:** CRM_WEB_V1
- **App:** Internal HR / Admin Tool
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `efbb6ce9d2f6855e79e2bbdb79a19886e0f8d46f7ae1f499fa47c8bd04fe9057`
- **Workspace hash:** `45b2a325081bd41e1bc0b2809e700b9289a67f112cc07e3a11784302937bf0ff`
- **Comparison fingerprint:** `f82a92f4baf4ce8953fc3b79e78a3506169b5731b1319ce103c1940beb435f93`

## Prompt

Build an HR admin tool with employee directory, onboarding checklist, time-off requests, and payroll summary.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782838941541/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782838941541/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782838941541/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782838941541/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782838956329

## Failure Reasons

- registry missing modules: auth, leads, deals

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=109 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 123 files, 27 directories |
| Manifest written | PASS | manifestHash=efbb6ce9d2f6… |
| Feature modules generated | PASS | 13 modules |
| Build executed | PASS | npmBuildDurationMs=3653 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
