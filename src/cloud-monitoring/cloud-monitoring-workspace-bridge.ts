/**
 * Cloud Monitoring Foundation — Workspace Hosting Foundation bridge.
 */

import { getWorkspace, listWorkspaces } from '../workspace-hosting/index.js';
import { getStoredCloudMonitoringRecord, listStoredCloudMonitoringRecords, storeCloudMonitoringRecord } from './cloud-monitoring-store.js';
import { recordCloudMonitoringHistoryEntry } from './cloud-monitoring-history.js';
import type { CloudMonitoringRecord, CloudMonitoringWorkspaceLink } from './cloud-monitoring-types.js';
import { CLOUD_MONITORING_FOUNDATION_OWNER_MODULE } from './cloud-monitoring-types.js';

export function linkMonitoringToWorkspace(monitoringId: string, workspaceId: string): CloudMonitoringWorkspaceLink | null {
  const record = getStoredCloudMonitoringRecord(monitoringId);
  const workspace = getWorkspace(workspaceId);
  if (!record || !workspace) return null;

  const mismatch = workspace.workspaceOwner.projectId !== record.monitoringOwner.projectId;
  const link: CloudMonitoringWorkspaceLink = {
    workspaceId,
    linkedAt: Date.now(),
    linkAuthority: CLOUD_MONITORING_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeCloudMonitoringRecord({
    ...record,
    monitoringWorkspaceLink: link,
    monitoringOwner: { ...record.monitoringOwner, workspaceId },
    monitoringRelationships: {
      ...record.monitoringRelationships,
      relatedWorkspaceIds: [...new Set([...record.monitoringRelationships.relatedWorkspaceIds, workspaceId])],
    },
    updatedAt: Date.now(),
  });

  recordCloudMonitoringHistoryEntry({
    monitoringId,
    category: 'WORKSPACE',
    summary: `Linked to workspace ${workspaceId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: workspaceId,
  });

  return link;
}

export function getWorkspaceForMonitoring(monitoringId: string): string | null {
  return getStoredCloudMonitoringRecord(monitoringId)?.monitoringWorkspaceLink.workspaceId ?? null;
}

export function listMonitoringByWorkspace(workspaceId: string): CloudMonitoringRecord[] {
  return listStoredCloudMonitoringRecords().filter(
    (r) => r.monitoringWorkspaceLink.workspaceId === workspaceId || r.monitoringOwner.workspaceId === workspaceId,
  );
}

export function detectMonitoringWorkspaceMismatch(monitoringId: string): boolean {
  const record = getStoredCloudMonitoringRecord(monitoringId);
  if (!record) return true;
  const workspace = getWorkspace(record.monitoringWorkspaceLink.workspaceId);
  if (!workspace) return true;
  return (
    workspace.workspaceOwner.projectId !== record.monitoringOwner.projectId ||
    record.monitoringWorkspaceLink.mismatchDetected
  );
}

export function resolveWorkspaceForMonitoringRegistration(
  workspaceId: string,
): { exists: boolean; projectId: string | null } {
  const workspace = getWorkspace(workspaceId);
  if (!workspace) return { exists: false, projectId: null };
  return { exists: true, projectId: workspace.workspaceOwner.projectId };
}
