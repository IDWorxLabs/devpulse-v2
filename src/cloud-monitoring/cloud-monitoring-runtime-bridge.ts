/**
 * Cloud Monitoring Foundation — Cloud Runtime Foundation bridge.
 */

import { getRuntime, listRuntimes } from '../cloud-runtime/index.js';
import { getStoredCloudMonitoringRecord, listStoredCloudMonitoringRecords, storeCloudMonitoringRecord } from './cloud-monitoring-store.js';
import { recordCloudMonitoringHistoryEntry } from './cloud-monitoring-history.js';
import type { CloudMonitoringRecord, CloudMonitoringRuntimeLink } from './cloud-monitoring-types.js';
import { CLOUD_MONITORING_FOUNDATION_OWNER_MODULE } from './cloud-monitoring-types.js';

export function linkMonitoringToRuntime(monitoringId: string, runtimeId: string): CloudMonitoringRuntimeLink | null {
  const record = getStoredCloudMonitoringRecord(monitoringId);
  const runtime = getRuntime(runtimeId);
  if (!record || !runtime) return null;

  const mismatch = runtime.runtimeOwner.projectId !== record.monitoringOwner.projectId;
  const link: CloudMonitoringRuntimeLink = {
    runtimeId,
    linkedAt: Date.now(),
    linkAuthority: CLOUD_MONITORING_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeCloudMonitoringRecord({
    ...record,
    monitoringRuntimeLink: link,
    monitoringOwner: { ...record.monitoringOwner, runtimeId },
    monitoringRelationships: {
      ...record.monitoringRelationships,
      relatedRuntimeIds: [...new Set([...record.monitoringRelationships.relatedRuntimeIds, runtimeId])],
    },
    updatedAt: Date.now(),
  });

  recordCloudMonitoringHistoryEntry({
    monitoringId,
    category: 'RUNTIME',
    summary: `Linked to runtime ${runtimeId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: runtimeId,
  });

  return link;
}

export function getRuntimeForMonitoring(monitoringId: string): string | null {
  return getStoredCloudMonitoringRecord(monitoringId)?.monitoringRuntimeLink.runtimeId ?? null;
}

export function listMonitoringByRuntime(runtimeId: string): CloudMonitoringRecord[] {
  return listStoredCloudMonitoringRecords().filter(
    (r) => r.monitoringRuntimeLink.runtimeId === runtimeId || r.monitoringOwner.runtimeId === runtimeId,
  );
}

export function detectMonitoringRuntimeMismatch(monitoringId: string): boolean {
  const record = getStoredCloudMonitoringRecord(monitoringId);
  if (!record) return true;
  const runtime = getRuntime(record.monitoringRuntimeLink.runtimeId);
  if (!runtime) return true;
  return (
    runtime.runtimeOwner.projectId !== record.monitoringOwner.projectId ||
    record.monitoringRuntimeLink.mismatchDetected
  );
}

export function resolveRuntimeForMonitoringRegistration(
  runtimeId: string,
): { exists: boolean; projectId: string | null } {
  const runtime = getRuntime(runtimeId);
  if (!runtime) return { exists: false, projectId: null };
  return { exists: true, projectId: runtime.runtimeOwner.projectId };
}

export function listAvailableRuntimeIdsForMonitoringBridge(): string[] {
  return listRuntimes().map((r) => r.runtimeId);
}
