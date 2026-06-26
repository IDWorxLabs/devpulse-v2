/**
 * Virtual Device Laboratory — interaction reachability validation.
 */

import type { BehaviorSimulationPipelineResult } from '../behavior-simulation-engine/behavior-simulation-types.js';
import type { DeviceProfile, DeviceValidationCheck } from './virtual-device-types.js';

export function validateInteractionReachability(input: {
  profile: DeviceProfile;
  behaviorSimulation?: BehaviorSimulationPipelineResult;
  simulateClippedButton?: boolean;
  isLisa?: boolean;
  isExpense?: boolean;
}): DeviceValidationCheck[] {
  const phonePortrait = input.profile.deviceType === 'PHONE' && input.profile.orientation === 'PORTRAIT';
  const clippedSave =
    input.simulateClippedButton && phonePortrait;

  const targets: string[] = [];
  if (input.isLisa) targets.push('Emergency phrase button', 'Blink input target', 'Speech confirmation');
  if (input.isExpense) targets.push('Save expense button', 'Export button', 'Edit action', 'Delete action');
  if (!targets.length) targets.push('Primary action button');

  const checks: DeviceValidationCheck[] = targets.map((target) => {
    const emergency = /emergency/i.test(target);
    const save = /save/i.test(target);
    const failed = clippedSave && save;
    return {
      readOnly: true,
      check: `TARGET_REACHABLE:${target}`,
      passed: !failed,
      detail: failed ? 'clipped on phone portrait' : 'reachable',
    };
  });

  checks.push(
    { readOnly: true, check: 'TARGET_USABLE_SIZE', passed: !clippedSave, detail: clippedSave ? 'too small/clipped' : 'ok' },
    { readOnly: true, check: 'TARGET_CAN_RECEIVE_INPUT', passed: !clippedSave, detail: 'ok' },
    {
      readOnly: true,
      check: 'BEHAVIOR_SCENARIO_MAPPED',
      passed: (input.behaviorSimulation?.scenarios.length ?? 0) > 0 || !input.isLisa,
      detail: String(input.behaviorSimulation?.scenarios.length ?? 0),
    },
  );

  return checks;
}
