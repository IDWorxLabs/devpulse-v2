/**
 * Approval request engine — validates mobile approval request inputs.
 * Foundation only. No execution.
 */

import type { ApprovalInput, GateRecord } from './types.js';

export interface RequestValidationResult {
  valid: boolean;
  reason: string;
  gates: GateRecord[];
}

export function validateApprovalRequest(input: ApprovalInput): RequestValidationResult {
  const gates: GateRecord[] = [];

  if (!input.approvalRequestId?.trim()) {
    gates.push({
      gateId: 'req-id-0001',
      gateType: 'APPROVAL_REQUEST',
      status: 'CLOSED',
      description: 'approvalRequestId is required',
    });
    return { valid: false, reason: 'approvalRequestId is required', gates };
  }

  if (!input.approvalPacketId?.trim()) {
    gates.push({
      gateId: 'pkt-id-0001',
      gateType: 'APPROVAL_PACKET',
      status: 'CLOSED',
      description: 'approvalPacketId is required',
    });
    return { valid: false, reason: 'approvalPacketId is required', gates };
  }

  gates.push({
    gateId: 'req-id-0002',
    gateType: 'APPROVAL_REQUEST',
    status: 'OPEN',
    description: `Approval request validated: ${input.approvalRequestId}`,
  });

  return { valid: true, reason: 'Approval request validated', gates };
}

export function validateMobileApprovalSession(input: ApprovalInput): RequestValidationResult {
  const gates: GateRecord[] = [];

  if (!input.mobileSessionId?.trim()) {
    gates.push({
      gateId: 'mob-sess-0001',
      gateType: 'MOBILE_SESSION',
      status: 'CLOSED',
      description: 'mobileSessionId is required',
    });
    return { valid: false, reason: 'mobileSessionId is required', gates };
  }

  if (!input.userId?.trim()) {
    gates.push({
      gateId: 'mob-user-0001',
      gateType: 'MOBILE_SESSION',
      status: 'CLOSED',
      description: 'userId is required',
    });
    return { valid: false, reason: 'userId is required', gates };
  }

  if (!input.conversationId?.trim()) {
    gates.push({
      gateId: 'conv-0001',
      gateType: 'CONVERSATION',
      status: 'CLOSED',
      description: 'conversationId is required',
    });
    return { valid: false, reason: 'conversationId is required', gates };
  }

  gates.push({
    gateId: 'mob-sess-0002',
    gateType: 'MOBILE_SESSION',
    status: 'OPEN',
    description: `Mobile session validated: ${input.mobileSessionId}`,
  });

  return { valid: true, reason: 'Mobile session validated', gates };
}

export function validateCloudApprovalSession(input: ApprovalInput): RequestValidationResult {
  const gates: GateRecord[] = [];

  if (!input.cloudSessionId?.trim()) {
    gates.push({
      gateId: 'cloud-sess-0001',
      gateType: 'CLOUD_SESSION',
      status: 'CLOSED',
      description: 'cloudSessionId is required',
    });
    return { valid: false, reason: 'cloudSessionId is required', gates };
  }

  const connectionReady =
    input.cloudConnectionStatus === 'CONNECTED' || input.cloudConnectionStatus === 'DEGRADED';

  gates.push({
    gateId: 'cloud-conn-0001',
    gateType: 'CLOUD_CONNECTION',
    status: connectionReady ? 'OPEN' : 'CLOSED',
    description: `Cloud connection: ${input.cloudConnectionStatus}`,
  });

  if (!connectionReady) {
    return { valid: false, reason: 'Cloud connection not ready', gates };
  }

  gates.push({
    gateId: 'cloud-sess-0002',
    gateType: 'CLOUD_SESSION',
    status: 'OPEN',
    description: `Cloud session validated: ${input.cloudSessionId}`,
  });

  return { valid: true, reason: 'Cloud session validated', gates };
}

export function approvalRequestKey(input: ApprovalInput): string {
  return [
    input.approvalRequestId,
    input.approvalPacketId,
    input.mobileSessionId,
    input.cloudSessionId,
  ].join('|');
}
