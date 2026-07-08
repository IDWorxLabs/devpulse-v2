# Build History Audit Report

- **Run ID:** simple-recipe-organizer-app-where-i-can--1783372230602-2
- **Created:** 2026-07-06T21:10:31.508Z
- **Profile:** GENERIC_CUSTOM_APP_V1
- **App:** simple recipe organizer
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `120ca9c5e507684bdb6ee757186442a3d0b312b3875d4b47d062464743b57069`
- **Workspace hash:** `11a3009fa58de724dc9ae4418ccb8098622ab24b1a78aae850bf70dad90d88c3`
- **Comparison fingerprint:** `f9aa81d840446141ceed13a55011b1cfc9fd8513fee22e1dace0a104467f88e3`

## Prompt

Build a simple recipe organizer app where I can add recipes with ingredients and steps, and mark favorites.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/simple-recipe-organizer-app-where-i-can--1783372230602-2/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/simple-recipe-organizer-app-where-i-can--1783372230602-2/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/simple-recipe-organizer-app-where-i-can--1783372230602-2/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/simple-recipe-organizer-app-where-i-can--1783372230602-2/blueprint-manifest.json
- .generated-build-history/simple-recipe-organizer-app-where-i-can--1783372230602-2

## Failure Reasons

- Generated app materialization validation failed: Only 7/9 required UI terms detected in generated source.
- Generated app materialization validation failed: Only 7/9 required UI terms detected in generated source.
- Generated app materialization validation failed: Only 7/9 required UI terms detected in generated source.

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=107 |
| Profile selected | INFO | GENERIC_CUSTOM_APP_V1 |
| Workspace generated | PASS | 68 files, 18 directories |
| Manifest written | PASS | manifestHash=120ca9c5e507… |
| Feature modules generated | FAIL | 3 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=FAIL validation=FAIL |
