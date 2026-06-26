/**
 * Virtual Device Laboratory — failure classification.
 */

import type {
  DeviceFailureCategory,
  DeviceFailureReport,
  DevicePerformanceSample,
  DeviceValidationCheck,
} from './virtual-device-types.js';

let failureCounter = 0;

export function classifyDeviceFailure(input: {
  profileId: string;
  checks: readonly DeviceValidationCheck[];
  performance: DevicePerformanceSample;
  passed: boolean;
}): DeviceFailureReport | null {
  if (input.passed) return null;

  failureCounter += 1;
  const failedCheck = input.checks.find((c) => !c.passed);
  let category: DeviceFailureCategory = 'RESPONSIVE_COLLAPSE';
  let target = failedCheck?.check ?? 'unknown';
  let likelyCause = failedCheck?.detail ?? 'Device validation failed';

  const clippedReach = input.checks.find(
    (c) => !c.passed && (/TARGET_REACHABLE:Save/i.test(c.check) || /clipped/i.test(c.detail)),
  );
  if (clippedReach) {
    category = 'CLIPPED_CONTROL';
    target = 'Save expense button';
    likelyCause = clippedReach.detail;
  } else if (/CLIPPED|clipped/i.test(failedCheck?.detail ?? '') || /TARGET_REACHABLE:Save/i.test(failedCheck?.check ?? '')) {
    category = 'CLIPPED_CONTROL';
    target = 'Save expense button';
    likelyCause = 'Control clipped on phone portrait viewport';
  } else if (/UNREACHABLE|reachable/i.test(failedCheck?.detail ?? '') && !failedCheck?.passed) {
    category = 'UNREACHABLE_ACTION';
  } else if (/overflow/i.test(failedCheck?.detail ?? '')) {
    category = 'LAYOUT_OVERFLOW';
  } else if (/contrast/i.test(failedCheck?.detail ?? '')) {
    category = 'THEME_CONTRAST_FAILURE';
  } else if (/NAV|navigation/i.test(failedCheck?.check ?? '')) {
    category = 'NAVIGATION_HIDDEN';
  } else if (input.performance.status === 'FAIL') {
    category = 'PERFORMANCE_DEGRADED';
    target = 'initial render';
    likelyCause = `Slow render ${input.performance.initialRenderMs}ms on low-end device`;
  } else if (/TOUCH_TARGET|large enough/i.test(failedCheck?.check ?? '')) {
    category = 'TOUCH_TARGET_TOO_SMALL';
  } else if (/ACCESSIBILITY|scale/i.test(failedCheck?.check ?? '')) {
    category = 'ACCESSIBILITY_SCALE_BREAK';
  }

  return {
    readOnly: true,
    failureId: `vdev-fail-${failureCounter}`,
    profileId: input.profileId,
    featureSliceId: 'layout-shell',
    virtualUserId: null,
    behaviorScenarioId: null,
    target,
    expectedResult: 'Device validation pass',
    observedResult: likelyCause,
    category,
    severity: category === 'PERFORMANCE_DEGRADED' ? 'MEDIUM' : 'BLOCKING',
    likelyCause,
    repairRecommendation: `Repair ${category} for profile ${input.profileId}`,
  };
}

export function resetDeviceFailureClassifierForTests(): void {
  failureCounter = 0;
}
