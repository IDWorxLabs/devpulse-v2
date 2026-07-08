# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782898260803
- **Created:** 2026-07-01T09:31:00.750Z
- **Profile:** GENERIC_CUSTOM_APP_V1
- **App:** Calculator App
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `79089cc455f0b8dafbb982fb87a108ea3939d5fac987780183b05e6f7952d368`
- **Workspace hash:** `3aedc6d86824dc5c02212ed380c445d047a052fd7825c49933e9f1065b436715`
- **Comparison fingerprint:** `cc196bd7a0d51ecb1ec5258d7241c0f16ba3958fc7d887ed4978a3e950d11689`

## Prompt

build a calculator app

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/calculator-build-readiness-1782898251443/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/calculator-build-readiness-1782898251443/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/calculator-build-readiness-1782898251443/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/calculator-build-readiness-1782898251443/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782898260803

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=22 |
| Profile selected | INFO | GENERIC_CUSTOM_APP_V1 |
| Workspace generated | PASS | 57 files, 16 directories |
| Manifest written | PASS | manifestHash=79089cc455f0… |
| Feature modules generated | PASS | 1 modules |
| Build executed | PASS | npmBuildDurationMs=2574 |
| Preview verified | PASS | http://127.0.0.1:5181/ |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PASS | PASS — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
