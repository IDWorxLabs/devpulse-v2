# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782832054331
- **Created:** 2026-06-30T15:07:34.267Z
- **Profile:** CRM_WEB_V1
- **App:** Internal HR / Admin Tool
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `69e40fd7fd767dd47e88a5dcd60851131213f88bcde6e67f64d895978f5d94d9`
- **Workspace hash:** `b1feedf4e6eb54b89deec30ee6c4535dcc8c1b360dea77f019f913d85b0de6f3`
- **Comparison fingerprint:** `9b95dea70468912b3f6e431e7fe9e15a36e68e8ac437eef11482bef3b84b3de9`

## Prompt

Build an HR admin tool with employee directory, onboarding checklist, time-off requests, and payroll summary.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782832044756/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782832044756/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782832044756/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782832044756/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782832054331

## Failure Reasons

- registry missing modules: auth, leads, deals

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=109 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 99 files, 23 directories |
| Manifest written | PASS | manifestHash=69e40fd7fd76… |
| Feature modules generated | PASS | 9 modules |
| Build executed | PASS | npmBuildDurationMs=2480 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
