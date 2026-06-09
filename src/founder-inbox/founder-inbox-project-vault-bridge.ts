/**
 * Founder Inbox Foundation — Project Vault bridge.
 */

import { getStoredInboxEntry, listStoredInboxEntries, storeInboxEntry } from './founder-inbox-store.js';
import { recordInboxHistoryEntry } from './founder-inbox-history.js';
import type { FounderInboxEntry, InboxProjectVaultLink } from './founder-inbox-types.js';
import { FOUNDER_INBOX_FOUNDATION_OWNER_MODULE } from './founder-inbox-types.js';

export function linkInboxToProjectVault(
  inboxEntryId: string,
  vaultProjectId: string,
): InboxProjectVaultLink | null {
  const entry = getStoredInboxEntry(inboxEntryId);
  if (!entry) return null;

  const mismatch = vaultProjectId !== entry.inboxOwnership.projectId;
  const link: InboxProjectVaultLink = {
    vaultProjectId,
    linkedAt: Date.now(),
    linkAuthority: FOUNDER_INBOX_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeInboxEntry({
    ...entry,
    inboxProjectVaultLink: link,
    updatedAt: Date.now(),
  });

  recordInboxHistoryEntry({
    inboxEntryId,
    category: 'PROJECT_VAULT',
    summary: `Linked to project vault ${vaultProjectId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: vaultProjectId,
  });

  return link;
}

export function getProjectVaultForInbox(inboxEntryId: string): string | null {
  return getStoredInboxEntry(inboxEntryId)?.inboxProjectVaultLink.vaultProjectId ?? null;
}

export function listInboxEntriesByProjectVault(vaultProjectId: string): FounderInboxEntry[] {
  return listStoredInboxEntries().filter(
    (e) => e.inboxProjectVaultLink.vaultProjectId === vaultProjectId,
  );
}

export function detectInboxProjectVaultMismatch(inboxEntryId: string): boolean {
  const entry = getStoredInboxEntry(inboxEntryId);
  if (!entry) return true;
  return (
    entry.inboxProjectVaultLink.vaultProjectId !== entry.inboxOwnership.projectId ||
    entry.inboxProjectVaultLink.mismatchDetected
  );
}
