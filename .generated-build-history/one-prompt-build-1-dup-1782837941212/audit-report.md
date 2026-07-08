# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782837941212
- **Created:** 2026-06-30T16:45:41.052Z
- **Profile:** ASSISTIVE_COMMUNICATION_APP_V1
- **App:** Assistive / Mobile Accessibility App
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `f8e1baabf483a0b82afd65720915ea73d0a4d1cb0ccb09501dde328783407bd4`
- **Workspace hash:** `725e6471e023c24f01f54b10a9898c39982174ab8aafbf00cb3e34bc28a5b149`
- **Comparison fingerprint:** `23c2e6cd711199e210055987dc97893de1c9f286f9265d33130263ee0e057723`

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

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-assistive-mobile-accessibility-1782837920653/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-assistive-mobile-accessibility-1782837920653/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-assistive-mobile-accessibility-1782837920653/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-assistive-mobile-accessibility-1782837920653/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782837941212

## Failure Reasons

- feature modules lack expected domain-specific language

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=475 |
| Profile selected | INFO | ASSISTIVE_COMMUNICATION_APP_V1 |
| Workspace generated | PASS | 129 files, 28 directories |
| Manifest written | PASS | manifestHash=f8e1baabf483… |
| Feature modules generated | PASS | 14 modules |
| Build executed | PASS | npmBuildDurationMs=3643 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
