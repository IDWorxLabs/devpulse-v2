/**
 * Cloud Monitoring Foundation — in-memory store.
 */

import type {
  CloudMonitoringRecord,
  CloudMonitoringHistoryEntry,
  CloudMonitoringLifecycleEvent,
  CloudMonitoringSession,
  CloudMonitoringStateHistoryEntry,
} from './cloud-monitoring-types.js';

const records = new Map<string, CloudMonitoringRecord>();
const sessions = new Map<string, CloudMonitoringSession>();
const lifecycleEvents = new Map<string, CloudMonitoringLifecycleEvent>();
const historyEntries = new Map<string, CloudMonitoringHistoryEntry>();
const stateHistory = new Map<string, CloudMonitoringStateHistoryEntry[]>();

let monitoringCounter = 0;
let sessionCounter = 0;
let lifecycleCounter = 0;
let historyCounter = 0;

export function resetCloudMonitoringStoreForTests(): void {
  records.clear();
  sessions.clear();
  lifecycleEvents.clear();
  historyEntries.clear();
  stateHistory.clear();
  monitoringCounter = 0;
  sessionCounter = 0;
  lifecycleCounter = 0;
  historyCounter = 0;
}

export function nextMonitoringId(): string {
  monitoringCounter += 1;
  return `cmon-${monitoringCounter.toString().padStart(4, '0')}`;
}

export function nextMonitoringSessionId(): string {
  sessionCounter += 1;
  return `cmsess-${sessionCounter.toString().padStart(4, '0')}`;
}

export function nextMonitoringLifecycleEventId(): string {
  lifecycleCounter += 1;
  return `cmlc-${lifecycleCounter.toString().padStart(4, '0')}`;
}

export function nextMonitoringHistoryEntryId(): string {
  historyCounter += 1;
  return `cmhi-${historyCounter.toString().padStart(4, '0')}`;
}

export function storeCloudMonitoringRecord(record: CloudMonitoringRecord): void {
  records.set(record.monitoringId, record);
}

export function getStoredCloudMonitoringRecord(monitoringId: string): CloudMonitoringRecord | null {
  return records.get(monitoringId) ?? null;
}

export function listStoredCloudMonitoringRecords(): CloudMonitoringRecord[] {
  return [...records.values()];
}

export function storeCloudMonitoringSession(session: CloudMonitoringSession): void {
  sessions.set(session.sessionId, session);
}

export function getStoredCloudMonitoringSession(sessionId: string): CloudMonitoringSession | null {
  return sessions.get(sessionId) ?? null;
}

export function listStoredCloudMonitoringSessions(): CloudMonitoringSession[] {
  return [...sessions.values()];
}

export function storeCloudMonitoringLifecycleEvent(event: CloudMonitoringLifecycleEvent): void {
  lifecycleEvents.set(event.eventId, event);
}

export function listStoredCloudMonitoringLifecycleEvents(): CloudMonitoringLifecycleEvent[] {
  return [...lifecycleEvents.values()];
}

export function storeCloudMonitoringHistoryEntry(entry: CloudMonitoringHistoryEntry): void {
  historyEntries.set(entry.entryId, entry);
}

export function listStoredCloudMonitoringHistoryEntries(): CloudMonitoringHistoryEntry[] {
  return [...historyEntries.values()];
}

export function appendCloudMonitoringStateHistory(entry: CloudMonitoringStateHistoryEntry): void {
  const existing = stateHistory.get(entry.monitoringId) ?? [];
  existing.push(entry);
  stateHistory.set(entry.monitoringId, existing);
}

export function getStoredCloudMonitoringStateHistory(monitoringId: string): CloudMonitoringStateHistoryEntry[] {
  return [...(stateHistory.get(monitoringId) ?? [])];
}
