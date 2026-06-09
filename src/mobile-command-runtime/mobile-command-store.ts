/**
 * Mobile Command Runtime Foundation — in-memory store.
 */

import type {
  MobileCommandSession,
  MobileCommandHistoryEntry,
  MobileCommandLifecycleEvent,
  MobileCommandTrackedSession,
  MobileCommandStateHistoryEntry,
} from './mobile-command-types.js';

const sessions = new Map<string, MobileCommandSession>();
const trackedSessions = new Map<string, MobileCommandTrackedSession>();
const lifecycleEvents = new Map<string, MobileCommandLifecycleEvent>();
const historyEntries = new Map<string, MobileCommandHistoryEntry>();
const stateHistory = new Map<string, MobileCommandStateHistoryEntry[]>();

let commandCounter = 0;
let trackedSessionCounter = 0;
let lifecycleCounter = 0;
let historyCounter = 0;

export function resetMobileCommandStoreForTests(): void {
  sessions.clear();
  trackedSessions.clear();
  lifecycleEvents.clear();
  historyEntries.clear();
  stateHistory.clear();
  commandCounter = 0;
  trackedSessionCounter = 0;
  lifecycleCounter = 0;
  historyCounter = 0;
}

export function nextMobileCommandId(): string {
  commandCounter += 1;
  return `mcmd-${commandCounter.toString().padStart(4, '0')}`;
}

export function nextMobileCommandTrackedSessionId(): string {
  trackedSessionCounter += 1;
  return `mcsess-${trackedSessionCounter.toString().padStart(4, '0')}`;
}

export function nextMobileCommandLifecycleEventId(): string {
  lifecycleCounter += 1;
  return `mclc-${lifecycleCounter.toString().padStart(4, '0')}`;
}

export function nextMobileCommandHistoryEntryId(): string {
  historyCounter += 1;
  return `mchi-${historyCounter.toString().padStart(4, '0')}`;
}

export function storeMobileCommandSession(session: MobileCommandSession): void {
  sessions.set(session.mobileCommandId, session);
}

export function getStoredMobileCommandSession(mobileCommandId: string): MobileCommandSession | null {
  return sessions.get(mobileCommandId) ?? null;
}

export function listStoredMobileCommandSessions(): MobileCommandSession[] {
  return [...sessions.values()];
}

export function storeMobileCommandTrackedSession(session: MobileCommandTrackedSession): void {
  trackedSessions.set(session.sessionId, session);
}

export function getStoredMobileCommandTrackedSession(sessionId: string): MobileCommandTrackedSession | null {
  return trackedSessions.get(sessionId) ?? null;
}

export function listStoredMobileCommandTrackedSessions(): MobileCommandTrackedSession[] {
  return [...trackedSessions.values()];
}

export function storeMobileCommandLifecycleEvent(event: MobileCommandLifecycleEvent): void {
  lifecycleEvents.set(event.eventId, event);
}

export function listStoredMobileCommandLifecycleEvents(): MobileCommandLifecycleEvent[] {
  return [...lifecycleEvents.values()];
}

export function storeMobileCommandHistoryEntry(entry: MobileCommandHistoryEntry): void {
  historyEntries.set(entry.entryId, entry);
}

export function listStoredMobileCommandHistoryEntries(): MobileCommandHistoryEntry[] {
  return [...historyEntries.values()];
}

export function appendMobileCommandStateHistory(entry: MobileCommandStateHistoryEntry): void {
  const existing = stateHistory.get(entry.mobileCommandId) ?? [];
  existing.push(entry);
  stateHistory.set(entry.mobileCommandId, existing);
}

export function getStoredMobileCommandStateHistory(mobileCommandId: string): MobileCommandStateHistoryEntry[] {
  return [...(stateHistory.get(mobileCommandId) ?? [])];
}
