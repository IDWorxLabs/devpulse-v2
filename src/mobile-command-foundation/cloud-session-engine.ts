/**
 * Cloud session engine — validates DevPulse Cloud session linkage.
 * Foundation only. No cloud execution.
 */

import type { CloudConnectionStatus, GateRecord, MobileSessionInput } from './types.js';

export interface CloudSessionValidationResult {
  valid: boolean;
  reason: string;
  cloudSessionReadiness: boolean;
  gates: GateRecord[];
}

export function validateCloudSession(input: MobileSessionInput): CloudSessionValidationResult {
  const gates: GateRecord[] = [];

  if (!input.cloudSessionId?.trim()) {
    gates.push({
      gateId: 'cloud-sess-0001',
      gateType: 'CLOUD_SESSION',
      status: 'CLOSED',
      description: 'cloudSessionId is required',
    });
    return { valid: false, reason: 'cloudSessionId is required', gates, cloudSessionReadiness: false };
  }

  if (!input.cloudWorkspaceId?.trim()) {
    gates.push({
      gateId: 'cloud-ws-0001',
      gateType: 'CLOUD_WORKSPACE',
      status: 'CLOSED',
      description: 'cloudWorkspaceId is required',
    });
    return { valid: false, reason: 'cloudWorkspaceId is required', gates, cloudSessionReadiness: false };
  }

  if (input.cloudWorkspaceId !== input.workspaceId) {
    gates.push({
      gateId: 'cloud-ws-0002',
      gateType: 'CLOUD_WORKSPACE',
      status: 'CLOSED',
      description: 'cloudWorkspaceId must match workspaceId',
    });
    return {
      valid: false,
      reason: 'cloudWorkspaceId does not match workspaceId',
      gates,
      cloudSessionReadiness: false,
    };
  }

  const connectionReady = isCloudConnectionReady(input.cloudConnectionStatus);
  gates.push({
    gateId: 'cloud-conn-0001',
    gateType: 'CLOUD_CONNECTION',
    status: connectionReady ? 'OPEN' : 'CLOSED',
    description: `Cloud connection status: ${input.cloudConnectionStatus}`,
  });

  if (!connectionReady) {
    return {
      valid: false,
      reason: `Cloud connection not ready: ${input.cloudConnectionStatus}`,
      gates,
      cloudSessionReadiness: false,
    };
  }

  gates.push({
    gateId: 'cloud-sess-0002',
    gateType: 'CLOUD_SESSION',
    status: 'OPEN',
    description: `Cloud session validated: ${input.cloudSessionId}`,
  });

  return {
    valid: true,
    reason: 'Cloud session validated',
    gates,
    cloudSessionReadiness: true,
  };
}

export function isCloudConnectionReady(status: CloudConnectionStatus): boolean {
  return status === 'CONNECTED' || status === 'DEGRADED';
}

export function cloudSessionKey(input: MobileSessionInput): string {
  return [
    input.cloudSessionId,
    input.cloudWorkspaceId,
    input.cloudExecutionRegion,
    input.cloudConnectionStatus,
  ].join('|');
}
