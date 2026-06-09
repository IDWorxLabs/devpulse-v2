/**
 * Autonomous Builder Foundation — Notification Delivery bridge (primary upstream).
 */

import { getDeliveryRecord, listDeliveryRecordsAll } from '../notification-delivery/index.js';
import {
  getStoredAutonomousBuildRecord,
  listStoredAutonomousBuildRecords,
  storeAutonomousBuildRecord,
} from './autonomous-builder-store.js';
import { recordAutonomousBuildHistoryEntry } from './autonomous-builder-history.js';
import type { AutonomousBuildSession, AutonomousBuildDeliveryLink } from './autonomous-builder-types.js';
import { AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE } from './autonomous-builder-types.js';

export function linkAutonomousBuildToDelivery(
  autonomousBuildId: string,
  deliveryId: string,
): AutonomousBuildDeliveryLink | null {
  const record = getStoredAutonomousBuildRecord(autonomousBuildId);
  const delivery = getDeliveryRecord(deliveryId);
  if (!record || !delivery) return null;

  const mismatch =
    delivery.deliveryOwnership.projectId !== record.buildOwnership.projectId ||
    record.buildOwnership.deliveryId !== deliveryId;

  const link: AutonomousBuildDeliveryLink = {
    deliveryId,
    linkedAt: Date.now(),
    linkAuthority: AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeAutonomousBuildRecord({
    ...record,
    deliveryId,
    buildOwnership: { ...record.buildOwnership, deliveryId },
    buildDeliveryLink: link,
    updatedAt: Date.now(),
  });

  recordAutonomousBuildHistoryEntry({
    autonomousBuildId,
    category: 'DELIVERY',
    summary: `Linked to delivery ${deliveryId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: deliveryId,
  });

  return link;
}

export function getDeliveryForAutonomousBuild(autonomousBuildId: string): string | null {
  return getStoredAutonomousBuildRecord(autonomousBuildId)?.buildDeliveryLink.deliveryId ?? null;
}

export function listAutonomousBuildsByDelivery(deliveryId: string): AutonomousBuildSession[] {
  return listStoredAutonomousBuildRecords().filter((r) => r.buildDeliveryLink.deliveryId === deliveryId);
}

export function detectAutonomousBuildDeliveryMismatch(autonomousBuildId: string): boolean {
  const record = getStoredAutonomousBuildRecord(autonomousBuildId);
  if (!record) return true;
  const delivery = getDeliveryRecord(record.buildDeliveryLink.deliveryId);
  if (!delivery) return true;
  return (
    delivery.deliveryOwnership.projectId !== record.buildOwnership.projectId ||
    record.buildDeliveryLink.mismatchDetected
  );
}

export function resolveDeliveryForAutonomousBuildRegistration(
  deliveryId: string,
): { exists: boolean; projectId: string | null; pushId: string | null; notificationId: string | null; inboxEntryId: string | null } {
  const delivery = getDeliveryRecord(deliveryId);
  if (!delivery) return { exists: false, projectId: null, pushId: null, notificationId: null, inboxEntryId: null };
  return {
    exists: true,
    projectId: delivery.deliveryOwnership.projectId,
    pushId: null,
    notificationId: delivery.notificationId,
    inboxEntryId: delivery.inboxEntryId,
  };
}

export function findDeliveryByName(deliveryName: string): string | null {
  const match = listDeliveryRecordsAll().find((d) => d.deliveryMetadata.deliveryName === deliveryName);
  return match?.deliveryId ?? null;
}
