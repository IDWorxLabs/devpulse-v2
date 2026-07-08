# Build History Audit Report

- **Run ID:** lisa-live-path-1782461177538
- **Created:** 2026-06-26T08:06:18.514Z
- **Profile:** GENERIC_CUSTOM_APP_V1
- **App:** LISA — Locked In Syndrome App
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `0d9b274ba37ecb4321eea996241b2d2d5b5884a0a759e78417203335afd17d1a`
- **Workspace hash:** `9ca745f28b6e1292d2de3f7a9889dad2d4625e4b3815a8e74b0b158c6055d7da`
- **Comparison fingerprint:** `4a235248a6d9eb96275b6783cf8169ab8dcd6f3e134c7bd34286da8a631f9060`

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

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/lisa-live-path-1782461177538/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/lisa-live-path-1782461177538/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/lisa-live-path-1782461177538/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/lisa-live-path-1782461177538/blueprint-manifest.json
- .generated-build-history/lisa-live-path-1782461177538

## Failure Reasons

- Over-extracted non-module phrases materialized: emergency-speech.; Over-extracted non-module phrases in workspace: emergency-speech
- Over-extracted non-module phrases materialized: emergency-speech.; Over-extracted non-module phrases in workspace: emergency-speech
- Over-extracted non-module phrases materialized: emergency-speech.
- Over-extracted non-module phrases in workspace: emergency-speech
- Over-extracted non-module phrases materialized: emergency-speech.; Over-extracted non-module phrases in workspace: emergency-speech

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=542 |
| Profile selected | INFO | GENERIC_CUSTOM_APP_V1 |
| Workspace generated | PASS | 116 files, 26 directories |
| Manifest written | PASS | manifestHash=0d9b274ba37e… |
| Feature modules generated | FAIL | 11 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=FAIL validation=FAIL |
