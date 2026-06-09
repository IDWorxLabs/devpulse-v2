/**
 * Notification Delivery Foundation — Founder Inbox bridge.
 */

import { getInboxEntry, listInboxEntriesAll } from '../founder-inbox/index.js';
import { getStoredDeliveryRecord, listStoredDeliveryRecords, storeDeliveryRecord } from './notification-delivery-store.js';
import { recordDeliveryHistoryEntry } from './notification-delivery-history.js';
import type { NotificationDeliveryRecord, DeliveryInboxLink } from './notification-delivery-types.js';
import { NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE } from './notification-delivery-types.js';

export function linkDeliveryToInbox(
  deliveryId: string,
  inboxEntryId: string,
): DeliveryInboxLink | null {
  const record = getStoredDeliveryRecord(deliveryId);
  const inbox = getInboxEntry(inboxEntryId);
  if (!record || !inbox) return null;

  const mismatch =
    inbox.inboxOwnership.projectId !== record.deliveryOwnership.projectId ||
    record.deliveryOwnership.inboxEntryId !== inboxEntryId;

  const link: DeliveryInboxLink = {
    inboxEntryId,
    linkedAt: Date.now(),
    linkAuthority: NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeDeliveryRecord({
    ...record,
    inboxEntryId,
    deliveryOwnership: { ...record.deliveryOwnership, inboxEntryId },
    deliveryInboxLink: link,
    updatedAt: Date.now(),
  });

  recordDeliveryHistoryEntry({
    deliveryId,
    category: 'INBOX',
    summary: `Linked to inbox ${inboxEntryId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: inboxEntryId,
  });

  return link;
}

export function getInboxForDelivery(deliveryId: string): string | null {
  return getStoredDeliveryRecord(deliveryId)?.deliveryInboxLink.inboxEntryId ?? null;
}

export function listDeliveriesByInbox(inboxEntryId: string): NotificationDeliveryRecord[] {
  return listStoredDeliveryRecords().filter((r) => r.deliveryInboxLink.inboxEntryId === inboxEntryId);
}

export function detectDeliveryInboxMismatch(deliveryId: string): boolean {
  const record = getStoredDeliveryRecord(deliveryId);
  if (!record) return true;
  const inbox = getInboxEntry(record.deliveryInboxLink.inboxEntryId);
  if (!inbox) return true;
  return (
    inbox.inboxOwnership.projectId !== record.deliveryOwnership.projectId ||
    record.deliveryInboxLink.mismatchDetected
  );
}

export function resolveInboxForDeliveryRegistration(
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
