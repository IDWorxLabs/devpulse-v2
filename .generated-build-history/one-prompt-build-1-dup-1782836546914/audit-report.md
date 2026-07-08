# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782836546914
- **Created:** 2026-06-30T16:22:26.819Z
- **Profile:** CRM_WEB_V1
- **App:** Internal HR / Admin Tool
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `97b9defe1c7244f771c6303facd88b6c51746367979cda2ff99889d574363e56`
- **Workspace hash:** `770acf6e16f4e1136369f12f97b83c8cd8480e208ae3bd9f2effb3aeb1423539`
- **Comparison fingerprint:** `da11c04e28361f10d6afb3683f4f0c52475aab4d02e218e5fff703e211372929`

## Prompt

Build an HR admin tool with employee directory, onboarding checklist, time-off requests, and payroll summary.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782836535159/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782836535159/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782836535159/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782836535159/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782836546914

## Failure Reasons

- registry missing modules: auth, leads, deals

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=109 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 123 files, 27 directories |
| Manifest written | PASS | manifestHash=97b9defe1c72… |
| Feature modules generated | PASS | 13 modules |
| Build executed | PASS | npmBuildDurationMs=2944 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
