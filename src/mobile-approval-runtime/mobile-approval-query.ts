/**
 * Mobile Approval Runtime Foundation — query layer.
 */

import { listStoredMobileApprovalSessions, listStoredMobileApprovalTrackedSessions } from './mobile-approval-store.js';
import { listMobileApprovalsByWorld2Operation } from './mobile-approval-world2-bridge.js';
import { listMobileApprovalsByAiDevOperation } from './mobile-approval-aidev-bridge.js';
import type { MobileApprovalSession, MobileApprovalCategory } from './mobile-approval-types.js';

export interface MobileApprovalQuery {
  projectId?: string;
  mobileCommandSessionId?: string;
  mobileChatSessionId?: string;
  mobilePreviewSessionId?: string;
  runtimeId?: string;
  workspaceId?: string;
  persistentBuildId?: string;
  ownerModule?: string;
  mobileApprovalType?: MobileApprovalCategory;
  mobileApprovalState?: MobileApprovalSession['mobileApprovalState'];
  world2OperationId?: string;
  aidevOperationId?: string;
}

export function queryMobileApprovalSessions(query: MobileApprovalQuery = {}): MobileApprovalSession[] {
  if (query.world2OperationId) {
    return listMobileApprovalsByWorld2Operation(query.world2OperationId).filter((s) =>
      matchesMobileApprovalQuery(s, { ...query, world2OperationId: undefined }),
    );
  }
  if (query.aidevOperationId) {
    return listMobileApprovalsByAiDevOperation(query.aidevOperationId).filter((s) =>
      matchesMobileApprovalQuery(s, { ...query, aidevOperationId: undefined }),
    );
  }
  return listStoredMobileApprovalSessions().filter((s) => matchesMobileApprovalQuery(s, query));
}

function matchesMobileApprovalQuery(session: MobileApprovalSession, query: MobileApprovalQuery): boolean {
  if (query.projectId && session.mobileApprovalOwner.projectId !== query.projectId) return false;
  if (query.mobileCommandSessionId && session.mobileApprovalOwner.mobileCommandSessionId !== query.mobileCommandSessionId) {
    return false;
  }
  if (query.mobileChatSessionId && session.mobileApprovalOwner.mobileChatSessionId !== query.mobileChatSessionId) {
    return false;
  }
  if (query.mobilePreviewSessionId && session.mobileApprovalOwner.mobilePreviewSessionId !== query.mobilePreviewSessionId) {
    return false;
  }
  if (query.runtimeId && session.mobileApprovalOwner.runtimeId !== query.runtimeId) return false;
  if (query.workspaceId && session.mobileApprovalOwner.workspaceId !== query.workspaceId) return false;
  if (query.persistentBuildId && session.mobileApprovalOwner.persistentBuildId !== query.persistentBuildId) {
    return false;
  }
  if (query.ownerModule && session.mobileApprovalOwner.ownerModule !== query.ownerModule) return false;
  if (query.mobileApprovalType && session.mobileApprovalType !== query.mobileApprovalType) return false;
  if (query.mobileApprovalState && session.mobileApprovalState !== query.mobileApprovalState) return false;
  return true;
}

export function listMobileApprovalSessionsAll(): MobileApprovalSession[] {
  return listStoredMobileApprovalSessions();
}

export function listMobileApprovalsByProject(projectId: string): MobileApprovalSession[] {
  return queryMobileApprovalSessions({ projectId });
}

export function listMobileApprovalsByCommandSession(mobileCommandSessionId: string): MobileApprovalSession[] {
  return queryMobileApprovalSessions({ mobileCommandSessionId });
}

export function listMobileApprovalsByChatSession(mobileChatSessionId: string): MobileApprovalSession[] {
  return queryMobileApprovalSessions({ mobileChatSessionId });
}

export function listMobileApprovalsByPreviewSession(mobilePreviewSessionId: string): MobileApprovalSession[] {
  return queryMobileApprovalSessions({ mobilePreviewSessionId });
}

export function listMobileApprovalsByRuntime(runtimeId: string): MobileApprovalSession[] {
  return queryMobileApprovalSessions({ runtimeId });
}

export function listMobileApprovalsByWorkspace(workspaceId: string): MobileApprovalSession[] {
  return queryMobileApprovalSessions({ workspaceId });
}

export function listMobileApprovalsByPersistentBuild(persistentBuildId: string): MobileApprovalSession[] {
  return queryMobileApprovalSessions({ persistentBuildId });
}

export function listMobileApprovalsByOwner(ownerModule: string): MobileApprovalSession[] {
  return queryMobileApprovalSessions({ ownerModule });
}

export function listMobileApprovalsByType(mobileApprovalType: MobileApprovalCategory): MobileApprovalSession[] {
  return queryMobileApprovalSessions({ mobileApprovalType });
}

export function listMobileApprovalsByWorld2(world2OperationId: string): MobileApprovalSession[] {
  return queryMobileApprovalSessions({ world2OperationId });
}

export function listMobileApprovalsByAiDev(aidevOperationId: string): MobileApprovalSession[] {
  return queryMobileApprovalSessions({ aidevOperationId });
}

export function countMobileApprovalsByState(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of listStoredMobileApprovalSessions()) {
    counts[s.mobileApprovalState] = (counts[s.mobileApprovalState] ?? 0) + 1;
  }
  return counts;
}

export function countMobileApprovalTrackedSessions(): number {
  return listStoredMobileApprovalTrackedSessions().length;
}
