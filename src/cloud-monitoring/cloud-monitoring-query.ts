/**
 * Cloud Monitoring Foundation — query layer.
 */

import { listStoredCloudMonitoringRecords, listStoredCloudMonitoringSessions } from './cloud-monitoring-store.js';
import type { CloudMonitoringRecord, CloudMonitoringCategory } from './cloud-monitoring-types.js';

export interface CloudMonitoringQuery {
  projectId?: string;
  runtimeId?: string;
  workspaceId?: string;
  persistentBuildId?: string;
  verificationId?: string;
  recoveryId?: string;
  ownerModule?: string;
  monitoringType?: CloudMonitoringCategory;
  monitoringState?: CloudMonitoringRecord['monitoringState'];
}

export function queryMonitoringRecords(query: CloudMonitoringQuery = {}): CloudMonitoringRecord[] {
  return listStoredCloudMonitoringRecords().filter((r) => {
    if (query.projectId && r.monitoringOwner.projectId !== query.projectId) return false;
    if (query.runtimeId && r.monitoringOwner.runtimeId !== query.runtimeId) return false;
    if (query.workspaceId && r.monitoringOwner.workspaceId !== query.workspaceId) return false;
    if (query.persistentBuildId && r.monitoringOwner.persistentBuildId !== query.persistentBuildId) return false;
    if (query.verificationId && r.monitoringOwner.verificationId !== query.verificationId) return false;
    if (query.recoveryId && r.monitoringOwner.recoveryId !== query.recoveryId) return false;
    if (query.ownerModule && r.monitoringOwner.ownerModule !== query.ownerModule) return false;
    if (query.monitoringType && r.monitoringType !== query.monitoringType) return false;
    if (query.monitoringState && r.monitoringState !== query.monitoringState) return false;
    return true;
  });
}

export function listMonitoringRecords(): CloudMonitoringRecord[] {
  return listStoredCloudMonitoringRecords();
}

export function listMonitoringByProject(projectId: string): CloudMonitoringRecord[] {
  return queryMonitoringRecords({ projectId });
}

export function listMonitoringByRuntime(runtimeId: string): CloudMonitoringRecord[] {
  return queryMonitoringRecords({ runtimeId });
}

export function listMonitoringByWorkspace(workspaceId: string): CloudMonitoringRecord[] {
  return queryMonitoringRecords({ workspaceId });
}

export function listMonitoringByBuild(persistentBuildId: string): CloudMonitoringRecord[] {
  return queryMonitoringRecords({ persistentBuildId });
}

export function listMonitoringByVerification(verificationId: string): CloudMonitoringRecord[] {
  return queryMonitoringRecords({ verificationId });
}

export function listMonitoringByRecovery(recoveryId: string): CloudMonitoringRecord[] {
  return queryMonitoringRecords({ recoveryId });
}

export function listMonitoringByOwner(ownerModule: string): CloudMonitoringRecord[] {
  return queryMonitoringRecords({ ownerModule });
}

export function listMonitoringByType(monitoringType: CloudMonitoringCategory): CloudMonitoringRecord[] {
  return queryMonitoringRecords({ monitoringType });
}

export function countMonitoringByState(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of listStoredCloudMonitoringRecords()) {
    counts[r.monitoringState] = (counts[r.monitoringState] ?? 0) + 1;
  }
  return counts;
}

export function countMonitoringSessions(): number {
  return listStoredCloudMonitoringSessions().length;
}
