/**
 * Mobile Command Runtime Foundation — query layer.
 */

import { listStoredMobileCommandSessions, listStoredMobileCommandTrackedSessions } from './mobile-command-store.js';
import type { MobileCommandSession, MobileCommandCategory } from './mobile-command-types.js';

export interface MobileCommandQuery {
  projectId?: string;
  runtimeId?: string;
  workspaceId?: string;
  persistentBuildId?: string;
  verificationId?: string;
  recoveryId?: string;
  monitoringId?: string;
  ownerModule?: string;
  mobileCommandType?: MobileCommandCategory;
  mobileCommandState?: MobileCommandSession['mobileCommandState'];
}

export function queryMobileCommandSessions(query: MobileCommandQuery = {}): MobileCommandSession[] {
  return listStoredMobileCommandSessions().filter((s) => {
    if (query.projectId && s.mobileCommandOwner.projectId !== query.projectId) return false;
    if (query.runtimeId && s.mobileCommandOwner.runtimeId !== query.runtimeId) return false;
    if (query.workspaceId && s.mobileCommandOwner.workspaceId !== query.workspaceId) return false;
    if (query.persistentBuildId && s.mobileCommandOwner.persistentBuildId !== query.persistentBuildId) return false;
    if (query.verificationId && s.mobileCommandOwner.verificationId !== query.verificationId) return false;
    if (query.recoveryId && s.mobileCommandOwner.recoveryId !== query.recoveryId) return false;
    if (query.monitoringId && s.mobileCommandOwner.monitoringId !== query.monitoringId) return false;
    if (query.ownerModule && s.mobileCommandOwner.ownerModule !== query.ownerModule) return false;
    if (query.mobileCommandType && s.mobileCommandType !== query.mobileCommandType) return false;
    if (query.mobileCommandState && s.mobileCommandState !== query.mobileCommandState) return false;
    return true;
  });
}

export function listMobileCommandSessionsAll(): MobileCommandSession[] {
  return listStoredMobileCommandSessions();
}

export function listMobileCommandsByProject(projectId: string): MobileCommandSession[] {
  return queryMobileCommandSessions({ projectId });
}

export function listMobileCommandsByRuntime(runtimeId: string): MobileCommandSession[] {
  return queryMobileCommandSessions({ runtimeId });
}

export function listMobileCommandsByWorkspace(workspaceId: string): MobileCommandSession[] {
  return queryMobileCommandSessions({ workspaceId });
}

export function listMobileCommandsByBuild(persistentBuildId: string): MobileCommandSession[] {
  return queryMobileCommandSessions({ persistentBuildId });
}

export function listMobileCommandsByVerification(verificationId: string): MobileCommandSession[] {
  return queryMobileCommandSessions({ verificationId });
}

export function listMobileCommandsByRecovery(recoveryId: string): MobileCommandSession[] {
  return queryMobileCommandSessions({ recoveryId });
}

export function listMobileCommandsByMonitoring(monitoringId: string): MobileCommandSession[] {
  return queryMobileCommandSessions({ monitoringId });
}

export function listMobileCommandsByOwner(ownerModule: string): MobileCommandSession[] {
  return queryMobileCommandSessions({ ownerModule });
}

export function listMobileCommandsByType(mobileCommandType: MobileCommandCategory): MobileCommandSession[] {
  return queryMobileCommandSessions({ mobileCommandType });
}

export function countMobileCommandsByState(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of listStoredMobileCommandSessions()) {
    counts[s.mobileCommandState] = (counts[s.mobileCommandState] ?? 0) + 1;
  }
  return counts;
}

export function countMobileCommandTrackedSessions(): number {
  return listStoredMobileCommandTrackedSessions().length;
}
