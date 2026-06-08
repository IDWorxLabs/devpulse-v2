/**
 * Device handoff engine — validates source/target devices and classifies handoff types.
 * Foundation only. Transfers context, not ownership.
 */

import type { ContinuityInput, GateRecord, HandoffType } from './types.js';
import { KNOWN_HANDOFF_TYPES } from './types.js';

export interface HandoffValidationResult {
  valid: boolean;
  handoffType: HandoffType;
  reason: string;
  gates: GateRecord[];
}

export function validateSourceDevice(input: ContinuityInput): HandoffValidationResult {
  const gates: GateRecord[] = [];

  if (!input.fromDeviceId?.trim()) {
    gates.push({
      gateId: 'src-dev-0001',
      gateType: 'SOURCE_DEVICE',
      status: 'CLOSED',
      description: 'fromDeviceId is required',
    });
    return { valid: false, handoffType: input.handoffType, reason: 'fromDeviceId is required', gates };
  }

  gates.push({
    gateId: 'src-dev-0002',
    gateType: 'SOURCE_DEVICE',
    status: 'OPEN',
    description: `Source device validated: ${input.fromDeviceId}`,
  });

  return { valid: true, handoffType: input.handoffType, reason: 'Source device validated', gates };
}

export function validateTargetDevice(input: ContinuityInput): HandoffValidationResult {
  const gates: GateRecord[] = [];

  if (!input.toDeviceId?.trim()) {
    gates.push({
      gateId: 'tgt-dev-0001',
      gateType: 'TARGET_DEVICE',
      status: 'CLOSED',
      description: 'toDeviceId is required',
    });
    return { valid: false, handoffType: input.handoffType, reason: 'toDeviceId is required', gates };
  }

  gates.push({
    gateId: 'tgt-dev-0002',
    gateType: 'TARGET_DEVICE',
    status: 'OPEN',
    description: `Target device validated: ${input.toDeviceId}`,
  });

  return { valid: true, handoffType: input.handoffType, reason: 'Target device validated', gates };
}

export function classifyHandoff(input: ContinuityInput): HandoffValidationResult {
  const gates: GateRecord[] = [];

  if (input.handoffType === 'UNKNOWN') {
    gates.push({
      gateId: 'handoff-type-0001',
      gateType: 'HANDOFF_TYPE',
      status: 'CLOSED',
      description: 'handoffType UNKNOWN blocked',
    });
    return { valid: false, handoffType: 'UNKNOWN', reason: 'handoffType UNKNOWN blocked', gates };
  }

  if (!(KNOWN_HANDOFF_TYPES as readonly string[]).includes(input.handoffType)) {
    gates.push({
      gateId: 'handoff-type-0002',
      gateType: 'HANDOFF_TYPE',
      status: 'CLOSED',
      description: `Unknown handoff type: ${input.handoffType}`,
    });
    return { valid: false, handoffType: input.handoffType, reason: 'Unknown handoff type', gates };
  }

  gates.push({
    gateId: 'handoff-type-0003',
    gateType: 'HANDOFF_TYPE',
    status: 'OPEN',
    description: `Handoff classified: ${input.handoffType}`,
  });

  return { valid: true, handoffType: input.handoffType, reason: 'Handoff classified', gates };
}

export function validateCloudContinuitySession(input: ContinuityInput): HandoffValidationResult {
  const gates: GateRecord[] = [];

  if (!input.cloudSessionId?.trim()) {
    gates.push({
      gateId: 'cloud-sess-0001',
      gateType: 'CLOUD_SESSION',
      status: 'CLOSED',
      description: 'cloudSessionId is required',
    });
    return { valid: false, handoffType: input.handoffType, reason: 'cloudSessionId is required', gates };
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
    return { valid: false, handoffType: input.handoffType, reason: 'Cloud connection not ready', gates };
  }

  gates.push({
    gateId: 'cloud-sess-0002',
    gateType: 'CLOUD_SESSION',
    status: 'OPEN',
    description: `Cloud session validated: ${input.cloudSessionId}`,
  });

  return { valid: true, handoffType: input.handoffType, reason: 'Cloud session validated', gates };
}

export function validateHandoffRequest(input: ContinuityInput): HandoffValidationResult {
  const gates: GateRecord[] = [];

  if (!input.handoffRequestId?.trim()) {
    gates.push({
      gateId: 'handoff-req-0001',
      gateType: 'HANDOFF_REQUEST',
      status: 'CLOSED',
      description: 'handoffRequestId is required',
    });
    return { valid: false, handoffType: input.handoffType, reason: 'handoffRequestId is required', gates };
  }

  if (!input.userId?.trim()) {
    gates.push({
      gateId: 'handoff-user-0001',
      gateType: 'HANDOFF_REQUEST',
      status: 'CLOSED',
      description: 'userId is required',
    });
    return { valid: false, handoffType: input.handoffType, reason: 'userId is required', gates };
  }

  gates.push({
    gateId: 'handoff-req-0002',
    gateType: 'HANDOFF_REQUEST',
    status: 'OPEN',
    description: `Handoff request validated: ${input.handoffRequestId}`,
  });

  return { valid: true, handoffType: input.handoffType, reason: 'Handoff request validated', gates };
}

export function handoffKey(input: ContinuityInput): string {
  return [input.fromDeviceId, input.toDeviceId, input.handoffType, input.handoffRequestId].join('|');
}

export function handoffClassificationKey(type: HandoffType, valid: boolean): string {
  return `${type}|${valid}`;
}
