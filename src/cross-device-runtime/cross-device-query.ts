/**
 * Cross Device Runtime Foundation — query layer.
 */

import {
  listStoredCrossDeviceSessions,
  listStoredCrossDeviceTrackedSessions,
  listStoredDeviceRecords,
} from './cross-device-store.js';
import type { CrossDeviceSession, CrossDeviceCategory } from './cross-device-types.js';

export interface CrossDeviceQuery {
  projectId?: string;
  deviceId?: string;
  mobileCommandSessionId?: string;
  mobileChatSessionId?: string;
  mobilePreviewSessionId?: string;
  mobileApprovalSessionId?: string;
  runtimeId?: string;
  workspaceId?: string;
  persistentBuildId?: string;
  ownerModule?: string;
  crossDeviceType?: CrossDeviceCategory;
  crossDeviceState?: CrossDeviceSession['crossDeviceState'];
}

export function queryCrossDeviceSessions(query: CrossDeviceQuery = {}): CrossDeviceSession[] {
  return listStoredCrossDeviceSessions().filter((s) => matchesCrossDeviceQuery(s, query));
}

function matchesCrossDeviceQuery(session: CrossDeviceSession, query: CrossDeviceQuery): boolean {
  if (query.projectId && session.crossDeviceOwner.projectId !== query.projectId) return false;
  if (query.deviceId && session.crossDeviceOwner.deviceId !== query.deviceId) return false;
  if (query.mobileCommandSessionId && session.crossDeviceOwner.mobileCommandSessionId !== query.mobileCommandSessionId) {
    return false;
  }
  if (query.mobileChatSessionId && session.crossDeviceOwner.mobileChatSessionId !== query.mobileChatSessionId) {
    return false;
  }
  if (query.mobilePreviewSessionId && session.crossDeviceOwner.mobilePreviewSessionId !== query.mobilePreviewSessionId) {
    return false;
  }
  if (query.mobileApprovalSessionId && session.crossDeviceOwner.mobileApprovalSessionId !== query.mobileApprovalSessionId) {
    return false;
  }
  if (query.runtimeId && session.crossDeviceOwner.runtimeId !== query.runtimeId) return false;
  if (query.workspaceId && session.crossDeviceOwner.workspaceId !== query.workspaceId) return false;
  if (query.persistentBuildId && session.crossDeviceOwner.persistentBuildId !== query.persistentBuildId) {
    return false;
  }
  if (query.ownerModule && session.crossDeviceOwner.ownerModule !== query.ownerModule) return false;
  if (query.crossDeviceType && session.crossDeviceType !== query.crossDeviceType) return false;
  if (query.crossDeviceState && session.crossDeviceState !== query.crossDeviceState) return false;
  return true;
}

export function listCrossDeviceSessionsAll(): CrossDeviceSession[] {
  return listStoredCrossDeviceSessions();
}

export function listCrossDevicesByProject(projectId: string): CrossDeviceSession[] {
  return queryCrossDeviceSessions({ projectId });
}

export function listCrossDevicesByDevice(deviceId: string): CrossDeviceSession[] {
  return queryCrossDeviceSessions({ deviceId });
}

export function listCrossDevicesByCommandSession(mobileCommandSessionId: string): CrossDeviceSession[] {
  return queryCrossDeviceSessions({ mobileCommandSessionId });
}

export function listCrossDevicesByChatSession(mobileChatSessionId: string): CrossDeviceSession[] {
  return queryCrossDeviceSessions({ mobileChatSessionId });
}

export function listCrossDevicesByPreviewSession(mobilePreviewSessionId: string): CrossDeviceSession[] {
  return queryCrossDeviceSessions({ mobilePreviewSessionId });
}

export function listCrossDevicesByApprovalSession(mobileApprovalSessionId: string): CrossDeviceSession[] {
  return queryCrossDeviceSessions({ mobileApprovalSessionId });
}

export function listCrossDevicesByRuntime(runtimeId: string): CrossDeviceSession[] {
  return queryCrossDeviceSessions({ runtimeId });
}

export function listCrossDevicesByWorkspace(workspaceId: string): CrossDeviceSession[] {
  return queryCrossDeviceSessions({ workspaceId });
}

export function listCrossDevicesByPersistentBuild(persistentBuildId: string): CrossDeviceSession[] {
  return queryCrossDeviceSessions({ persistentBuildId });
}

export function listCrossDevicesByOwner(ownerModule: string): CrossDeviceSession[] {
  return queryCrossDeviceSessions({ ownerModule });
}

export function listCrossDevicesByType(crossDeviceType: CrossDeviceCategory): CrossDeviceSession[] {
  return queryCrossDeviceSessions({ crossDeviceType });
}

export function countCrossDevicesByState(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of listStoredCrossDeviceSessions()) {
    counts[s.crossDeviceState] = (counts[s.crossDeviceState] ?? 0) + 1;
  }
  return counts;
}

export function countCrossDeviceTrackedSessions(): number {
  return listStoredCrossDeviceTrackedSessions().length;
}

export function listDeviceRecords(crossDeviceId?: string) {
  const all = listStoredDeviceRecords();
  if (!crossDeviceId) return all;
  return all.filter((r) => r.crossDeviceId === crossDeviceId);
}
