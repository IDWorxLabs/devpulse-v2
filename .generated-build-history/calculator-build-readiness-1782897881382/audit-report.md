# Build History Audit Report

- **Run ID:** calculator-build-readiness-1782897881382
- **Created:** 2026-07-01T09:24:42.204Z
- **Profile:** GENERIC_CUSTOM_APP_V1
- **App:** calculator
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `07e7048df894a5916c593e593b76bd5ae27f0fc0f66e098763367a1b95c58bc4`
- **Workspace hash:** `63270451e7dca1f2801918239ddfeed138cb57d439b3f537b8c7940f556a4cc4`
- **Comparison fingerprint:** `5803d0eb0220a08b841fbbc363caba0ef072cfb0a3e3a2b5485ef22015f3fc23`

## Prompt

build a calculator app

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/calculator-build-readiness-1782897881382/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/calculator-build-readiness-1782897881382/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/calculator-build-readiness-1782897881382/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/calculator-build-readiness-1782897881382/blueprint-manifest.json
- .generated-build-history/calculator-build-readiness-1782897881382

## Failure Reasons

- Generated app materialization validation failed: Only 3/7 required UI terms detected in generated source.
- Generated app materialization validation failed: Only 3/7 required UI terms detected in generated source.
- Generated app materialization validation failed: Only 3/7 required UI terms detected in generated source.

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=22 |
| Profile selected | INFO | GENERIC_CUSTOM_APP_V1 |
| Workspace generated | PASS | 56 files, 16 directories |
| Manifest written | PASS | manifestHash=07e7048df894… |
| Feature modules generated | FAIL | 1 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=FAIL validation=FAIL |
