# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782833444321
- **Created:** 2026-06-30T15:30:44.320Z
- **Profile:** GENERIC_CUSTOM_APP_V1
- **App:** E-Commerce Store
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `8dc1d0566a4921be6e6d5b003689631151e4d1d43b31ab0311b528c81f124d0a`
- **Workspace hash:** `59d6ebb779cd3d4941672af4c8cbefbde733a587bb5387a5da14b53febf5815f`
- **Comparison fingerprint:** `9c40841f854b6bfbb4bcfc2b0a7e07ab66c72db33ef8895e9126d6b7ac9407bc`

## Prompt

Build an e-commerce store with product catalog, shopping cart, checkout flow, and order history pages.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-e-commerce-store-1782833444311/.generated-app-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782833444321

## Failure Reasons

- Prompt faithfulness score below threshold.
- Prompt faithfulness score below threshold.

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=102 |
| Profile selected | INFO | GENERIC_CUSTOM_APP_V1 |
| Workspace generated | PASS | 1 files, 0 directories |
| Manifest written | PASS | manifestHash=8dc1d0566a49… |
| Feature modules generated | FAIL | 0 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | FAIL | status=ABORTED validation=FAIL |
