# Build History Audit Report

- **Run ID:** one-prompt-build-3-dup-1783003658350
- **Created:** 2026-07-02T14:47:38.306Z
- **Profile:** GENERIC_CUSTOM_APP_V1
- **App:** calculator
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `4789ca284948a5a5ecb2598b403b7eee87e65b0717995a53b4cc7a90980b5eff`
- **Workspace hash:** `a31d593f09a18e462157522f755a37db9bac3d1176cc8f372659547ab6c4f303`
- **Comparison fingerprint:** `16a9f7ed239cbaa6bd95bcf64425d75f70ad4df4783a72d429d78fc728315687`

## Prompt

build a calculator app

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/calculator-1783003632243-2/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/calculator-1783003632243-2/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/calculator-1783003632243-2/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/calculator-1783003632243-2/blueprint-manifest.json
- .generated-build-history/one-prompt-build-3-dup-1783003658350

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=22 |
| Profile selected | INFO | GENERIC_CUSTOM_APP_V1 |
| Workspace generated | PASS | 57 files, 16 directories |
| Manifest written | PASS | manifestHash=4789ca284948… |
| Feature modules generated | PASS | 1 modules |
| Build executed | PASS | npmBuildDurationMs=2489 |
| Preview verified | PASS | http://127.0.0.1:5192/ |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PASS | PASS — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
