# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782835285687
- **Created:** 2026-06-30T16:01:25.616Z
- **Profile:** CRM_WEB_V1
- **App:** Internal HR / Admin Tool
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `468480ca07ea8dcb15b9af9c39e77f13214540be04cdbe219c92dafaa10db0f6`
- **Workspace hash:** `d13309edd954a22a00b0cbc181f14cfc1ac933ddd74b956f5e5acec893541cd4`
- **Comparison fingerprint:** `3303da714180e0d838ebc32d096853d26f3b42cbf6d0011703e068578cc02498`

## Prompt

Build an HR admin tool with employee directory, onboarding checklist, time-off requests, and payroll summary.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782835276203/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782835276203/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782835276203/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782835276203/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782835285687

## Failure Reasons

- registry missing modules: auth, leads, deals

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=109 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 123 files, 27 directories |
| Manifest written | PASS | manifestHash=468480ca07ea… |
| Feature modules generated | PASS | 13 modules |
| Build executed | PASS | npmBuildDurationMs=2609 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
