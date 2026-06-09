/**
 * Founder Inbox Foundation — Cross Device bridge.
 */

import { getCrossDeviceSession } from '../cross-device-runtime/index.js';
import { getStoredInboxEntry, listStoredInboxEntries, storeInboxEntry } from './founder-inbox-store.js';
import { recordInboxHistoryEntry } from './founder-inbox-history.js';
import type { FounderInboxEntry, InboxCrossDeviceLink } from './founder-inbox-types.js';
import { FOUNDER_INBOX_FOUNDATION_OWNER_MODULE } from './founder-inbox-types.js';

export function linkInboxToCrossDevice(
  inboxEntryId: string,
  crossDeviceSessionId: string,
): InboxCrossDeviceLink | null {
  const entry = getStoredInboxEntry(inboxEntryId);
  const crossDevice = getCrossDeviceSession(crossDeviceSessionId);
  if (!entry || !crossDevice) return null;

  const mismatch = crossDevice.crossDeviceOwner.projectId !== entry.inboxOwnership.projectId;
  const link: InboxCrossDeviceLink = {
    crossDeviceSessionId,
    linkedAt: Date.now(),
    linkAuthority: FOUNDER_INBOX_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeInboxEntry({
    ...entry,
    inboxCrossDeviceLink: link,
    updatedAt: Date.now(),
  });

  recordInboxHistoryEntry({
    inboxEntryId,
    category: 'CROSS_DEVICE',
    summary: `Linked to cross device ${crossDeviceSessionId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: crossDeviceSessionId,
  });

  return link;
}

export function getCrossDeviceForInbox(inboxEntryId: string): string | null {
  return getStoredInboxEntry(inboxEntryId)?.inboxCrossDeviceLink.crossDeviceSessionId ?? null;
}

export function listInboxEntriesByCrossDevice(crossDeviceSessionId: string): FounderInboxEntry[] {
  return listStoredInboxEntries().filter(
    (e) => e.inboxCrossDeviceLink.crossDeviceSessionId === crossDeviceSessionId,
  );
}

export function detectInboxCrossDeviceMismatch(inboxEntryId: string): boolean {
  const entry = getStoredInboxEntry(inboxEntryId);
  if (!entry) return true;
  const crossDevice = getCrossDeviceSession(entry.inboxCrossDeviceLink.crossDeviceSessionId);
  if (!crossDevice) return true;
  return (
    crossDevice.crossDeviceOwner.projectId !== entry.inboxOwnership.projectId ||
    entry.inboxCrossDeviceLink.mismatchDetected
  );
}
