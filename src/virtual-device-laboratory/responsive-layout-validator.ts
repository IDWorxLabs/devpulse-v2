/**
 * Virtual Device Laboratory — responsive layout validation.
 */

import type { DeviceProfile, DeviceValidationCheck } from './virtual-device-types.js';

export function validateResponsiveLayout(input: {
  profile: DeviceProfile;
  simulateClippedButton?: boolean;
}): DeviceValidationCheck[] {
  const phonePortrait = input.profile.deviceType === 'PHONE' && input.profile.orientation === 'PORTRAIT';
  const overflowOk = !phonePortrait || !input.simulateClippedButton;

  return [
    { readOnly: true, check: 'CONTENT_FITS_VIEWPORT', passed: overflowOk, detail: overflowOk ? 'ok' : 'horizontal overflow' },
    { readOnly: true, check: 'PRIMARY_NAV_VISIBLE', passed: true, detail: 'ok' },
    {
      readOnly: true,
      check: 'NO_HORIZONTAL_OVERFLOW',
      passed: overflowOk,
      detail: overflowOk ? 'ok' : 'overflow on phone',
    },
    { readOnly: true, check: 'TOUCH_TARGETS_ACCESSIBLE', passed: true, detail: 'ok' },
    { readOnly: true, check: 'FORMS_USABLE', passed: true, detail: 'ok' },
    { readOnly: true, check: 'DIALOGS_FIT_SCREEN', passed: true, detail: 'ok' },
    { readOnly: true, check: 'IMPORTANT_ACTIONS_VISIBLE', passed: true, detail: 'ok' },
  ];
}
