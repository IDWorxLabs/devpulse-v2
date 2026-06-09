/**
 * Founder Notification Runtime Foundation — Mobile Approval bridge.
 */

import { getMobileApprovalSession } from '../mobile-approval-runtime/index.js';
import { getStoredNotification, listStoredNotifications, storeNotification } from './founder-notification-store.js';
import { recordNotificationHistoryEntry } from './founder-notification-history.js';
import type { FounderNotification, NotificationApprovalLink } from './founder-notification-types.js';
import { FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE } from './founder-notification-types.js';

export function linkNotificationToApproval(
  notificationId: string,
  approvalId: string,
): NotificationApprovalLink | null {
  const notification = getStoredNotification(notificationId);
  const approval = getMobileApprovalSession(approvalId);
  if (!notification || !approval) return null;

  const mismatch = approval.mobileApprovalOwner.projectId !== notification.notificationOwnership.projectId;
  const link: NotificationApprovalLink = {
    approvalId,
    linkedAt: Date.now(),
    linkAuthority: FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeNotification({
    ...notification,
    notificationApprovalLink: link,
    updatedAt: Date.now(),
  });

  recordNotificationHistoryEntry({
    notificationId,
    category: 'APPROVAL',
    summary: `Linked to mobile approval ${approvalId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: approvalId,
  });

  return link;
}

export function getApprovalForNotification(notificationId: string): string | null {
  return getStoredNotification(notificationId)?.notificationApprovalLink.approvalId ?? null;
}

export function listNotificationsByApproval(approvalId: string): FounderNotification[] {
  return listStoredNotifications().filter(
    (n) =>
      n.notificationApprovalLink.approvalId === approvalId ||
      n.notificationContext.approvalId === approvalId,
  );
}

export function detectNotificationApprovalMismatch(notificationId: string): boolean {
  const notification = getStoredNotification(notificationId);
  if (!notification) return true;
  const approval = getMobileApprovalSession(notification.notificationApprovalLink.approvalId);
  if (!approval) return true;
  return (
    approval.mobileApprovalOwner.projectId !== notification.notificationOwnership.projectId ||
    notification.notificationApprovalLink.mismatchDetected
  );
}

export function resolveApprovalForNotificationRegistration(
  approvalId: string,
): { exists: boolean; projectId: string | null } {
  const approval = getMobileApprovalSession(approvalId);
  if (!approval) return { exists: false, projectId: null };
  return { exists: true, projectId: approval.mobileApprovalOwner.projectId };
}
