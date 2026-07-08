# Build History Audit Report

- **Run ID:** lisa-live-path-1782461376334
- **Created:** 2026-06-26T08:09:37.284Z
- **Profile:** GENERIC_CUSTOM_APP_V1
- **App:** LISA — Locked In Syndrome App
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `4c71ddbc8de4dcc38431204fbfb3346bc2d9df0470888fa0ef25c0cb2dc38c50`
- **Workspace hash:** `56a52103dd0893bb6ecc9e71216b23145d3c0f8f0512e4e1ac3dad892ec20238`
- **Comparison fingerprint:** `4d2d61f7818d70271cbcfacd10131360f747f01b613f9ecedfad0974aec93216`

## Prompt

Build LISA — Locked In Syndrome App.

An assistive communication app for locked-in syndrome users that converts eye movement, gaze, and blinks into speech.

Mobile-first Android phone preview required.

Required modules:
* onboarding-calibration
* eye-tracking-board
* blink-input-engine
* gaze-keyboard
* text-to-speech
* quick-phrases
* caregiver-dashboard
* communication-history
* accessibility-settings
* emergency-speech

Do not use generic project management fallback. Generate architecture, plan, tasks, and begin build execution now.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/lisa-live-path-1782461376334/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/lisa-live-path-1782461376334/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/lisa-live-path-1782461376334/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/lisa-live-path-1782461376334/blueprint-manifest.json
- .generated-build-history/lisa-live-path-1782461376334

## Failure Reasons

- Over-extracted non-module phrases in workspace: emergency-speech
- Over-extracted non-module phrases in workspace: emergency-speech
- Over-extracted non-module phrases in workspace: emergency-speech
- Over-extracted non-module phrases in workspace: emergency-speech

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=542 |
| Profile selected | INFO | GENERIC_CUSTOM_APP_V1 |
| Workspace generated | PASS | 116 files, 26 directories |
| Manifest written | PASS | manifestHash=4c71ddbc8de4… |
| Feature modules generated | FAIL | 11 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=FAIL validation=FAIL |
