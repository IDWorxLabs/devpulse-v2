/**
 * Cloud Verification Foundation — in-memory store.
 */

import type {
  CloudVerification,
  CloudVerificationHistoryEntry,
  CloudVerificationLifecycleEvent,
  CloudVerificationSession,
  CloudVerificationStateHistoryEntry,
} from './cloud-verification-types.js';

const verifications = new Map<string, CloudVerification>();
const sessions = new Map<string, CloudVerificationSession>();
const lifecycleEvents = new Map<string, CloudVerificationLifecycleEvent>();
const historyEntries = new Map<string, CloudVerificationHistoryEntry>();
const stateHistory = new Map<string, CloudVerificationStateHistoryEntry[]>();

let verificationCounter = 0;
let sessionCounter = 0;
let lifecycleCounter = 0;
let historyCounter = 0;

export function resetCloudVerificationStoreForTests(): void {
  verifications.clear();
  sessions.clear();
  lifecycleEvents.clear();
  historyEntries.clear();
  stateHistory.clear();
  verificationCounter = 0;
  sessionCounter = 0;
  lifecycleCounter = 0;
  historyCounter = 0;
}

export function nextVerificationId(): string {
  verificationCounter += 1;
  return `cver-${verificationCounter.toString().padStart(4, '0')}`;
}

export function nextCloudVerificationSessionId(): string {
  sessionCounter += 1;
  return `cvsess-${sessionCounter.toString().padStart(4, '0')}`;
}

export function nextCloudVerificationLifecycleEventId(): string {
  lifecycleCounter += 1;
  return `cvlc-${lifecycleCounter.toString().padStart(4, '0')}`;
}

export function nextCloudVerificationHistoryEntryId(): string {
  historyCounter += 1;
  return `cvhi-${historyCounter.toString().padStart(4, '0')}`;
}

export function storeCloudVerification(verification: CloudVerification): void {
  verifications.set(verification.verificationId, verification);
}

export function getStoredCloudVerification(verificationId: string): CloudVerification | null {
  return verifications.get(verificationId) ?? null;
}

export function listStoredCloudVerifications(): CloudVerification[] {
  return [...verifications.values()];
}

export function storeCloudVerificationSession(session: CloudVerificationSession): void {
  sessions.set(session.sessionId, session);
}

export function getStoredCloudVerificationSession(sessionId: string): CloudVerificationSession | null {
  return sessions.get(sessionId) ?? null;
}

export function listStoredCloudVerificationSessions(): CloudVerificationSession[] {
  return [...sessions.values()];
}

export function storeCloudVerificationLifecycleEvent(event: CloudVerificationLifecycleEvent): void {
  lifecycleEvents.set(event.eventId, event);
}

export function listStoredCloudVerificationLifecycleEvents(): CloudVerificationLifecycleEvent[] {
  return [...lifecycleEvents.values()];
}

export function storeCloudVerificationHistoryEntry(entry: CloudVerificationHistoryEntry): void {
  historyEntries.set(entry.entryId, entry);
}

export function listStoredCloudVerificationHistoryEntries(): CloudVerificationHistoryEntry[] {
  return [...historyEntries.values()];
}

export function appendCloudVerificationStateHistory(entry: CloudVerificationStateHistoryEntry): void {
  const existing = stateHistory.get(entry.verificationId) ?? [];
  existing.push(entry);
  stateHistory.set(entry.verificationId, existing);
}

export function getStoredCloudVerificationStateHistory(verificationId: string): CloudVerificationStateHistoryEntry[] {
  return [...(stateHistory.get(verificationId) ?? [])];
}
