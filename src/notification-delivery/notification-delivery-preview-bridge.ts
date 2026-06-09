/**
 * Notification Delivery Foundation — Mobile Preview bridge.
 */

import { getMobilePreviewSession } from '../mobile-preview-runtime/index.js';
import { getStoredDeliveryRecord, listStoredDeliveryRecords, storeDeliveryRecord } from './notification-delivery-store.js';
import { recordDeliveryHistoryEntry } from './notification-delivery-history.js';
import type { NotificationDeliveryRecord, DeliveryPreviewLink } from './notification-delivery-types.js';
import { NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE } from './notification-delivery-types.js';

export function linkDeliveryToPreview(
  deliveryId: string,
  previewId: string,
): DeliveryPreviewLink | null {
  const record = getStoredDeliveryRecord(deliveryId);
  const preview = getMobilePreviewSession(previewId);
  if (!record || !preview) return null;

  const mismatch = preview.mobilePreviewOwner.projectId !== record.deliveryOwnership.projectId;
  const link: DeliveryPreviewLink = {
    previewId,
    linkedAt: Date.now(),
    linkAuthority: NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeDeliveryRecord({
    ...record,
    deliveryPreviewLink: link,
    updatedAt: Date.now(),
  });

  recordDeliveryHistoryEntry({
    deliveryId,
    category: 'PREVIEW',
    summary: `Linked to preview ${previewId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: previewId,
  });

  return link;
}

export function getPreviewForDelivery(deliveryId: string): string | null {
  return getStoredDeliveryRecord(deliveryId)?.deliveryPreviewLink.previewId ?? null;
}

export function listDeliveriesByPreview(previewId: string): NotificationDeliveryRecord[] {
  return listStoredDeliveryRecords().filter((r) => r.deliveryPreviewLink.previewId === previewId);
}

export function detectDeliveryPreviewMismatch(deliveryId: string): boolean {
  const record = getStoredDeliveryRecord(deliveryId);
  if (!record) return true;
  const preview = getMobilePreviewSession(record.deliveryPreviewLink.previewId);
  if (!preview) return true;
  return (
    preview.mobilePreviewOwner.projectId !== record.deliveryOwnership.projectId ||
    record.deliveryPreviewLink.mismatchDetected
  );
}
