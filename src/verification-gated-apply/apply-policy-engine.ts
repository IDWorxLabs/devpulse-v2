/**
 * Apply policy engine — determines ALLOW / BLOCK / PENDING verdict.
 */

import { checksOutputKey } from './apply-gate-checker.js';
import type { ApplyGateChecks, ApplyRiskLevel, ApplyVerdict } from './types.js';

export interface PolicyDecision {
  verdict: ApplyVerdict;
  blockReasons: string[];
  pendingReasons: string[];
}

export function evaluateApplyPolicy(checks: ApplyGateChecks, riskLevel: ApplyRiskLevel): PolicyDecision {
  const blockReasons: string[] = [];
  const pendingReasons: string[] = [];

  if (!checks.realitySatisfied && checks.contradictionCount === 0) {
    blockReasons.push('Reality validation not trusted');
  }

  if (checks.contradictionCount > 0) {
    blockReasons.push('Contradictions present in governance chain');
  }

  if (checks.rollbackRequired) {
    blockReasons.push('Rollback required before apply could proceed');
  }

  if (checks.autonomyBlocked) {
    blockReasons.push('Autonomy-related fix blocked');
  }

  if (riskLevel === 'CRITICAL') {
    blockReasons.push('Critical risk level');
  }

  if (checks.approvalPending) {
    pendingReasons.push('Approval required but not granted');
  }

  if (checks.recoveryPending) {
    pendingReasons.push('Recovery chain approval still pending');
  }

  if (checks.retryRecommended) {
    pendingReasons.push('Retry recommended before apply');
  }

  if (checks.retryRequired && blockReasons.length === 0) {
    pendingReasons.push('Retry required before apply');
  }

  if (blockReasons.length > 0) {
    return { verdict: 'BLOCK', blockReasons, pendingReasons };
  }

  if (pendingReasons.length > 0) {
    return { verdict: 'PENDING', blockReasons, pendingReasons };
  }

  if (
    checks.verificationSatisfied &&
    checks.approvalSatisfied &&
    checks.realitySatisfied &&
    checks.contradictionCount === 0 &&
    !checks.rollbackRequired &&
    !checks.retryRequired
  ) {
    return { verdict: 'ALLOW', blockReasons, pendingReasons };
  }

  return { verdict: 'BLOCK', blockReasons: ['Governance chain not ready for apply'], pendingReasons };
}

export function policyOutputKey(checks: ApplyGateChecks, riskLevel: ApplyRiskLevel): string {
  const policy = evaluateApplyPolicy(checks, riskLevel);
  return `${policy.verdict}|${checksOutputKey(checks)}|${riskLevel}`;
}

export function verdictOutputKey(checks: ApplyGateChecks, riskLevel: ApplyRiskLevel): string {
  return policyOutputKey(checks, riskLevel);
}
