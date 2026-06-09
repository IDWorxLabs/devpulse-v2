/**
 * Mobile Command Runtime Foundation — Project Vault bridge.
 */

import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { getStoredMobileCommandSession, listStoredMobileCommandSessions, storeMobileCommandSession } from './mobile-command-store.js';
import { recordMobileCommandHistoryEntry } from './mobile-command-history.js';
import type { MobileCommandSession, MobileCommandProjectVaultLink } from './mobile-command-types.js';
import { MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-command-types.js';

export function linkMobileCommandToProjectVault(mobileCommandId: string, vaultProjectId: string): MobileCommandProjectVaultLink | null {
  const session = getStoredMobileCommandSession(mobileCommandId);
  if (!session) return null;

  const vault = getDevPulseV2ProjectVaultAuthority();
  const project = vault.listProjects().find((p) => p.projectId === vaultProjectId);
  const mismatch = !project || project.projectId !== session.mobileCommandOwner.projectId;

  const link: MobileCommandProjectVaultLink = {
    vaultProjectId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeMobileCommandSession({
    ...session,
    mobileCommandProjectVaultLink: link,
    updatedAt: Date.now(),
  });

  recordMobileCommandHistoryEntry({
    mobileCommandId,
    category: 'PROJECT_VAULT',
    summary: `Linked to project vault ${vaultProjectId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: vaultProjectId,
  });

  return link;
}

export function getProjectVaultForMobileCommand(mobileCommandId: string): string | null {
  return getStoredMobileCommandSession(mobileCommandId)?.mobileCommandProjectVaultLink.vaultProjectId ?? null;
}

export function listMobileCommandsByProjectVault(vaultProjectId: string): MobileCommandSession[] {
  return listStoredMobileCommandSessions().filter(
    (s) =>
      s.mobileCommandProjectVaultLink.vaultProjectId === vaultProjectId ||
      s.mobileCommandOwner.projectId === vaultProjectId,
  );
}

export function detectMobileCommandProjectVaultMismatch(mobileCommandId: string): boolean {
  const session = getStoredMobileCommandSession(mobileCommandId);
  if (!session) return true;
  return session.mobileCommandProjectVaultLink.mismatchDetected;
}
