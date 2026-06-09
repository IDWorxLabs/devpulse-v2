/**
 * Mobile Preview Runtime Foundation — query layer.
 */

import { listStoredMobilePreviewSessions, listStoredMobilePreviewTrackedSessions } from './mobile-preview-store.js';
import type { MobilePreviewSession, MobilePreviewCategory } from './mobile-preview-types.js';

export interface MobilePreviewQuery {
  projectId?: string;
  mobileCommandSessionId?: string;
  mobileChatSessionId?: string;
  runtimeId?: string;
  workspaceId?: string;
  persistentBuildId?: string;
  verificationId?: string;
  ownerModule?: string;
  mobilePreviewType?: MobilePreviewCategory;
  mobilePreviewState?: MobilePreviewSession['mobilePreviewState'];
}

export function queryMobilePreviewSessions(query: MobilePreviewQuery = {}): MobilePreviewSession[] {
  return listStoredMobilePreviewSessions().filter((s) => {
    if (query.projectId && s.mobilePreviewOwner.projectId !== query.projectId) return false;
    if (query.mobileCommandSessionId && s.mobilePreviewOwner.mobileCommandSessionId !== query.mobileCommandSessionId) {
      return false;
    }
    if (query.mobileChatSessionId && s.mobilePreviewOwner.mobileChatSessionId !== query.mobileChatSessionId) {
      return false;
    }
    if (query.runtimeId && s.mobilePreviewOwner.runtimeId !== query.runtimeId) return false;
    if (query.workspaceId && s.mobilePreviewOwner.workspaceId !== query.workspaceId) return false;
    if (query.persistentBuildId && s.mobilePreviewOwner.persistentBuildId !== query.persistentBuildId) {
      return false;
    }
    if (query.verificationId && s.mobilePreviewOwner.verificationId !== query.verificationId) return false;
    if (query.ownerModule && s.mobilePreviewOwner.ownerModule !== query.ownerModule) return false;
    if (query.mobilePreviewType && s.mobilePreviewType !== query.mobilePreviewType) return false;
    if (query.mobilePreviewState && s.mobilePreviewState !== query.mobilePreviewState) return false;
    return true;
  });
}

export function listMobilePreviewSessionsAll(): MobilePreviewSession[] {
  return listStoredMobilePreviewSessions();
}

export function listMobilePreviewsByProject(projectId: string): MobilePreviewSession[] {
  return queryMobilePreviewSessions({ projectId });
}

export function listMobilePreviewsByCommandSession(mobileCommandSessionId: string): MobilePreviewSession[] {
  return queryMobilePreviewSessions({ mobileCommandSessionId });
}

export function listMobilePreviewsByChatSession(mobileChatSessionId: string): MobilePreviewSession[] {
  return queryMobilePreviewSessions({ mobileChatSessionId });
}

export function listMobilePreviewsByRuntime(runtimeId: string): MobilePreviewSession[] {
  return queryMobilePreviewSessions({ runtimeId });
}

export function listMobilePreviewsByWorkspace(workspaceId: string): MobilePreviewSession[] {
  return queryMobilePreviewSessions({ workspaceId });
}

export function listMobilePreviewsByPersistentBuild(persistentBuildId: string): MobilePreviewSession[] {
  return queryMobilePreviewSessions({ persistentBuildId });
}

export function listMobilePreviewsByVerification(verificationId: string): MobilePreviewSession[] {
  return queryMobilePreviewSessions({ verificationId });
}

export function listMobilePreviewsByOwner(ownerModule: string): MobilePreviewSession[] {
  return queryMobilePreviewSessions({ ownerModule });
}

export function listMobilePreviewsByType(mobilePreviewType: MobilePreviewCategory): MobilePreviewSession[] {
  return queryMobilePreviewSessions({ mobilePreviewType });
}

export function countMobilePreviewsByState(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of listStoredMobilePreviewSessions()) {
    counts[s.mobilePreviewState] = (counts[s.mobilePreviewState] ?? 0) + 1;
  }
  return counts;
}

export function countMobilePreviewTrackedSessions(): number {
  return listStoredMobilePreviewTrackedSessions().length;
}
