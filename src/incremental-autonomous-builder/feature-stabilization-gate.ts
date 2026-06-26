/**
 * Incremental Autonomous Builder — feature stabilization gate.
 */

import type {
  FeatureRegressionGuardResult,
  FeatureSliceValidationResult,
  FeatureStabilizationResult,
} from './incremental-builder-types.js';

export function evaluateFeatureStabilization(input: {
  sliceId: string;
  validation: FeatureSliceValidationResult;
  regression: FeatureRegressionGuardResult | null;
  repairAttempts: number;
  maxRepairBudget: number;
  behaviorPassed?: boolean;
  behaviorBlockers?: readonly string[];
  virtualUserPassed?: boolean;
  virtualUserBlockers?: readonly string[];
  virtualDevicePassed?: boolean;
  virtualDeviceBlockers?: readonly string[];
  interactionProofPassed?: boolean;
  interactionProofBlockers?: readonly string[];
}): FeatureStabilizationResult {
  const blockers: string[] = [];

  if (!input.validation.passed) {
    blockers.push(input.validation.blockedReason ?? 'Validation failed');
  }
  if (input.regression && !input.regression.passed) {
    blockers.push(...input.regression.blockers);
  }
  if (input.repairAttempts > input.maxRepairBudget) {
    blockers.push('Repair budget exhausted');
  }
  if (input.behaviorPassed === false) {
    blockers.push(...(input.behaviorBlockers ?? ['Behavior simulation failed']));
  }
  if (input.virtualUserPassed === false) {
    blockers.push(...(input.virtualUserBlockers ?? ['Virtual user impact check failed']));
  }
  if (input.virtualDevicePassed === false) {
    blockers.push(...(input.virtualDeviceBlockers ?? ['Virtual device impact check failed']));
  }
  if (input.interactionProofPassed === false) {
    blockers.push(...(input.interactionProofBlockers ?? ['Interaction proof check failed']));
  }

  const stable = blockers.length === 0;

  return {
    readOnly: true,
    sliceId: input.sliceId,
    stable,
    status: stable ? 'STABLE' : input.repairAttempts > 0 ? 'REPAIRING' : 'FAILED',
    blockers,
  };
}

export function isFeatureStable(result: FeatureStabilizationResult): boolean {
  return result.stable && result.status === 'STABLE';
}
