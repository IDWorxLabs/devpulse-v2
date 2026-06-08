/**
 * Rollback/retry policy engine — combined policy evaluation.
 */

import type { ChainRiskLevel } from '../recovery-chains/types.js';
import { classifyRollbackState, rollbackRequiresApproval } from './rollback-classifier.js';
import { classifyRetryState, retryRequiresVerification } from './retry-classifier.js';
import type { FailureScenario, RollbackState, RetryState } from './types.js';

export interface PolicyResult {
  rollbackState: RollbackState;
  retryState: RetryState;
  approvalRequired: boolean;
  verificationRequired: boolean;
  riskLevel: ChainRiskLevel;
}

const RISK_BY_SCENARIO: Record<FailureScenario, ChainRiskLevel> = {
  NONE: 'LOW',
  APPROVAL_MISSING: 'MEDIUM',
  MISSING_RUNTIME: 'MEDIUM',
  MISSING_VERIFICATION: 'MEDIUM',
  WRONG_GATE_MAPPING: 'HIGH',
  CONTRADICTION_PRESENT: 'HIGH',
  FAILED_REALITY_VALIDATION: 'HIGH',
  AUTONOMY_FAILURE: 'CRITICAL',
};

export function evaluateRollbackRetryPolicy(scenario: FailureScenario): PolicyResult {
  const rollbackState = classifyRollbackState(scenario);
  const retryState = classifyRetryState(scenario);

  const approvalRequired =
    rollbackRequiresApproval(rollbackState) ||
    scenario === 'APPROVAL_MISSING' ||
    scenario === 'AUTONOMY_FAILURE';

  const verificationRequired =
    retryRequiresVerification(retryState) ||
    rollbackState !== 'ROLLBACK_NOT_REQUIRED';

  return {
    rollbackState,
    retryState,
    approvalRequired,
    verificationRequired,
    riskLevel: RISK_BY_SCENARIO[scenario],
  };
}

export function policyOutputKey(scenario: FailureScenario): string {
  const policy = evaluateRollbackRetryPolicy(scenario);
  return `${scenario}|${policy.rollbackState}|${policy.retryState}|${policy.approvalRequired}|${policy.verificationRequired}|${policy.riskLevel}`;
}
