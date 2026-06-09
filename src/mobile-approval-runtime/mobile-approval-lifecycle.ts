/**
 * Mobile Approval Runtime Foundation — lifecycle tracking (no execution).
 */

import {
  nextMobileApprovalLifecycleEventId,
  storeMobileApprovalLifecycleEvent,
  getStoredMobileApprovalSession,
  listStoredMobileApprovalLifecycleEvents,
} from './mobile-approval-store.js';
import { setMobileApprovalState } from './mobile-approval-state-manager.js';
import { recordMobileApprovalHistoryEntry } from './mobile-approval-history.js';
import type {
  MobileApprovalLifecycleEvent,
  MobileApprovalLifecycleEventType,
  MobileApprovalState,
} from './mobile-approval-types.js';
import { MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-approval-types.js';

const EVENT_STATE_MAP: Record<MobileApprovalLifecycleEventType, MobileApprovalState> = {
  MOBILE_APPROVAL_CREATED: 'CREATED',
  MOBILE_APPROVAL_INITIALIZED: 'INITIALIZING',
  MOBILE_APPROVAL_READY: 'READY',
  MOBILE_APPROVAL_REQUEST_REGISTERED: 'REQUEST_REGISTERED',
  MOBILE_APPROVAL_WAITING_FOR_DECISION: 'WAITING_FOR_DECISION',
  MOBILE_APPROVAL_DECISION_RECORDED: 'DECISION_RECORDED',
  MOBILE_APPROVAL_APPROVED: 'APPROVED_STATE',
  MOBILE_APPROVAL_REJECTED: 'REJECTED_STATE',
  MOBILE_APPROVAL_COMPLETED: 'COMPLETED',
  MOBILE_APPROVAL_ARCHIVED: 'ARCHIVED',
  MOBILE_APPROVAL_FAILED: 'FAILED',
};

export function recordMobileApprovalLifecycleEvent(
  mobileApprovalId: string,
  eventType: MobileApprovalLifecycleEventType,
  notes = '',
): MobileApprovalLifecycleEvent | null {
  const session = getStoredMobileApprovalSession(mobileApprovalId);
  if (!session) return null;

  const targetState = EVENT_STATE_MAP[eventType];
  const previousState = session.mobileApprovalState;

  const event: MobileApprovalLifecycleEvent = {
    eventId: nextMobileApprovalLifecycleEventId(),
    mobileApprovalId,
    eventType,
    previousState,
    newState: targetState,
    timestamp: Date.now(),
    sourceModule: MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
    notes,
  };
  storeMobileApprovalLifecycleEvent(event);

  if (previousState !== targetState) {
    setMobileApprovalState(
      mobileApprovalId,
      targetState,
      eventType === 'MOBILE_APPROVAL_INITIALIZED',
    );
  }

  recordMobileApprovalHistoryEntry({
    mobileApprovalId,
    category: 'LIFECYCLE',
    summary: `${eventType}: ${previousState} → ${targetState}${notes ? ` — ${notes}` : ''}`,
    scopeUsed: mobileApprovalId,
  });

  return event;
}

export function initializeMobileApproval(mobileApprovalId: string): MobileApprovalLifecycleEvent | null {
  return recordMobileApprovalLifecycleEvent(
    mobileApprovalId,
    'MOBILE_APPROVAL_INITIALIZED',
    'Authority initialization',
  );
}

export function markMobileApprovalReady(mobileApprovalId: string): MobileApprovalLifecycleEvent | null {
  return recordMobileApprovalLifecycleEvent(mobileApprovalId, 'MOBILE_APPROVAL_READY', 'Approval authority ready');
}

export function registerMobileApprovalRequestLifecycle(
  mobileApprovalId: string,
  notes = 'Approval request registered',
): MobileApprovalLifecycleEvent | null {
  return recordMobileApprovalLifecycleEvent(mobileApprovalId, 'MOBILE_APPROVAL_REQUEST_REGISTERED', notes);
}

export function waitForMobileApprovalDecision(
  mobileApprovalId: string,
  notes = 'Waiting for decision',
): MobileApprovalLifecycleEvent | null {
  return recordMobileApprovalLifecycleEvent(mobileApprovalId, 'MOBILE_APPROVAL_WAITING_FOR_DECISION', notes);
}

export function recordMobileApprovalDecisionLifecycle(
  mobileApprovalId: string,
  notes = 'Decision recorded',
): MobileApprovalLifecycleEvent | null {
  return recordMobileApprovalLifecycleEvent(mobileApprovalId, 'MOBILE_APPROVAL_DECISION_RECORDED', notes);
}

export function approveMobileApproval(mobileApprovalId: string): MobileApprovalLifecycleEvent | null {
  return recordMobileApprovalLifecycleEvent(
    mobileApprovalId,
    'MOBILE_APPROVAL_APPROVED',
    'Approval recorded by authority — no execution performed',
  );
}

export function rejectMobileApproval(mobileApprovalId: string, reason: string): MobileApprovalLifecycleEvent | null {
  return recordMobileApprovalLifecycleEvent(mobileApprovalId, 'MOBILE_APPROVAL_REJECTED', reason);
}

export function completeMobileApproval(mobileApprovalId: string): MobileApprovalLifecycleEvent | null {
  return recordMobileApprovalLifecycleEvent(
    mobileApprovalId,
    'MOBILE_APPROVAL_COMPLETED',
    'Mobile approval authority complete',
  );
}

export function archiveMobileApproval(mobileApprovalId: string): MobileApprovalLifecycleEvent | null {
  return recordMobileApprovalLifecycleEvent(mobileApprovalId, 'MOBILE_APPROVAL_ARCHIVED', 'Mobile approval archived');
}

export function failMobileApproval(mobileApprovalId: string, reason: string): MobileApprovalLifecycleEvent | null {
  return recordMobileApprovalLifecycleEvent(mobileApprovalId, 'MOBILE_APPROVAL_FAILED', reason);
}

export function listLifecycleEventsForMobileApproval(mobileApprovalId: string): MobileApprovalLifecycleEvent[] {
  return listStoredMobileApprovalLifecycleEvents().filter((e) => e.mobileApprovalId === mobileApprovalId);
}
