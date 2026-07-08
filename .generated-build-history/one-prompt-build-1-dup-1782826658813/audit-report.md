# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782826658813
- **Created:** 2026-06-30T13:37:38.811Z
- **Profile:** GENERIC_CUSTOM_APP_V1
- **App:** E-Commerce Store
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `6029572bd921a7c1e1fd71c1ffd1f4d09d132628134d9515b6d58f738557102d`
- **Workspace hash:** `1ac5cf96d501867ef55b9309426dec4bb9beb31d975ee4b68b2d1e109e2ead58`
- **Comparison fingerprint:** `d53aa1085e7df1aa5b018207a0045221f48feec2d96dce076b9a6b1c5606a9f9`

## Prompt

Build an e-commerce store with product catalog, shopping cart, checkout flow, and order history pages.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-e-commerce-store-1782826658797/.generated-app-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782826658813

## Failure Reasons

- Prompt faithfulness score below threshold.
- Prompt faithfulness score below threshold.

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=102 |
| Profile selected | INFO | GENERIC_CUSTOM_APP_V1 |
| Workspace generated | PASS | 1 files, 0 directories |
| Manifest written | PASS | manifestHash=6029572bd921… |
| Feature modules generated | FAIL | 0 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | FAIL | status=ABORTED validation=FAIL |
