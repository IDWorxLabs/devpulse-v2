/**
 * Notification Delivery Foundation — Mobile Approval bridge.
 */

import { getMobileApprovalSession } from '../mobile-approval-runtime/index.js';
import { getStoredDeliveryRecord, listStoredDeliveryRecords, storeDeliveryRecord } from './notification-delivery-store.js';
import { recordDeliveryHistoryEntry } from './notification-delivery-history.js';
import type { NotificationDeliveryRecord, DeliveryApprovalLink } from './notification-delivery-types.js';
import { NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE } from './notification-delivery-types.js';

export function linkDeliveryToApproval(
  deliveryId: string,
  approvalId: string,
): DeliveryApprovalLink | null {
  const record = getStoredDeliveryRecord(deliveryId);
  const approval = getMobileApprovalSession(approvalId);
  if (!record || !approval) return null;

  const mismatch = approval.mobileApprovalOwner.projectId !== record.deliveryOwnership.projectId;
  const link: DeliveryApprovalLink = {
    approvalId,
    linkedAt: Date.now(),
    linkAuthority: NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeDeliveryRecord({
    ...record,
    deliveryApprovalLink: link,
    updatedAt: Date.now(),
  });

  recordDeliveryHistoryEntry({
    deliveryId,
    category: 'APPROVAL',
    summary: `Linked to approval ${approvalId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: approvalId,
  });

  return link;
}

export function getApprovalForDelivery(deliveryId: string): string | null {
  return getStoredDeliveryRecord(deliveryId)?.deliveryApprovalLink.approvalId ?? null;
}

export function listDeliveriesByApproval(approvalId: string): NotificationDeliveryRecord[] {
  return listStoredDeliveryRecords().filter((r) => r.deliveryApprovalLink.approvalId === approvalId);
}

export function detectDeliveryApprovalMismatch(deliveryId: string): boolean {
  const record = getStoredDeliveryRecord(deliveryId);
  if (!record) return true;
  const approval = getMobileApprovalSession(record.deliveryApprovalLink.approvalId);
  if (!approval) return true;
  return (
    approval.mobileApprovalOwner.projectId !== record.deliveryOwnership.projectId ||
    record.deliveryApprovalLink.mismatchDetected
  );
}
