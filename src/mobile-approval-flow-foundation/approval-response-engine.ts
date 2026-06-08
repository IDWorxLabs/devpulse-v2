/**
 * Approval response engine — creates approval response packets only.
 * Records decisions. Does NOT execute.
 */

import type { ApprovalDecision, ApprovalInput, ApprovalResponsePacket } from './types.js';
import { routeDecision } from './approval-decision-engine.js';

let responseCounter = 0;
let packetCounter = 0;

export function resetApprovalResponseCounterForTests(): void {
  responseCounter = 0;
  packetCounter = 0;
}

function createResponseId(): string {
  responseCounter += 1;
  return `approval-response-${responseCounter.toString().padStart(4, '0')}`;
}

function createResponsePacketId(): string {
  packetCounter += 1;
  return `approval-res-pkt-${packetCounter.toString().padStart(4, '0')}`;
}

export function createApprovalResponsePacket(
  input: ApprovalInput,
  decision: ApprovalDecision,
): ApprovalResponsePacket {
  return {
    responsePacketId: createResponsePacketId(),
    approvalRequestId: input.approvalRequestId,
    approvalPacketId: input.approvalPacketId,
    mobileSessionId: input.mobileSessionId,
    cloudSessionId: input.cloudSessionId,
    conversationId: input.conversationId,
    approvalType: input.approvalType,
    approvalDecision: decision,
    payloadSummary: `${routeDecision(decision)} — ${input.approvalSummary.slice(0, 120)}`,
    decisionOnly: true,
    executed: false,
  };
}

export function createApprovalResponseId(): string {
  return createResponseId();
}

export function responsePacketKey(packet: ApprovalResponsePacket | null): string {
  if (!packet) return 'none';
  return `${packet.approvalDecision}|${packet.approvalType}|${packet.decisionOnly}`;
}
