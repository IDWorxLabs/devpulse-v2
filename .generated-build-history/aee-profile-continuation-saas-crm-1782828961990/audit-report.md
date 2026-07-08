# Build History Audit Report

- **Run ID:** aee-profile-continuation-saas-crm-1782828961990
- **Created:** 2026-06-30T14:16:02.769Z
- **Profile:** CRM_WEB_V1
- **App:** CRM
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `69dd53f01fd0e37fa73398095cdf69e3018a9bb7acf233081062003474debb79`
- **Workspace hash:** `9f48f207eae6cb1e18e33de51590d60059ded29eba3730c972012a93be1e3854`
- **Comparison fingerprint:** `2ab0f68d9f9a0d0c54ba975565ea2b570ae7fd332af0f2d931649758fcf946c7`

## Prompt

Build a SaaS CRM with customer records, deal pipeline, activity timeline, and team dashboard.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-saas-crm-1782828961990/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-saas-crm-1782828961990/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-saas-crm-1782828961990/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-saas-crm-1782828961990/blueprint-manifest.json
- .generated-build-history/aee-profile-continuation-saas-crm-1782828961990

## Failure Reasons

- Banned fallback modules present in workspace: deals
- Banned fallback modules present in workspace: deals
- Banned fallback modules present in workspace: deals

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=93 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 106 files, 25 directories |
| Manifest written | PASS | manifestHash=69dd53f01fd0… |
| Feature modules generated | FAIL | 9 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=FAIL validation=FAIL |
