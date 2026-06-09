/**
 * Notification Delivery Foundation — operator feed bridge.
 */

import { getStoredDeliveryRecord, listStoredDeliveryRecords, storeDeliveryRecord } from './notification-delivery-store.js';
import { recordDeliveryHistoryEntry } from './notification-delivery-history.js';
import type { NotificationDeliveryRecord, DeliveryOperatorFeedLink } from './notification-delivery-types.js';
import { NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE } from './notification-delivery-types.js';

export function linkDeliveryToOperatorFeed(deliveryId: string): DeliveryOperatorFeedLink | null {
  const record = getStoredDeliveryRecord(deliveryId);
  if (!record) return null;

  const link: DeliveryOperatorFeedLink = {
    feedAuthorityId: 'devpulse_v2_operator_feed_foundation',
    linkedAt: Date.now(),
    linkAuthority: NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE,
    mismatchDetected: false,
  };

  storeDeliveryRecord({
    ...record,
    deliveryOperatorFeedLink: link,
    updatedAt: Date.now(),
  });

  recordDeliveryHistoryEntry({
    deliveryId,
    category: 'OPERATOR_FEED',
    summary: `Linked to operator feed ${link.feedAuthorityId}`,
    scopeUsed: link.feedAuthorityId,
  });

  return link;
}

export function getOperatorFeedForDelivery(deliveryId: string): string | null {
  return getStoredDeliveryRecord(deliveryId)?.deliveryOperatorFeedLink.feedAuthorityId ?? null;
}

export function listDeliveriesByOperatorFeed(feedAuthorityId: string): NotificationDeliveryRecord[] {
  return listStoredDeliveryRecords().filter(
    (r) => r.deliveryOperatorFeedLink.feedAuthorityId === feedAuthorityId,
  );
}

export function detectDeliveryOperatorFeedMismatch(deliveryId: string): boolean {
  const record = getStoredDeliveryRecord(deliveryId);
  if (!record) return true;
  return record.deliveryOperatorFeedLink.mismatchDetected;
}
