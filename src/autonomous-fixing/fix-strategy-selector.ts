/**
 * Autonomous Fixing — fix strategy selection.
 */

import type { FailureCategory, FixPlanInput, FixStrategy } from './autonomous-fixing-types.js';
import type { RepairCandidate, RollbackPlan } from './autonomous-fixing-types.js';
import type { RootCauseAnalysis } from './autonomous-fixing-types.js';

export function selectFixStrategy(
  input: FixPlanInput,
  category: FailureCategory,
  rootCause: RootCauseAnalysis,
  repairs: RepairCandidate[],
  rollback: RollbackPlan,
  confidence: number,
  riskScore: number,
): FixStrategy {
  if (input.policyConflict || input.governanceBoundary) {
    return 'FOUNDER_REVIEW';
  }

  if (input.transientFailure && riskScore < 50) {
    return 'RETRY';
  }

  if (input.trustScore < 40 || category === 'TRUST' || input.verificationDisagreement) {
    return 'TRUST_RECOVERY';
  }

  if (category === 'WORLD2' && riskScore >= 60) {
    return 'ROLLBACK';
  }

  if (rollback.rollbackRequired && (riskScore >= 70 || input.blastRadius === 'PLATFORM')) {
    return 'ROLLBACK';
  }

  if ((input.repeatFailures ?? 0) >= 3 || (input.criticalSubsystem && confidence < 50)) {
    return 'ESCALATE';
  }

  if (
    category === 'BUILD' &&
    (input.failureSignals.some((s) => s.toLowerCase().includes('corrupt')) ||
      input.failureSignals.some((s) => s.toLowerCase().includes('inconsistent')))
  ) {
    return 'REGENERATE';
  }

  if (repairs.length > 0 && confidence >= 55 && riskScore < 65) {
    return 'REPAIR';
  }

  if ((confidence < 45 || repairs.length === 0) && !input.transientFailure) {
    return 'ESCALATE';
  }

  if (rootCause.probableCauses.length > 0 && confidence >= 50) {
    return 'REPAIR';
  }

  if (input.transientFailure) {
    return 'RETRY';
  }

  return 'FOUNDER_REVIEW';
}
