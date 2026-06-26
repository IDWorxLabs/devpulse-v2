/**
 * Virtual Device Laboratory — Live Preview gate.
 */

import type {
  LivePreviewVirtualDeviceGateResult,
  VirtualDevicePipelineResult,
} from './virtual-device-types.js';

export function evaluateLivePreviewVirtualDeviceGate(
  result: VirtualDevicePipelineResult,
): LivePreviewVirtualDeviceGateResult {
  const failed = result.profileResults.find((r) => !r.passed && !r.skipJustification);
  const perfFail = result.profileResults.find((r) => r.performance.status === 'FAIL');
  const unlocked =
    result.permissionVerdict === 'READY_FOR_PREVIEW' &&
    result.wholeAppSweep.passed &&
    !failed &&
    !perfFail;

  const profile = failed ? result.profiles.find((p) => {
    const matrixEntry = result.matrix.find((m) => m.profileId === failed.profileId);
    return matrixEntry?.deviceId === p.deviceId;
  }) : null;

  return {
    readOnly: true,
    unlocked,
    blockedReason: unlocked ? null : result.blockedReason ?? 'Virtual device laboratory did not pass',
    affectedDevice: profile ? `${profile.deviceType} ${profile.orientation}` : null,
    affectedOrientationTheme: profile ? `${profile.orientation} / ${profile.themeMode} / ${profile.accessibilityScaling}x` : null,
    failedWorkflow: failed?.launchPlan.requiredWorkflows[0] ?? null,
    failureCategory: failed?.failure?.category ?? null,
    responsibleComponent: failed?.failure?.featureSliceId ?? null,
    repairPlan: failed?.repairRecommendation?.suggestedRepairScope ?? null,
    gateStatus: unlocked ? 'VIRTUAL_DEVICE_LABORATORY_PASS' : 'VIRTUAL_DEVICE_LABORATORY_BLOCKED',
  };
}
