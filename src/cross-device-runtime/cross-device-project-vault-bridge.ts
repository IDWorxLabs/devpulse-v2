/**
 * Cross Device Runtime Foundation — Project Vault bridge.
 */

import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { getStoredCrossDeviceSession, listStoredCrossDeviceSessions, storeCrossDeviceSession } from './cross-device-store.js';
import { recordCrossDeviceHistoryEntry } from './cross-device-history.js';
import type { CrossDeviceSession, CrossDeviceProjectVaultLink } from './cross-device-types.js';
import { CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE } from './cross-device-types.js';

export function linkCrossDeviceToProjectVault(
  crossDeviceId: string,
  vaultProjectId: string,
): CrossDeviceProjectVaultLink | null {
  const session = getStoredCrossDeviceSession(crossDeviceId);
  if (!session) return null;

  const vault = getDevPulseV2ProjectVaultAuthority();
  const project = vault.listProjects().find((p) => p.projectId === vaultProjectId);
  const mismatch = !project || project.projectId !== session.crossDeviceOwner.projectId;

  const link: CrossDeviceProjectVaultLink = {
    vaultProjectId,
    linkedAt: Date.now(),
    linkAuthority: CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeCrossDeviceSession({
    ...session,
    crossDeviceProjectVaultLink: link,
    updatedAt: Date.now(),
  });

  recordCrossDeviceHistoryEntry({
    crossDeviceId,
    category: 'PROJECT_VAULT',
    summary: `Linked to project vault ${vaultProjectId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: vaultProjectId,
  });

  return link;
}

export function getProjectVaultForCrossDevice(crossDeviceId: string): string | null {
  return getStoredCrossDeviceSession(crossDeviceId)?.crossDeviceProjectVaultLink.vaultProjectId ?? null;
}

export function listCrossDevicesByProjectVault(vaultProjectId: string): CrossDeviceSession[] {
  return listStoredCrossDeviceSessions().filter(
    (s) =>
      s.crossDeviceProjectVaultLink.vaultProjectId === vaultProjectId ||
      s.crossDeviceOwner.projectId === vaultProjectId,
  );
}

export function detectCrossDeviceProjectVaultMismatch(crossDeviceId: string): boolean {
  const session = getStoredCrossDeviceSession(crossDeviceId);
  if (!session) return true;
  return session.crossDeviceProjectVaultLink.mismatchDetected;
}
