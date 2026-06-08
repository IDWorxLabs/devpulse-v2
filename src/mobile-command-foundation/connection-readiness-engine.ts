/**
 * Connection readiness engine — determines mobile command connection readiness.
 * Foundation only. No execution.
 */

import type {
  CapabilityClassification,
  CloudConnectionStatus,
  ConnectionReadiness,
  MobileSessionInput,
} from './types.js';
import { isCloudConnectionReady } from './cloud-session-engine.js';
import { isGovernanceReady } from './mobile-governance-bridge.js';
import { COMMAND_INTENT_CAPABILITIES, READ_ONLY_CAPABILITIES } from './types.js';

export interface ReadinessContext {
  deviceValid: boolean;
  ownershipValid: boolean;
  governanceValid: boolean;
  cloudValid: boolean;
  authPassed: boolean;
  allowedCapabilities: CapabilityClassification[];
}

export function determineConnectionReadiness(ctx: ReadinessContext): ConnectionReadiness {
  if (!ctx.deviceValid || !ctx.authPassed) {
    return ctx.authPassed === false ? 'NEEDS_AUTH' : 'NOT_READY';
  }
  if (!ctx.ownershipValid) return 'NEEDS_OWNERSHIP';
  if (!ctx.governanceValid) return 'NEEDS_GOVERNANCE';
  if (!ctx.cloudValid) return 'NEEDS_CLOUD_CONNECTION';

  const hasCommandIntent = ctx.allowedCapabilities.some(
    (c) => (COMMAND_INTENT_CAPABILITIES as readonly string[]).includes(c.capability),
  );
  const hasReadOnly = ctx.allowedCapabilities.some(
    (c) => (READ_ONLY_CAPABILITIES as readonly string[]).includes(c.capability),
  );

  if (hasCommandIntent) return 'READY_COMMAND_INTENT_ONLY';
  if (hasReadOnly) return 'READY_READ_ONLY';
  return 'NOT_READY';
}

export function buildReadinessContext(
  input: MobileSessionInput,
  deviceValid: boolean,
  ownershipValid: boolean,
  governanceValid: boolean,
  cloudValid: boolean,
  allowedCapabilities: CapabilityClassification[],
): ReadinessContext {
  return {
    deviceValid,
    ownershipValid,
    governanceValid,
    cloudValid,
    authPassed: input.authStatus === 'PASS',
    allowedCapabilities,
  };
}

export function readinessKey(readiness: ConnectionReadiness): string {
  return readiness;
}

export function mapCloudStatusToReadiness(status: CloudConnectionStatus): ConnectionReadiness | null {
  if (status === 'DISCONNECTED' || status === 'CONNECTING') return 'NEEDS_CLOUD_CONNECTION';
  return null;
}

export function isSessionReady(readiness: ConnectionReadiness): boolean {
  return readiness === 'READY_READ_ONLY' || readiness === 'READY_COMMAND_INTENT_ONLY';
}
