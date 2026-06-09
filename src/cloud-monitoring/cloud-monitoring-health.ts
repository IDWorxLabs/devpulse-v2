/**
 * Cloud Monitoring Foundation — health metadata (no real infrastructure polling).
 */

import { getStoredCloudMonitoringRecord, storeCloudMonitoringRecord } from './cloud-monitoring-store.js';
import { recordCloudMonitoringHistoryEntry } from './cloud-monitoring-history.js';
import type { CloudMonitoringHealth, MonitoringHealthStatus } from './cloud-monitoring-types.js';

export function buildDefaultMonitoringHealth(category = 'GENERAL'): CloudMonitoringHealth {
  return {
    healthStatus: 'UNKNOWN',
    healthScore: 0,
    healthCategory: category,
    lastHealthUpdate: Date.now(),
    healthEvidence: [],
    healthReferences: ['authority_only', 'no_infrastructure_polling'],
  };
}

export function updateMonitoringHealth(
  monitoringId: string,
  updates: Partial<CloudMonitoringHealth>,
): CloudMonitoringHealth | null {
  const record = getStoredCloudMonitoringRecord(monitoringId);
  if (!record) return null;

  const health: CloudMonitoringHealth = {
    ...record.monitoringHealth,
    ...updates,
    lastHealthUpdate: Date.now(),
  };

  storeCloudMonitoringRecord({
    ...record,
    monitoringHealth: health,
    updatedAt: Date.now(),
  });

  recordCloudMonitoringHistoryEntry({
    monitoringId,
    category: 'HEALTH',
    summary: `Health updated: status=${health.healthStatus} score=${health.healthScore}`,
    scopeUsed: monitoringId,
  });

  return health;
}

export function getMonitoringHealth(monitoringId: string): CloudMonitoringHealth | null {
  return getStoredCloudMonitoringRecord(monitoringId)?.monitoringHealth ?? null;
}

export function validateMonitoringHealth(health: CloudMonitoringHealth): string[] {
  const issues: string[] = [];
  if (health.healthScore < 0 || health.healthScore > 100) {
    issues.push('Invalid health score — must be 0-100');
  }
  if (!health.healthCategory?.trim()) issues.push('Missing health category');
  return issues;
}

export function resolveHealthStatusForScore(score: number): MonitoringHealthStatus {
  if (score >= 80) return 'HEALTHY';
  if (score >= 50) return 'DEGRADED';
  if (score > 0) return 'CRITICAL';
  return 'UNKNOWN';
}
