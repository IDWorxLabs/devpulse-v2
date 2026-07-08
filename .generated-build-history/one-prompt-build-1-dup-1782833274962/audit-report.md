# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782833274962
- **Created:** 2026-06-30T15:27:54.961Z
- **Profile:** CRM_WEB_V1
- **App:** SaaS CRM
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `a673f03dcce7e1f827468f4a2f021d924409db4dd69baf7e53ae039d383d9b44`
- **Workspace hash:** `2eb8539d0d39a26507fd4282342ebc225600e821181c08ad818a0e658d962a3d`
- **Comparison fingerprint:** `4d0ba1398abb46fece8d9453d4445481d82a98a2547abde7b3d852ac4818cbb3`

## Prompt

Build a SaaS CRM with customer records, deal pipeline, activity timeline, and team dashboard.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-saas-crm-1782833274879/.generated-app-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782833274962

## Failure Reasons

- Unexpected build error: resolveOutcome is not defined
- resolveOutcome is not defined
- Unexpected build error: resolveOutcome is not defined

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=93 |
| Profile selected | INFO | CRM_WEB_V1 |
| Workspace generated | PASS | 1 files, 0 directories |
| Manifest written | PASS | manifestHash=a673f03dcce7… |
| Feature modules generated | FAIL | 0 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=FAIL validation=FAIL |
