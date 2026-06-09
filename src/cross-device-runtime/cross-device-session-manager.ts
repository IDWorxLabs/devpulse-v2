/**
 * Cross Device Runtime Foundation — session manager.
 */

import {
  nextCrossDeviceTrackedSessionId,
  storeCrossDeviceTrackedSession,
  getStoredCrossDeviceTrackedSession,
  listStoredCrossDeviceTrackedSessions,
  getStoredCrossDeviceSession,
  storeCrossDeviceSession,
} from './cross-device-store.js';
import { updateCrossDeviceSessionOwnership } from './cross-device-ownership.js';
import { recordCrossDeviceHistoryEntry } from './cross-device-history.js';
import type { CrossDeviceTrackedSession, DeviceVisibility } from './cross-device-types.js';
import { CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE } from './cross-device-types.js';

export function createCrossDeviceSession(input: {
  crossDeviceId: string;
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
  sessionOwner?: string;
  sessionMetadata?: Record<string, string>;
  visibility?: DeviceVisibility;
}): CrossDeviceTrackedSession | null {
  const crossDevice = getStoredCrossDeviceSession(input.crossDeviceId);
  if (!crossDevice) return null;

  const now = Date.now();
  const tracked: CrossDeviceTrackedSession = {
    sessionId: nextCrossDeviceTrackedSessionId(),
    crossDeviceId: input.crossDeviceId,
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
    sessionOwner: input.sessionOwner ?? CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE,
    sessionState: crossDevice.crossDeviceState,
    sessionMetadata: input.sessionMetadata ?? { authority: 'cross_device_runtime_foundation' },
    sessionVisibility: input.visibility ?? crossDevice.crossDeviceVisibility,
    createdAt: now,
    updatedAt: now,
  };
  storeCrossDeviceTrackedSession(tracked);

  storeCrossDeviceSession({
    ...crossDevice,
    crossDeviceOwner: updateCrossDeviceSessionOwnership(crossDevice.crossDeviceOwner, tracked.sessionId),
    updatedAt: now,
  });

  recordCrossDeviceHistoryEntry({
    crossDeviceId: input.crossDeviceId,
    category: 'SESSION',
    summary: `Tracked session ${tracked.sessionId} created`,
    scopeUsed: tracked.sessionId,
  });

  return tracked;
}

export function getCrossDeviceTrackedSession(sessionId: string): CrossDeviceTrackedSession | null {
  return getStoredCrossDeviceTrackedSession(sessionId);
}

export function listCrossDeviceTrackedSessions(crossDeviceId?: string): CrossDeviceTrackedSession[] {
  const all = listStoredCrossDeviceTrackedSessions();
  if (!crossDeviceId) return all;
  return all.filter((s) => s.crossDeviceId === crossDeviceId);
}

export function trackSessionOwnership(sessionId: string, owner: string): CrossDeviceTrackedSession | null {
  const session = getStoredCrossDeviceTrackedSession(sessionId);
  if (!session) return null;
  const updated = { ...session, sessionOwner: owner, updatedAt: Date.now() };
  storeCrossDeviceTrackedSession(updated);
  return updated;
}

export function trackSessionMetadata(
  sessionId: string,
  metadata: Record<string, string>,
): CrossDeviceTrackedSession | null {
  const session = getStoredCrossDeviceTrackedSession(sessionId);
  if (!session) return null;
  const updated = {
    ...session,
    sessionMetadata: { ...session.sessionMetadata, ...metadata },
    updatedAt: Date.now(),
  };
  storeCrossDeviceTrackedSession(updated);
  return updated;
}

export function resetCrossDeviceSessionManagerForTests(): void {
  // Cleared via store reset
}
