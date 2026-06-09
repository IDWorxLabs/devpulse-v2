/**
 * Completion risk engine — classifies completion plan risk.
 */

import type { CompletionEvidence, CompletionRiskLevel } from './types.js';
import type { PrepareCompletionPlanInput } from './types.js';

export function classifyCompletionRisk(
  input: PrepareCompletionPlanInput,
  evidence: CompletionEvidence[],
): CompletionRiskLevel {
  if (
    input.markCompleteAttempt ||
    !input.evidenceProvided ||
    input.targetWorld === 'WORLD_1' ||
    !input.world1Protected ||
    input.duplicateAuthorityDetected ||
    !input.rollbackPlan ||
    !input.recoveryPlan ||
    !input.runtimeVerificationPassed ||
    !input.verificationRequirementsMet
  ) {
    return 'CRITICAL';
  }

  if (!input.founderApprovalRecorded || !input.constitutionPassed || !input.taskGovernorPassed) {
    return 'HIGH';
  }

  const unsatisfiedEvidence = evidence.filter((e) => !e.satisfied).length;
  if (unsatisfiedEvidence > 2) return 'HIGH';
  if (unsatisfiedEvidence > 0) return 'MEDIUM';

  return 'LOW';
}

export function hasCriticalCompletionViolation(
  input: PrepareCompletionPlanInput,
  riskLevel: CompletionRiskLevel,
): boolean {
  return (
    riskLevel === 'CRITICAL' ||
    input.markCompleteAttempt ||
    (!input.evidenceProvided && input.query?.toLowerCase().includes('mark complete') === true) ||
    (!input.rollbackPlan && input.applyPlan !== null) ||
    (!input.recoveryPlan && input.rollbackPlan !== null)
  );
}
