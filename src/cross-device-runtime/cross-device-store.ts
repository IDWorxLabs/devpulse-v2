/**
 * Cross Device Runtime Foundation — in-memory store.
 */

import type {
  CrossDeviceSession,
  CrossDeviceHistoryEntry,
  CrossDeviceLifecycleEvent,
  CrossDeviceTrackedSession,
  CrossDeviceStateHistoryEntry,
  DeviceRecord,
  DeviceLink,
  DeviceHandoff,
} from './cross-device-types.js';

const sessions = new Map<string, CrossDeviceSession>();
const trackedSessions = new Map<string, CrossDeviceTrackedSession>();
const lifecycleEvents = new Map<string, CrossDeviceLifecycleEvent>();
const historyEntries = new Map<string, CrossDeviceHistoryEntry>();
const stateHistory = new Map<string, CrossDeviceStateHistoryEntry[]>();
const deviceRecords = new Map<string, DeviceRecord>();
const deviceLinks = new Map<string, DeviceLink>();
const deviceHandoffs = new Map<string, DeviceHandoff>();

let crossDeviceCounter = 0;
let trackedSessionCounter = 0;
let lifecycleCounter = 0;
let historyCounter = 0;
let deviceRecordCounter = 0;
let deviceLinkCounter = 0;
let deviceHandoffCounter = 0;
let reportCounter = 0;

export function resetCrossDeviceStoreForTests(): void {
  sessions.clear();
  trackedSessions.clear();
  lifecycleEvents.clear();
  historyEntries.clear();
  stateHistory.clear();
  deviceRecords.clear();
  deviceLinks.clear();
  deviceHandoffs.clear();
  crossDeviceCounter = 0;
  trackedSessionCounter = 0;
  lifecycleCounter = 0;
  historyCounter = 0;
  deviceRecordCounter = 0;
  deviceLinkCounter = 0;
  deviceHandoffCounter = 0;
  reportCounter = 0;
}

export function nextCrossDeviceId(): string {
  crossDeviceCounter += 1;
  return `mxdev-${crossDeviceCounter.toString().padStart(4, '0')}`;
}

export function nextCrossDeviceTrackedSessionId(): string {
  trackedSessionCounter += 1;
  return `mxdevsess-${trackedSessionCounter.toString().padStart(4, '0')}`;
}

export function nextCrossDeviceLifecycleEventId(): string {
  lifecycleCounter += 1;
  return `mxdevlc-${lifecycleCounter.toString().padStart(4, '0')}`;
}

export function nextCrossDeviceHistoryEntryId(): string {
  historyCounter += 1;
  return `mxdevhi-${historyCounter.toString().padStart(4, '0')}`;
}

export function nextDeviceRecordId(): string {
  deviceRecordCounter += 1;
  return `mxdevrec-${deviceRecordCounter.toString().padStart(4, '0')}`;
}

export function nextDeviceLinkId(): string {
  deviceLinkCounter += 1;
  return `mxdevlink-${deviceLinkCounter.toString().padStart(4, '0')}`;
}

export function nextDeviceHandoffId(): string {
  deviceHandoffCounter += 1;
  return `mxdevhand-${deviceHandoffCounter.toString().padStart(4, '0')}`;
}

export function nextCrossDeviceReportId(): string {
  reportCounter += 1;
  return `mxdevrpt-${reportCounter.toString().padStart(4, '0')}`;
}

export function storeCrossDeviceSession(session: CrossDeviceSession): void {
  sessions.set(session.crossDeviceId, session);
}

export function getStoredCrossDeviceSession(crossDeviceId: string): CrossDeviceSession | null {
  return sessions.get(crossDeviceId) ?? null;
}

export function listStoredCrossDeviceSessions(): CrossDeviceSession[] {
  return [...sessions.values()];
}

export function storeCrossDeviceTrackedSession(session: CrossDeviceTrackedSession): void {
  trackedSessions.set(session.sessionId, session);
}

export function getStoredCrossDeviceTrackedSession(sessionId: string): CrossDeviceTrackedSession | null {
  return trackedSessions.get(sessionId) ?? null;
}

export function listStoredCrossDeviceTrackedSessions(): CrossDeviceTrackedSession[] {
  return [...trackedSessions.values()];
}

export function storeCrossDeviceLifecycleEvent(event: CrossDeviceLifecycleEvent): void {
  lifecycleEvents.set(event.eventId, event);
}

export function listStoredCrossDeviceLifecycleEvents(): CrossDeviceLifecycleEvent[] {
  return [...lifecycleEvents.values()];
}

export function storeCrossDeviceHistoryEntry(entry: CrossDeviceHistoryEntry): void {
  historyEntries.set(entry.entryId, entry);
}

export function listStoredCrossDeviceHistoryEntries(): CrossDeviceHistoryEntry[] {
  return [...historyEntries.values()];
}

export function appendCrossDeviceStateHistory(entry: CrossDeviceStateHistoryEntry): void {
  const existing = stateHistory.get(entry.crossDeviceId) ?? [];
  existing.push(entry);
  stateHistory.set(entry.crossDeviceId, existing);
}

export function getStoredCrossDeviceStateHistory(crossDeviceId: string): CrossDeviceStateHistoryEntry[] {
  return [...(stateHistory.get(crossDeviceId) ?? [])];
}

export function storeDeviceRecord(record: DeviceRecord): void {
  deviceRecords.set(record.deviceRecordId, record);
}

export function getStoredDeviceRecord(deviceRecordId: string): DeviceRecord | null {
  return deviceRecords.get(deviceRecordId) ?? null;
}

export function listStoredDeviceRecords(): DeviceRecord[] {
  return [...deviceRecords.values()];
}

export function storeDeviceLink(link: DeviceLink): void {
  deviceLinks.set(link.deviceLinkId, link);
}

export function getStoredDeviceLink(deviceLinkId: string): DeviceLink | null {
  return deviceLinks.get(deviceLinkId) ?? null;
}

export function listStoredDeviceLinks(): DeviceLink[] {
  return [...deviceLinks.values()];
}

export function storeDeviceHandoff(handoff: DeviceHandoff): void {
  deviceHandoffs.set(handoff.handoffId, handoff);
}

export function getStoredDeviceHandoff(handoffId: string): DeviceHandoff | null {
  return deviceHandoffs.get(handoffId) ?? null;
}

export function listStoredDeviceHandoffs(): DeviceHandoff[] {
  return [...deviceHandoffs.values()];
}

export function resetCrossDeviceReportCounterForTests(): void {
  reportCounter = 0;
}
