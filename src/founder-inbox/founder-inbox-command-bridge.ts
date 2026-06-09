/**
 * Founder Inbox Foundation — Mobile Command bridge.
 */

import { getMobileCommandSession } from '../mobile-command-runtime/index.js';
import { getStoredInboxEntry, listStoredInboxEntries, storeInboxEntry } from './founder-inbox-store.js';
import { recordInboxHistoryEntry } from './founder-inbox-history.js';
import type { FounderInboxEntry, InboxCommandLink } from './founder-inbox-types.js';
import { FOUNDER_INBOX_FOUNDATION_OWNER_MODULE } from './founder-inbox-types.js';

export function linkInboxToCommand(
  inboxEntryId: string,
  commandSessionId: string,
): InboxCommandLink | null {
  const entry = getStoredInboxEntry(inboxEntryId);
  const command = getMobileCommandSession(commandSessionId);
  if (!entry || !command) return null;

  const mismatch = command.mobileCommandOwner.projectId !== entry.inboxOwnership.projectId;
  const link: InboxCommandLink = {
    commandSessionId,
    linkedAt: Date.now(),
    linkAuthority: FOUNDER_INBOX_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeInboxEntry({
    ...entry,
    inboxCommandLink: link,
    updatedAt: Date.now(),
  });

  recordInboxHistoryEntry({
    inboxEntryId,
    category: 'COMMAND',
    summary: `Linked to command ${commandSessionId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: commandSessionId,
  });

  return link;
}

export function getCommandForInbox(inboxEntryId: string): string | null {
  return getStoredInboxEntry(inboxEntryId)?.inboxCommandLink.commandSessionId ?? null;
}

export function listInboxEntriesByCommand(commandSessionId: string): FounderInboxEntry[] {
  return listStoredInboxEntries().filter(
    (e) => e.inboxCommandLink.commandSessionId === commandSessionId,
  );
}

export function detectInboxCommandMismatch(inboxEntryId: string): boolean {
  const entry = getStoredInboxEntry(inboxEntryId);
  if (!entry) return true;
  const command = getMobileCommandSession(entry.inboxCommandLink.commandSessionId);
  if (!command) return true;
  return (
    command.mobileCommandOwner.projectId !== entry.inboxOwnership.projectId ||
    entry.inboxCommandLink.mismatchDetected
  );
}
