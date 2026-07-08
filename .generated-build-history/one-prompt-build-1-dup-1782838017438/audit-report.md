# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782838017438
- **Created:** 2026-06-30T16:46:57.343Z
- **Profile:** CRM_WEB_V1
- **App:** Internal HR / Admin Tool
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `6c0c9838a87163f075ee192335b8199a1280e05906149eefec127b6f964498b1`
- **Workspace hash:** `980423dfddb85653463e540f57e3818844fab61f0816cbe836e8d6e886d7697d`
- **Comparison fingerprint:** `ca95fbc73350f1c4c1a5d829d439abdb4fbb25a4ba7fd51ac8237c383da7bcfb`

## Prompt

Build an HR admin tool with employee directory, onboarding checklist, time-off requests, and payroll summary.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782838003676/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782838003676/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782838003676/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782838003676/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782838017438

## Failure Reasons

- registry missing modules: auth, leads, deals

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=109 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 123 files, 27 directories |
| Manifest written | PASS | manifestHash=6c0c9838a871… |
| Feature modules generated | PASS | 13 modules |
| Build executed | PASS | npmBuildDurationMs=3388 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
