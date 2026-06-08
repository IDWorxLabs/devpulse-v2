/**
 * Apply risk engine — evaluates apply risk from governance inputs.
 */

import type { ApplyGateChecks, ApplyGateInput, ApplyRiskLevel } from './types.js';

export function evaluateApplyRisk(input: ApplyGateInput, checks: ApplyGateChecks): ApplyRiskLevel {
  if (checks.autonomyBlocked || input.recoveryChain?.riskLevel === 'CRITICAL') {
    return 'CRITICAL';
  }

  if (
    checks.rollbackRequired ||
    checks.contradictionCount > 0 ||
    !checks.realitySatisfied ||
    input.rollbackRetryPlan?.riskLevel === 'HIGH'
  ) {
    return 'HIGH';
  }

  if (
    checks.retryRequired ||
    checks.retryRecommended ||
    checks.recoveryPending ||
    input.recoveryChain?.riskLevel === 'MEDIUM'
  ) {
    return 'MEDIUM';
  }

  if (checks.verificationSatisfied && checks.realitySatisfied && checks.approvalSatisfied) {
    return 'LOW';
  }

  return 'MEDIUM';
}
