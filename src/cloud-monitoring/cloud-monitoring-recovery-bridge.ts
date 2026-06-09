/**
 * Cloud Monitoring Foundation — Cloud Recovery Foundation bridge.
 */

import { getRecovery, listRecoveries } from '../cloud-recovery/index.js';
import { getStoredCloudMonitoringRecord, listStoredCloudMonitoringRecords, storeCloudMonitoringRecord } from './cloud-monitoring-store.js';
import { recordCloudMonitoringHistoryEntry } from './cloud-monitoring-history.js';
import type { CloudMonitoringRecord, CloudMonitoringRecoveryLink } from './cloud-monitoring-types.js';
import { CLOUD_MONITORING_FOUNDATION_OWNER_MODULE } from './cloud-monitoring-types.js';

export function linkMonitoringToRecovery(monitoringId: string, recoveryId: string): CloudMonitoringRecoveryLink | null {
  const record = getStoredCloudMonitoringRecord(monitoringId);
  const recovery = getRecovery(recoveryId);
  if (!record || !recovery) return null;

  const mismatch = recovery.recoveryOwner.projectId !== record.monitoringOwner.projectId;
  const link: CloudMonitoringRecoveryLink = {
    recoveryId,
    linkedAt: Date.now(),
    linkAuthority: CLOUD_MONITORING_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeCloudMonitoringRecord({
    ...record,
    monitoringRecoveryLink: link,
    monitoringOwner: { ...record.monitoringOwner, recoveryId },
    monitoringRelationships: {
      ...record.monitoringRelationships,
      relatedRecoveryIds: [...new Set([...record.monitoringRelationships.relatedRecoveryIds, recoveryId])],
    },
    updatedAt: Date.now(),
  });

  recordCloudMonitoringHistoryEntry({
    monitoringId,
    category: 'RECOVERY',
    summary: `Linked to recovery ${recoveryId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: recoveryId,
  });

  return link;
}

export function getRecoveryForMonitoring(monitoringId: string): string | null {
  return getStoredCloudMonitoringRecord(monitoringId)?.monitoringRecoveryLink.recoveryId ?? null;
}

export function listMonitoringByRecovery(recoveryId: string): CloudMonitoringRecord[] {
  return listStoredCloudMonitoringRecords().filter(
    (r) => r.monitoringRecoveryLink.recoveryId === recoveryId || r.monitoringOwner.recoveryId === recoveryId,
  );
}

export function detectMonitoringRecoveryMismatch(monitoringId: string): boolean {
  const record = getStoredCloudMonitoringRecord(monitoringId);
  if (!record) return true;
  const recovery = getRecovery(record.monitoringRecoveryLink.recoveryId);
  if (!recovery) return true;
  return (
    recovery.recoveryOwner.projectId !== record.monitoringOwner.projectId ||
    record.monitoringRecoveryLink.mismatchDetected
  );
}

export function resolveRecoveryForMonitoringRegistration(
  recoveryId: string,
): { exists: boolean; projectId: string | null } {
  const recovery = getRecovery(recoveryId);
  if (!recovery) return { exists: false, projectId: null };
  return { exists: true, projectId: recovery.recoveryOwner.projectId };
}

export function listAvailableRecoveryIdsForMonitoringBridge(): string[] {
  return listRecoveries().map((r) => r.recoveryId);
}
