/**
 * Founder approval state machine — governance states only.
 */

import type { ApprovalDecisionType, ApprovalRequirement, ApprovalState } from './types.js';
import { approvalRequired } from './founder-approval-classifier.js';

export function buildApprovalStateSequence(
  requirement: ApprovalRequirement,
  decision: ApprovalDecisionType,
): ApprovalState[] {
  const states: ApprovalState[] = [
    'APPROVAL_REQUEST_RECEIVED',
    'CONSTITUTION_CHECK_COMPLETED',
    'RISK_EVALUATED',
    'APPROVAL_REQUIREMENT_DETERMINED',
  ];

  if (!approvalRequired(requirement)) {
    states.push('APPROVAL_RECORD_CREATED');
    return states;
  }

  if (decision === 'PENDING') {
    states.push('APPROVAL_PENDING');
  } else if (decision === 'APPROVED') {
    states.push('APPROVAL_PENDING', 'APPROVAL_GRANTED');
  } else {
    states.push('APPROVAL_PENDING', 'APPROVAL_DENIED');
  }

  states.push('APPROVAL_RECORD_CREATED');
  return states;
}

export function approvalStateIncludes(states: ApprovalState[], target: ApprovalState): boolean {
  return states.includes(target);
}

export function createApprovalRequestId(): string {
  return `approval-req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
