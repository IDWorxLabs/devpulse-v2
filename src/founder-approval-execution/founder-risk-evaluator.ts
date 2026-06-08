/**
 * Founder risk evaluator — deterministic risk levels for approval requests.
 */

import type { ExecutionClassification } from '../execution-authority/types.js';
import type { RecoveryRecord } from '../recovery-execution/types.js';
import type { ApprovalRequirement, FounderRiskLevel } from './types.js';

export function evaluateRiskFromClassification(
  classification: ExecutionClassification | 'INVALID' | 'WORLD2_ACTIVITY' | undefined,
): FounderRiskLevel {
  switch (classification) {
    case 'READ_ONLY':
      return 'LOW';
    case 'WRITE_OPERATION':
    case 'PROJECT_MODIFICATION':
    case 'COMMAND_EXECUTION':
      return 'MEDIUM';
    case 'RECOVERY_ACTION':
      return 'HIGH';
    case 'AUTONOMOUS_ACTION':
    case 'WORLD2_ACTIVITY':
      return 'CRITICAL';
    default:
      return 'MEDIUM';
  }
}

export function evaluateFounderRisk(
  record: RecoveryRecord,
  requirement: ApprovalRequirement,
): FounderRiskLevel {
  const verification = record.verificationResult;
  const classification =
    verification.authorityDecision?.classification ??
    (verification.runtimeDecision?.classification !== 'INVALID'
      ? verification.runtimeDecision?.classification
      : undefined);

  if (verification.runtimeRecord?.package.metadata.world2_activity === 'true') {
    return 'CRITICAL';
  }

  if (requirement === 'APPROVAL_REQUIRED_HIGH_RISK') {
    return 'HIGH';
  }

  const base = evaluateRiskFromClassification(classification);

  if (requirement === 'NO_APPROVAL_REQUIRED') {
    return 'LOW';
  }

  if (requirement === 'APPROVAL_REQUIRED_RECOVERY' && base !== 'CRITICAL') {
    return 'HIGH';
  }

  if (
    (requirement === 'APPROVAL_REQUIRED_AUTONOMY' || record.plan.strategy === 'WORLD2_ISOLATION_REQUIRED') &&
    base !== 'LOW'
  ) {
    return 'CRITICAL';
  }

  if (record.plan.verificationVerdict === 'FAILED' && base === 'LOW') {
    return 'HIGH';
  }

  return base;
}

export function riskAtLeast(level: FounderRiskLevel, minimum: FounderRiskLevel): boolean {
  const order: FounderRiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  return order.indexOf(level) >= order.indexOf(minimum);
}
