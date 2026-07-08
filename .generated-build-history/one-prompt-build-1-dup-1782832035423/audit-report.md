# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782832035423
- **Created:** 2026-06-30T15:07:15.422Z
- **Profile:** GENERIC_CUSTOM_APP_V1
- **App:** E-Commerce Store
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `628228f16ce419c78fc460100ddef3276a1c2d1334ebbb3b30a963a3c3e3715a`
- **Workspace hash:** `0c2534d43559b0c321663ec034f921c2aab10ee39b01473875eba3ef4fd11a44`
- **Comparison fingerprint:** `fc052aca088fc60b52014fcdb87a1c0c8a4c8fa6c6f5f408fa5304a15cbf09ed`

## Prompt

Build an e-commerce store with product catalog, shopping cart, checkout flow, and order history pages.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-e-commerce-store-1782832035412/.generated-app-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782832035423

## Failure Reasons

- Prompt faithfulness score below threshold.
- Prompt faithfulness score below threshold.

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=102 |
| Profile selected | INFO | GENERIC_CUSTOM_APP_V1 |
| Workspace generated | PASS | 1 files, 0 directories |
| Manifest written | PASS | manifestHash=628228f16ce4… |
| Feature modules generated | FAIL | 0 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | FAIL | status=ABORTED validation=FAIL |
