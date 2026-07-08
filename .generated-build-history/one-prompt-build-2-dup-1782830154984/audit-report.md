# Build History Audit Report

- **Run ID:** one-prompt-build-2-dup-1782830154984
- **Created:** 2026-06-30T14:35:54.902Z
- **Profile:** CRM_WEB_V1
- **App:** SaaS CRM
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `110ba2cbecabac179eae1ce62f4ecfe49b4ac75572fe969b6ca8dd0bca8d7b34`
- **Workspace hash:** `790449b17d0108c0672abb85b3d46f492b544212fc33f07b3afc01f64341fc7a`
- **Comparison fingerprint:** `7593d38bb428372ba48588983f59211c59533339fe21a2159eebff41477dbe57`

## Prompt

Build a SaaS CRM with customer records, deal pipeline, activity timeline, and team dashboard.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-build-autofix-saas-crm-1782830137796/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-build-autofix-saas-crm-1782830137796/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-build-autofix-saas-crm-1782830137796/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-build-autofix-saas-crm-1782830137796/blueprint-manifest.json
- .generated-build-history/one-prompt-build-2-dup-1782830154984

## Failure Reasons

- registry missing modules: auth, leads

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=93 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 107 files, 25 directories |
| Manifest written | PASS | manifestHash=110ba2cbecab… |
| Feature modules generated | PASS | 10 modules |
| Build executed | PASS | npmBuildDurationMs=5281 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
