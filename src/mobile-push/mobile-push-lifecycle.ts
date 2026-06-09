/**
 * Mobile Push Foundation — lifecycle events.
 */

import {
  nextPushLifecycleEventId,
  storePushLifecycleEvent,
  getStoredPushRecord,
  listStoredPushLifecycleEvents,
} from './mobile-push-store.js';
import { setPushState } from './mobile-push-state-manager.js';
import type { PushLifecycleEvent, PushLifecycleEventType, PushState } from './mobile-push-types.js';
import { MOBILE_PUSH_FOUNDATION_OWNER_MODULE } from './mobile-push-types.js';

const STATE_MAP: Record<PushLifecycleEventType, PushState> = {
  PUSH_CREATED: 'CREATED',
  PUSH_PLANNED: 'PLANNED',
  PUSH_ELIGIBILITY_CHECKED: 'ELIGIBILITY_CHECKED',
  PUSH_TOKEN_METADATA_CHECKED: 'TOKEN_METADATA_CHECKED',
  PUSH_PAYLOAD_PLANNED: 'PAYLOAD_PLANNED',
  PUSH_ROUTED: 'ROUTED',
  PUSH_TARGET_SELECTED: 'TARGET_SELECTED',
  PUSH_BLOCKED: 'BLOCKED',
  PUSH_DEFERRED: 'DEFERRED',
  PUSH_READY: 'READY',
  PUSH_COMPLETED: 'COMPLETED',
  PUSH_FAILED: 'FAILED',
  PUSH_ARCHIVED: 'ARCHIVED',
};

export function recordPushLifecycleEvent(
  pushId: string,
  eventType: PushLifecycleEventType,
  notes = '',
): void {
  const record = getStoredPushRecord(pushId);
  if (!record) return;

  const targetState = STATE_MAP[eventType];
  storePushLifecycleEvent({
    eventId: nextPushLifecycleEventId(),
    pushId,
    eventType,
    previousState: record.pushState,
    newState: targetState,
    timestamp: Date.now(),
    sourceModule: MOBILE_PUSH_FOUNDATION_OWNER_MODULE,
    notes,
  });

  if (record.pushState !== targetState) {
    setPushState(pushId, targetState, eventType === 'PUSH_CREATED');
  }
}

export function listPushLifecycleEvents(pushId: string): PushLifecycleEvent[] {
  return listStoredPushLifecycleEvents().filter((e) => e.pushId === pushId);
}
