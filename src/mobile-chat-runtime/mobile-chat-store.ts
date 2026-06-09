/**
 * Mobile Chat Runtime Foundation — in-memory store.
 */

import type {
  MobileChatSession,
  MobileChatHistoryEntry,
  MobileChatLifecycleEvent,
  MobileChatTrackedSession,
  MobileChatStateHistoryEntry,
  MobileChatMessage,
} from './mobile-chat-types.js';

const sessions = new Map<string, MobileChatSession>();
const trackedSessions = new Map<string, MobileChatTrackedSession>();
const lifecycleEvents = new Map<string, MobileChatLifecycleEvent>();
const historyEntries = new Map<string, MobileChatHistoryEntry>();
const stateHistory = new Map<string, MobileChatStateHistoryEntry[]>();
const messages = new Map<string, MobileChatMessage>();

let chatCounter = 0;
let trackedSessionCounter = 0;
let lifecycleCounter = 0;
let historyCounter = 0;
let messageCounter = 0;

export function resetMobileChatStoreForTests(): void {
  sessions.clear();
  trackedSessions.clear();
  lifecycleEvents.clear();
  historyEntries.clear();
  stateHistory.clear();
  messages.clear();
  chatCounter = 0;
  trackedSessionCounter = 0;
  lifecycleCounter = 0;
  historyCounter = 0;
  messageCounter = 0;
}

export function nextMobileChatId(): string {
  chatCounter += 1;
  return `mchat-${chatCounter.toString().padStart(4, '0')}`;
}

export function nextMobileChatTrackedSessionId(): string {
  trackedSessionCounter += 1;
  return `mchsess-${trackedSessionCounter.toString().padStart(4, '0')}`;
}

export function nextMobileChatLifecycleEventId(): string {
  lifecycleCounter += 1;
  return `mchlc-${lifecycleCounter.toString().padStart(4, '0')}`;
}

export function nextMobileChatHistoryEntryId(): string {
  historyCounter += 1;
  return `mchi-${historyCounter.toString().padStart(4, '0')}`;
}

export function nextMobileChatMessageId(): string {
  messageCounter += 1;
  return `mmsg-${messageCounter.toString().padStart(4, '0')}`;
}

export function storeMobileChatSession(session: MobileChatSession): void {
  sessions.set(session.mobileChatId, session);
}

export function getStoredMobileChatSession(mobileChatId: string): MobileChatSession | null {
  return sessions.get(mobileChatId) ?? null;
}

export function listStoredMobileChatSessions(): MobileChatSession[] {
  return [...sessions.values()];
}

export function storeMobileChatTrackedSession(session: MobileChatTrackedSession): void {
  trackedSessions.set(session.sessionId, session);
}

export function getStoredMobileChatTrackedSession(sessionId: string): MobileChatTrackedSession | null {
  return trackedSessions.get(sessionId) ?? null;
}

export function listStoredMobileChatTrackedSessions(): MobileChatTrackedSession[] {
  return [...trackedSessions.values()];
}

export function storeMobileChatLifecycleEvent(event: MobileChatLifecycleEvent): void {
  lifecycleEvents.set(event.eventId, event);
}

export function listStoredMobileChatLifecycleEvents(): MobileChatLifecycleEvent[] {
  return [...lifecycleEvents.values()];
}

export function storeMobileChatHistoryEntry(entry: MobileChatHistoryEntry): void {
  historyEntries.set(entry.entryId, entry);
}

export function listStoredMobileChatHistoryEntries(): MobileChatHistoryEntry[] {
  return [...historyEntries.values()];
}

export function appendMobileChatStateHistory(entry: MobileChatStateHistoryEntry): void {
  const existing = stateHistory.get(entry.mobileChatId) ?? [];
  existing.push(entry);
  stateHistory.set(entry.mobileChatId, existing);
}

export function getStoredMobileChatStateHistory(mobileChatId: string): MobileChatStateHistoryEntry[] {
  return [...(stateHistory.get(mobileChatId) ?? [])];
}

export function storeMobileChatMessage(message: MobileChatMessage): void {
  messages.set(message.messageId, message);
}

export function getStoredMobileChatMessage(messageId: string): MobileChatMessage | null {
  return messages.get(messageId) ?? null;
}

export function listStoredMobileChatMessages(): MobileChatMessage[] {
  return [...messages.values()];
}
