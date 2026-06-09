/**
 * Build Strategy Engine — Notification Delivery bridge.
 */

import { getDeliveryRecord, listDeliveryRecordsAll } from '../notification-delivery/index.js';
import {
  getStoredBuildStrategyRecord,
  listStoredBuildStrategyRecords,
  storeBuildStrategyRecord,
} from './build-strategy-store.js';
import { recordBuildStrategyHistoryEntry } from './build-strategy-history.js';
import type { BuildStrategySession, BuildStrategyDeliveryLink } from './build-strategy-types.js';
import { BUILD_STRATEGY_ENGINE_OWNER_MODULE } from './build-strategy-types.js';

export function linkBuildStrategyToDelivery(
  buildStrategyId: string,
  deliveryId: string,
): BuildStrategyDeliveryLink | null {
  const record = getStoredBuildStrategyRecord(buildStrategyId);
  const delivery = getDeliveryRecord(deliveryId);
  if (!record || !delivery) return null;

  const mismatch =
    delivery.deliveryOwnership.projectId !== record.strategyOwnership.projectId ||
    record.strategyOwnership.deliveryId !== deliveryId;

  const link: BuildStrategyDeliveryLink = {
    deliveryId,
    linkedAt: Date.now(),
    linkAuthority: BUILD_STRATEGY_ENGINE_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeBuildStrategyRecord({
    ...record,
    deliveryId,
    strategyOwnership: { ...record.strategyOwnership, deliveryId },
    strategyDeliveryLink: link,
    updatedAt: Date.now(),
  });

  recordBuildStrategyHistoryEntry({
    buildStrategyId,
    category: 'DELIVERY',
    summary: `Linked to delivery ${deliveryId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: deliveryId,
  });

  return link;
}

export function getDeliveryForBuildStrategy(buildStrategyId: string): string | null {
  return getStoredBuildStrategyRecord(buildStrategyId)?.strategyDeliveryLink.deliveryId ?? null;
}

export function listBuildStrategiesByDelivery(deliveryId: string): BuildStrategySession[] {
  return listStoredBuildStrategyRecords().filter((r) => r.strategyDeliveryLink.deliveryId === deliveryId);
}

export function detectBuildStrategyDeliveryMismatch(buildStrategyId: string): boolean {
  const record = getStoredBuildStrategyRecord(buildStrategyId);
  if (!record) return true;
  const delivery = getDeliveryRecord(record.strategyDeliveryLink.deliveryId);
  if (!delivery) return true;
  return (
    delivery.deliveryOwnership.projectId !== record.strategyOwnership.projectId ||
    record.strategyDeliveryLink.mismatchDetected
  );
}

export function resolveDeliveryForBuildStrategyRegistration(
  deliveryId: string,
): { exists: boolean; projectId: string | null; notificationId: string | null; inboxEntryId: string | null } {
  const delivery = getDeliveryRecord(deliveryId);
  if (!delivery) return { exists: false, projectId: null, notificationId: null, inboxEntryId: null };
  return {
    exists: true,
    projectId: delivery.deliveryOwnership.projectId,
    notificationId: delivery.notificationId,
    inboxEntryId: delivery.inboxEntryId,
  };
}

export function findDeliveryByName(deliveryName: string): string | null {
  const match = listDeliveryRecordsAll().find((d) => d.deliveryMetadata.deliveryName === deliveryName);
  return match?.deliveryId ?? null;
}
