/**
 * Founder Inbox Foundation — priority metadata.
 */

import { getStoredInboxEntry, listStoredInboxEntries, storeInboxEntry } from './founder-inbox-store.js';
import { recordInboxHistoryEntry } from './founder-inbox-history.js';
import type { FounderInboxEntry, InboxCategory, InboxPriority, InboxPriorityMeta } from './founder-inbox-types.js';

const CATEGORY_DEFAULT_PRIORITY: Record<InboxCategory, InboxPriority> = {
  GENERAL_INBOX: 'NORMAL',
  PROJECT_INBOX: 'HIGH',
  MOBILE_INBOX: 'HIGH',
  CLOUD_INBOX: 'NORMAL',
  WORLD2_INBOX: 'HIGH',
  AUTONOMOUS_BUILDER_INBOX: 'NORMAL',
  AIDEV_INBOX: 'NORMAL',
  APPROVAL_INBOX: 'HIGH',
  PREVIEW_INBOX: 'NORMAL',
  COMMAND_INBOX: 'HIGH',
  CHAT_INBOX: 'NORMAL',
  SYSTEM_INBOX: 'INFORMATIONAL',
};

export function buildDefaultInboxPriority(
  category: InboxCategory,
  priority?: InboxPriority,
): InboxPriorityMeta {
  const p = priority ?? CATEGORY_DEFAULT_PRIORITY[category];
  return {
    priority: p,
    priorityReason: `Default priority for ${category}`,
    escalated: p === 'CRITICAL' || p === 'HIGH',
    escalationReason: p === 'CRITICAL' ? 'Critical inbox category' : null,
  };
}

export function registerInboxPriority(
  inboxEntryId: string,
  priorityMeta: InboxPriorityMeta,
): InboxPriorityMeta | null {
  const entry = getStoredInboxEntry(inboxEntryId);
  if (!entry) return null;
  storeInboxEntry({ ...entry, inboxPriority: priorityMeta, updatedAt: Date.now() });
  recordInboxHistoryEntry({
    inboxEntryId,
    category: 'PRIORITY',
    summary: `Priority set to ${priorityMeta.priority}`,
    scopeUsed: inboxEntryId,
  });
  return priorityMeta;
}

export function getInboxPriority(inboxEntryId: string): InboxPriorityMeta | null {
  return getStoredInboxEntry(inboxEntryId)?.inboxPriority ?? null;
}

export function listInboxEntriesByPriority(priority: InboxPriority): FounderInboxEntry[] {
  return listStoredInboxEntries().filter((e) => e.inboxPriority.priority === priority);
}
