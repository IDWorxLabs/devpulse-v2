# Build History Audit Report

- **Run ID:** lisa-live-path-1782477667675
- **Created:** 2026-06-26T12:41:08.546Z
- **Profile:** GENERIC_CUSTOM_APP_V1
- **App:** LISA — Locked In Syndrome App
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `aad81bf6485c34ada0379a187499137b16a7979130d97e884c5698112769b6fc`
- **Workspace hash:** `437c159d501d39ab718204027ee58ff8400744747fdefde243dfe7953e15ace7`
- **Comparison fingerprint:** `bcae1e2e1bc024963013e26017ed20f4343669cb96b0972b27d3280fe62c34cc`

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

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/lisa-live-path-1782477667675/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/lisa-live-path-1782477667675/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/lisa-live-path-1782477667675/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/lisa-live-path-1782477667675/blueprint-manifest.json
- .generated-build-history/lisa-live-path-1782477667675

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
| Manifest written | PASS | manifestHash=aad81bf6485c… |
| Feature modules generated | FAIL | 14 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=FAIL validation=FAIL |
