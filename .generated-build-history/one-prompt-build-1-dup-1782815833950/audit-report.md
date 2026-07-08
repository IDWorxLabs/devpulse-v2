# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782815833950
- **Created:** 2026-06-30T10:37:13.947Z
- **Profile:** GENERIC_CUSTOM_APP_V1
- **App:** LISA Continuation
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `c301bcf46e9beb878d3e0bfaf4c2446573f2bc6de6cd10ef5bab054d4ce131a7`
- **Workspace hash:** `8a16386e2b80996d81cd08c210488eb6156b9e71d4d80e4fca4a8e5d9b7f52c6`
- **Comparison fingerprint:** `c73557a71bba41b133dc6619f7c4e20a1f968fd4d90cd884152f46eb67447080`

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

Do not use generic project management fallback.

Generate architecture, plan, tasks, and begin build execution now.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/lisa-continuation-1782815833368/.generated-app-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782815833950

## Failure Reasons

- ASE denied materialization authorization.
- ASE denied materialization authorization.

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=543 |
| Profile selected | INFO | GENERIC_CUSTOM_APP_V1 |
| Workspace generated | PASS | 1 files, 0 directories |
| Manifest written | PASS | manifestHash=c301bcf46e9b… |
| Feature modules generated | FAIL | 0 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | FAIL | status=ABORTED validation=FAIL |
