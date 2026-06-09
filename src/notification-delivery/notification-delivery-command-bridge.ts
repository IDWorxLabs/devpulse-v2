/**
 * Notification Delivery Foundation — Mobile Command bridge.
 */

import { getMobileCommandSession } from '../mobile-command-runtime/index.js';
import { getStoredDeliveryRecord, listStoredDeliveryRecords, storeDeliveryRecord } from './notification-delivery-store.js';
import { recordDeliveryHistoryEntry } from './notification-delivery-history.js';
import type { NotificationDeliveryRecord, DeliveryCommandLink } from './notification-delivery-types.js';
import { NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE } from './notification-delivery-types.js';

export function linkDeliveryToCommand(
  deliveryId: string,
  commandSessionId: string,
): DeliveryCommandLink | null {
  const record = getStoredDeliveryRecord(deliveryId);
  const command = getMobileCommandSession(commandSessionId);
  if (!record || !command) return null;

  const mismatch = command.mobileCommandOwner.projectId !== record.deliveryOwnership.projectId;
  const link: DeliveryCommandLink = {
    commandSessionId,
    linkedAt: Date.now(),
    linkAuthority: NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeDeliveryRecord({
    ...record,
    deliveryCommandLink: link,
    updatedAt: Date.now(),
  });

  recordDeliveryHistoryEntry({
    deliveryId,
    category: 'COMMAND',
    summary: `Linked to command ${commandSessionId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: commandSessionId,
  });

  return link;
}

export function getCommandForDelivery(deliveryId: string): string | null {
  return getStoredDeliveryRecord(deliveryId)?.deliveryCommandLink.commandSessionId ?? null;
}

export function listDeliveriesByCommand(commandSessionId: string): NotificationDeliveryRecord[] {
  return listStoredDeliveryRecords().filter((r) => r.deliveryCommandLink.commandSessionId === commandSessionId);
}

export function detectDeliveryCommandMismatch(deliveryId: string): boolean {
  const record = getStoredDeliveryRecord(deliveryId);
  if (!record) return true;
  const command = getMobileCommandSession(record.deliveryCommandLink.commandSessionId);
  if (!command) return true;
  return (
    command.mobileCommandOwner.projectId !== record.deliveryOwnership.projectId ||
    record.deliveryCommandLink.mismatchDetected
  );
}
