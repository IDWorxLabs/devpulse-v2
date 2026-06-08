/**
 * Apply readiness evaluator — determines chain readiness state.
 */

import type { ApplyGateChecks, ReadinessState } from './types.js';

export function evaluateApplyReadiness(checks: ApplyGateChecks): ReadinessState {
  if (checks.approvalPending || checks.recoveryPending) {
    return 'PENDING_APPROVAL';
  }

  if (
    !checks.verificationSatisfied ||
    !checks.realitySatisfied ||
    checks.contradictionCount > 0 ||
    checks.rollbackRequired ||
    checks.retryRequired ||
    checks.autonomyBlocked
  ) {
    return 'NOT_READY';
  }

  return 'READY';
}

export function readinessOutputKey(readiness: ReadinessState): string {
  return readiness;
}
