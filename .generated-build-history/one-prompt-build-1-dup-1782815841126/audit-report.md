# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782815841126
- **Created:** 2026-06-30T10:37:21.125Z
- **Profile:** GENERIC_CUSTOM_APP_V1
- **App:** LISA Continuation
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `6b10d6e889c18c08b2c019bec1f66ceb8d34dd8760f3040801f2368ac24d91a7`
- **Workspace hash:** `e47031f42b9267a51c372db33a7be58db6c26d828f90103bb9038a96bbbec997`
- **Comparison fingerprint:** `46688981d491acf3c03960fdd76820a97505af8e35893d61ed1f3dabff67abb7`

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

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/lisa-continuation-1782815840506/.generated-app-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782815841126

## Failure Reasons

- ASE denied materialization authorization.
- ASE denied materialization authorization.

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=543 |
| Profile selected | INFO | GENERIC_CUSTOM_APP_V1 |
| Workspace generated | PASS | 1 files, 0 directories |
| Manifest written | PASS | manifestHash=6b10d6e889c1… |
| Feature modules generated | FAIL | 0 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | FAIL | status=ABORTED validation=FAIL |
