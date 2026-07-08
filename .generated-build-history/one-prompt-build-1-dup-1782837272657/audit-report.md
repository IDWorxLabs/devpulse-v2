# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782837272657
- **Created:** 2026-06-30T16:34:32.571Z
- **Profile:** CRM_WEB_V1
- **App:** SaaS CRM
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `1ea9cab15c567213ea90f39243d60e0323cc7ae5a9562a2204b3cba6119d7303`
- **Workspace hash:** `ce6a391577d1d3e5b081d4d28054807def44baa022b493596a049acd11478f7a`
- **Comparison fingerprint:** `05bf6e126cac3abbb7ddc6aa095681f355a98f9675fa4418370f3d81b2566931`

## Prompt

Build a SaaS CRM with customer records, deal pipeline, activity timeline, and team dashboard.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-saas-crm-1782837256515/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-saas-crm-1782837256515/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-saas-crm-1782837256515/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-saas-crm-1782837256515/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782837272657

## Failure Reasons

- registry missing modules: auth, leads

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=93 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 114 files, 26 directories |
| Manifest written | PASS | manifestHash=1ea9cab15c56… |
| Feature modules generated | PASS | 10 modules |
| Build executed | PASS | npmBuildDurationMs=3484 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
