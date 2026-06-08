/**
 * Preview session engine — validates preview session linkage.
 * Foundation only. No execution or preview rendering.
 */

import type { GateRecord, PreviewSessionInput } from './types.js';

export interface SessionValidationResult {
  valid: boolean;
  reason: string;
  gates: GateRecord[];
}

export function validatePreviewSession(input: PreviewSessionInput): SessionValidationResult {
  const gates: GateRecord[] = [];

  if (!input.previewSessionId?.trim()) {
    gates.push({
      gateId: 'prev-sess-0001',
      gateType: 'PREVIEW_SESSION',
      status: 'CLOSED',
      description: 'previewSessionId is required',
    });
    return { valid: false, reason: 'previewSessionId is required', gates };
  }

  if (!input.previewRequestId?.trim()) {
    gates.push({
      gateId: 'prev-req-0001',
      gateType: 'PREVIEW_REQUEST',
      status: 'CLOSED',
      description: 'previewRequestId is required',
    });
    return { valid: false, reason: 'previewRequestId is required', gates };
  }

  gates.push({
    gateId: 'prev-sess-0002',
    gateType: 'PREVIEW_SESSION',
    status: 'OPEN',
    description: `Preview session validated: ${input.previewSessionId}`,
  });

  return { valid: true, reason: 'Preview session validated', gates };
}

export function validateMobilePreviewSession(input: PreviewSessionInput): SessionValidationResult {
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

  gates.push({
    gateId: 'mob-sess-0002',
    gateType: 'MOBILE_SESSION',
    status: 'OPEN',
    description: `Mobile session validated: ${input.mobileSessionId}`,
  });

  return { valid: true, reason: 'Mobile session validated', gates };
}

export function validateChatPreviewContext(input: PreviewSessionInput): SessionValidationResult {
  const gates: GateRecord[] = [];

  if (!input.conversationId?.trim()) {
    gates.push({
      gateId: 'chat-ctx-0001',
      gateType: 'CHAT_CONTEXT',
      status: 'CLOSED',
      description: 'conversationId is required',
    });
    return { valid: false, reason: 'conversationId is required', gates };
  }

  gates.push({
    gateId: 'chat-ctx-0002',
    gateType: 'CHAT_CONTEXT',
    status: 'OPEN',
    description: `Chat context validated: ${input.conversationId}`,
  });

  return { valid: true, reason: 'Chat context validated', gates };
}

export function validateCloudPreviewSession(input: PreviewSessionInput): SessionValidationResult {
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

export function previewSessionKey(input: PreviewSessionInput): string {
  return [
    input.previewSessionId,
    input.mobileSessionId,
    input.cloudSessionId,
    input.conversationId,
    input.previewRequestId,
  ].join('|');
}
