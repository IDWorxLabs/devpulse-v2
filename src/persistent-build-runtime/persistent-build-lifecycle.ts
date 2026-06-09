/**
 * Persistent Build Runtime Foundation — lifecycle tracking (no execution).
 */

import {
  nextBuildLifecycleEventId,
  storePersistentBuildLifecycleEvent,
  getStoredPersistentBuild,
  storePersistentBuild,
  listStoredPersistentBuildLifecycleEvents,
} from './persistent-build-store.js';
import { setPersistentBuildState } from './persistent-build-state-manager.js';
import { recordPersistentBuildHistoryEntry } from './persistent-build-history.js';
import type { PersistentBuildLifecycleEvent, PersistentBuildLifecycleEventType, PersistentBuildState } from './persistent-build-types.js';
import { PERSISTENT_BUILD_RUNTIME_FOUNDATION_OWNER_MODULE } from './persistent-build-types.js';

const EVENT_STATE_MAP: Record<PersistentBuildLifecycleEventType, PersistentBuildState> = {
  BUILD_CREATED: 'CREATED',
  BUILD_INITIALIZED: 'INITIALIZING',
  BUILD_ACTIVATED: 'ACTIVE',
  BUILD_PAUSED: 'PAUSED',
  BUILD_RESUMED: 'RESUMABLE',
  BUILD_WAITING_FOR_APPROVAL: 'WAITING_FOR_APPROVAL',
  BUILD_WAITING_FOR_VERIFICATION: 'WAITING_FOR_VERIFICATION',
  BUILD_WAITING_FOR_RECOVERY: 'WAITING_FOR_RECOVERY',
  BUILD_COMPLETED: 'COMPLETED',
  BUILD_ARCHIVED: 'ARCHIVED',
  BUILD_FAILED: 'FAILED',
  BUILD_LINKED_TO_RUNTIME: 'READY',
  BUILD_LINKED_TO_WORKSPACE: 'READY',
};

export function recordPersistentBuildLifecycleEvent(
  buildId: string,
  eventType: PersistentBuildLifecycleEventType,
  notes = '',
): PersistentBuildLifecycleEvent | null {
  const build = getStoredPersistentBuild(buildId);
  if (!build) return null;

  const targetState = EVENT_STATE_MAP[eventType];
  const previousState = build.buildState;

  const event: PersistentBuildLifecycleEvent = {
    eventId: nextBuildLifecycleEventId(),
    buildId,
    eventType,
    previousState,
    newState: targetState,
    timestamp: Date.now(),
    sourceModule: PERSISTENT_BUILD_RUNTIME_FOUNDATION_OWNER_MODULE,
    notes,
  };
  storePersistentBuildLifecycleEvent(event);

  if (previousState !== targetState) {
    setPersistentBuildState(buildId, targetState, eventType === 'BUILD_INITIALIZED');
  }

  recordPersistentBuildHistoryEntry({
    buildId,
    category: 'LIFECYCLE',
    summary: `${eventType}: ${previousState} → ${targetState}${notes ? ` — ${notes}` : ''}`,
    scopeUsed: 'LIFECYCLE',
  });

  return event;
}

export function activatePersistentBuild(buildId: string): PersistentBuildLifecycleEvent | null {
  const build = getStoredPersistentBuild(buildId);
  if (!build) return null;

  if (build.buildState === 'CREATED') {
    recordPersistentBuildLifecycleEvent(buildId, 'BUILD_INITIALIZED', 'Authority initialization');
    setPersistentBuildState(buildId, 'READY', true);
  }

  return recordPersistentBuildLifecycleEvent(buildId, 'BUILD_ACTIVATED', 'Authority activation — no build execution');
}

export function pausePersistentBuild(buildId: string): PersistentBuildLifecycleEvent | null {
  return recordPersistentBuildLifecycleEvent(buildId, 'BUILD_PAUSED', 'Authority pause — no execution');
}

export function resumePersistentBuild(buildId: string): PersistentBuildLifecycleEvent | null {
  const event = recordPersistentBuildLifecycleEvent(buildId, 'BUILD_RESUMED', 'Authority resume marker');
  if (event) setPersistentBuildState(buildId, 'ACTIVE', true);
  return event;
}

export function waitForApproval(buildId: string): PersistentBuildLifecycleEvent | null {
  return recordPersistentBuildLifecycleEvent(buildId, 'BUILD_WAITING_FOR_APPROVAL', 'Approval wait — metadata only');
}

export function waitForVerification(buildId: string): PersistentBuildLifecycleEvent | null {
  return recordPersistentBuildLifecycleEvent(buildId, 'BUILD_WAITING_FOR_VERIFICATION', 'Verification wait — metadata only');
}

export function waitForRecovery(buildId: string): PersistentBuildLifecycleEvent | null {
  return recordPersistentBuildLifecycleEvent(buildId, 'BUILD_WAITING_FOR_RECOVERY', 'Recovery wait — metadata only');
}

export function completePersistentBuild(buildId: string): PersistentBuildLifecycleEvent | null {
  return recordPersistentBuildLifecycleEvent(buildId, 'BUILD_COMPLETED', 'Authority completion — no build executed');
}

export function archivePersistentBuild(buildId: string): PersistentBuildLifecycleEvent | null {
  return recordPersistentBuildLifecycleEvent(buildId, 'BUILD_ARCHIVED', 'Authority archival');
}

export function failPersistentBuild(buildId: string, reason: string): PersistentBuildLifecycleEvent | null {
  const build = getStoredPersistentBuild(buildId);
  if (build) {
    storePersistentBuild({
      ...build,
      buildState: 'FAILED',
      buildStatus: 'BLOCKED',
      updatedAt: Date.now(),
    });
  }
  return recordPersistentBuildLifecycleEvent(buildId, 'BUILD_FAILED', reason);
}

export function listLifecycleEventsForBuild(buildId: string): PersistentBuildLifecycleEvent[] {
  return listStoredPersistentBuildLifecycleEvents().filter((e) => e.buildId === buildId);
}
