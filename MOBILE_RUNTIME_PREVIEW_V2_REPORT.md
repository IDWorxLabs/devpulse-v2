# MOBILE_RUNTIME_PREVIEW_V2

Generated: 2026-06-25T10:51:30.770Z  
Assessment ID: mobile-runtime-preview-v2-1  
Owner: `mobile-runtime-preview-v2`  
Baseline: V1/V1.1 (`MOBILE_RUNTIME_PREVIEW_V1_REPORT.md`)

## Executive summary

MOBILE_RUNTIME_PREVIEW_V2 assessment complete. Browser verified. Mobile web verified. Android VERIFIED (emulator-5554, API 36). Reality score: 58/100.

V2 adds **bounded Android emulator launch + adb verification** on top of V1/V1.1 SDK path detection. Native proof is never faked.

## V1/V1.1 baseline (Android before V2 launch)

| Signal | V1 value |
|--------|----------|
| SDK detected | true |
| adb detected | true |
| AVD detected | true |
| V1 Android state | DEVICE_RUNNING |
| V1 launch | deferred (Phase 1) |

## Android toolchain (V1.1 detection reused)

| Field | Value |
|-------|-------|
| SDK path | C:\Users\Richa\AppData\Local\Android\Sdk |
| SDK source | standard SDK path |
| adb path | C:\Users\Richa\AppData\Local\Android\Sdk\platform-tools\adb.exe |
| adb version | Android Debug Bridge version 1.0.41 |
| emulator path | C:\Users\Richa\AppData\Local\Android\Sdk\emulator\emulator.exe |
| AVD list | Medium_Phone_API_36.1 |

## V2 bounded Android launch

| Field | Value |
|-------|-------|
| Selected AVD | — |
| Emulator already running | true |
| Started by AiDevEngine | false |
| Launch attempted | false |
| Launch successful | true |
| Device serial | emulator-5554 |
| Device type | emulator |
| Boot completed | true |
| sys.boot_completed | 1 |
| dev.bootcomplete | 1 |
| API level | 36 |
| Device model | sdk_gphone64_x86_64 |
| Screen size | Physical size: 1080x2400 |
| Density | Physical density: 420 |
| Verification verdict | **VERIFIED** |
| Blocker / detail | Reused running emulator — verified |
| Elapsed ms | 784 |

## Final runtime matrix

| Runtime | Status | Detail |
|---------|--------|--------|
| Browser | verified | detected=true launchable=true launched=true verified=true |
| Mobile Web | verified | detected=true launchable=true launched=true verified=true |
| Android | verified | detected=true launchable=true launched=true verified=true |
| iOS | unsupported | detected=false launchable=false launched=false verified=false |
| Expo | detected | detected=true launchable=false launched=false verified=false |

## mobile-runtime-experience-reality integration

| Signal | Value |
|--------|-------|
| androidRuntimeLaunchEvidence | true |
| mobileRuntimeVerificationEvidence | true |
| Reality score | 58/100 |

## Remaining gap

Android native runtime verified via bounded emulator launch.
