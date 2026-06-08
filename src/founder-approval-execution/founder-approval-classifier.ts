/**
 * Founder approval classifier — maps execution context to approval requirements.
 */

import type { ExecutionClassification } from '../execution-authority/types.js';
import type { RecoveryRecord } from '../recovery-execution/types.js';
import type { ApprovalRequirement } from './types.js';

export function classifyFromExecutionAction(
  classification: ExecutionClassification | 'INVALID' | 'WORLD2_ACTIVITY' | undefined,
  verificationVerdict: RecoveryRecord['plan']['verificationVerdict'],
): ApprovalRequirement {
  if (classification === 'WORLD2_ACTIVITY') {
    return 'APPROVAL_REQUIRED_AUTONOMY';
  }

  switch (classification) {
    case 'READ_ONLY':
      return 'NO_APPROVAL_REQUIRED';
    case 'WRITE_OPERATION':
    case 'PROJECT_MODIFICATION':
      return 'APPROVAL_REQUIRED_MODIFICATION';
    case 'RECOVERY_ACTION':
      return 'APPROVAL_REQUIRED_RECOVERY';
    case 'AUTONOMOUS_ACTION':
      return 'APPROVAL_REQUIRED_AUTONOMY';
    case 'COMMAND_EXECUTION':
      return 'APPROVAL_REQUIRED';
    case 'NO_EXECUTION':
      return verificationVerdict === 'FAILED'
        ? 'APPROVAL_REQUIRED_HIGH_RISK'
        : 'APPROVAL_REQUIRED';
    default:
      if (verificationVerdict === 'FAILED') {
        return 'APPROVAL_REQUIRED_HIGH_RISK';
      }
      return 'APPROVAL_REQUIRED';
  }
}

export function classifyApprovalRequirement(record: RecoveryRecord): ApprovalRequirement {
  const verification = record.verificationResult;
  const metadata = record.plan.packageId
    ? record.verificationResult.runtimeRecord?.package.metadata ?? {}
    : {};

  if (metadata.world2_activity === 'true') {
    return 'APPROVAL_REQUIRED_AUTONOMY';
  }

  const classification =
    verification.authorityDecision?.classification ??
    (verification.runtimeDecision?.classification !== 'INVALID'
      ? verification.runtimeDecision?.classification
      : undefined);

  let requirement = classifyFromExecutionAction(classification, record.plan.verificationVerdict);

  if (
    record.plan.verificationVerdict === 'FAILED' &&
    requirement !== 'NO_APPROVAL_REQUIRED' &&
    requirement !== 'APPROVAL_REQUIRED_AUTONOMY' &&
    requirement !== 'APPROVAL_REQUIRED_RECOVERY' &&
    requirement !== 'APPROVAL_REQUIRED_MODIFICATION'
  ) {
    requirement = 'APPROVAL_REQUIRED_HIGH_RISK';
  }

  if (record.plan.strategy === 'WORLD2_ISOLATION_REQUIRED') {
    return 'APPROVAL_REQUIRED_AUTONOMY';
  }

  return requirement;
}

export function approvalRequired(requirement: ApprovalRequirement): boolean {
  return requirement !== 'NO_APPROVAL_REQUIRED';
}
