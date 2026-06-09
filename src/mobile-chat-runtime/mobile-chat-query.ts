/**
 * Mobile Chat Runtime Foundation — query layer.
 */

import { listStoredMobileChatSessions, listStoredMobileChatTrackedSessions } from './mobile-chat-store.js';
import type { MobileChatSession, MobileChatCategory } from './mobile-chat-types.js';

export interface MobileChatQuery {
  projectId?: string;
  mobileCommandSessionId?: string;
  runtimeId?: string;
  workspaceId?: string;
  persistentBuildId?: string;
  verificationId?: string;
  monitoringId?: string;
  ownerModule?: string;
  mobileChatType?: MobileChatCategory;
  mobileChatState?: MobileChatSession['mobileChatState'];
}

export function queryMobileChatSessions(query: MobileChatQuery = {}): MobileChatSession[] {
  return listStoredMobileChatSessions().filter((s) => {
    if (query.projectId && s.mobileChatOwner.projectId !== query.projectId) return false;
    if (query.mobileCommandSessionId && s.mobileChatOwner.mobileCommandSessionId !== query.mobileCommandSessionId) return false;
    if (query.runtimeId && s.mobileChatOwner.runtimeId !== query.runtimeId) return false;
    if (query.workspaceId && s.mobileChatOwner.workspaceId !== query.workspaceId) return false;
    if (query.persistentBuildId && s.mobileChatOwner.persistentBuildId !== query.persistentBuildId) return false;
    if (query.verificationId && s.mobileChatOwner.verificationId !== query.verificationId) return false;
    if (query.monitoringId && s.mobileChatOwner.monitoringId !== query.monitoringId) return false;
    if (query.ownerModule && s.mobileChatOwner.ownerModule !== query.ownerModule) return false;
    if (query.mobileChatType && s.mobileChatType !== query.mobileChatType) return false;
    if (query.mobileChatState && s.mobileChatState !== query.mobileChatState) return false;
    return true;
  });
}

export function listMobileChatSessionsAll(): MobileChatSession[] {
  return listStoredMobileChatSessions();
}

export function listMobileChatsByProject(projectId: string): MobileChatSession[] {
  return queryMobileChatSessions({ projectId });
}

export function listMobileChatsByCommandSession(mobileCommandSessionId: string): MobileChatSession[] {
  return queryMobileChatSessions({ mobileCommandSessionId });
}

export function listMobileChatsByRuntime(runtimeId: string): MobileChatSession[] {
  return queryMobileChatSessions({ runtimeId });
}

export function listMobileChatsByWorkspace(workspaceId: string): MobileChatSession[] {
  return queryMobileChatSessions({ workspaceId });
}

export function listMobileChatsByPersistentBuild(persistentBuildId: string): MobileChatSession[] {
  return queryMobileChatSessions({ persistentBuildId });
}

export function listMobileChatsByVerification(verificationId: string): MobileChatSession[] {
  return queryMobileChatSessions({ verificationId });
}

export function listMobileChatsByMonitoring(monitoringId: string): MobileChatSession[] {
  return queryMobileChatSessions({ monitoringId });
}

export function listMobileChatsByOwner(ownerModule: string): MobileChatSession[] {
  return queryMobileChatSessions({ ownerModule });
}

export function listMobileChatsByType(mobileChatType: MobileChatCategory): MobileChatSession[] {
  return queryMobileChatSessions({ mobileChatType });
}

export function countMobileChatsByState(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of listStoredMobileChatSessions()) {
    counts[s.mobileChatState] = (counts[s.mobileChatState] ?? 0) + 1;
  }
  return counts;
}

export function countMobileChatTrackedSessions(): number {
  return listStoredMobileChatTrackedSessions().length;
}
