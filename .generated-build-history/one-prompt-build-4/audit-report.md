# Build History Audit Report

- **Run ID:** one-prompt-build-4
- **Created:** 2026-06-30T14:16:04.525Z
- **Profile:** CRM_WEB_V1
- **App:** Internal HR / Admin Tool
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `96213535bf0293600d1263ed1a87c782b43727d4a24ab9f0f137193fc736a16c`
- **Workspace hash:** `418ebcaea40febd90b9553df80cdfb3d11cb11a28d7dcf6933c538ec3a395394`
- **Comparison fingerprint:** `51b526a2d08cb3d21151fc2539e6c6bf306fe2f4bc27b629efba06cea98824ad`

## Prompt

Build an HR admin tool with employee directory, onboarding checklist, time-off requests, and payroll summary.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-internal-hr-admin-1782828948618/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-internal-hr-admin-1782828948618/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-internal-hr-admin-1782828948618/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/aee-profile-continuation-internal-hr-admin-1782828948618/blueprint-manifest.json
- .generated-build-history/one-prompt-build-4

## Failure Reasons

- registry missing modules: auth, leads, deals

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=109 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 99 files, 23 directories |
| Manifest written | PASS | manifestHash=96213535bf02… |
| Feature modules generated | PASS | 9 modules |
| Build executed | PASS | npmBuildDurationMs=4166 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
