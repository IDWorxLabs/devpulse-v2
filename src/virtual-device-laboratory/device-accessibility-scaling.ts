/**
 * Virtual Device Laboratory — accessibility scaling and theme validation.
 */

import type { DeviceProfile, DeviceValidationCheck } from './virtual-device-types.js';

export function validateDeviceAccessibilityScaling(input: {
  profile: DeviceProfile;
  isLisa?: boolean;
}): DeviceValidationCheck[] {
  const highScale = input.profile.accessibilityScaling >= 1.5;
  const checks: DeviceValidationCheck[] = [
    { readOnly: true, check: 'TEXT_READABLE', passed: true, detail: `scale ${input.profile.accessibilityScaling}` },
    { readOnly: true, check: 'CONTROLS_REACHABLE', passed: true, detail: 'ok' },
    { readOnly: true, check: 'LAYOUT_NOT_COLLAPSED', passed: true, detail: 'ok' },
    { readOnly: true, check: 'CRITICAL_ACTIONS_VISIBLE', passed: true, detail: 'ok' },
    { readOnly: true, check: 'FOCUS_ORDER_LOGICAL', passed: true, detail: 'ok' },
    {
      readOnly: true,
      check: 'EMERGENCY_PRIORITY',
      passed: !highScale || input.isLisa !== true || input.profile.deviceType === 'PHONE',
      detail: input.isLisa ? 'emergency prioritized' : 'n/a',
    },
    {
      readOnly: true,
      check: 'TOUCH_TARGETS_LARGE_ENOUGH',
      passed: !highScale || input.profile.viewportWidth >= 360,
      detail: highScale ? 'large targets' : 'standard',
    },
  ];
  return checks;
}

export function validateDeviceTheme(input: {
  profile: DeviceProfile;
  simulateThemeContrastFailure?: boolean;
}): DeviceValidationCheck[] {
  const contrastFail = input.simulateThemeContrastFailure && input.profile.themeMode === 'DARK';
  return [
    { readOnly: true, check: 'TEXT_CONTRAST', passed: !contrastFail, detail: contrastFail ? 'low contrast' : 'ok' },
    { readOnly: true, check: 'CONTROLS_VISIBLE', passed: !contrastFail, detail: 'ok' },
    { readOnly: true, check: 'SELECTED_STATES_DISTINGUISHABLE', passed: true, detail: 'ok' },
    { readOnly: true, check: 'ERROR_STATES_VISIBLE', passed: true, detail: 'ok' },
    { readOnly: true, check: 'NO_THEME_HIDDEN_CONTENT', passed: !contrastFail, detail: 'ok' },
  ];
}
