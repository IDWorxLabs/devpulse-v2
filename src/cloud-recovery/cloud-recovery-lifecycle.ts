/**
 * Cloud Recovery Foundation — lifecycle tracking (no recovery execution).
 */

import {
  nextRecoveryLifecycleEventId,
  storeCloudRecoveryLifecycleEvent,
  getStoredCloudRecovery,
  listStoredCloudRecoveryLifecycleEvents,
} from './cloud-recovery-store.js';
import { setRecoveryState } from './cloud-recovery-state-manager.js';
import { recordCloudRecoveryHistoryEntry } from './cloud-recovery-history.js';
import type {
  CloudRecoveryLifecycleEvent,
  CloudRecoveryLifecycleEventType,
  CloudRecoveryState,
} from './cloud-recovery-types.js';
import { CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE } from './cloud-recovery-types.js';

const EVENT_STATE_MAP: Record<CloudRecoveryLifecycleEventType, CloudRecoveryState> = {
  RECOVERY_CREATED: 'CREATED',
  RECOVERY_INITIALIZED: 'INITIALIZING',
  FAILURE_REGISTERED: 'FAILURE_IDENTIFIED',
  RECOVERY_CANDIDATE_REGISTERED: 'RECOVERY_CANDIDATE_IDENTIFIED',
  RECOVERY_PLAN_REGISTERED: 'RECOVERY_PLAN_REGISTERED',
  RECOVERY_LINKED_TO_VERIFICATION: 'READY',
  RECOVERY_LINKED_TO_RUNTIME: 'READY',
  RECOVERY_LINKED_TO_WORKSPACE: 'READY',
  RECOVERY_LINKED_TO_BUILD: 'READY',
  RECOVERY_READY: 'RECOVERY_READY',
  RECOVERY_COMPLETED: 'COMPLETED',
  RECOVERY_ARCHIVED: 'ARCHIVED',
  RECOVERY_FAILED: 'FAILED',
};

export function recordCloudRecoveryLifecycleEvent(
  recoveryId: string,
  eventType: CloudRecoveryLifecycleEventType,
  notes = '',
): CloudRecoveryLifecycleEvent | null {
  const recovery = getStoredCloudRecovery(recoveryId);
  if (!recovery) return null;

  const targetState = EVENT_STATE_MAP[eventType];
  const previousState = recovery.recoveryState;

  const event: CloudRecoveryLifecycleEvent = {
    eventId: nextRecoveryLifecycleEventId(),
    recoveryId,
    eventType,
    previousState,
    newState: targetState,
    timestamp: Date.now(),
    sourceModule: CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE,
    notes,
  };
  storeCloudRecoveryLifecycleEvent(event);

  if (previousState !== targetState) {
    setRecoveryState(recoveryId, targetState, eventType === 'RECOVERY_INITIALIZED');
  }

  const historyCategory =
    eventType === 'FAILURE_REGISTERED'
      ? 'FAILURE'
      : eventType === 'RECOVERY_CANDIDATE_REGISTERED'
        ? 'CANDIDATE'
        : 'LIFECYCLE';

  recordCloudRecoveryHistoryEntry({
    recoveryId,
    category: historyCategory,
    summary: `${eventType}: ${previousState} → ${targetState}${notes ? ` — ${notes}` : ''}`,
    scopeUsed: recoveryId,
  });

  return event;
}

export function initializeCloudRecovery(recoveryId: string): CloudRecoveryLifecycleEvent | null {
  return recordCloudRecoveryLifecycleEvent(recoveryId, 'RECOVERY_INITIALIZED', 'Authority initialization');
}

export function registerFailure(recoveryId: string, description: string): CloudRecoveryLifecycleEvent | null {
  return recordCloudRecoveryLifecycleEvent(recoveryId, 'FAILURE_REGISTERED', description);
}

export function registerRecoveryCandidate(recoveryId: string, description: string): CloudRecoveryLifecycleEvent | null {
  return recordCloudRecoveryLifecycleEvent(recoveryId, 'RECOVERY_CANDIDATE_REGISTERED', description);
}

export function registerRecoveryPlan(recoveryId: string, description: string): CloudRecoveryLifecycleEvent | null {
  return recordCloudRecoveryLifecycleEvent(recoveryId, 'RECOVERY_PLAN_REGISTERED', description);
}

export function markRecoveryReady(recoveryId: string): CloudRecoveryLifecycleEvent | null {
  return recordCloudRecoveryLifecycleEvent(recoveryId, 'RECOVERY_READY', 'Recovery metadata ready — no execution');
}

export function completeCloudRecovery(recoveryId: string): CloudRecoveryLifecycleEvent | null {
  return recordCloudRecoveryLifecycleEvent(recoveryId, 'RECOVERY_COMPLETED', 'Recovery authority complete');
}

export function archiveCloudRecovery(recoveryId: string): CloudRecoveryLifecycleEvent | null {
  return recordCloudRecoveryLifecycleEvent(recoveryId, 'RECOVERY_ARCHIVED', 'Recovery archived');
}

export function failCloudRecovery(recoveryId: string, reason: string): CloudRecoveryLifecycleEvent | null {
  return recordCloudRecoveryLifecycleEvent(recoveryId, 'RECOVERY_FAILED', reason);
}

export function listLifecycleEventsForRecovery(recoveryId: string): CloudRecoveryLifecycleEvent[] {
  return listStoredCloudRecoveryLifecycleEvents().filter((e) => e.recoveryId === recoveryId);
}
