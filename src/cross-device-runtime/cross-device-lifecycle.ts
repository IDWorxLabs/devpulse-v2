/**
 * Cross Device Runtime Foundation — lifecycle tracking (no sync).
 */

import {
  nextCrossDeviceLifecycleEventId,
  storeCrossDeviceLifecycleEvent,
  getStoredCrossDeviceSession,
  listStoredCrossDeviceLifecycleEvents,
} from './cross-device-store.js';
import { setCrossDeviceState } from './cross-device-state-manager.js';
import { recordCrossDeviceHistoryEntry } from './cross-device-history.js';
import type {
  CrossDeviceLifecycleEvent,
  CrossDeviceLifecycleEventType,
  CrossDeviceState,
} from './cross-device-types.js';
import { CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE } from './cross-device-types.js';

const EVENT_STATE_MAP: Record<CrossDeviceLifecycleEventType, CrossDeviceState> = {
  CROSS_DEVICE_CREATED: 'CREATED',
  CROSS_DEVICE_INITIALIZED: 'INITIALIZING',
  CROSS_DEVICE_READY: 'READY',
  DEVICE_REGISTERED: 'DEVICE_REGISTERED',
  DEVICE_LINKED: 'DEVICE_LINKED',
  HANDOFF_AVAILABLE: 'HANDOFF_AVAILABLE',
  HANDOFF_REQUESTED: 'HANDOFF_REQUESTED',
  HANDOFF_READY: 'HANDOFF_READY',
  HANDOFF_COMPLETED: 'HANDOFF_COMPLETED',
  VISIBILITY_UPDATED: 'VISIBILITY_UPDATED',
  CROSS_DEVICE_COMPLETED: 'COMPLETED',
  CROSS_DEVICE_ARCHIVED: 'ARCHIVED',
  CROSS_DEVICE_FAILED: 'FAILED',
};

export function recordCrossDeviceLifecycleEvent(
  crossDeviceId: string,
  eventType: CrossDeviceLifecycleEventType,
  notes = '',
): CrossDeviceLifecycleEvent | null {
  const session = getStoredCrossDeviceSession(crossDeviceId);
  if (!session) return null;

  const targetState = EVENT_STATE_MAP[eventType];
  const previousState = session.crossDeviceState;

  const event: CrossDeviceLifecycleEvent = {
    eventId: nextCrossDeviceLifecycleEventId(),
    crossDeviceId,
    eventType,
    previousState,
    newState: targetState,
    timestamp: Date.now(),
    sourceModule: CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE,
    notes,
  };
  storeCrossDeviceLifecycleEvent(event);

  if (previousState !== targetState) {
    setCrossDeviceState(crossDeviceId, targetState, eventType === 'CROSS_DEVICE_INITIALIZED');
  }

  recordCrossDeviceHistoryEntry({
    crossDeviceId,
    category: 'LIFECYCLE',
    summary: `${eventType}: ${previousState} → ${targetState}${notes ? ` — ${notes}` : ''}`,
    scopeUsed: crossDeviceId,
  });

  return event;
}

export function initializeCrossDevice(crossDeviceId: string): CrossDeviceLifecycleEvent | null {
  return recordCrossDeviceLifecycleEvent(crossDeviceId, 'CROSS_DEVICE_INITIALIZED', 'Authority initialization');
}

export function markCrossDeviceReady(crossDeviceId: string): CrossDeviceLifecycleEvent | null {
  return recordCrossDeviceLifecycleEvent(crossDeviceId, 'CROSS_DEVICE_READY', 'Cross device authority ready');
}

export function registerDeviceLifecycle(crossDeviceId: string, notes = 'Device registered'): CrossDeviceLifecycleEvent | null {
  return recordCrossDeviceLifecycleEvent(crossDeviceId, 'DEVICE_REGISTERED', notes);
}

export function linkDeviceLifecycle(crossDeviceId: string, notes = 'Device linked'): CrossDeviceLifecycleEvent | null {
  return recordCrossDeviceLifecycleEvent(crossDeviceId, 'DEVICE_LINKED', notes);
}

export function markHandoffAvailable(crossDeviceId: string): CrossDeviceLifecycleEvent | null {
  return recordCrossDeviceLifecycleEvent(crossDeviceId, 'HANDOFF_AVAILABLE', 'Handoff available — metadata only');
}

export function requestHandoffLifecycle(crossDeviceId: string): CrossDeviceLifecycleEvent | null {
  return recordCrossDeviceLifecycleEvent(crossDeviceId, 'HANDOFF_REQUESTED', 'Handoff requested — no real sync');
}

export function markHandoffReady(crossDeviceId: string): CrossDeviceLifecycleEvent | null {
  return recordCrossDeviceLifecycleEvent(crossDeviceId, 'HANDOFF_READY', 'Handoff ready — authority only');
}

export function completeHandoffLifecycle(crossDeviceId: string): CrossDeviceLifecycleEvent | null {
  return recordCrossDeviceLifecycleEvent(crossDeviceId, 'HANDOFF_COMPLETED', 'Handoff completed — metadata only');
}

export function updateVisibilityLifecycle(crossDeviceId: string): CrossDeviceLifecycleEvent | null {
  return recordCrossDeviceLifecycleEvent(crossDeviceId, 'VISIBILITY_UPDATED', 'Visibility updated');
}

export function completeCrossDevice(crossDeviceId: string): CrossDeviceLifecycleEvent | null {
  return recordCrossDeviceLifecycleEvent(crossDeviceId, 'CROSS_DEVICE_COMPLETED', 'Cross device authority complete');
}

export function archiveCrossDevice(crossDeviceId: string): CrossDeviceLifecycleEvent | null {
  return recordCrossDeviceLifecycleEvent(crossDeviceId, 'CROSS_DEVICE_ARCHIVED', 'Cross device archived');
}

export function failCrossDevice(crossDeviceId: string, reason: string): CrossDeviceLifecycleEvent | null {
  return recordCrossDeviceLifecycleEvent(crossDeviceId, 'CROSS_DEVICE_FAILED', reason);
}

export function listLifecycleEventsForCrossDevice(crossDeviceId: string): CrossDeviceLifecycleEvent[] {
  return listStoredCrossDeviceLifecycleEvents().filter((e) => e.crossDeviceId === crossDeviceId);
}
