/**
 * Cross Device Runtime Foundation — ownership tracking.
 */

import { recordCrossDeviceHistoryEntry } from './cross-device-history.js';
import type { CrossDeviceOwnership } from './cross-device-types.js';
import { CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE } from './cross-device-types.js';

export function buildCrossDeviceOwnership(input: {
  projectId: string;
  deviceId: string;
  deviceSessionId: string;
  mobileCommandSessionId: string;
  mobileChatSessionId: string;
  mobilePreviewSessionId: string;
  mobileApprovalSessionId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  createdBy?: string;
}): CrossDeviceOwnership {
  return {
    ownerModule: CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE,
    ownerDomain: 'cross_device_runtime_foundation',
    createdBy: input.createdBy ?? CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE,
    projectId: input.projectId,
    deviceId: input.deviceId,
    deviceSessionId: input.deviceSessionId,
    mobileCommandSessionId: input.mobileCommandSessionId,
    mobileChatSessionId: input.mobileChatSessionId,
    mobilePreviewSessionId: input.mobilePreviewSessionId,
    mobileApprovalSessionId: input.mobileApprovalSessionId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    crossDeviceAuthority: CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE,
    creationTimestamp: Date.now(),
  };
}

export function recordCrossDeviceOwnershipHistory(crossDeviceId: string, summary: string): void {
  recordCrossDeviceHistoryEntry({
    crossDeviceId,
    category: 'OWNERSHIP',
    summary,
    scopeUsed: crossDeviceId,
  });
}

export function updateCrossDeviceSessionOwnership(
  ownership: CrossDeviceOwnership,
  sessionId: string,
): CrossDeviceOwnership {
  return { ...ownership, deviceSessionId: sessionId };
}
