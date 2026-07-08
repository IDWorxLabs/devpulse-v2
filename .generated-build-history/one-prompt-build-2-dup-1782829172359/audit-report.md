# Build History Audit Report

- **Run ID:** one-prompt-build-2-dup-1782829172359
- **Created:** 2026-06-30T14:19:32.244Z
- **Profile:** CRM_WEB_V1
- **App:** SaaS CRM
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `dfc6fb78a4651c88e0cf3e874ab1e0bd4c7b717029f4de0f94a39d5cdd38e8b2`
- **Workspace hash:** `9928163b19a203c82886cf012001060c51f0e65b11e6df8c4fc2785ab575832f`
- **Comparison fingerprint:** `9a66fba2bbaea37ea5d64aa0441e9f8f2b613e46b712eb338d7908417c7a589d`

## Prompt

Build a SaaS CRM with customer records, deal pipeline, activity timeline, and team dashboard.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-saas-crm-1782829149475/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-saas-crm-1782829149475/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-saas-crm-1782829149475/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-saas-crm-1782829149475/blueprint-manifest.json
- .generated-build-history/one-prompt-build-2-dup-1782829172359

## Failure Reasons

- registry missing modules: auth, leads

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=93 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 107 files, 25 directories |
| Manifest written | PASS | manifestHash=dfc6fb78a465… |
| Feature modules generated | PASS | 10 modules |
| Build executed | PASS | npmBuildDurationMs=4677 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
