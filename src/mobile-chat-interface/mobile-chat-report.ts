/**
 * Mobile chat founder-readable report.
 */

import type {
  MobileChatInterfaceState,
  MobileChatReport,
  MobileChatResult,
} from './types.js';
import { MOBILE_CHAT_INTERFACE_OWNER_MODULE } from './types.js';

export function buildMobileChatReport(
  state: MobileChatInterfaceState,
  result: MobileChatResult,
): MobileChatReport {
  return {
    ownerModule: MOBILE_CHAT_INTERFACE_OWNER_MODULE,
    chatPacketId: result.chatPacketId,
    mobileSessionId: result.mobileSessionId,
    cloudSessionId: result.cloudSessionId,
    userId: result.userId,
    workspaceId: result.workspaceId,
    projectId: result.projectId,
    conversationId: result.conversationId,
    messageId: result.messageId,
    chatState: result.chatState,
    chatReadiness: result.chatReadiness,
    worldTarget: result.worldTarget,
    messageIntent: result.messageIntent,
    conversationMode: result.conversationMode,
    projectContextStatus: result.projectContextStatus,
    projectCreationRequestId: result.projectCreationRequestId,
    cloudCommandPacketId: result.cloudCommandPacket?.cloudCommandPacketId ?? '',
    ownershipGateCount: result.ownershipGates.length,
    governanceGateCount: result.governanceGates.length,
    cloudGateCount: result.cloudGates.length,
    projectContextGateCount: result.projectContextGates.length,
    securityWarningCount: result.securityWarnings.length,
    recommendationCount: result.recommendations.length,
    confirmation: { ...result.confirmation },
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation:
      'Phase 8.2 Mobile Chat Interface Foundation V1 — project command interface only. No execution, commands, file modification, code generation, or deployment.',
  };
}

export function formatMobileChatReport(
  state: MobileChatInterfaceState,
  result: MobileChatResult,
): string {
  const report = buildMobileChatReport(state, result);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Phase 8.2 — Mobile Chat Interface Foundation Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Foundation ID: ${state.foundationId}`,
    `Chat packet ID: ${report.chatPacketId}`,
    `Mobile session ID: ${report.mobileSessionId}`,
    `Cloud session ID: ${report.cloudSessionId}`,
    `User ID: ${report.userId}`,
    `Workspace ID: ${report.workspaceId}`,
    `Project ID: ${report.projectId}`,
    `Conversation ID: ${report.conversationId}`,
    `Message ID: ${report.messageId}`,
    `Chat state: ${report.chatState}`,
    `Chat readiness: ${report.chatReadiness}`,
    `World target: ${report.worldTarget}`,
    `Message intent: ${report.messageIntent}`,
    `Conversation mode: ${report.conversationMode}`,
    `Project context status: ${report.projectContextStatus}`,
    `Project creation request ID: ${report.projectCreationRequestId}`,
    `Cloud command packet ID: ${report.cloudCommandPacketId}`,
    `Ownership gate count: ${report.ownershipGateCount}`,
    `Governance gate count: ${report.governanceGateCount}`,
    `Cloud gate count: ${report.cloudGateCount}`,
    `Project context gate count: ${report.projectContextGateCount}`,
    `Security warning count: ${report.securityWarningCount}`,
    `Recommendation count: ${report.recommendationCount}`,
    '',
    'Mobile-chat-foundation-only confirmations:',
    '  No execution performed: CONFIRMED',
    '  No commands executed: CONFIRMED',
    '  No files modified: CONFIRMED',
    '  No code generated: CONFIRMED',
    '  No deployment performed: CONFIRMED',
    '  No approval self-granted: CONFIRMED',
    '  Mobile chat foundation only: CONFIRMED',
    '',
    `Recommendation: ${report.recommendation}`,
    '═══════════════════════════════════════════════════',
  ];
  return lines.join('\n');
}
