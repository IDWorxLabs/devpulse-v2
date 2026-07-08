# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782833360214
- **Created:** 2026-06-30T15:29:20.164Z
- **Profile:** CRM_WEB_V1
- **App:** SaaS CRM
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `5b0783c8f9c50547715b7fd3ca7e0e1e95209e1f58ecfd32e572736cd6bfc0c6`
- **Workspace hash:** `80f900b719a8972280821356a58a6ac40689eb2ed6258f11c5f5285a544d033e`
- **Comparison fingerprint:** `9677b0cf5842727e0f51bcff27e7e561809decc3cac30509acbc6929958e2f81`

## Prompt

Build a SaaS CRM with customer records, deal pipeline, activity timeline, and team dashboard.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-saas-crm-1782833348329/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-saas-crm-1782833348329/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-saas-crm-1782833348329/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-saas-crm-1782833348329/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782833360214

## Failure Reasons

- registry missing modules: auth, leads

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=93 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 114 files, 26 directories |
| Manifest written | PASS | manifestHash=5b0783c8f9c5… |
| Feature modules generated | PASS | 10 modules |
| Build executed | PASS | npmBuildDurationMs=2503 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
