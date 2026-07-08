# Build History Audit Report

- **Run ID:** one-prompt-build-4-dup-1782829210351
- **Created:** 2026-06-30T14:20:10.265Z
- **Profile:** CRM_WEB_V1
- **App:** Internal HR / Admin Tool
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `7b64096c1f02ea06ba2b0af6c0c7387f1d430fca7039bb01e4e2c61a96a69834`
- **Workspace hash:** `be0cd0bd9dd70fbd2361e4e3ea359002bc93dcbede2914056406e4c32db5c493`
- **Comparison fingerprint:** `f5ca769ec5a05ee71751ffd31430f4ea55e406113bdfd47833c2e0931060a48f`

## Prompt

Build an HR admin tool with employee directory, onboarding checklist, time-off requests, and payroll summary.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-internal-hr-admin-1782829192348/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-internal-hr-admin-1782829192348/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-internal-hr-admin-1782829192348/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-internal-hr-admin-1782829192348/blueprint-manifest.json
- .generated-build-history/one-prompt-build-4-dup-1782829210351

## Failure Reasons

- registry missing modules: auth, leads, deals

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=109 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 99 files, 23 directories |
| Manifest written | PASS | manifestHash=7b64096c1f02… |
| Feature modules generated | PASS | 9 modules |
| Build executed | PASS | npmBuildDurationMs=4163 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
