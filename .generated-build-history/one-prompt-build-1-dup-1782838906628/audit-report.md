# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782838906628
- **Created:** 2026-06-30T17:01:46.545Z
- **Profile:** CRM_WEB_V1
- **App:** SaaS CRM
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `8a1f73d0b036bd549cf844c710dca0485d8d7eb501de8c7590d30bbd4ca135c5`
- **Workspace hash:** `da6128dd98fece250b91130901080a94f5e9089efb4bdb05e2e345bbb6671324`
- **Comparison fingerprint:** `27fe5a569ac46fd0752c044c29cb8348c4da79e19f28b23294fe0cfc825d9a05`

## Prompt

Build a SaaS CRM with customer records, deal pipeline, activity timeline, and team dashboard.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-saas-crm-1782838886128/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-saas-crm-1782838886128/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-saas-crm-1782838886128/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-saas-crm-1782838886128/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782838906628

## Failure Reasons

- registry missing modules: auth, leads

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=93 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 114 files, 26 directories |
| Manifest written | PASS | manifestHash=8a1f73d0b036… |
| Feature modules generated | PASS | 10 modules |
| Build executed | PASS | npmBuildDurationMs=6641 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
