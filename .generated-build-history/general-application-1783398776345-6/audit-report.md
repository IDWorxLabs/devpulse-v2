# Build History Audit Report

- **Run ID:** general-application-1783398776345-6
- **Created:** 2026-07-07T04:32:57.528Z
- **Profile:** GENERIC_CUSTOM_APP_V1
- **App:** Custom App
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `32c7b8d9a34ecbab915f33c3c240439a7718f62bfeb9ca60be1b54e4cd76a2d6`
- **Workspace hash:** `bce996cd9e66b13dbc1b3ab458800a95c4dcbfd9f16a6cb0ba645fae1ef3cabc`
- **Comparison fingerprint:** `4437994ae03ff227caac107b1c0cd3a30226a16c34d4ccb0366d5f7ea67ba88a`

## Prompt

A simple app where I can keep a list of items, mark them done, and remove them.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/general-application-1783398776345-6/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/general-application-1783398776345-6/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/general-application-1783398776345-6/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/general-application-1783398776345-6/blueprint-manifest.json
- .generated-build-history/general-application-1783398776345-6

## Failure Reasons

- Generated app materialization validation failed: Only 7/9 required UI terms detected in generated source.
- Generated app materialization validation failed: Only 7/9 required UI terms detected in generated source.
- Generated app materialization validation failed: Only 7/9 required UI terms detected in generated source.

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=79 |
| Profile selected | INFO | GENERIC_CUSTOM_APP_V1 |
| Workspace generated | PASS | 68 files, 18 directories |
| Manifest written | PASS | manifestHash=32c7b8d9a34e… |
| Feature modules generated | FAIL | 3 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=FAIL validation=FAIL |
