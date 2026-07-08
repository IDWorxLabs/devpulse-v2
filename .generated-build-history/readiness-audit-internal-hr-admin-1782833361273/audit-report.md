# Build History Audit Report

- **Run ID:** readiness-audit-internal-hr-admin-1782833361273
- **Created:** 2026-06-30T15:29:21.711Z
- **Profile:** CRM_WEB_V1
- **App:** CRM
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `9273c4052457ca8954a7a429a63095c901a4df2758c29e53a642f392eddbca02`
- **Workspace hash:** `730c81f434a281c15f0bcce95084b9da3d37ef8df73e2773e96bb89d0a2f2f6b`
- **Comparison fingerprint:** `a162e2a875eda093b509bcb24fefff3b6afae454f13864f0c4961979c4a1d173`

## Prompt

Build an HR admin tool with employee directory, onboarding checklist, time-off requests, and payroll summary.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782833361273/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782833361273/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782833361273/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-internal-hr-admin-1782833361273/blueprint-manifest.json
- .generated-build-history/readiness-audit-internal-hr-admin-1782833361273

## Failure Reasons

- Planned module missing from workspace: employees; Planned module missing from workspace: onboarding; Planned module missing from workspace: time-off; Planned module missing from workspace: payroll
- Planned module missing from workspace: employees; Planned module missing from workspace: onboarding; Planned module missing from workspace: time-off; Planned module missing from workspace: payroll
- Planned module missing from workspace: employees; Planned module missing from workspace: onboarding; Planned module missing from workspace: time-off; Planned module missing from workspace: payroll

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=109 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 98 files, 23 directories |
| Manifest written | PASS | manifestHash=9273c4052457… |
| Feature modules generated | FAIL | 8 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=FAIL validation=FAIL |
