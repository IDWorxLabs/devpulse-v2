/**
 * Continuity readiness engine — classifies continuity readiness levels.
 * Foundation only. No execution.
 */

import type { AuthStatus, CloudConnectionStatus, ContinuityReadiness, GovernanceStatus } from './types.js';

export function determineContinuityReadiness(
  securityBlocked: boolean,
  sourceValid: boolean,
  targetValid: boolean,
  cloudValid: boolean,
  projectValid: boolean,
  governanceValid: boolean,
  capabilitiesValid: boolean,
  cloudRefreshOnly: boolean,
  authStatus: AuthStatus,
  cloudConnectionStatus: CloudConnectionStatus,
  governanceStatus: GovernanceStatus,
  missingCloudSession: boolean,
  missingSourceDevice: boolean,
  missingTargetDevice: boolean,
): ContinuityReadiness {
  if (securityBlocked) {
    if (authStatus === 'FAIL') return 'NEEDS_AUTH';
    if (cloudConnectionStatus === 'DISCONNECTED' || missingCloudSession) return 'NEEDS_CLOUD_CONNECTION';
    if (missingSourceDevice) return 'NEEDS_SOURCE_DEVICE';
    if (missingTargetDevice) return 'NEEDS_TARGET_DEVICE';
    if (governanceStatus === 'FAIL') return 'NEEDS_GOVERNANCE';
    return 'NOT_READY';
  }
  if (!sourceValid || missingSourceDevice) return 'NEEDS_SOURCE_DEVICE';
  if (!targetValid || missingTargetDevice) return 'NEEDS_TARGET_DEVICE';
  if (!cloudValid) return 'NEEDS_CLOUD_CONNECTION';
  if (!projectValid) return 'NEEDS_PROJECT_CONTEXT';
  if (!governanceValid) return 'NEEDS_GOVERNANCE';
  if (!capabilitiesValid) return 'NOT_READY';
  if (cloudRefreshOnly) return 'READY_CLOUD_STATE_REFRESH';
  return 'READY_CONTEXT_RESUME';
}

export function readinessKey(readiness: ContinuityReadiness): string {
  return readiness;
}
