# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782837236470
- **Created:** 2026-06-30T16:33:56.462Z
- **Profile:** ASSISTIVE_COMMUNICATION_APP_V1
- **App:** Assistive / Mobile Accessibility App
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `1b2aefecb9e4097a6ac44789a115faa593b72abcb638fc9f10f6ac1db475fe39`
- **Workspace hash:** `8d66a889c6f040e953355808abb7c919fad5dbe248911dc43ba7d774dba18161`
- **Comparison fingerprint:** `e48298bbd8325ceb1fde56ba0b1adc94031ff9db48a81c515ad8a2d2a56e3036`

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

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-assistive-mobile-accessibility-1782837235856/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-assistive-mobile-accessibility-1782837235856/build-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782837236470

## Failure Reasons

- Unexpected build error: Unsupported profile: ASSISTIVE_COMMUNICATION_APP_V1
- Unsupported profile: ASSISTIVE_COMMUNICATION_APP_V1
- Unexpected build error: Unsupported profile: ASSISTIVE_COMMUNICATION_APP_V1

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=475 |
| Profile selected | INFO | ASSISTIVE_COMMUNICATION_APP_V1 |
| Workspace generated | PASS | 8 files, 4 directories |
| Manifest written | PASS | manifestHash=1b2aefecb9e4… |
| Feature modules generated | FAIL | 0 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=FAIL validation=FAIL |
