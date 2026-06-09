/**
 * Mobile Command Runtime Foundation — Cloud Recovery Foundation bridge.
 */

import { getRecovery } from '../cloud-recovery/index.js';
import { getStoredMobileCommandSession, listStoredMobileCommandSessions, storeMobileCommandSession } from './mobile-command-store.js';
import { recordMobileCommandHistoryEntry } from './mobile-command-history.js';
import type { MobileCommandSession, MobileCommandRecoveryLink } from './mobile-command-types.js';
import { MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-command-types.js';

export function linkMobileCommandToRecovery(mobileCommandId: string, recoveryId: string): MobileCommandRecoveryLink | null {
  const session = getStoredMobileCommandSession(mobileCommandId);
  const recovery = getRecovery(recoveryId);
  if (!session || !recovery) return null;

  const mismatch = recovery.recoveryOwner.projectId !== session.mobileCommandOwner.projectId;
  const link: MobileCommandRecoveryLink = {
    recoveryId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeMobileCommandSession({
    ...session,
    mobileCommandRecoveryLink: link,
    mobileCommandOwner: { ...session.mobileCommandOwner, recoveryId },
    updatedAt: Date.now(),
  });

  recordMobileCommandHistoryEntry({
    mobileCommandId,
    category: 'RECOVERY',
    summary: `Linked to recovery ${recoveryId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: recoveryId,
  });

  return link;
}

export function getRecoveryForMobileCommand(mobileCommandId: string): string | null {
  return getStoredMobileCommandSession(mobileCommandId)?.mobileCommandRecoveryLink.recoveryId ?? null;
}

export function listMobileCommandsByRecovery(recoveryId: string): MobileCommandSession[] {
  return listStoredMobileCommandSessions().filter(
    (s) => s.mobileCommandRecoveryLink.recoveryId === recoveryId || s.mobileCommandOwner.recoveryId === recoveryId,
  );
}

export function detectMobileCommandRecoveryMismatch(mobileCommandId: string): boolean {
  const session = getStoredMobileCommandSession(mobileCommandId);
  if (!session) return true;
  const recovery = getRecovery(session.mobileCommandRecoveryLink.recoveryId);
  if (!recovery) return true;
  return recovery.recoveryOwner.projectId !== session.mobileCommandOwner.projectId || session.mobileCommandRecoveryLink.mismatchDetected;
}

export function resolveRecoveryForMobileCommandRegistration(
  recoveryId: string,
): { exists: boolean; projectId: string | null } {
  const recovery = getRecovery(recoveryId);
  if (!recovery) return { exists: false, projectId: null };
  return { exists: true, projectId: recovery.recoveryOwner.projectId };
}
