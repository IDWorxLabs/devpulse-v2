# Build History Audit Report

- **Run ID:** one-prompt-build-2-dup-1782830560033
- **Created:** 2026-06-30T14:42:39.930Z
- **Profile:** CRM_WEB_V1
- **App:** SaaS CRM
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `073e89f3bfb083fb2f051d5e721b4e01ba5b9969bd260e90345e48d7c1d8affb`
- **Workspace hash:** `b8a76e4b2ff5394e929f5cba202d520cc5340631a45a742bd3e9baa48ca0e4b3`
- **Comparison fingerprint:** `3a83458db29f28db92725ac6b725231c2a1a183fab96d6b25aa5e92a11b78530`

## Prompt

Build a SaaS CRM with customer records, deal pipeline, activity timeline, and team dashboard.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-preview-contract-saas-crm-1782830543904/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-preview-contract-saas-crm-1782830543904/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-preview-contract-saas-crm-1782830543904/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-preview-contract-saas-crm-1782830543904/blueprint-manifest.json
- .generated-build-history/one-prompt-build-2-dup-1782830560033

## Failure Reasons

- registry missing modules: auth, leads

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=93 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 107 files, 25 directories |
| Manifest written | PASS | manifestHash=073e89f3bfb0… |
| Feature modules generated | PASS | 10 modules |
| Build executed | PASS | npmBuildDurationMs=3729 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
