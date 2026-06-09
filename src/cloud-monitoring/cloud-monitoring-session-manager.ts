/**
 * Cloud Monitoring Foundation — session manager.
 */

import {
  nextMonitoringSessionId,
  storeCloudMonitoringSession,
  getStoredCloudMonitoringSession,
  listStoredCloudMonitoringSessions,
  getStoredCloudMonitoringRecord,
  storeCloudMonitoringRecord,
} from './cloud-monitoring-store.js';
import { updateMonitoringSessionOwnership } from './cloud-monitoring-ownership.js';
import { recordCloudMonitoringHistoryEntry } from './cloud-monitoring-history.js';
import type { CloudMonitoringSession, CloudMonitoringVisibility } from './cloud-monitoring-types.js';
import { CLOUD_MONITORING_FOUNDATION_OWNER_MODULE } from './cloud-monitoring-types.js';

export function createMonitoringSession(input: {
  monitoringId: string;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  recoveryId: string;
  sessionOwner?: string;
  sessionMetadata?: Record<string, string>;
  visibility?: CloudMonitoringVisibility;
}): CloudMonitoringSession | null {
  const record = getStoredCloudMonitoringRecord(input.monitoringId);
  if (!record) return null;

  const now = Date.now();
  const session: CloudMonitoringSession = {
    sessionId: nextMonitoringSessionId(),
    monitoringId: input.monitoringId,
    projectId: input.projectId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    verificationId: input.verificationId,
    recoveryId: input.recoveryId,
    sessionOwner: input.sessionOwner ?? CLOUD_MONITORING_FOUNDATION_OWNER_MODULE,
    sessionState: record.monitoringState,
    sessionMetadata: input.sessionMetadata ?? { authority: 'cloud_monitoring_foundation' },
    sessionVisibility: input.visibility ?? record.monitoringVisibility,
    createdAt: now,
    updatedAt: now,
  };
  storeCloudMonitoringSession(session);

  storeCloudMonitoringRecord({
    ...record,
    monitoringOwner: updateMonitoringSessionOwnership(record.monitoringOwner, session.sessionId),
    updatedAt: now,
  });

  recordCloudMonitoringHistoryEntry({
    monitoringId: input.monitoringId,
    category: 'SESSION',
    summary: `Session ${session.sessionId} created`,
    scopeUsed: session.sessionId,
  });

  return session;
}

export function getMonitoringSession(sessionId: string): CloudMonitoringSession | null {
  return getStoredCloudMonitoringSession(sessionId);
}

export function listMonitoringSessions(monitoringId?: string): CloudMonitoringSession[] {
  const all = listStoredCloudMonitoringSessions();
  if (!monitoringId) return all;
  return all.filter((s) => s.monitoringId === monitoringId);
}

export function trackSessionOwnership(sessionId: string, owner: string): CloudMonitoringSession | null {
  const session = getStoredCloudMonitoringSession(sessionId);
  if (!session) return null;
  const updated = { ...session, sessionOwner: owner, updatedAt: Date.now() };
  storeCloudMonitoringSession(updated);
  return updated;
}

export function trackSessionMetadata(
  sessionId: string,
  metadata: Record<string, string>,
): CloudMonitoringSession | null {
  const session = getStoredCloudMonitoringSession(sessionId);
  if (!session) return null;
  const updated = {
    ...session,
    sessionMetadata: { ...session.sessionMetadata, ...metadata },
    updatedAt: Date.now(),
  };
  storeCloudMonitoringSession(updated);
  return updated;
}

export function resetCloudMonitoringSessionManagerForTests(): void {
  // Sessions cleared via store reset
}
