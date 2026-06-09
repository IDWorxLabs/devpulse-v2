/**
 * Mobile Chat Runtime Foundation — Project Vault bridge.
 */

import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { getStoredMobileChatSession, listStoredMobileChatSessions, storeMobileChatSession } from './mobile-chat-store.js';
import { recordMobileChatHistoryEntry } from './mobile-chat-history.js';
import type { MobileChatSession, MobileChatProjectVaultLink } from './mobile-chat-types.js';
import { MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-chat-types.js';

export function linkMobileChatToProjectVault(mobileChatId: string, vaultProjectId: string): MobileChatProjectVaultLink | null {
  const session = getStoredMobileChatSession(mobileChatId);
  if (!session) return null;

  const vault = getDevPulseV2ProjectVaultAuthority();
  const project = vault.listProjects().find((p) => p.projectId === vaultProjectId);
  const mismatch = !project || project.projectId !== session.mobileChatOwner.projectId;

  const link: MobileChatProjectVaultLink = {
    vaultProjectId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeMobileChatSession({ ...session, mobileChatProjectVaultLink: link, updatedAt: Date.now() });
  recordMobileChatHistoryEntry({ mobileChatId, category: 'PROJECT_VAULT', summary: `Linked to vault ${vaultProjectId}`, scopeUsed: vaultProjectId });
  return link;
}

export function getProjectVaultForMobileChat(mobileChatId: string): string | null {
  return getStoredMobileChatSession(mobileChatId)?.mobileChatProjectVaultLink.vaultProjectId ?? null;
}

export function listMobileChatsByProjectVault(vaultProjectId: string): MobileChatSession[] {
  return listStoredMobileChatSessions().filter(
    (s) => s.mobileChatProjectVaultLink.vaultProjectId === vaultProjectId || s.mobileChatOwner.projectId === vaultProjectId,
  );
}

export function detectMobileChatProjectVaultMismatch(mobileChatId: string): boolean {
  const session = getStoredMobileChatSession(mobileChatId);
  if (!session) return true;
  return session.mobileChatProjectVaultLink.mismatchDetected;
}
