/**
 * Mobile chat session engine — validates mobile and cloud session linkage.
 * Foundation only. No execution.
 */

import type { GateRecord, MobileChatInput } from './types.js';

export interface MobileSessionValidationResult {
  valid: boolean;
  reason: string;
  gates: GateRecord[];
}

export function validateMobileChatSession(input: MobileChatInput): MobileSessionValidationResult {
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
      gateId: 'mob-conv-0001',
      gateType: 'MOBILE_SESSION',
      status: 'CLOSED',
      description: 'conversationId is required',
    });
    return { valid: false, reason: 'conversationId is required', gates };
  }

  if (!input.messageId?.trim()) {
    gates.push({
      gateId: 'mob-msg-0001',
      gateType: 'MOBILE_SESSION',
      status: 'CLOSED',
      description: 'messageId is required',
    });
    return { valid: false, reason: 'messageId is required', gates };
  }

  gates.push({
    gateId: 'mob-sess-0002',
    gateType: 'MOBILE_SESSION',
    status: 'OPEN',
    description: `Mobile session validated: ${input.mobileSessionId}`,
  });

  return { valid: true, reason: 'Mobile session validated', gates };
}

export function validateCloudChatSession(input: MobileChatInput): MobileSessionValidationResult {
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

export function mobileSessionKey(input: MobileChatInput): string {
  return [input.mobileSessionId, input.userId, input.conversationId, input.messageId].join('|');
}

export function cloudSessionKey(input: MobileChatInput): string {
  return [input.cloudSessionId, input.cloudConnectionStatus].join('|');
}
