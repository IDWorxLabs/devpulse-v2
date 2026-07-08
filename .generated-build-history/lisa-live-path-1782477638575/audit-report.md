# Build History Audit Report

- **Run ID:** lisa-live-path-1782477638575
- **Created:** 2026-06-26T12:40:39.388Z
- **Profile:** GENERIC_CUSTOM_APP_V1
- **App:** LISA — Locked In Syndrome App
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `5a93faff6041136afa493037bddd9f2e22ab7734ef7eebde6ab70d27bfb0b618`
- **Workspace hash:** `a9a2170b50c499f95ec293f95f35ae3986b5639326f75a5e68e74dbfff2ff15e`
- **Comparison fingerprint:** `aaa0dd114b542190a2083080058edaa62b103cd1f141e6fe8cdb840791b50c8f`

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

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/lisa-live-path-1782477638575/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/lisa-live-path-1782477638575/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/lisa-live-path-1782477638575/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/lisa-live-path-1782477638575/blueprint-manifest.json
- .generated-build-history/lisa-live-path-1782477638575

## Failure Reasons

- Unexpected build error: validatePromptFaithfulness is not defined
- validatePromptFaithfulness is not defined
- Unexpected build error: validatePromptFaithfulness is not defined

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=542 |
| Profile selected | INFO | GENERIC_CUSTOM_APP_V1 |
| Workspace generated | PASS | 134 files, 29 directories |
| Manifest written | PASS | manifestHash=5a93faff6041… |
| Feature modules generated | FAIL | 14 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=FAIL validation=FAIL |
