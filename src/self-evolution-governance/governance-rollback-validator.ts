/**
 * Self Evolution Governance — rollback validator.
 */

import type { GovernanceRollbackValidation, SelfEvolutionGovernanceInput } from './self-evolution-governance-types.js';

let rollbackReviewCount = 0;

export function validateGovernanceRollback(input: SelfEvolutionGovernanceInput): GovernanceRollbackValidation {
  rollbackReviewCount += 1;

  const findings: string[] = [];
  const checkpoints = input.rollbackCheckpoints ?? [];
  const triggers = input.rollbackTriggers ?? [];
  const recovery = input.recoveryPath ?? [];

  const missingRollback = checkpoints.length === 0 || recovery.length === 0;
  const unsafeRollback = (input.signals?.includes('rollback:unsafe') ?? false)
    || (triggers.length === 0 && checkpoints.length > 0);

  if (missingRollback) findings.push('missing_rollback_plan');
  if (unsafeRollback) findings.push('unsafe_rollback');
  if (triggers.length === 0) findings.push('missing_rollback_triggers');

  const valid = !missingRollback && !unsafeRollback && triggers.length > 0;

  return { valid, missingRollback, unsafeRollback, findings };
}

export function getRollbackReviewCount(): number {
  return rollbackReviewCount;
}

export function resetRollbackValidatorForTests(): void {
  rollbackReviewCount = 0;
}
