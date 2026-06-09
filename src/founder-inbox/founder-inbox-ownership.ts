/**
 * Founder Inbox Foundation — ownership tracking (visualization layer only).
 */

import { recordInboxHistoryEntry } from './founder-inbox-history.js';
import type { InboxOwnership } from './founder-inbox-types.js';
import { FOUNDER_INBOX_FOUNDATION_OWNER_MODULE } from './founder-inbox-types.js';

export function buildInboxOwnership(input: {
  inboxEntryId: string;
  notificationId: string;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  deviceId: string;
  crossDeviceSessionId: string;
}): InboxOwnership {
  return {
    inboxEntryId: input.inboxEntryId,
    notificationId: input.notificationId,
    projectId: input.projectId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    deviceId: input.deviceId,
    crossDeviceSessionId: input.crossDeviceSessionId,
    ownerModule: FOUNDER_INBOX_FOUNDATION_OWNER_MODULE,
    ownerDomain: 'founder_inbox_foundation',
    creationTimestamp: Date.now(),
  };
}

export function recordInboxOwnershipHistory(inboxEntryId: string, summary: string): void {
  recordInboxHistoryEntry({
    inboxEntryId,
    category: 'OWNERSHIP',
    summary,
    scopeUsed: inboxEntryId,
  });
}

export function registerInboxOwnership(inboxEntryId: string, ownership: InboxOwnership): InboxOwnership {
  recordInboxOwnershipHistory(inboxEntryId, `Inbox ownership registered for ${ownership.ownerModule}`);
  return ownership;
}
