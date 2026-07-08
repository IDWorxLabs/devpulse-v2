# Build History Audit Report

- **Run ID:** calculator-build-readiness-1782898003563
- **Created:** 2026-07-01T09:26:44.260Z
- **Profile:** GENERIC_CUSTOM_APP_V1
- **App:** calculator
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `ef64983e6de3cc8e209486ffcb3fec9a910d2230d1c43a957c6e7403c0b27121`
- **Workspace hash:** `5885cfde6cb9fc64d014b0d03f4ab5aa7600a894b8646608a83d707361f510d6`
- **Comparison fingerprint:** `980c99d3be3e8e2806949e3864363c06f6fa8a7598fe98f73cede836733a4173`

## Prompt

build a calculator app

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/calculator-build-readiness-1782898003563/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/calculator-build-readiness-1782898003563/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/calculator-build-readiness-1782898003563/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/calculator-build-readiness-1782898003563/blueprint-manifest.json
- .generated-build-history/calculator-build-readiness-1782898003563

## Failure Reasons

- Generated app materialization validation failed: Universal app materialization validation failed
- Generated app materialization validation failed: Universal app materialization validation failed
- Generated app materialization validation failed: Universal app materialization validation failed

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=22 |
| Profile selected | INFO | GENERIC_CUSTOM_APP_V1 |
| Workspace generated | PASS | 56 files, 16 directories |
| Manifest written | PASS | manifestHash=ef64983e6de3… |
| Feature modules generated | FAIL | 1 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=FAIL validation=FAIL |
