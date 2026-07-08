# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782833443725
- **Created:** 2026-06-30T15:30:43.662Z
- **Profile:** CRM_WEB_V1
- **App:** SaaS CRM
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `c77593ef9a3c5a83861a9a722593d283b2805958a223196c8a0b2a678b736756`
- **Workspace hash:** `6e2e6eeedfcd62ec9a70a1c8eab836064cbc4df6b777ea91c905398e15cc5c7a`
- **Comparison fingerprint:** `42f6e773001732eb9cdcd3cb50d48620867d544f23fc714d9062145cbaca6bc8`

## Prompt

Build a SaaS CRM with customer records, deal pipeline, activity timeline, and team dashboard.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-saas-crm-1782833432156/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-saas-crm-1782833432156/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-saas-crm-1782833432156/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-saas-crm-1782833432156/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782833443725

## Failure Reasons

- registry missing modules: auth, leads

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=93 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 114 files, 26 directories |
| Manifest written | PASS | manifestHash=c77593ef9a3c… |
| Feature modules generated | PASS | 10 modules |
| Build executed | PASS | npmBuildDurationMs=2591 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
