# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782833360793
- **Created:** 2026-06-30T15:29:20.792Z
- **Profile:** GENERIC_CUSTOM_APP_V1
- **App:** E-Commerce Store
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `22a49ee2da993e1e093fa0c7ae86d627914a8b08edf485e45f4679c3526647c7`
- **Workspace hash:** `ba1944928ea80a08ea3ca0901c310292cf0c55db830fd196a69d4907790f2ccd`
- **Comparison fingerprint:** `12bed366fd785b3804d3caf11d86f5b3c8e3a4efec6f8d0ab8eb1d668fa5e932`

## Prompt

Build an e-commerce store with product catalog, shopping cart, checkout flow, and order history pages.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-e-commerce-store-1782833360782/.generated-app-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782833360793

## Failure Reasons

- Prompt faithfulness score below threshold.
- Prompt faithfulness score below threshold.

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=102 |
| Profile selected | INFO | GENERIC_CUSTOM_APP_V1 |
| Workspace generated | PASS | 1 files, 0 directories |
| Manifest written | PASS | manifestHash=22a49ee2da99… |
| Feature modules generated | FAIL | 0 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | FAIL | status=ABORTED validation=FAIL |
