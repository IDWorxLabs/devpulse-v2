/**
 * Mobile Command Runtime Foundation — Cloud Runtime Foundation bridge.
 */

import { getRuntime } from '../cloud-runtime/index.js';
import { getStoredMobileCommandSession, listStoredMobileCommandSessions, storeMobileCommandSession } from './mobile-command-store.js';
import { recordMobileCommandHistoryEntry } from './mobile-command-history.js';
import type { MobileCommandSession, MobileCommandCloudLink } from './mobile-command-types.js';
import { MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-command-types.js';

export function linkMobileCommandToCloud(mobileCommandId: string, runtimeId: string): MobileCommandCloudLink | null {
  const session = getStoredMobileCommandSession(mobileCommandId);
  const runtime = getRuntime(runtimeId);
  if (!session || !runtime) return null;

  const mismatch = runtime.runtimeOwner.projectId !== session.mobileCommandOwner.projectId;
  const link: MobileCommandCloudLink = {
    runtimeId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeMobileCommandSession({
    ...session,
    mobileCommandCloudLink: link,
    mobileCommandOwner: { ...session.mobileCommandOwner, runtimeId },
    mobileCommandRelationships: {
      ...session.mobileCommandRelationships,
      relatedRuntimeIds: [...new Set([...session.mobileCommandRelationships.relatedRuntimeIds, runtimeId])],
    },
    updatedAt: Date.now(),
  });

  recordMobileCommandHistoryEntry({
    mobileCommandId,
    category: 'RUNTIME',
    summary: `Linked to cloud runtime ${runtimeId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: runtimeId,
  });

  return link;
}

export function getCloudForMobileCommand(mobileCommandId: string): string | null {
  return getStoredMobileCommandSession(mobileCommandId)?.mobileCommandCloudLink.runtimeId ?? null;
}

export function listMobileCommandsByRuntime(runtimeId: string): MobileCommandSession[] {
  return listStoredMobileCommandSessions().filter(
    (s) => s.mobileCommandCloudLink.runtimeId === runtimeId || s.mobileCommandOwner.runtimeId === runtimeId,
  );
}

export function detectMobileCommandCloudMismatch(mobileCommandId: string): boolean {
  const session = getStoredMobileCommandSession(mobileCommandId);
  if (!session) return true;
  const runtime = getRuntime(session.mobileCommandCloudLink.runtimeId);
  if (!runtime) return true;
  return runtime.runtimeOwner.projectId !== session.mobileCommandOwner.projectId || session.mobileCommandCloudLink.mismatchDetected;
}

export function resolveRuntimeForMobileCommandRegistration(
  runtimeId: string,
): { exists: boolean; projectId: string | null } {
  const runtime = getRuntime(runtimeId);
  if (!runtime) return { exists: false, projectId: null };
  return { exists: true, projectId: runtime.runtimeOwner.projectId };
}
