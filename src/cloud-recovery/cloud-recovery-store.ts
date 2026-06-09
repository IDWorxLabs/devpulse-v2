/**
 * Cloud Recovery Foundation — in-memory store.
 */

import type {
  CloudRecovery,
  CloudRecoveryHistoryEntry,
  CloudRecoveryLifecycleEvent,
  CloudRecoverySession,
  CloudRecoveryStateHistoryEntry,
} from './cloud-recovery-types.js';

const recoveries = new Map<string, CloudRecovery>();
const sessions = new Map<string, CloudRecoverySession>();
const lifecycleEvents = new Map<string, CloudRecoveryLifecycleEvent>();
const historyEntries = new Map<string, CloudRecoveryHistoryEntry>();
const stateHistory = new Map<string, CloudRecoveryStateHistoryEntry[]>();

let recoveryCounter = 0;
let sessionCounter = 0;
let lifecycleCounter = 0;
let historyCounter = 0;

export function resetCloudRecoveryStoreForTests(): void {
  recoveries.clear();
  sessions.clear();
  lifecycleEvents.clear();
  historyEntries.clear();
  stateHistory.clear();
  recoveryCounter = 0;
  sessionCounter = 0;
  lifecycleCounter = 0;
  historyCounter = 0;
}

export function nextRecoveryId(): string {
  recoveryCounter += 1;
  return `crec-${recoveryCounter.toString().padStart(4, '0')}`;
}

export function nextRecoverySessionId(): string {
  sessionCounter += 1;
  return `crsess-${sessionCounter.toString().padStart(4, '0')}`;
}

export function nextRecoveryLifecycleEventId(): string {
  lifecycleCounter += 1;
  return `crlc-${lifecycleCounter.toString().padStart(4, '0')}`;
}

export function nextRecoveryHistoryEntryId(): string {
  historyCounter += 1;
  return `crhi-${historyCounter.toString().padStart(4, '0')}`;
}

export function storeCloudRecovery(recovery: CloudRecovery): void {
  recoveries.set(recovery.recoveryId, recovery);
}

export function getStoredCloudRecovery(recoveryId: string): CloudRecovery | null {
  return recoveries.get(recoveryId) ?? null;
}

export function listStoredCloudRecoveries(): CloudRecovery[] {
  return [...recoveries.values()];
}

export function storeCloudRecoverySession(session: CloudRecoverySession): void {
  sessions.set(session.sessionId, session);
}

export function getStoredCloudRecoverySession(sessionId: string): CloudRecoverySession | null {
  return sessions.get(sessionId) ?? null;
}

export function listStoredCloudRecoverySessions(): CloudRecoverySession[] {
  return [...sessions.values()];
}

export function storeCloudRecoveryLifecycleEvent(event: CloudRecoveryLifecycleEvent): void {
  lifecycleEvents.set(event.eventId, event);
}

export function listStoredCloudRecoveryLifecycleEvents(): CloudRecoveryLifecycleEvent[] {
  return [...lifecycleEvents.values()];
}

export function storeCloudRecoveryHistoryEntry(entry: CloudRecoveryHistoryEntry): void {
  historyEntries.set(entry.entryId, entry);
}

export function listStoredCloudRecoveryHistoryEntries(): CloudRecoveryHistoryEntry[] {
  return [...historyEntries.values()];
}

export function appendCloudRecoveryStateHistory(entry: CloudRecoveryStateHistoryEntry): void {
  const existing = stateHistory.get(entry.recoveryId) ?? [];
  existing.push(entry);
  stateHistory.set(entry.recoveryId, existing);
}

export function getStoredCloudRecoveryStateHistory(recoveryId: string): CloudRecoveryStateHistoryEntry[] {
  return [...(stateHistory.get(recoveryId) ?? [])];
}
