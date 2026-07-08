# Build History Audit Report

- **Run ID:** one-prompt-build-4-dup-1782829115574
- **Created:** 2026-06-30T14:18:35.490Z
- **Profile:** CRM_WEB_V1
- **App:** Internal HR / Admin Tool
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `182cef0efdae05bb0d7f1cabec3d584b5023ecb14c85f9afa0a04565bd729b44`
- **Workspace hash:** `04255f27cb5d69762a60da0bb00c941ec9d7f0143a0596186fc1ad4f7870b6a5`
- **Comparison fingerprint:** `2e95cd92e1bdf1a0793611405ecf064014998fc57b6b17e1414a3bb9687c02bb`

## Prompt

Build an HR admin tool with employee directory, onboarding checklist, time-off requests, and payroll summary.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-internal-hr-admin-1782829100151/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-internal-hr-admin-1782829100151/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-internal-hr-admin-1782829100151/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-internal-hr-admin-1782829100151/blueprint-manifest.json
- .generated-build-history/one-prompt-build-4-dup-1782829115574

## Failure Reasons

- registry missing modules: auth, leads, deals

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=109 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 99 files, 23 directories |
| Manifest written | PASS | manifestHash=182cef0efdae… |
| Feature modules generated | PASS | 9 modules |
| Build executed | PASS | npmBuildDurationMs=3675 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
