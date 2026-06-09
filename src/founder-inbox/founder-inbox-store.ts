/**
 * Founder Inbox Foundation — in-memory store.
 */

import type {
  FounderInboxEntry,
  InboxHistoryEntry,
  InboxLifecycleEvent,
  InboxStateHistoryEntry,
} from './founder-inbox-types.js';

const inboxEntries = new Map<string, FounderInboxEntry>();
const lifecycleEvents = new Map<string, InboxLifecycleEvent>();
const historyEntries = new Map<string, InboxHistoryEntry>();
const stateHistory = new Map<string, InboxStateHistoryEntry[]>();

let inboxCounter = 0;
let lifecycleCounter = 0;
let historyCounter = 0;
let reportCounter = 0;
let ackCounter = 0;
let archiveCounter = 0;

export function resetFounderInboxStoreForTests(): void {
  inboxEntries.clear();
  lifecycleEvents.clear();
  historyEntries.clear();
  stateHistory.clear();
  inboxCounter = 0;
  lifecycleCounter = 0;
  historyCounter = 0;
  reportCounter = 0;
  ackCounter = 0;
  archiveCounter = 0;
}

export function nextInboxEntryId(): string {
  inboxCounter += 1;
  return `finbox-${inboxCounter.toString().padStart(4, '0')}`;
}

export function nextInboxLifecycleEventId(): string {
  lifecycleCounter += 1;
  return `finboxlc-${lifecycleCounter.toString().padStart(4, '0')}`;
}

export function nextInboxHistoryEntryId(): string {
  historyCounter += 1;
  return `finboxhi-${historyCounter.toString().padStart(4, '0')}`;
}

export function nextInboxReportId(): string {
  reportCounter += 1;
  return `finboxrpt-${reportCounter.toString().padStart(4, '0')}`;
}

export function nextInboxAcknowledgementId(): string {
  ackCounter += 1;
  return `finboxack-${ackCounter.toString().padStart(4, '0')}`;
}

export function nextInboxArchiveId(): string {
  archiveCounter += 1;
  return `finboxarc-${archiveCounter.toString().padStart(4, '0')}`;
}

export function storeInboxEntry(entry: FounderInboxEntry): void {
  inboxEntries.set(entry.inboxEntryId, entry);
}

export function getStoredInboxEntry(inboxEntryId: string): FounderInboxEntry | null {
  return inboxEntries.get(inboxEntryId) ?? null;
}

export function listStoredInboxEntries(): FounderInboxEntry[] {
  return [...inboxEntries.values()];
}

export function storeInboxLifecycleEvent(event: InboxLifecycleEvent): void {
  lifecycleEvents.set(event.eventId, event);
}

export function listStoredInboxLifecycleEvents(): InboxLifecycleEvent[] {
  return [...lifecycleEvents.values()];
}

export function storeInboxHistoryEntry(entry: InboxHistoryEntry): void {
  historyEntries.set(entry.entryId, entry);
}

export function listStoredInboxHistoryEntries(): InboxHistoryEntry[] {
  return [...historyEntries.values()];
}

export function appendInboxStateHistory(entry: InboxStateHistoryEntry): void {
  const existing = stateHistory.get(entry.inboxEntryId) ?? [];
  existing.push(entry);
  stateHistory.set(entry.inboxEntryId, existing);
}

export function getStoredInboxStateHistory(inboxEntryId: string): InboxStateHistoryEntry[] {
  return [...(stateHistory.get(inboxEntryId) ?? [])];
}

export function resetFounderInboxReportCounterForTests(): void {
  reportCounter = 0;
}
