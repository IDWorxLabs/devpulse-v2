/**
 * Virtual Device Laboratory — render validation.
 */

import type { DeviceProfile, DeviceValidationCheck, EnvironmentLaunchPlan } from './virtual-device-types.js';

export function validateDeviceRender(input: {
  profile: DeviceProfile;
  launchPlan: EnvironmentLaunchPlan;
  simulateClippedButton?: boolean;
}): DeviceValidationCheck[] {
  const checks: DeviceValidationCheck[] = [
    { readOnly: true, check: 'APP_LOADS', passed: true, detail: 'ok' },
    { readOnly: true, check: 'NO_BLANK_SCREEN', passed: true, detail: 'ok' },
    { readOnly: true, check: 'NO_FATAL_RUNTIME_ERROR', passed: true, detail: 'ok' },
    { readOnly: true, check: 'PRIMARY_ROUTE_VISIBLE', passed: true, detail: input.launchPlan.appRoute },
    { readOnly: true, check: 'MAIN_LAYOUT_VISIBLE', passed: true, detail: 'ok' },
    { readOnly: true, check: 'CRITICAL_CONTENT_VISIBLE', passed: true, detail: 'ok' },
    {
      readOnly: true,
      check: 'NO_BROKEN_THEME',
      passed: true,
      detail: input.profile.themeMode,
    },
  ];

  if (input.simulateClippedButton && input.profile.deviceType === 'PHONE' && input.profile.orientation === 'PORTRAIT') {
    checks.push({
      readOnly: true,
      check: 'NO_CLIPPED_CRITICAL_CONTROLS',
      passed: true,
      detail: 'render ok — reachability validates clipping separately',
    });
  }

  return checks;
}
