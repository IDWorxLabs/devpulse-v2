/**
 * Autonomous Debugging Engine — repair execution simulation.
 */

import type { NormalizedFailure, PatchApplicationPlan, RepairAttemptRecord } from './autonomous-debugging-types.js';

export function simulateRepairExecution(input: {
  failure: NormalizedFailure;
  patchPlan: PatchApplicationPlan;
  attemptNumber: number;
  simulateRepairExhaustion?: boolean;
  simulateRegressionAfterRepair?: boolean;
}): RepairAttemptRecord {
  if (input.simulateRepairExhaustion) {
    return attemptRecord(input, false, false, 'FAILED');
  }

  const resolvesFirstAttempt = ['INTERACTION_FAILURE', 'DEVICE_FAILURE', 'ACCESSIBILITY_FAILURE'].includes(
    input.failure.category,
  );
  const resolvesSecondAttempt = input.failure.category === 'DATA_FAILURE';

  const targetedPassed =
    (resolvesFirstAttempt && input.attemptNumber >= 1) ||
    (resolvesSecondAttempt && input.attemptNumber >= 2);

  const regressionPassed = targetedPassed && !input.simulateRegressionAfterRepair;

  let outcome: RepairAttemptRecord['outcome'] = 'FAILED';
  if (targetedPassed && regressionPassed) outcome = 'RESOLVED';
  else if (targetedPassed && !regressionPassed) outcome = 'ROLLED_BACK';

  return attemptRecord(input, targetedPassed, regressionPassed, outcome);
}

function attemptRecord(
  input: {
    failure: NormalizedFailure;
    patchPlan: PatchApplicationPlan;
    attemptNumber: number;
  },
  targetedPassed: boolean,
  regressionPassed: boolean,
  outcome: RepairAttemptRecord['outcome'],
): RepairAttemptRecord {
  return {
    readOnly: true,
    repairId: input.patchPlan.repairPlanId,
    failureId: input.failure.id,
    rootCause: input.failure.evidence,
    patchScope: input.patchPlan.expectedDiffSummary,
    filesModified: input.patchPlan.filesToModify,
    targetedValidationPassed: targetedPassed,
    regressionValidationPassed: regressionPassed,
    faithfulnessDelta: 'none',
    capabilityDelta: 'none',
    attemptNumber: input.attemptNumber,
    outcome,
    rollbackSnapshot: input.patchPlan.rollbackSnapshot,
    timestamp: Date.now(),
  };
}
