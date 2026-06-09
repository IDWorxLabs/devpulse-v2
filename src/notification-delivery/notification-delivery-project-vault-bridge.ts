/**
 * Notification Delivery Foundation — Project Vault bridge.
 */

import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { getStoredDeliveryRecord, listStoredDeliveryRecords, storeDeliveryRecord } from './notification-delivery-store.js';
import { recordDeliveryHistoryEntry } from './notification-delivery-history.js';
import type { NotificationDeliveryRecord, DeliveryProjectVaultLink } from './notification-delivery-types.js';
import { NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE } from './notification-delivery-types.js';

export function linkDeliveryToProjectVault(
  deliveryId: string,
  vaultProjectId: string,
): DeliveryProjectVaultLink | null {
  const record = getStoredDeliveryRecord(deliveryId);
  if (!record) return null;

  const vault = getDevPulseV2ProjectVaultAuthority();
  const project = vault.getProject(vaultProjectId);
  const mismatch = !project || project.projectId !== record.deliveryOwnership.projectId;

  const link: DeliveryProjectVaultLink = {
    vaultProjectId,
    linkedAt: Date.now(),
    linkAuthority: NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeDeliveryRecord({
    ...record,
    deliveryProjectVaultLink: link,
    updatedAt: Date.now(),
  });

  recordDeliveryHistoryEntry({
    deliveryId,
    category: 'PROJECT_VAULT',
    summary: `Linked to project vault ${vaultProjectId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: vaultProjectId,
  });

  return link;
}

export function getProjectVaultForDelivery(deliveryId: string): string | null {
  return getStoredDeliveryRecord(deliveryId)?.deliveryProjectVaultLink.vaultProjectId ?? null;
}

export function listDeliveriesByProjectVault(vaultProjectId: string): NotificationDeliveryRecord[] {
  return listStoredDeliveryRecords().filter(
    (r) => r.deliveryProjectVaultLink.vaultProjectId === vaultProjectId,
  );
}

export function detectDeliveryProjectVaultMismatch(deliveryId: string): boolean {
  const record = getStoredDeliveryRecord(deliveryId);
  if (!record) return true;
  const vault = getDevPulseV2ProjectVaultAuthority();
  const project = vault.getProject(record.deliveryProjectVaultLink.vaultProjectId);
  if (!project) return true;
  return (
    project.projectId !== record.deliveryOwnership.projectId ||
    record.deliveryProjectVaultLink.mismatchDetected
  );
}
