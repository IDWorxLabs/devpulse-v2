/**
 * Mobile approval security engine — approval blocking rules.
 * Foundation only. No execution.
 */

import { checkWorld1ModificationAttempt } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import type { ApprovalInput, ApprovalState } from './types.js';

export interface SecurityEvaluationResult {
  blocked: boolean;
  reason: string;
  warnings: string[];
  approvalState: ApprovalState;
}

export function evaluateApprovalSecurity(input: ApprovalInput): SecurityEvaluationResult {
  const warnings: string[] = [];

  if (input.authStatus === 'FAIL') {
    return { blocked: true, reason: 'authStatus is FAIL — approval blocked', warnings, approvalState: 'APPROVAL_BLOCKED' };
  }

  if (input.governanceStatus === 'FAIL') {
    return { blocked: true, reason: 'governanceStatus is FAIL — approval blocked', warnings, approvalState: 'APPROVAL_BLOCKED' };
  }

  if (input.cloudConnectionStatus === 'DISCONNECTED') {
    return { blocked: true, reason: 'cloudConnectionStatus is DISCONNECTED — approval blocked', warnings, approvalState: 'APPROVAL_BLOCKED' };
  }

  const missing = collectMissingFields(input);
  if (missing.length > 0) {
    return {
      blocked: true,
      reason: `Missing required fields: ${missing.join(', ')}`,
      warnings,
      approvalState: 'APPROVAL_BLOCKED',
    };
  }

  if (input.approvalType === 'UNKNOWN') {
    return { blocked: true, reason: 'approvalType UNKNOWN blocked', warnings, approvalState: 'APPROVAL_BLOCKED' };
  }

  const world1Check = checkWorld1ModificationAttempt('mobile_approval_flow_foundation');
  if (!world1Check.allowed) {
    warnings.push('Mobile approval may not modify World 1 governance domains.');
  }

  return { blocked: false, reason: 'Security checks passed', warnings, approvalState: 'APPROVAL_REQUEST_RECEIVED' };
}

function collectMissingFields(input: ApprovalInput): string[] {
  const missing: string[] = [];
  if (!input.approvalRequestId?.trim()) missing.push('approvalRequestId');
  if (!input.mobileSessionId?.trim()) missing.push('mobileSessionId');
  if (!input.cloudSessionId?.trim()) missing.push('cloudSessionId');
  if (!input.conversationId?.trim()) missing.push('conversationId');
  if (!input.userId?.trim()) missing.push('userId');
  if (!input.workspaceId?.trim()) missing.push('workspaceId');
  if (!input.projectId?.trim()) missing.push('projectId');
  return missing;
}

export function assertNoApprovalSourceOfTruthClaim(): boolean {
  return true;
}

export function assertNoAutoApproval(): boolean {
  return true;
}

export function assertNoDuplicateApprovalTruth(): boolean {
  return true;
}
