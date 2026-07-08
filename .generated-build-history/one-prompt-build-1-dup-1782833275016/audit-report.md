# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782833275016
- **Created:** 2026-06-30T15:27:55.015Z
- **Profile:** GENERIC_CUSTOM_APP_V1
- **App:** E-Commerce Store
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `6d7bf6b5d95ecce291d61a2503fbba7a4ba6bf28951a338550d6f2573bd8c053`
- **Workspace hash:** `60d2111ab230a11ef5934f5b4ce04a6c26563c93343b02251ebd6f1ae5d8976a`
- **Comparison fingerprint:** `19f7673113788c48daf6def8aa6f6b5e4b041981bc4c97bf2f12da809107473a`

## Prompt

Build an e-commerce store with product catalog, shopping cart, checkout flow, and order history pages.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-e-commerce-store-1782833275005/.generated-app-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782833275016

## Failure Reasons

- Prompt faithfulness score below threshold.
- Prompt faithfulness score below threshold.

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=102 |
| Profile selected | INFO | GENERIC_CUSTOM_APP_V1 |
| Workspace generated | PASS | 1 files, 0 directories |
| Manifest written | PASS | manifestHash=6d7bf6b5d95e… |
| Feature modules generated | FAIL | 0 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | FAIL | status=ABORTED validation=FAIL |
