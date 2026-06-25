/**
 * Mobile Runtime Preview V2 — report builder.
 */

import { MOBILE_RUNTIME_PREVIEW_V1_REPORT_FILENAME } from '../mobile-runtime-preview-v1/mobile-runtime-preview-bounds.js';
import type { MobileRuntimePreviewV2Assessment } from './mobile-runtime-preview-v2-types.js';

function statusLabel(detected: boolean, launchable: boolean, launched: boolean, verified: boolean): string {
  if (verified) return 'verified';
  if (launched) return 'launched';
  if (launchable) return 'launchable';
  if (detected) return 'detected';
  return 'unsupported';
}

export function buildMobileRuntimePreviewV2ReportMarkdown(assessment: MobileRuntimePreviewV2Assessment): string {
  const { v1Baseline, capabilityMatrix, verificationRecords, androidLaunchEvidence: ev, realityBridge } = assessment;
  const tc = capabilityMatrix.androidToolchain;

  const browser = verificationRecords.find((r) => r.runtimeId === 'BROWSER');
  const mobileWeb = verificationRecords.find((r) => r.runtimeId === 'MOBILE_WEB');
  const android = verificationRecords.find((r) => r.runtimeId === 'ANDROID');
  const ios = verificationRecords.find((r) => r.runtimeId === 'IOS');
  const expo = verificationRecords.find((r) => r.runtimeId === 'EXPO');

  const runtimeMatrix = [
    ['Browser', browser?.detected, true, browser?.launchSuccessful, browser?.verificationSuccessful],
    ['Mobile Web', mobileWeb?.detected, true, mobileWeb?.launchSuccessful, mobileWeb?.verificationSuccessful],
    ['Android', android?.detected, v1Baseline.adapterStatuses.find((s) => s.runtimeId === 'ANDROID')?.launchable, android?.launchSuccessful, android?.verificationSuccessful],
    ['iOS', ios?.detected, false, ios?.launchSuccessful, ios?.verificationSuccessful],
    ['Expo', expo?.detected, v1Baseline.adapterStatuses.find((s) => s.runtimeId === 'EXPO')?.launchable, expo?.launchSuccessful, expo?.verificationSuccessful],
  ]
    .map(([name, det, launchable, launched, verified]) => {
      const d = Boolean(det);
      const l = Boolean(launchable);
      const la = Boolean(launched);
      const v = Boolean(verified);
      return `| ${name} | ${statusLabel(d, l, la, v)} | detected=${d} launchable=${l} launched=${la} verified=${v} |`;
    })
    .join('\n');

  return `# MOBILE_RUNTIME_PREVIEW_V2

Generated: ${new Date(assessment.assessedAt).toISOString()}  
Assessment ID: ${assessment.assessmentId}  
Owner: \`mobile-runtime-preview-v2\`  
Baseline: V1/V1.1 (\`${MOBILE_RUNTIME_PREVIEW_V1_REPORT_FILENAME}\`)

## Executive summary

${assessment.summary}

V2 adds **bounded Android emulator launch + adb verification** on top of V1/V1.1 SDK path detection. Native proof is never faked.

## V1/V1.1 baseline (Android before V2 launch)

| Signal | V1 value |
|--------|----------|
| SDK detected | ${v1Baseline.capabilityMatrix.androidSdkPresent} |
| adb detected | ${v1Baseline.capabilityMatrix.adbPresent} |
| AVD detected | ${v1Baseline.capabilityMatrix.androidEmulatorAvailable} |
| V1 Android state | ${v1Baseline.capabilityMatrix.androidToolchain.androidRuntimeState} |
| V1 launch | deferred (Phase 1) |

## Android toolchain (V1.1 detection reused)

| Field | Value |
|-------|-------|
| SDK path | ${tc.sdkPath ?? '—'} |
| SDK source | ${tc.sdkPathSource} |
| adb path | ${tc.adbPath ?? '—'} |
| adb version | ${tc.adbVersion ?? '—'} |
| emulator path | ${tc.emulatorPath ?? '—'} |
| AVD list | ${tc.avdList.length > 0 ? tc.avdList.join(', ') : '—'} |

## V2 bounded Android launch

| Field | Value |
|-------|-------|
| Selected AVD | ${ev.selectedAvd ?? '—'} |
| Emulator already running | ${ev.emulatorAlreadyRunning} |
| Started by AiDevEngine | ${ev.startedByAiDevEngine} |
| Launch attempted | ${ev.launchAttempted} |
| Launch successful | ${ev.launchSuccessful} |
| Device serial | ${ev.deviceSerial ?? '—'} |
| Device type | ${ev.deviceType ?? '—'} |
| Boot completed | ${ev.bootCompleted} |
| sys.boot_completed | ${ev.deviceState.sysBootCompleted ?? '—'} |
| dev.bootcomplete | ${ev.deviceState.devBootcomplete ?? '—'} |
| API level | ${ev.deviceState.apiLevel ?? '—'} |
| Device model | ${ev.deviceState.deviceModel ?? '—'} |
| Screen size | ${ev.deviceState.screenSize ?? '—'} |
| Density | ${ev.deviceState.density ?? '—'} |
| Verification verdict | **${ev.verificationVerdict}** |
| Blocker / detail | ${ev.blockerDetail} |
| Elapsed ms | ${ev.elapsedMs} |

## Final runtime matrix

| Runtime | Status | Detail |
|---------|--------|--------|
${runtimeMatrix}

## mobile-runtime-experience-reality integration

| Signal | Value |
|--------|-------|
| androidRuntimeLaunchEvidence | ${realityBridge.workspaceSignals.androidRuntimeLaunchEvidence} |
| mobileRuntimeVerificationEvidence | ${realityBridge.workspaceSignals.mobileRuntimeVerificationEvidence} |
| Reality score | ${realityBridge.realityAssessmentScore}/100 |

## Remaining gap

${
  ev.verificationVerdict === 'VERIFIED'
    ? 'Android native runtime verified via bounded emulator launch.'
    : `Native Android verification incomplete: **${ev.verificationVerdict}** — ${ev.blockerDetail}`
}
`;
}
