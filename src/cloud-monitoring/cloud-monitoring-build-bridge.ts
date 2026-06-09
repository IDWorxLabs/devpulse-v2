/**
 * Cloud Monitoring Foundation — Persistent Build Runtime Foundation bridge.
 */

import { getPersistentBuild, listPersistentBuilds } from '../persistent-build-runtime/index.js';
import { getStoredCloudMonitoringRecord, listStoredCloudMonitoringRecords, storeCloudMonitoringRecord } from './cloud-monitoring-store.js';
import { recordCloudMonitoringHistoryEntry } from './cloud-monitoring-history.js';
import type { CloudMonitoringRecord, CloudMonitoringBuildLink } from './cloud-monitoring-types.js';
import { CLOUD_MONITORING_FOUNDATION_OWNER_MODULE } from './cloud-monitoring-types.js';

export function linkMonitoringToBuild(monitoringId: string, persistentBuildId: string): CloudMonitoringBuildLink | null {
  const record = getStoredCloudMonitoringRecord(monitoringId);
  const build = getPersistentBuild(persistentBuildId);
  if (!record || !build) return null;

  const mismatch = build.buildOwner.projectId !== record.monitoringOwner.projectId;
  const link: CloudMonitoringBuildLink = {
    persistentBuildId,
    linkedAt: Date.now(),
    linkAuthority: CLOUD_MONITORING_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeCloudMonitoringRecord({
    ...record,
    monitoringBuildLink: link,
    monitoringOwner: { ...record.monitoringOwner, persistentBuildId },
    monitoringRelationships: {
      ...record.monitoringRelationships,
      relatedPersistentBuildIds: [
        ...new Set([...record.monitoringRelationships.relatedPersistentBuildIds, persistentBuildId]),
      ],
    },
    updatedAt: Date.now(),
  });

  recordCloudMonitoringHistoryEntry({
    monitoringId,
    category: 'PERSISTENT_BUILD',
    summary: `Linked to build ${persistentBuildId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: persistentBuildId,
  });

  return link;
}

export function getBuildForMonitoring(monitoringId: string): string | null {
  return getStoredCloudMonitoringRecord(monitoringId)?.monitoringBuildLink.persistentBuildId ?? null;
}

export function listMonitoringByBuild(persistentBuildId: string): CloudMonitoringRecord[] {
  return listStoredCloudMonitoringRecords().filter(
    (r) =>
      r.monitoringBuildLink.persistentBuildId === persistentBuildId ||
      r.monitoringOwner.persistentBuildId === persistentBuildId,
  );
}

export function detectMonitoringBuildMismatch(monitoringId: string): boolean {
  const record = getStoredCloudMonitoringRecord(monitoringId);
  if (!record) return true;
  const build = getPersistentBuild(record.monitoringBuildLink.persistentBuildId);
  if (!build) return true;
  return (
    build.buildOwner.projectId !== record.monitoringOwner.projectId ||
    record.monitoringBuildLink.mismatchDetected
  );
}

export function resolveBuildForMonitoringRegistration(
  persistentBuildId: string,
): { exists: boolean; projectId: string | null } {
  const build = getPersistentBuild(persistentBuildId);
  if (!build) return { exists: false, projectId: null };
  return { exists: true, projectId: build.buildOwner.projectId };
}

export function listAvailableBuildIdsForMonitoringBridge(): string[] {
  return listPersistentBuilds().map((b) => b.buildId);
}
