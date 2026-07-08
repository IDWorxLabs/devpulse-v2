# Build History Audit Report

- **Run ID:** one-prompt-build-2-dup-1782829192722
- **Created:** 2026-06-30T14:19:52.620Z
- **Profile:** CRM_WEB_V1
- **App:** SaaS CRM
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `96306892c6077970ac6984be7fc6b165df801bfc52892fc1d1c01fd637c93fca`
- **Workspace hash:** `f471607a28b7ddc5bf5b1a2380037945e55807825569753441935aa2d8c85cc4`
- **Comparison fingerprint:** `c3189e3af1a1b39fa93b1ad779362f04be95dd663b94b424e6b4c9752c3e5fc0`

## Prompt

Build a SaaS CRM with customer records, deal pipeline, activity timeline, and team dashboard.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-saas-crm-1782829173324/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-saas-crm-1782829173324/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-saas-crm-1782829173324/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-saas-crm-1782829173324/blueprint-manifest.json
- .generated-build-history/one-prompt-build-2-dup-1782829192722

## Failure Reasons

- registry missing modules: auth, leads

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=93 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 107 files, 25 directories |
| Manifest written | PASS | manifestHash=96306892c607… |
| Feature modules generated | PASS | 10 modules |
| Build executed | PASS | npmBuildDurationMs=4050 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
