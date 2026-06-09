/**
 * Cloud Monitoring Foundation — ownership tracking.
 */

import { recordCloudMonitoringHistoryEntry } from './cloud-monitoring-history.js';
import type { CloudMonitoringOwnership } from './cloud-monitoring-types.js';
import { CLOUD_MONITORING_FOUNDATION_OWNER_MODULE } from './cloud-monitoring-types.js';

export function buildCloudMonitoringOwnership(input: {
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  recoveryId: string;
  createdBy?: string;
}): CloudMonitoringOwnership {
  return {
    ownerModule: CLOUD_MONITORING_FOUNDATION_OWNER_MODULE,
    ownerDomain: 'cloud_monitoring_foundation',
    createdBy: input.createdBy ?? CLOUD_MONITORING_FOUNDATION_OWNER_MODULE,
    projectId: input.projectId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    verificationId: input.verificationId,
    recoveryId: input.recoveryId,
    monitoringSessionId: null,
    monitoringAuthority: CLOUD_MONITORING_FOUNDATION_OWNER_MODULE,
    creationTimestamp: Date.now(),
  };
}

export function recordMonitoringOwnershipHistory(monitoringId: string, summary: string): void {
  recordCloudMonitoringHistoryEntry({
    monitoringId,
    category: 'OWNERSHIP',
    summary,
    scopeUsed: monitoringId,
  });
}

export function updateMonitoringSessionOwnership(
  ownership: CloudMonitoringOwnership,
  sessionId: string,
): CloudMonitoringOwnership {
  return { ...ownership, monitoringSessionId: sessionId };
}
