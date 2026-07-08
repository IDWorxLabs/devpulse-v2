# Build History Audit Report

- **Run ID:** general-application-3-1783398974831-7
- **Created:** 2026-07-07T04:36:15.503Z
- **Profile:** GENERIC_CUSTOM_APP_V1
- **App:** Custom App
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `cd99a8802a376d75bb72942b5e2d38692e8dc6d1402c5f317bcfd5c13c8f902f`
- **Workspace hash:** `6b61e386ac6f10f8867f50c44cdf31e93c4951615d95cb4460d0b86546d4e3ed`
- **Comparison fingerprint:** `6b7fb87df792028167ffe2c4b44f199b3eabb126fb7bfea95691026ff26b8381`

## Prompt

A simple counter app with a button to increase the count and a button to reset it to zero.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/general-application-3-1783398974831-7/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/general-application-3-1783398974831-7/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/general-application-3-1783398974831-7/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/general-application-3-1783398974831-7/blueprint-manifest.json
- .generated-build-history/general-application-3-1783398974831-7

## Failure Reasons

- Generated app materialization validation failed: Only 7/9 required UI terms detected in generated source.
- Generated app materialization validation failed: Only 7/9 required UI terms detected in generated source.
- Generated app materialization validation failed: Only 7/9 required UI terms detected in generated source.

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=90 |
| Profile selected | INFO | GENERIC_CUSTOM_APP_V1 |
| Workspace generated | PASS | 68 files, 18 directories |
| Manifest written | PASS | manifestHash=cd99a8802a37… |
| Feature modules generated | FAIL | 3 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=FAIL validation=FAIL |
