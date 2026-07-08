# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782897096638
- **Created:** 2026-07-01T09:11:36.636Z
- **Profile:** GENERIC_CUSTOM_APP_V1
- **App:** New Project
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `d09ddc60ad833cd5874e7749a3acfd0aa7ff75abe35e5be2e555c12dc4b4361c`
- **Workspace hash:** `caf2acefd8922c497d5119075dd753d47409153b9cc1168d2d3baf30867472cf`
- **Comparison fingerprint:** `41f74ee39ff428e16eb49960a6de1e64e624aed5d3b2e5780cb1c1734bd965a2`

## Prompt

build a calculator app

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/new-project-1782897096576-2/.generated-app-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782897096638

## Failure Reasons

- Planning did not produce a build-ready contract
- Planning did not produce a build-ready contract
- Planning did not produce a build-ready contract

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=22 |
| Profile selected | INFO | GENERIC_CUSTOM_APP_V1 |
| Workspace generated | PASS | 1 files, 0 directories |
| Manifest written | PASS | manifestHash=d09ddc60ad83… |
| Feature modules generated | FAIL | 0 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=FAIL validation=FAIL |
