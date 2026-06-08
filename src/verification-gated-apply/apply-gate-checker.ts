/**
 * Apply gate checker — evaluates individual governance preconditions.
 */

import type { ApplyGateChecks, ApplyGateInput } from './types.js';

export function runApplyGateChecks(input: ApplyGateInput): ApplyGateChecks {
  const verificationSatisfied = input.verificationResult?.verdict === 'TRUSTED';

  const approvalRequirement = input.approvalRecord?.approvalRequirement ?? 'NO_APPROVAL_REQUIRED';
  const approvalDecision = input.approvalRecord?.decision;
  const approvalPending =
    approvalRequirement !== 'NO_APPROVAL_REQUIRED' &&
    (approvalDecision === 'PENDING' || !input.approvalRecord);
  const approvalSatisfied =
    approvalRequirement === 'NO_APPROVAL_REQUIRED' ||
    approvalDecision === 'APPROVED';

  const realitySatisfied = input.realityResult?.verdict === 'REALITY_TRUSTED';
  const contradictionCount = input.realityResult?.contradictions.length ?? 0;

  const rollbackRequired =
    input.rollbackRetryPlan?.rollbackState === 'ROLLBACK_REQUIRED';
  const retryRequired = input.rollbackRetryPlan?.retryState === 'RETRY_REQUIRED';
  const retryRecommended = input.rollbackRetryPlan?.retryState === 'RETRY_RECOMMENDED';

  const autonomyBlocked =
    input.autoFixRecord?.fixType === 'AUTONOMY_FIX' ||
    input.autoFixRecord?.fixType === 'WORLD2_FIX' ||
    input.autoFixRecord?.permissionState === 'BLOCKED';

  const recoveryPending =
    input.recoveryChain !== null &&
    input.recoveryChain !== undefined &&
    input.recoveryChain.approvalRequired &&
    !approvalSatisfied;

  return {
    verificationSatisfied,
    approvalSatisfied,
    realitySatisfied,
    contradictionCount,
    rollbackRequired,
    retryRequired,
    retryRecommended,
    autonomyBlocked,
    recoveryPending,
    approvalPending,
  };
}

export function checksOutputKey(checks: ApplyGateChecks): string {
  return [
    checks.verificationSatisfied,
    checks.approvalSatisfied,
    checks.realitySatisfied,
    checks.contradictionCount,
    checks.rollbackRequired,
    checks.retryRequired,
    checks.retryRecommended,
    checks.autonomyBlocked,
    checks.recoveryPending,
    checks.approvalPending,
  ].join('|');
}
