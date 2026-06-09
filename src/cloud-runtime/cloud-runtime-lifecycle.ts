/**
 * Cloud Runtime Foundation — lifecycle tracking (no execution).
 */

import {
  nextLifecycleEventId,
  storeLifecycleEvent,
  getStoredRuntime,
  storeRuntime,
  listStoredLifecycleEvents,
} from './cloud-runtime-store.js';
import { setRuntimeState } from './cloud-runtime-state-manager.js';
import { recordHistoryEntry } from './cloud-runtime-history.js';
import type {
  CloudRuntimeLifecycleEvent,
  CloudRuntimeLifecycleEventType,
  CloudRuntimeState,
} from './cloud-runtime-types.js';
import { CLOUD_RUNTIME_FOUNDATION_OWNER_MODULE } from './cloud-runtime-types.js';

const EVENT_STATE_MAP: Record<CloudRuntimeLifecycleEventType, CloudRuntimeState> = {
  RUNTIME_CREATED: 'CREATED',
  RUNTIME_INITIALIZED: 'INITIALIZING',
  RUNTIME_ACTIVATED: 'ACTIVE',
  RUNTIME_PAUSED: 'PAUSED',
  RUNTIME_RESUMED: 'RESUMABLE',
  RUNTIME_COMPLETED: 'COMPLETED',
  RUNTIME_ARCHIVED: 'ARCHIVED',
  RUNTIME_FAILED: 'FAILED',
};

export function recordLifecycleEvent(
  runtimeId: string,
  eventType: CloudRuntimeLifecycleEventType,
  notes = '',
): CloudRuntimeLifecycleEvent | null {
  const runtime = getStoredRuntime(runtimeId);
  if (!runtime) return null;

  const targetState = EVENT_STATE_MAP[eventType];
  const previousState = runtime.runtimeState;

  const event: CloudRuntimeLifecycleEvent = {
    eventId: nextLifecycleEventId(),
    runtimeId,
    eventType,
    previousState,
    newState: targetState,
    timestamp: Date.now(),
    sourceModule: CLOUD_RUNTIME_FOUNDATION_OWNER_MODULE,
    notes,
  };
  storeLifecycleEvent(event);

  if (previousState !== targetState) {
    setRuntimeState(runtimeId, targetState, eventType === 'RUNTIME_INITIALIZED');
  }

  recordHistoryEntry({
    runtimeId,
    category: 'LIFECYCLE',
    summary: `${eventType}: ${previousState} → ${targetState}${notes ? ` — ${notes}` : ''}`,
    consumer: null,
    scopeUsed: 'LIFECYCLE',
  });

  return event;
}

export function activateRuntime(runtimeId: string): CloudRuntimeLifecycleEvent | null {
  const runtime = getStoredRuntime(runtimeId);
  if (!runtime) return null;

  if (runtime.runtimeState === 'CREATED') {
    recordLifecycleEvent(runtimeId, 'RUNTIME_INITIALIZED', 'Authority initialization');
    setRuntimeState(runtimeId, 'READY', true);
  }

  return recordLifecycleEvent(runtimeId, 'RUNTIME_ACTIVATED', 'Authority activation — no cloud execution');
}

export function pauseRuntime(runtimeId: string): CloudRuntimeLifecycleEvent | null {
  return recordLifecycleEvent(runtimeId, 'RUNTIME_PAUSED', 'Authority pause — no execution');
}

export function resumeRuntime(runtimeId: string): CloudRuntimeLifecycleEvent | null {
  const event = recordLifecycleEvent(runtimeId, 'RUNTIME_RESUMED', 'Authority resume marker');
  if (event) setRuntimeState(runtimeId, 'ACTIVE', true);
  return event;
}

export function completeRuntime(runtimeId: string): CloudRuntimeLifecycleEvent | null {
  return recordLifecycleEvent(runtimeId, 'RUNTIME_COMPLETED', 'Authority completion — no build executed');
}

export function archiveRuntime(runtimeId: string): CloudRuntimeLifecycleEvent | null {
  return recordLifecycleEvent(runtimeId, 'RUNTIME_ARCHIVED', 'Authority archival');
}

export function failRuntime(runtimeId: string, reason: string): CloudRuntimeLifecycleEvent | null {
  const runtime = getStoredRuntime(runtimeId);
  if (runtime) {
    storeRuntime({
      ...runtime,
      runtimeState: 'FAILED',
      runtimeStatus: 'BLOCKED',
      updatedAt: Date.now(),
    });
  }
  return recordLifecycleEvent(runtimeId, 'RUNTIME_FAILED', reason);
}

export function listLifecycleEventsForRuntime(runtimeId: string): CloudRuntimeLifecycleEvent[] {
  return listStoredLifecycleEvents().filter((e) => e.runtimeId === runtimeId);
}
