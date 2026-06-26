/**
 * Virtual User Engine — goal completion verification.
 */

import type {
  VirtualUserGoal,
  VirtualUserGoalStatus,
  VirtualUserJourney,
  VirtualUserStepResult,
} from './virtual-user-types.js';

export function verifyVirtualUserGoal(input: {
  goal: VirtualUserGoal;
  journey: VirtualUserJourney;
  stepResults: readonly VirtualUserStepResult[];
  hasBlockingFriction: boolean;
  hasHighFriction: boolean;
  skipJustification?: string | null;
}): VirtualUserGoalStatus {
  if (input.skipJustification) return 'SKIPPED_WITH_JUSTIFICATION';

  const allPassed = input.stepResults.every((s) => s.passed);
  const finalStep = input.stepResults[input.stepResults.length - 1];
  const goalReached = allPassed && finalStep?.passed === true;

  if (!goalReached) return 'FAILED';
  if (input.hasBlockingFriction) return 'BLOCKED';
  if (input.hasHighFriction) return 'COMPLETED_WITH_FRICTION';
  return 'COMPLETED';
}
