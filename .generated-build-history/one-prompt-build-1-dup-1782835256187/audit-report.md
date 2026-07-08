# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782835256187
- **Created:** 2026-06-30T16:00:56.135Z
- **Profile:** CRM_WEB_V1
- **App:** SaaS CRM
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `98fc2f6dfaf8cba46ef28f79b5c882cf6c379b8684f8e9c6b17fc04cdcf0197b`
- **Workspace hash:** `e0351e99bc7429b78340cbb166a9f20fa83b35c3681c31a5365eb738079ce59b`
- **Comparison fingerprint:** `f0b0c01c75f75bc6ab6b5c8af0496131965589ac195239202bc3de94f3aabc75`

## Prompt

Build a SaaS CRM with customer records, deal pipeline, activity timeline, and team dashboard.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-saas-crm-1782835244894/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-saas-crm-1782835244894/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-saas-crm-1782835244894/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-saas-crm-1782835244894/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782835256187

## Failure Reasons

- registry missing modules: auth, leads

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=93 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 114 files, 26 directories |
| Manifest written | PASS | manifestHash=98fc2f6dfaf8… |
| Feature modules generated | PASS | 10 modules |
| Build executed | PASS | npmBuildDurationMs=2701 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
