/**
 * Mobile Approval Runtime Foundation — in-memory store.
 */

import type {
  MobileApprovalSession,
  MobileApprovalHistoryEntry,
  MobileApprovalLifecycleEvent,
  MobileApprovalTrackedSession,
  MobileApprovalStateHistoryEntry,
  MobileApprovalRequest,
  MobileApprovalDecision,
} from './mobile-approval-types.js';

const sessions = new Map<string, MobileApprovalSession>();
const trackedSessions = new Map<string, MobileApprovalTrackedSession>();
const lifecycleEvents = new Map<string, MobileApprovalLifecycleEvent>();
const historyEntries = new Map<string, MobileApprovalHistoryEntry>();
const stateHistory = new Map<string, MobileApprovalStateHistoryEntry[]>();
const approvalRequests = new Map<string, MobileApprovalRequest>();
const approvalDecisions = new Map<string, MobileApprovalDecision>();

let approvalCounter = 0;
let trackedSessionCounter = 0;
let lifecycleCounter = 0;
let historyCounter = 0;
let approvalRequestCounter = 0;
let approvalDecisionCounter = 0;
let reportCounter = 0;

export function resetMobileApprovalStoreForTests(): void {
  sessions.clear();
  trackedSessions.clear();
  lifecycleEvents.clear();
  historyEntries.clear();
  stateHistory.clear();
  approvalRequests.clear();
  approvalDecisions.clear();
  approvalCounter = 0;
  trackedSessionCounter = 0;
  lifecycleCounter = 0;
  historyCounter = 0;
  approvalRequestCounter = 0;
  approvalDecisionCounter = 0;
  reportCounter = 0;
}

export function nextMobileApprovalId(): string {
  approvalCounter += 1;
  return `mappr-${approvalCounter.toString().padStart(4, '0')}`;
}

export function nextMobileApprovalTrackedSessionId(): string {
  trackedSessionCounter += 1;
  return `mapprsess-${trackedSessionCounter.toString().padStart(4, '0')}`;
}

export function nextMobileApprovalLifecycleEventId(): string {
  lifecycleCounter += 1;
  return `mapprlc-${lifecycleCounter.toString().padStart(4, '0')}`;
}

export function nextMobileApprovalHistoryEntryId(): string {
  historyCounter += 1;
  return `mapprhi-${historyCounter.toString().padStart(4, '0')}`;
}

export function nextMobileApprovalRequestId(): string {
  approvalRequestCounter += 1;
  return `mapprreq-${approvalRequestCounter.toString().padStart(4, '0')}`;
}

export function nextMobileApprovalDecisionId(): string {
  approvalDecisionCounter += 1;
  return `mapprdec-${approvalDecisionCounter.toString().padStart(4, '0')}`;
}

export function nextMobileApprovalReportId(): string {
  reportCounter += 1;
  return `mapprpt-${reportCounter.toString().padStart(4, '0')}`;
}

export function storeMobileApprovalSession(session: MobileApprovalSession): void {
  sessions.set(session.mobileApprovalId, session);
}

export function getStoredMobileApprovalSession(mobileApprovalId: string): MobileApprovalSession | null {
  return sessions.get(mobileApprovalId) ?? null;
}

export function listStoredMobileApprovalSessions(): MobileApprovalSession[] {
  return [...sessions.values()];
}

export function storeMobileApprovalTrackedSession(session: MobileApprovalTrackedSession): void {
  trackedSessions.set(session.sessionId, session);
}

export function getStoredMobileApprovalTrackedSession(sessionId: string): MobileApprovalTrackedSession | null {
  return trackedSessions.get(sessionId) ?? null;
}

export function listStoredMobileApprovalTrackedSessions(): MobileApprovalTrackedSession[] {
  return [...trackedSessions.values()];
}

export function storeMobileApprovalLifecycleEvent(event: MobileApprovalLifecycleEvent): void {
  lifecycleEvents.set(event.eventId, event);
}

export function listStoredMobileApprovalLifecycleEvents(): MobileApprovalLifecycleEvent[] {
  return [...lifecycleEvents.values()];
}

export function storeMobileApprovalHistoryEntry(entry: MobileApprovalHistoryEntry): void {
  historyEntries.set(entry.entryId, entry);
}

export function listStoredMobileApprovalHistoryEntries(): MobileApprovalHistoryEntry[] {
  return [...historyEntries.values()];
}

export function appendMobileApprovalStateHistory(entry: MobileApprovalStateHistoryEntry): void {
  const existing = stateHistory.get(entry.mobileApprovalId) ?? [];
  existing.push(entry);
  stateHistory.set(entry.mobileApprovalId, existing);
}

export function getStoredMobileApprovalStateHistory(mobileApprovalId: string): MobileApprovalStateHistoryEntry[] {
  return [...(stateHistory.get(mobileApprovalId) ?? [])];
}

export function storeMobileApprovalRequest(request: MobileApprovalRequest): void {
  approvalRequests.set(request.requestId, request);
}

export function getStoredMobileApprovalRequest(requestId: string): MobileApprovalRequest | null {
  return approvalRequests.get(requestId) ?? null;
}

export function listStoredMobileApprovalRequests(): MobileApprovalRequest[] {
  return [...approvalRequests.values()];
}

export function listStoredMobileApprovalRequestsForSession(mobileApprovalId: string): MobileApprovalRequest[] {
  return [...approvalRequests.values()].filter((r) => r.mobileApprovalId === mobileApprovalId);
}

export function storeMobileApprovalDecision(decision: MobileApprovalDecision): void {
  approvalDecisions.set(decision.decisionId, decision);
}

export function getStoredMobileApprovalDecision(decisionId: string): MobileApprovalDecision | null {
  return approvalDecisions.get(decisionId) ?? null;
}

export function listStoredMobileApprovalDecisions(): MobileApprovalDecision[] {
  return [...approvalDecisions.values()];
}

export function listStoredMobileApprovalDecisionsForSession(mobileApprovalId: string): MobileApprovalDecision[] {
  return [...approvalDecisions.values()].filter((d) => d.mobileApprovalId === mobileApprovalId);
}

export function resetMobileApprovalRequestCounterForTests(): void {
  approvalRequestCounter = 0;
}

export function resetMobileApprovalDecisionCounterForTests(): void {
  approvalDecisionCounter = 0;
}

export function resetMobileApprovalReportCounterForTests(): void {
  reportCounter = 0;
}
