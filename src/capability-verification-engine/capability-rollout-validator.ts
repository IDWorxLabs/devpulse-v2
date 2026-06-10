/**
 * Capability Verification Engine — rollout validator.
 */

import type { CapabilityRolloutValidation, CapabilityVerificationInput } from './capability-verification-types.js';

let rolloutValidationCount = 0;

export function validateCapabilityRollout(input: CapabilityVerificationInput): CapabilityRolloutValidation {
  rolloutValidationCount += 1;

  const findings: string[] = [];
  const stages = input.rolloutStages ?? [];
  const checkpoints = input.rollbackCheckpoints ?? [];
  const recovery = input.recoveryPath ?? [];

  const missingRollback = checkpoints.length === 0 || recovery.length === 0;
  const unsafeRollout = (input.signals?.includes('rollout:unsafe') ?? false)
    || (input.world2Impact === true && !stages.some((s) => s.includes('world2') || s.includes('sandbox')));

  if (missingRollback) findings.push('missing_rollback_plan');
  if (unsafeRollout) findings.push('unsafe_rollout_detected');
  if (stages.length === 0) findings.push('missing_rollout_stages');

  const valid = !missingRollback && !unsafeRollout && stages.length > 0;

  return { valid, unsafeRollout, missingRollback, findings };
}

export function getRolloutValidationCount(): number {
  return rolloutValidationCount;
}

export function resetRolloutValidatorForTests(): void {
  rolloutValidationCount = 0;
}
