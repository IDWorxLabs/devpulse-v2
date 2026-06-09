/**
 * Cloud Verification Foundation — lifecycle tracking (no execution).
 */

import {
  nextCloudVerificationLifecycleEventId,
  storeCloudVerificationLifecycleEvent,
  getStoredCloudVerification,
  listStoredCloudVerificationLifecycleEvents,
} from './cloud-verification-store.js';
import { setCloudVerificationState } from './cloud-verification-state-manager.js';
import { recordCloudVerificationHistoryEntry } from './cloud-verification-history.js';
import type {
  CloudVerificationLifecycleEvent,
  CloudVerificationLifecycleEventType,
  CloudVerificationState,
} from './cloud-verification-types.js';
import { CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE } from './cloud-verification-types.js';

const EVENT_STATE_MAP: Record<CloudVerificationLifecycleEventType, CloudVerificationState> = {
  VERIFICATION_CREATED: 'CREATED',
  VERIFICATION_INITIALIZED: 'INITIALIZING',
  VERIFICATION_REQUESTED: 'REQUESTED',
  VERIFICATION_EVIDENCE_LINKED: 'EVIDENCE_LINKED',
  VERIFICATION_REPORT_LINKED: 'REPORT_LINKED',
  VERIFICATION_WAITING_FOR_RUNTIME: 'WAITING_FOR_RUNTIME',
  VERIFICATION_WAITING_FOR_WORKSPACE: 'WAITING_FOR_WORKSPACE',
  VERIFICATION_WAITING_FOR_BUILD: 'WAITING_FOR_BUILD',
  VERIFICATION_LINKED_TO_UNIFIED_ENTRY: 'READY',
  VERIFICATION_LINKED_TO_RUNTIME: 'READY',
  VERIFICATION_LINKED_TO_WORKSPACE: 'READY',
  VERIFICATION_LINKED_TO_PERSISTENT_BUILD: 'READY',
  VERIFICATION_COMPLETED: 'COMPLETED',
  VERIFICATION_ARCHIVED: 'ARCHIVED',
  VERIFICATION_FAILED: 'FAILED',
};

export function recordCloudVerificationLifecycleEvent(
  verificationId: string,
  eventType: CloudVerificationLifecycleEventType,
  notes = '',
): CloudVerificationLifecycleEvent | null {
  const verification = getStoredCloudVerification(verificationId);
  if (!verification) return null;

  const targetState = EVENT_STATE_MAP[eventType];
  const previousState = verification.verificationState;

  const event: CloudVerificationLifecycleEvent = {
    eventId: nextCloudVerificationLifecycleEventId(),
    verificationId,
    eventType,
    previousState,
    newState: targetState,
    timestamp: Date.now(),
    sourceModule: CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE,
    notes,
  };
  storeCloudVerificationLifecycleEvent(event);

  if (previousState !== targetState) {
    setCloudVerificationState(verificationId, targetState, eventType === 'VERIFICATION_INITIALIZED');
  }

  recordCloudVerificationHistoryEntry({
    verificationId,
    category: 'LIFECYCLE',
    summary: `${eventType}: ${previousState} → ${targetState}${notes ? ` — ${notes}` : ''}`,
    scopeUsed: verificationId,
  });

  return event;
}

export function initializeCloudVerification(verificationId: string): CloudVerificationLifecycleEvent | null {
  return recordCloudVerificationLifecycleEvent(verificationId, 'VERIFICATION_INITIALIZED', 'Authority initialization');
}

export function requestCloudVerification(verificationId: string): CloudVerificationLifecycleEvent | null {
  return recordCloudVerificationLifecycleEvent(verificationId, 'VERIFICATION_REQUESTED', 'Verification requested — metadata only');
}

export function completeCloudVerification(verificationId: string): CloudVerificationLifecycleEvent | null {
  return recordCloudVerificationLifecycleEvent(verificationId, 'VERIFICATION_COMPLETED', 'Verification authority complete');
}

export function archiveCloudVerification(verificationId: string): CloudVerificationLifecycleEvent | null {
  return recordCloudVerificationLifecycleEvent(verificationId, 'VERIFICATION_ARCHIVED', 'Verification archived');
}

export function failCloudVerification(verificationId: string, reason: string): CloudVerificationLifecycleEvent | null {
  return recordCloudVerificationLifecycleEvent(verificationId, 'VERIFICATION_FAILED', reason);
}

export function listLifecycleEventsForVerification(verificationId: string): CloudVerificationLifecycleEvent[] {
  return listStoredCloudVerificationLifecycleEvents().filter((e) => e.verificationId === verificationId);
}
