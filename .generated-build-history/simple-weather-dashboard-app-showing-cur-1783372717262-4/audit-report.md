# Build History Audit Report

- **Run ID:** simple-weather-dashboard-app-showing-cur-1783372717262-4
- **Created:** 2026-07-06T21:18:38.750Z
- **Profile:** GENERIC_CUSTOM_APP_V1
- **App:** simple weather dashboard
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `7ff217c40e2cd00afaeba4f21e935c581fdfd79654ebc014cd902941241df2c3`
- **Workspace hash:** `54d6a2b17f4d2012a339bff8e862009400b21bbc4c655d00afbb99572b4dfc22`
- **Comparison fingerprint:** `fd8704252ab2b4dff689815d140bbf7246bce973360875f17d2f74b906a6b5b6`

## Prompt

Build a simple weather dashboard app showing current temperature and a 5 day forecast for a city the user enters.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/simple-weather-dashboard-app-showing-cur-1783372717262-4/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/simple-weather-dashboard-app-showing-cur-1783372717262-4/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/simple-weather-dashboard-app-showing-cur-1783372717262-4/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/simple-weather-dashboard-app-showing-cur-1783372717262-4/blueprint-manifest.json
- .generated-build-history/simple-weather-dashboard-app-showing-cur-1783372717262-4

## Failure Reasons

- Generated app materialization validation failed: Only 7/9 required UI terms detected in generated source.
- Generated app materialization validation failed: Only 7/9 required UI terms detected in generated source.
- Generated app materialization validation failed: Only 7/9 required UI terms detected in generated source.

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=113 |
| Profile selected | INFO | GENERIC_CUSTOM_APP_V1 |
| Workspace generated | PASS | 68 files, 18 directories |
| Manifest written | PASS | manifestHash=7ff217c40e2c… |
| Feature modules generated | FAIL | 3 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=FAIL validation=FAIL |
