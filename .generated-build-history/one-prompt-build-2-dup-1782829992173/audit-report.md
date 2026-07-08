# Build History Audit Report

- **Run ID:** one-prompt-build-2-dup-1782829992173
- **Created:** 2026-06-30T14:33:12.089Z
- **Profile:** CRM_WEB_V1
- **App:** SaaS CRM
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `3de713264cee06faa443a4da164170de0c5dca190bb1634e3caa94e0b5f26669`
- **Workspace hash:** `523ed429d56d9a86547a62db44cd64e535243bc2eefba55b67009c19603f72a8`
- **Comparison fingerprint:** `81ad7ca0c8cb295836e86afe91c1528d6066a90c5b71e98b9dc687999a3e95d9`

## Prompt

Build a SaaS CRM with customer records, deal pipeline, activity timeline, and team dashboard.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-build-autofix-saas-crm-1782829976759/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-build-autofix-saas-crm-1782829976759/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-build-autofix-saas-crm-1782829976759/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-build-autofix-saas-crm-1782829976759/blueprint-manifest.json
- .generated-build-history/one-prompt-build-2-dup-1782829992173

## Failure Reasons

- registry missing modules: auth, leads

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=93 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 107 files, 25 directories |
| Manifest written | PASS | manifestHash=3de713264cee… |
| Feature modules generated | PASS | 10 modules |
| Build executed | PASS | npmBuildDurationMs=3518 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
