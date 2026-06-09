/**
 * Autonomous Builder Foundation — Founder Notification Runtime bridge.
 */

import { getNotification, listNotificationsAll } from '../founder-notification-runtime/index.js';
import {
  getStoredAutonomousBuildRecord,
  listStoredAutonomousBuildRecords,
  storeAutonomousBuildRecord,
} from './autonomous-builder-store.js';
import { recordAutonomousBuildHistoryEntry } from './autonomous-builder-history.js';
import type { AutonomousBuildSession, AutonomousBuildNotificationLink } from './autonomous-builder-types.js';
import { AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE } from './autonomous-builder-types.js';

export function linkAutonomousBuildToNotification(
  autonomousBuildId: string,
  notificationId: string,
): AutonomousBuildNotificationLink | null {
  const record = getStoredAutonomousBuildRecord(autonomousBuildId);
  const notification = getNotification(notificationId);
  if (!record || !notification) return null;

  const mismatch =
    notification.notificationOwnership.projectId !== record.buildOwnership.projectId ||
    record.buildOwnership.notificationId !== notificationId;

  const link: AutonomousBuildNotificationLink = {
    notificationId,
    linkedAt: Date.now(),
    linkAuthority: AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeAutonomousBuildRecord({
    ...record,
    notificationId,
    buildOwnership: { ...record.buildOwnership, notificationId },
    buildNotificationLink: link,
    updatedAt: Date.now(),
  });

  recordAutonomousBuildHistoryEntry({
    autonomousBuildId,
    category: 'NOTIFICATION',
    summary: `Linked to notification ${notificationId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: notificationId,
  });

  return link;
}

export function getNotificationForAutonomousBuild(autonomousBuildId: string): string | null {
  return getStoredAutonomousBuildRecord(autonomousBuildId)?.buildNotificationLink.notificationId ?? null;
}

export function listAutonomousBuildsByNotification(notificationId: string): AutonomousBuildSession[] {
  return listStoredAutonomousBuildRecords().filter(
    (r) => r.buildNotificationLink.notificationId === notificationId,
  );
}

export function detectAutonomousBuildNotificationMismatch(autonomousBuildId: string): boolean {
  const record = getStoredAutonomousBuildRecord(autonomousBuildId);
  if (!record) return true;
  const notification = getNotification(record.buildNotificationLink.notificationId);
  if (!notification) return true;
  return (
    notification.notificationOwnership.projectId !== record.buildOwnership.projectId ||
    record.buildNotificationLink.mismatchDetected
  );
}

export function resolveNotificationForAutonomousBuildRegistration(
  notificationId: string,
): { exists: boolean; projectId: string | null } {
  const notification = getNotification(notificationId);
  if (!notification) return { exists: false, projectId: null };
  return { exists: true, projectId: notification.notificationOwnership.projectId };
}

export function findNotificationByName(notificationName: string): string | null {
  const match = listNotificationsAll().find((n) => n.notificationMetadata.notificationName === notificationName);
  return match?.notificationId ?? null;
}
