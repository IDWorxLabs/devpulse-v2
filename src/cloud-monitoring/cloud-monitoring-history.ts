/**
 * Cloud Monitoring Foundation — history tracking.
 */

import {
  nextMonitoringHistoryEntryId,
  storeCloudMonitoringHistoryEntry,
  listStoredCloudMonitoringHistoryEntries,
} from './cloud-monitoring-store.js';
import type { CloudMonitoringHistoryEntry } from './cloud-monitoring-types.js';

export function recordCloudMonitoringHistoryEntry(input: {
  monitoringId: string;
  category: CloudMonitoringHistoryEntry['category'];
  summary: string;
  consumer?: string | null;
  scopeUsed?: string | null;
}): CloudMonitoringHistoryEntry {
  const entry: CloudMonitoringHistoryEntry = {
    entryId: nextMonitoringHistoryEntryId(),
    monitoringId: input.monitoringId,
    category: input.category,
    summary: input.summary,
    timestamp: Date.now(),
    consumer: input.consumer ?? null,
    scopeUsed: input.scopeUsed ?? null,
  };
  storeCloudMonitoringHistoryEntry(entry);
  return entry;
}

export function getCloudMonitoringHistory(monitoringId?: string): CloudMonitoringHistoryEntry[] {
  const all = listStoredCloudMonitoringHistoryEntries();
  if (!monitoringId) return all;
  return all.filter((e) => e.monitoringId === monitoringId);
}

export function getHealthHistory(monitoringId: string): CloudMonitoringHistoryEntry[] {
  return getCloudMonitoringHistory(monitoringId).filter((e) => e.category === 'HEALTH');
}

export function getAlertHistory(monitoringId: string): CloudMonitoringHistoryEntry[] {
  return getCloudMonitoringHistory(monitoringId).filter((e) => e.category === 'ALERT');
}

export function getRuntimeLinkHistory(monitoringId: string): CloudMonitoringHistoryEntry[] {
  return getCloudMonitoringHistory(monitoringId).filter((e) => e.category === 'RUNTIME');
}

export function getWorkspaceLinkHistory(monitoringId: string): CloudMonitoringHistoryEntry[] {
  return getCloudMonitoringHistory(monitoringId).filter((e) => e.category === 'WORKSPACE');
}

export function getBuildLinkHistory(monitoringId: string): CloudMonitoringHistoryEntry[] {
  return getCloudMonitoringHistory(monitoringId).filter((e) => e.category === 'PERSISTENT_BUILD');
}

export function getVerificationLinkHistory(monitoringId: string): CloudMonitoringHistoryEntry[] {
  return getCloudMonitoringHistory(monitoringId).filter((e) => e.category === 'VERIFICATION');
}

export function getRecoveryLinkHistory(monitoringId: string): CloudMonitoringHistoryEntry[] {
  return getCloudMonitoringHistory(monitoringId).filter((e) => e.category === 'RECOVERY');
}

export function getProjectMonitoringHistory(projectId: string): CloudMonitoringHistoryEntry[] {
  return listStoredCloudMonitoringHistoryEntries().filter(
    (e) => e.scopeUsed === projectId || e.summary.includes(projectId),
  );
}

export function getContextHistory(monitoringId: string): CloudMonitoringHistoryEntry[] {
  return getCloudMonitoringHistory(monitoringId).filter((e) => e.category === 'CONTEXT');
}

export function getLifecycleHistory(monitoringId: string): CloudMonitoringHistoryEntry[] {
  return getCloudMonitoringHistory(monitoringId).filter((e) => e.category === 'LIFECYCLE');
}

export function listCloudMonitoringHistoryConsumers(): string[] {
  const consumers = new Set<string>();
  for (const entry of listStoredCloudMonitoringHistoryEntries()) {
    if (entry.consumer) consumers.add(entry.consumer);
  }
  return [...consumers];
}
