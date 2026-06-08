/**
 * Approval audit engine — creates approval audit records only.
 * Does not execute or become approval source of truth.
 */

import type { ApprovalAuditRecord, ApprovalDecision, ApprovalInput } from './types.js';
import { normalizeProjectId } from '../world2-workspace-foundation/workspace-identity.js';

let auditCounter = 0;

export function resetApprovalAuditCounterForTests(): void {
  auditCounter = 0;
}

function createAuditId(): string {
  auditCounter += 1;
  return `approval-audit-${auditCounter.toString().padStart(4, '0')}`;
}

export function createApprovalAuditRecord(
  input: ApprovalInput,
  approvalResponseId: string,
  decision: ApprovalDecision,
  timestamp: number,
): ApprovalAuditRecord {
  return {
    auditId: createAuditId(),
    approvalRequestId: input.approvalRequestId,
    approvalResponseId,
    userId: input.userId,
    decision,
    timestamp,
    deviceId: input.deviceId,
    mobileSessionId: input.mobileSessionId,
    cloudSessionId: input.cloudSessionId,
    projectId: normalizeProjectId(input.projectId),
    workspaceId: input.workspaceId,
  };
}

export function auditKey(record: ApprovalAuditRecord | null): string {
  if (!record) return 'none';
  return `${record.decision}|${record.approvalRequestId}|${record.userId}`;
}
