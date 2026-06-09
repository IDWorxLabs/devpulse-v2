/**
 * Mobile Command Runtime Foundation — lifecycle tracking (no execution).
 */

import {
  nextMobileCommandLifecycleEventId,
  storeMobileCommandLifecycleEvent,
  getStoredMobileCommandSession,
  listStoredMobileCommandLifecycleEvents,
} from './mobile-command-store.js';
import { setMobileCommandState } from './mobile-command-state-manager.js';
import { recordMobileCommandHistoryEntry } from './mobile-command-history.js';
import type {
  MobileCommandLifecycleEvent,
  MobileCommandLifecycleEventType,
  MobileCommandState,
} from './mobile-command-types.js';
import { MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-command-types.js';

const EVENT_STATE_MAP: Record<MobileCommandLifecycleEventType, MobileCommandState> = {
  MOBILE_COMMAND_CREATED: 'CREATED',
  MOBILE_COMMAND_INITIALIZED: 'INITIALIZING',
  MOBILE_COMMAND_CONNECTED_TO_CLOUD: 'CONNECTED_TO_CLOUD',
  MOBILE_COMMAND_CONNECTED_TO_WORKSPACE: 'CONNECTED_TO_WORKSPACE',
  MOBILE_COMMAND_CONNECTED_TO_BUILD: 'CONNECTED_TO_BUILD',
  MOBILE_COMMAND_CONNECTED_TO_VERIFICATION: 'CONNECTED_TO_VERIFICATION',
  MOBILE_COMMAND_CONNECTED_TO_RECOVERY: 'CONNECTED_TO_RECOVERY',
  MOBILE_COMMAND_CONNECTED_TO_MONITORING: 'CONNECTED_TO_MONITORING',
  MOBILE_COMMAND_WAITING_FOR_APPROVAL: 'WAITING_FOR_APPROVAL',
  MOBILE_COMMAND_ACTION_BLOCKED: 'ACTION_BLOCKED',
  MOBILE_COMMAND_ACTION_ALLOWED: 'ACTION_ALLOWED',
  MOBILE_COMMAND_COMPLETED: 'COMPLETED',
  MOBILE_COMMAND_ARCHIVED: 'ARCHIVED',
  MOBILE_COMMAND_FAILED: 'FAILED',
};

export function recordMobileCommandLifecycleEvent(
  mobileCommandId: string,
  eventType: MobileCommandLifecycleEventType,
  notes = '',
): MobileCommandLifecycleEvent | null {
  const session = getStoredMobileCommandSession(mobileCommandId);
  if (!session) return null;

  const targetState = EVENT_STATE_MAP[eventType];
  const previousState = session.mobileCommandState;

  const event: MobileCommandLifecycleEvent = {
    eventId: nextMobileCommandLifecycleEventId(),
    mobileCommandId,
    eventType,
    previousState,
    newState: targetState,
    timestamp: Date.now(),
    sourceModule: MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE,
    notes,
  };
  storeMobileCommandLifecycleEvent(event);

  if (previousState !== targetState) {
    setMobileCommandState(mobileCommandId, targetState, eventType === 'MOBILE_COMMAND_INITIALIZED');
  }

  recordMobileCommandHistoryEntry({
    mobileCommandId,
    category: 'LIFECYCLE',
    summary: `${eventType}: ${previousState} → ${targetState}${notes ? ` — ${notes}` : ''}`,
    scopeUsed: mobileCommandId,
  });

  return event;
}

export function initializeMobileCommand(mobileCommandId: string): MobileCommandLifecycleEvent | null {
  return recordMobileCommandLifecycleEvent(mobileCommandId, 'MOBILE_COMMAND_INITIALIZED', 'Authority initialization');
}

export function completeMobileCommand(mobileCommandId: string): MobileCommandLifecycleEvent | null {
  return recordMobileCommandLifecycleEvent(mobileCommandId, 'MOBILE_COMMAND_COMPLETED', 'Mobile command authority complete');
}

export function archiveMobileCommand(mobileCommandId: string): MobileCommandLifecycleEvent | null {
  return recordMobileCommandLifecycleEvent(mobileCommandId, 'MOBILE_COMMAND_ARCHIVED', 'Mobile command archived');
}

export function failMobileCommand(mobileCommandId: string, reason: string): MobileCommandLifecycleEvent | null {
  return recordMobileCommandLifecycleEvent(mobileCommandId, 'MOBILE_COMMAND_FAILED', reason);
}

export function listLifecycleEventsForMobileCommand(mobileCommandId: string): MobileCommandLifecycleEvent[] {
  return listStoredMobileCommandLifecycleEvents().filter((e) => e.mobileCommandId === mobileCommandId);
}
