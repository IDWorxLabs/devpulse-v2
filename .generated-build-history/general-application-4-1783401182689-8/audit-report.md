# Build History Audit Report

- **Run ID:** general-application-4-1783401182689-8
- **Created:** 2026-07-07T05:13:03.966Z
- **Profile:** GENERIC_CUSTOM_APP_V1
- **App:** Custom App
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `07bfaa20092e246cc6bc65654d991892ed67aaf764c6c4bd13757867c1ee8164`
- **Workspace hash:** `50a39f84c0ce09572545ae2524161ed5ee7640084a13f3438ad4c0b079195f36`
- **Comparison fingerprint:** `82c82b1a4cab69917ea3af062f2cf9205900ce2ea73931e3984cbd669454fcaf`

## Prompt

A simple app where I can keep a list of notes, add a note, and delete a note.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/general-application-4-1783401182689-8/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/general-application-4-1783401182689-8/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/general-application-4-1783401182689-8/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/general-application-4-1783401182689-8/blueprint-manifest.json
- .generated-build-history/general-application-4-1783401182689-8

## Failure Reasons

- Generated app materialization validation failed: Only 7/9 required UI terms detected in generated source.
- Generated app materialization validation failed: Only 7/9 required UI terms detected in generated source.
- Generated app materialization validation failed: Only 7/9 required UI terms detected in generated source.

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=77 |
| Profile selected | INFO | GENERIC_CUSTOM_APP_V1 |
| Workspace generated | PASS | 68 files, 18 directories |
| Manifest written | PASS | manifestHash=07bfaa20092e… |
| Feature modules generated | FAIL | 3 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=FAIL validation=FAIL |
