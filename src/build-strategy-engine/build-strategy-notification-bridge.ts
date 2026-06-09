/**
 * Build Strategy Engine — Founder Notification Runtime bridge.
 */

import { getNotification, listNotificationsAll } from '../founder-notification-runtime/index.js';
import {
  getStoredBuildStrategyRecord,
  listStoredBuildStrategyRecords,
  storeBuildStrategyRecord,
} from './build-strategy-store.js';
import { recordBuildStrategyHistoryEntry } from './build-strategy-history.js';
import type { BuildStrategySession, BuildStrategyNotificationLink } from './build-strategy-types.js';
import { BUILD_STRATEGY_ENGINE_OWNER_MODULE } from './build-strategy-types.js';

export function linkBuildStrategyToNotification(
  buildStrategyId: string,
  notificationId: string,
): BuildStrategyNotificationLink | null {
  const record = getStoredBuildStrategyRecord(buildStrategyId);
  const notification = getNotification(notificationId);
  if (!record || !notification) return null;

  const mismatch =
    notification.notificationOwnership.projectId !== record.strategyOwnership.projectId ||
    record.strategyOwnership.notificationId !== notificationId;

  const link: BuildStrategyNotificationLink = {
    notificationId,
    linkedAt: Date.now(),
    linkAuthority: BUILD_STRATEGY_ENGINE_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeBuildStrategyRecord({
    ...record,
    notificationId,
    strategyOwnership: { ...record.strategyOwnership, notificationId },
    strategyNotificationLink: link,
    updatedAt: Date.now(),
  });

  recordBuildStrategyHistoryEntry({
    buildStrategyId,
    category: 'NOTIFICATION',
    summary: `Linked to notification ${notificationId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: notificationId,
  });

  return link;
}

export function getNotificationForBuildStrategy(buildStrategyId: string): string | null {
  return getStoredBuildStrategyRecord(buildStrategyId)?.strategyNotificationLink.notificationId ?? null;
}

export function listBuildStrategiesByNotification(notificationId: string): BuildStrategySession[] {
  return listStoredBuildStrategyRecords().filter(
    (r) => r.strategyNotificationLink.notificationId === notificationId,
  );
}

export function detectBuildStrategyNotificationMismatch(buildStrategyId: string): boolean {
  const record = getStoredBuildStrategyRecord(buildStrategyId);
  if (!record) return true;
  const notification = getNotification(record.strategyNotificationLink.notificationId);
  if (!notification) return true;
  return (
    notification.notificationOwnership.projectId !== record.strategyOwnership.projectId ||
    record.strategyNotificationLink.mismatchDetected
  );
}

export function resolveNotificationForBuildStrategyRegistration(
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
