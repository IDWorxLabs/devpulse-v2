/**
 * Cloud Runtime Foundation — in-memory store.
 */

import type {
  CloudRuntime,
  CloudRuntimeHistoryEntry,
  CloudRuntimeLifecycleEvent,
  CloudRuntimeSession,
  CloudRuntimeStateHistoryEntry,
} from './cloud-runtime-types.js';

const runtimes = new Map<string, CloudRuntime>();
const sessions = new Map<string, CloudRuntimeSession>();
const lifecycleEvents = new Map<string, CloudRuntimeLifecycleEvent>();
const historyEntries = new Map<string, CloudRuntimeHistoryEntry>();
const stateHistory = new Map<string, CloudRuntimeStateHistoryEntry[]>();

let runtimeCounter = 0;
let sessionCounter = 0;
let lifecycleCounter = 0;
let historyCounter = 0;

export function resetCloudRuntimeStoreForTests(): void {
  runtimes.clear();
  sessions.clear();
  lifecycleEvents.clear();
  historyEntries.clear();
  stateHistory.clear();
  runtimeCounter = 0;
  sessionCounter = 0;
  lifecycleCounter = 0;
  historyCounter = 0;
}

export function nextRuntimeId(): string {
  runtimeCounter += 1;
  return `crrt-${runtimeCounter.toString().padStart(4, '0')}`;
}

export function nextSessionId(): string {
  sessionCounter += 1;
  return `crss-${sessionCounter.toString().padStart(4, '0')}`;
}

export function nextLifecycleEventId(): string {
  lifecycleCounter += 1;
  return `crlc-${lifecycleCounter.toString().padStart(4, '0')}`;
}

export function nextHistoryEntryId(): string {
  historyCounter += 1;
  return `crhi-${historyCounter.toString().padStart(4, '0')}`;
}

export function storeRuntime(runtime: CloudRuntime): void {
  runtimes.set(runtime.runtimeId, runtime);
}

export function getStoredRuntime(runtimeId: string): CloudRuntime | null {
  return runtimes.get(runtimeId) ?? null;
}

export function listStoredRuntimes(): CloudRuntime[] {
  return [...runtimes.values()];
}

export function storeSession(session: CloudRuntimeSession): void {
  sessions.set(session.sessionId, session);
}

export function getStoredSession(sessionId: string): CloudRuntimeSession | null {
  return sessions.get(sessionId) ?? null;
}

export function listStoredSessions(): CloudRuntimeSession[] {
  return [...sessions.values()];
}

export function storeLifecycleEvent(event: CloudRuntimeLifecycleEvent): void {
  lifecycleEvents.set(event.eventId, event);
}

export function listStoredLifecycleEvents(): CloudRuntimeLifecycleEvent[] {
  return [...lifecycleEvents.values()];
}

export function storeHistoryEntry(entry: CloudRuntimeHistoryEntry): void {
  historyEntries.set(entry.entryId, entry);
}

export function listStoredHistoryEntries(): CloudRuntimeHistoryEntry[] {
  return [...historyEntries.values()];
}

export function appendStateHistory(entry: CloudRuntimeStateHistoryEntry): void {
  const existing = stateHistory.get(entry.runtimeId) ?? [];
  existing.push(entry);
  stateHistory.set(entry.runtimeId, existing);
}

export function getStoredStateHistory(runtimeId: string): CloudRuntimeStateHistoryEntry[] {
  return [...(stateHistory.get(runtimeId) ?? [])];
}
