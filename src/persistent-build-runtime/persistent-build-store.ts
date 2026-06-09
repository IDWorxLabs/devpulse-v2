/**
 * Persistent Build Runtime Foundation — in-memory store.
 */

import type {
  PersistentBuild,
  PersistentBuildHistoryEntry,
  PersistentBuildLifecycleEvent,
  PersistentBuildSession,
  PersistentBuildStateHistoryEntry,
} from './persistent-build-types.js';

const builds = new Map<string, PersistentBuild>();
const sessions = new Map<string, PersistentBuildSession>();
const lifecycleEvents = new Map<string, PersistentBuildLifecycleEvent>();
const historyEntries = new Map<string, PersistentBuildHistoryEntry>();
const stateHistory = new Map<string, PersistentBuildStateHistoryEntry[]>();

let buildCounter = 0;
let sessionCounter = 0;
let lifecycleCounter = 0;
let historyCounter = 0;

export function resetPersistentBuildStoreForTests(): void {
  builds.clear();
  sessions.clear();
  lifecycleEvents.clear();
  historyEntries.clear();
  stateHistory.clear();
  buildCounter = 0;
  sessionCounter = 0;
  lifecycleCounter = 0;
  historyCounter = 0;
}

export function nextBuildId(): string {
  buildCounter += 1;
  return `pbuild-${buildCounter.toString().padStart(4, '0')}`;
}

export function nextBuildSessionId(): string {
  sessionCounter += 1;
  return `pbsess-${sessionCounter.toString().padStart(4, '0')}`;
}

export function nextBuildLifecycleEventId(): string {
  lifecycleCounter += 1;
  return `pblc-${lifecycleCounter.toString().padStart(4, '0')}`;
}

export function nextBuildHistoryEntryId(): string {
  historyCounter += 1;
  return `pbhi-${historyCounter.toString().padStart(4, '0')}`;
}

export function storePersistentBuild(build: PersistentBuild): void {
  builds.set(build.buildId, build);
}

export function getStoredPersistentBuild(buildId: string): PersistentBuild | null {
  return builds.get(buildId) ?? null;
}

export function listStoredPersistentBuilds(): PersistentBuild[] {
  return [...builds.values()];
}

export function storePersistentBuildSession(session: PersistentBuildSession): void {
  sessions.set(session.sessionId, session);
}

export function getStoredPersistentBuildSession(sessionId: string): PersistentBuildSession | null {
  return sessions.get(sessionId) ?? null;
}

export function listStoredPersistentBuildSessions(): PersistentBuildSession[] {
  return [...sessions.values()];
}

export function storePersistentBuildLifecycleEvent(event: PersistentBuildLifecycleEvent): void {
  lifecycleEvents.set(event.eventId, event);
}

export function listStoredPersistentBuildLifecycleEvents(): PersistentBuildLifecycleEvent[] {
  return [...lifecycleEvents.values()];
}

export function storePersistentBuildHistoryEntry(entry: PersistentBuildHistoryEntry): void {
  historyEntries.set(entry.entryId, entry);
}

export function listStoredPersistentBuildHistoryEntries(): PersistentBuildHistoryEntry[] {
  return [...historyEntries.values()];
}

export function appendPersistentBuildStateHistory(entry: PersistentBuildStateHistoryEntry): void {
  const existing = stateHistory.get(entry.buildId) ?? [];
  existing.push(entry);
  stateHistory.set(entry.buildId, existing);
}

export function getStoredPersistentBuildStateHistory(buildId: string): PersistentBuildStateHistoryEntry[] {
  return [...(stateHistory.get(buildId) ?? [])];
}
