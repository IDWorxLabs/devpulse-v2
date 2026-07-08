# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782832034764
- **Created:** 2026-06-30T15:07:14.711Z
- **Profile:** CRM_WEB_V1
- **App:** SaaS CRM
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `174d14415f2618285e600a85cbcf2db39b8de8a0275d2e53ca650eab2583d90a`
- **Workspace hash:** `582c69bc0395ed228781460564a406ca4e828d8b9e157337f54cd929c14a78af`
- **Comparison fingerprint:** `50a670386c73028143357db0bf86c7513f2f506cd8ab873be88f7b67cbd1e013`

## Prompt

Build a SaaS CRM with customer records, deal pipeline, activity timeline, and team dashboard.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-saas-crm-1782832025555/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-saas-crm-1782832025555/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-saas-crm-1782832025555/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-saas-crm-1782832025555/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782832034764

## Failure Reasons

- registry missing modules: auth, leads

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=93 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 107 files, 25 directories |
| Manifest written | PASS | manifestHash=174d14415f26… |
| Feature modules generated | PASS | 10 modules |
| Build executed | PASS | npmBuildDurationMs=2432 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
