# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782838866980
- **Created:** 2026-06-30T17:01:06.810Z
- **Profile:** ASSISTIVE_COMMUNICATION_APP_V1
- **App:** Assistive / Mobile Accessibility App
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `9cbb20d3177bc1b53a47ae63773a71fb7bab5833dfb7d2912f50615c29f4b029`
- **Workspace hash:** `28b100dc6dcced26a03795b85c3c99ab7fc599d3f60697afa6e69687c0ed3033`
- **Comparison fingerprint:** `c0095e34e56e24acc61024d11da4312f627d6b9d5e5ef8c7deab8f03d348534c`

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

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-assistive-mobile-accessibility-1782838838009/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-assistive-mobile-accessibility-1782838838009/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-assistive-mobile-accessibility-1782838838009/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/readiness-audit-assistive-mobile-accessibility-1782838838009/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782838866980

## Failure Reasons

- feature modules lack expected domain-specific language

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=475 |
| Profile selected | INFO | ASSISTIVE_COMMUNICATION_APP_V1 |
| Workspace generated | PASS | 129 files, 28 directories |
| Manifest written | PASS | manifestHash=9cbb20d3177b… |
| Feature modules generated | PASS | 14 modules |
| Build executed | PASS | npmBuildDurationMs=4813 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
