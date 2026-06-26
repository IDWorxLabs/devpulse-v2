/**
 * Virtual Device Laboratory — environment launch planning.
 */

import type { DeviceMatrixEntry, DeviceProfile, EnvironmentLaunchPlan } from './virtual-device-types.js';

let planCounter = 0;

export function planEnvironmentLaunches(input: {
  profiles: readonly DeviceProfile[];
  matrix: readonly DeviceMatrixEntry[];
}): EnvironmentLaunchPlan[] {
  return input.matrix.map((entry) => {
    planCounter += 1;
    const profile = input.profiles.find((p) => p.deviceId === entry.deviceId)!;
    return {
      readOnly: true,
      planId: `launch-${planCounter}`,
      profileId: entry.profileId,
      viewport: { width: profile.viewportWidth, height: profile.viewportHeight },
      orientation: profile.orientation,
      theme: profile.themeMode,
      accessibilityScaling: profile.accessibilityScaling,
      inputMethod: profile.inputMode,
      networkConditions: profile.networkProfile,
      performanceTier: profile.performanceTier,
      appRoute: '/',
      requiredSetupState: ['Application shell loaded'],
      requiredWorkflows: [...profile.requiredWorkflows],
      expectedRenderConstraints: [...profile.expectedLayoutConstraints],
      timeoutBudgetMs: entry.timeoutBudgetMs,
    };
  });
}
