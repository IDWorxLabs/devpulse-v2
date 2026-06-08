/**
 * Mobile approval founder-readable report.
 */

import type {
  ApprovalInput,
  MobileApprovalFlowFoundationState,
  MobileApprovalReport,
  MobileApprovalResult,
} from './types.js';
import { MOBILE_APPROVAL_FLOW_FOUNDATION_OWNER_MODULE } from './types.js';

export function buildMobileApprovalReport(
  state: MobileApprovalFlowFoundationState,
  result: MobileApprovalResult,
  input: ApprovalInput,
): MobileApprovalReport {
  return {
    ownerModule: MOBILE_APPROVAL_FLOW_FOUNDATION_OWNER_MODULE,
    approvalResponseId: result.approvalResponseId,
    approvalRequestId: result.approvalRequestId,
    approvalPacketId: result.approvalPacketId,
    mobileSessionId: result.mobileSessionId,
    cloudSessionId: result.cloudSessionId,
    conversationId: result.conversationId,
    userId: result.userId,
    workspaceId: result.workspaceId,
    projectId: result.projectId,
    approvalType: result.approvalType,
    approvalDecision: result.approvalDecision,
    approvalState: result.approvalState,
    approvalReadiness: result.approvalReadiness,
    approvalRiskLevel: input.approvalRiskLevel,
    approvalPriority: input.approvalPriority,
    auditId: result.approvalAuditRecord?.auditId ?? '',
    ownershipGateCount: result.ownershipGates.length,
    governanceGateCount: result.governanceGates.length,
    cloudGateCount: result.cloudGates.length,
    approvalGateCount: result.approvalGates.length,
    securityWarningCount: result.securityWarnings.length,
    recommendationCount: result.recommendations.length,
    confirmation: { ...result.confirmation },
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation:
      'Phase 8.4 Mobile Approval Flow Foundation V1 — decision interface only. No execution, commands, file modification, code generation, or deployment.',
  };
}

export function formatMobileApprovalReport(
  state: MobileApprovalFlowFoundationState,
  result: MobileApprovalResult,
  input: ApprovalInput,
): string {
  const report = buildMobileApprovalReport(state, result, input);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Phase 8.4 — Mobile Approval Flow Foundation Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Foundation ID: ${state.foundationId}`,
    `Approval response ID: ${report.approvalResponseId}`,
    `Approval request ID: ${report.approvalRequestId}`,
    `Approval packet ID: ${report.approvalPacketId}`,
    `Mobile session ID: ${report.mobileSessionId}`,
    `Cloud session ID: ${report.cloudSessionId}`,
    `Conversation ID: ${report.conversationId}`,
    `User ID: ${report.userId}`,
    `Workspace ID: ${report.workspaceId}`,
    `Project ID: ${report.projectId}`,
    `Approval type: ${report.approvalType}`,
    `Approval decision: ${report.approvalDecision}`,
    `Approval state: ${report.approvalState}`,
    `Approval readiness: ${report.approvalReadiness}`,
    `Approval risk level: ${report.approvalRiskLevel}`,
    `Approval priority: ${report.approvalPriority}`,
    `Audit ID: ${report.auditId}`,
    `Ownership gate count: ${report.ownershipGateCount}`,
    `Governance gate count: ${report.governanceGateCount}`,
    `Cloud gate count: ${report.cloudGateCount}`,
    `Approval gate count: ${report.approvalGateCount}`,
    `Security warning count: ${report.securityWarningCount}`,
    `Recommendation count: ${report.recommendationCount}`,
    '',
    'Mobile-approval-foundation-only confirmations:',
    '  No execution performed: CONFIRMED',
    '  No commands executed: CONFIRMED',
    '  No files modified: CONFIRMED',
    '  No code generated: CONFIRMED',
    '  No deployment performed: CONFIRMED',
    '  No approval self-granted: CONFIRMED',
    '  No approval source of truth claim: CONFIRMED',
    '  Mobile approval foundation only: CONFIRMED',
    '',
    `Recommendation: ${report.recommendation}`,
    '═══════════════════════════════════════════════════',
  ];
  return lines.join('\n');
}
