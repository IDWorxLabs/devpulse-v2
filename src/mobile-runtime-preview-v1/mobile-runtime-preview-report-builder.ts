/**
 * Mobile Runtime Preview V1 — report builder.
 */

import { REUSED_MOBILE_PREVIEW_MODULES } from './mobile-runtime-preview-bounds.js';
import type { MobileRuntimePreviewAssessment } from './mobile-runtime-preview-types.js';

function formatRecordRow(
  runtimeId: string,
  detected: boolean,
  launchAttempted: boolean,
  launchSuccessful: boolean,
  verificationSuccessful: boolean,
  unsupportedReason: string | null,
  androidRuntimeState?: string,
): string {
  const stateCol = androidRuntimeState ?? '—';
  return `| ${runtimeId} | ${detected ? 'Yes' : 'No'} | ${launchAttempted ? 'Yes' : 'No'} | ${launchSuccessful ? 'Yes' : 'No'} | ${verificationSuccessful ? 'Yes' : 'No'} | ${unsupportedReason ?? '—'} | ${stateCol} |`;
}

export function buildMobileRuntimePreviewReportMarkdown(assessment: MobileRuntimePreviewAssessment): string {
  const { capabilityMatrix, verificationRecords, registry, realityBridge } = assessment;
  const tc = capabilityMatrix.androidToolchain;

  const capabilityRows = [
    ['Android SDK', capabilityMatrix.androidSdkPresent],
    ['adb', capabilityMatrix.adbPresent],
    ['Android emulator binary', Boolean(tc.emulatorPath)],
    ['Android AVD(s)', capabilityMatrix.androidEmulatorAvailable],
    ['Android device running', capabilityMatrix.androidDeviceAttached],
    ['Android runtime state', tc.androidRuntimeState],
    ['Expo CLI', capabilityMatrix.expoCliPresent],
    ['Expo project', capabilityMatrix.expoProjectDetected],
    ['React Native project', capabilityMatrix.reactNativeProjectDetected],
    ['Xcode', capabilityMatrix.xcodePresent],
    ['iOS Simulator', capabilityMatrix.iosSimulatorAvailable],
    ['Browser runtime (Playwright)', capabilityMatrix.browserRuntimeAvailable],
    ['OS', capabilityMatrix.operatingSystem],
  ]
    .map(([label, value]) => {
      if (typeof value === 'string') return `| ${label} | ${value} |`;
      return `| ${label} | ${value ? 'Detected' : 'Not detected'} |`;
    })
    .join('\n');

  const verificationRows = verificationRecords
    .map((r) =>
      formatRecordRow(
        r.runtimeId,
        r.detected,
        r.launchAttempted,
        r.launchSuccessful,
        r.verificationSuccessful,
        r.unsupportedReason,
        r.androidRuntimeState,
      ),
    )
    .join('\n');

  const registryRows = registry.entries
    .map(
      (e) =>
        `| ${e.runtimeId} | ${e.available ? 'Available' : 'Unavailable'} | ${e.launchable ? 'Yes' : 'No'} | ${e.unavailableReason ?? '—'} |`,
    )
    .join('\n');

  const androidAdapter = registry.livePreviewTree.androidRuntime;
  const nativeVerificationGap =
    tc.androidRuntimeState === 'LAUNCH_DEFERRED_PHASE_1' ||
    verificationRecords.find((r) => r.runtimeId === 'ANDROID')?.androidRuntimeState === 'LAUNCH_DEFERRED_PHASE_1'
      ? 'Phase 1 launch deferred — native app boot/install not implemented.'
      : !capabilityMatrix.androidDeviceAttached && capabilityMatrix.androidEmulatorAvailable
        ? 'AVD exists but no emulator/device is running — boot AVD for native verification.'
        : !capabilityMatrix.adbPresent
          ? 'Android toolchain not fully detected.'
          : 'Phase 1 native verification not implemented.';

  return `# MOBILE_RUNTIME_PREVIEW_V1

Generated: ${new Date(assessment.assessedAt).toISOString()}  
Assessment ID: ${assessment.assessmentId}  
Owner: \`mobile-runtime-preview-v1\`  
Repair: **V1.1 Android SDK path detection**

## Executive summary

${assessment.summary}

Phase 1 provides **capability detection + runtime orchestration** for AiDevEngine mobile products. V1.1 resolves Android SDK/adb/emulator from SDK paths without requiring global PATH changes. Native Android launch/verification is **not faked**.

## Android toolchain (V1.1)

| Field | Value |
|-------|-------|
| SDK path | ${tc.sdkPath ?? '—'} |
| SDK source | ${tc.sdkPathSource} |
| adb path | ${tc.adbPath ?? '—'} |
| adb version | ${tc.adbVersion ?? '—'} |
| emulator path | ${tc.emulatorPath ?? '—'} |
| AVD names | ${tc.avdList.length > 0 ? tc.avdList.join(', ') : '—'} |
| Runtime state | ${tc.androidRuntimeState} |
| Adapter available | ${androidAdapter.available} |
| Adapter launchable | ${androidAdapter.launchable} |
| Native verification gap | ${nativeVerificationGap} |

## Live Preview tree (planning registry)

\`\`\`
Live Preview
├── Browser Runtime
├── Mobile Web Runtime
├── Android Runtime
├── iOS Runtime
└── Expo Runtime
\`\`\`

## Capability matrix

| Capability | Status |
|------------|--------|
${capabilityRows}

## Runtime verification

| Runtime | Detected | Launch attempted | Launch successful | Verification successful | Unsupported reason | Android state |
|---------|----------|------------------|-------------------|-------------------------|-------------------|---------------|
${verificationRows}

## Live preview registry

| Runtime | Available | Launchable | Reason unavailable |
|---------|-----------|------------|-------------------|
${registryRows}

Available: ${registry.availableRuntimes.join(', ') || 'none'}  
Unavailable: ${registry.unavailableRuntimes.join(', ') || 'none'}

## mobile-runtime-experience-reality integration

| Signal | Value |
|--------|-------|
| deviceFramePreviewActive | ${realityBridge.workspaceSignals.deviceFramePreviewActive} |
| touchSimulationEvidence | ${realityBridge.workspaceSignals.touchSimulationEvidence} |
| mobilePreviewLaunchEvidence | ${realityBridge.workspaceSignals.mobilePreviewLaunchEvidence} |
| androidRuntimeLaunchEvidence | ${realityBridge.workspaceSignals.androidRuntimeLaunchEvidence} |
| iosRuntimeLaunchEvidence | ${realityBridge.workspaceSignals.iosRuntimeLaunchEvidence} |
| expoRuntimeLaunchEvidence | ${realityBridge.workspaceSignals.expoRuntimeLaunchEvidence} |
| mobileRuntimeVerificationEvidence | ${realityBridge.workspaceSignals.mobileRuntimeVerificationEvidence} |
| Reality assessment score | ${realityBridge.realityAssessmentScore}/100 |
| Reality assessment ID | ${realityBridge.realityAssessmentId} |

## Reused modules (no duplicate preview subsystem)

${REUSED_MOBILE_PREVIEW_MODULES.map((m) => `- \`${m}\``).join('\n')}

## Future foundation

MOBILE_RUNTIME_PREVIEW_V1 is the foundation for:

- Android Runtime Verification
- iOS Runtime Verification
- Expo Runtime Verification
- Device-specific Founder Testing
- Mobile Launch Readiness

Without duplicating existing preview, UVL, AFLA, Founder Test, or mobile runtime authorities.
`;
}
