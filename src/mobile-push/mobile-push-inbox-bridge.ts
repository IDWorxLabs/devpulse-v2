/**
 * Mobile Push Foundation — Founder Inbox bridge.
 */

import { getInboxEntry, listInboxEntriesAll } from '../founder-inbox/index.js';
import { getStoredPushRecord, listStoredPushRecords, storePushRecord } from './mobile-push-store.js';
import { recordPushHistoryEntry } from './mobile-push-history.js';
import type { MobilePushRecord, PushInboxLink } from './mobile-push-types.js';
import { MOBILE_PUSH_FOUNDATION_OWNER_MODULE } from './mobile-push-types.js';

export function linkPushToInbox(
  pushId: string,
  inboxEntryId: string,
): PushInboxLink | null {
  const record = getStoredPushRecord(pushId);
  const inbox = getInboxEntry(inboxEntryId);
  if (!record || !inbox) return null;

  const mismatch =
    inbox.inboxOwnership.projectId !== record.pushOwnership.projectId ||
    record.pushOwnership.inboxEntryId !== inboxEntryId;

  const link: PushInboxLink = {
    inboxEntryId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_PUSH_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storePushRecord({
    ...record,
    inboxEntryId,
    pushOwnership: { ...record.pushOwnership, inboxEntryId },
    pushInboxLink: link,
    updatedAt: Date.now(),
  });

  recordPushHistoryEntry({
    pushId,
    category: 'INBOX',
    summary: `Linked to inbox ${inboxEntryId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: inboxEntryId,
  });

  return link;
}

export function getInboxForPush(pushId: string): string | null {
  return getStoredPushRecord(pushId)?.pushInboxLink.inboxEntryId ?? null;
}

export function listPushRecordsByInbox(inboxEntryId: string): MobilePushRecord[] {
  return listStoredPushRecords().filter((r) => r.pushInboxLink.inboxEntryId === inboxEntryId);
}

export function detectPushInboxMismatch(pushId: string): boolean {
  const record = getStoredPushRecord(pushId);
  if (!record) return true;
  const inbox = getInboxEntry(record.pushInboxLink.inboxEntryId);
  if (!inbox) return true;
  return (
    inbox.inboxOwnership.projectId !== record.pushOwnership.projectId ||
    record.pushInboxLink.mismatchDetected
  );
}

export function resolveInboxForPushRegistration(
  inboxEntryId: string,
): { exists: boolean; projectId: string | null } {
  const inbox = getInboxEntry(inboxEntryId);
  if (!inbox) return { exists: false, projectId: null };
  return { exists: true, projectId: inbox.inboxOwnership.projectId };
}

export function findInboxEntryByName(inboxEntryName: string): string | null {
  const match = listInboxEntriesAll().find((e) => e.inboxMetadata.inboxEntryName === inboxEntryName);
  return match?.inboxEntryId ?? null;
}
