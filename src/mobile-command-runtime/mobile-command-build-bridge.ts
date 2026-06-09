/**
 * Mobile Command Runtime Foundation — Persistent Build Runtime Foundation bridge.
 */

import { getPersistentBuild } from '../persistent-build-runtime/index.js';
import { getStoredMobileCommandSession, listStoredMobileCommandSessions, storeMobileCommandSession } from './mobile-command-store.js';
import { recordMobileCommandHistoryEntry } from './mobile-command-history.js';
import type { MobileCommandSession, MobileCommandBuildLink } from './mobile-command-types.js';
import { MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-command-types.js';

export function linkMobileCommandToBuild(mobileCommandId: string, persistentBuildId: string): MobileCommandBuildLink | null {
  const session = getStoredMobileCommandSession(mobileCommandId);
  const build = getPersistentBuild(persistentBuildId);
  if (!session || !build) return null;

  const mismatch = build.buildOwner.projectId !== session.mobileCommandOwner.projectId;
  const link: MobileCommandBuildLink = {
    persistentBuildId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeMobileCommandSession({
    ...session,
    mobileCommandBuildLink: link,
    mobileCommandOwner: { ...session.mobileCommandOwner, persistentBuildId },
    updatedAt: Date.now(),
  });

  recordMobileCommandHistoryEntry({
    mobileCommandId,
    category: 'PERSISTENT_BUILD',
    summary: `Linked to build ${persistentBuildId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: persistentBuildId,
  });

  return link;
}

export function getBuildForMobileCommand(mobileCommandId: string): string | null {
  return getStoredMobileCommandSession(mobileCommandId)?.mobileCommandBuildLink.persistentBuildId ?? null;
}

export function listMobileCommandsByPersistentBuild(persistentBuildId: string): MobileCommandSession[] {
  return listStoredMobileCommandSessions().filter(
    (s) =>
      s.mobileCommandBuildLink.persistentBuildId === persistentBuildId ||
      s.mobileCommandOwner.persistentBuildId === persistentBuildId,
  );
}

export function detectMobileCommandBuildMismatch(mobileCommandId: string): boolean {
  const session = getStoredMobileCommandSession(mobileCommandId);
  if (!session) return true;
  const build = getPersistentBuild(session.mobileCommandBuildLink.persistentBuildId);
  if (!build) return true;
  return build.buildOwner.projectId !== session.mobileCommandOwner.projectId || session.mobileCommandBuildLink.mismatchDetected;
}

export function resolveBuildForMobileCommandRegistration(
  persistentBuildId: string,
): { exists: boolean; projectId: string | null } {
  const build = getPersistentBuild(persistentBuildId);
  if (!build) return { exists: false, projectId: null };
  return { exists: true, projectId: build.buildOwner.projectId };
}
