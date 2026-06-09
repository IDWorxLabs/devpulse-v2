/**
 * Notification Delivery Foundation — Mobile Chat bridge.
 */

import { getMobileChatSession } from '../mobile-chat-runtime/index.js';
import { getStoredDeliveryRecord, listStoredDeliveryRecords, storeDeliveryRecord } from './notification-delivery-store.js';
import { recordDeliveryHistoryEntry } from './notification-delivery-history.js';
import type { NotificationDeliveryRecord, DeliveryChatLink } from './notification-delivery-types.js';
import { NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE } from './notification-delivery-types.js';

export function linkDeliveryToChat(
  deliveryId: string,
  chatSessionId: string,
): DeliveryChatLink | null {
  const record = getStoredDeliveryRecord(deliveryId);
  const chat = getMobileChatSession(chatSessionId);
  if (!record || !chat) return null;

  const mismatch = chat.mobileChatOwner.projectId !== record.deliveryOwnership.projectId;
  const link: DeliveryChatLink = {
    chatSessionId,
    linkedAt: Date.now(),
    linkAuthority: NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeDeliveryRecord({
    ...record,
    deliveryChatLink: link,
    updatedAt: Date.now(),
  });

  recordDeliveryHistoryEntry({
    deliveryId,
    category: 'CHAT',
    summary: `Linked to chat ${chatSessionId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: chatSessionId,
  });

  return link;
}

export function getChatForDelivery(deliveryId: string): string | null {
  return getStoredDeliveryRecord(deliveryId)?.deliveryChatLink.chatSessionId ?? null;
}

export function listDeliveriesByChat(chatSessionId: string): NotificationDeliveryRecord[] {
  return listStoredDeliveryRecords().filter((r) => r.deliveryChatLink.chatSessionId === chatSessionId);
}

export function detectDeliveryChatMismatch(deliveryId: string): boolean {
  const record = getStoredDeliveryRecord(deliveryId);
  if (!record) return true;
  const chat = getMobileChatSession(record.deliveryChatLink.chatSessionId);
  if (!chat) return true;
  return (
    chat.mobileChatOwner.projectId !== record.deliveryOwnership.projectId ||
    record.deliveryChatLink.mismatchDetected
  );
}
