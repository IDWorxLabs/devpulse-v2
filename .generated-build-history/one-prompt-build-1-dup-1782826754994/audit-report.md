# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782826754994
- **Created:** 2026-06-30T13:39:14.992Z
- **Profile:** GENERIC_CUSTOM_APP_V1
- **App:** E-Commerce Store
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `04c55312f808b80834473a167cbc35e004a842fa4887c4ee52ee136c705bf9e4`
- **Workspace hash:** `447ace745122b225d08d81afd572db3d024d55655a5e553c7b42b7f8bff37b81`
- **Comparison fingerprint:** `753b44ce17ba047a0a51bead0bf46e3205437c5988c74ba535e63a4d0574bc81`

## Prompt

Build an e-commerce store with product catalog, shopping cart, checkout flow, and order history pages.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-e-commerce-store-1782826754972/.generated-app-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782826754994

## Failure Reasons

- Prompt faithfulness score below threshold.
- Prompt faithfulness score below threshold.

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=102 |
| Profile selected | INFO | GENERIC_CUSTOM_APP_V1 |
| Workspace generated | PASS | 1 files, 0 directories |
| Manifest written | PASS | manifestHash=04c55312f808… |
| Feature modules generated | FAIL | 0 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | FAIL | status=ABORTED validation=FAIL |
