# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1783370812220
- **Created:** 2026-07-06T20:46:52.037Z
- **Profile:** GENERIC_CUSTOM_APP_V1
- **App:** Simple Counter App
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `a52956785289ade81b6d467c43884d16efacb6e86d6a5381e134f95dbd5a694e`
- **Workspace hash:** `255520e7ade7936ad5ae93fb4261ea9cb50639585b44266fe71bc48eabf357f6`
- **Comparison fingerprint:** `edfa180a5f9752add3608f82a780c1d4df7453c58f85a7a85d465ab424c997c4`

## Prompt

Build a simple counter app with increment and decrement buttons and a reset button, take two.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/simple-counter-app-1783370775362-2/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/simple-counter-app-1783370775362-2/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/simple-counter-app-1783370775362-2/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/simple-counter-app-1783370775362-2/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1783370812220

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=93 |
| Profile selected | INFO | GENERIC_CUSTOM_APP_V1 |
| Workspace generated | PASS | 57 files, 16 directories |
| Manifest written | PASS | manifestHash=a52956785289… |
| Feature modules generated | PASS | 1 modules |
| Build executed | PASS | npmBuildDurationMs=6334 |
| Preview verified | FAIL | http://127.0.0.1:5174/ |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PASS | PASS — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
