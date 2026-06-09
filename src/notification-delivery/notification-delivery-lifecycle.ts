/**
 * Notification Delivery Foundation — lifecycle events.
 */

import {
  nextDeliveryLifecycleEventId,
  storeDeliveryLifecycleEvent,
  getStoredDeliveryRecord,
  listStoredDeliveryLifecycleEvents,
} from './notification-delivery-store.js';
import { setDeliveryState } from './notification-delivery-state-manager.js';
import type { DeliveryLifecycleEvent, DeliveryLifecycleEventType, DeliveryState } from './notification-delivery-types.js';
import { NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE } from './notification-delivery-types.js';

const STATE_MAP: Record<DeliveryLifecycleEventType, DeliveryState> = {
  DELIVERY_CREATED: 'CREATED',
  DELIVERY_PLANNED: 'PLANNED',
  DELIVERY_ELIGIBILITY_CHECKED: 'ELIGIBILITY_CHECKED',
  DELIVERY_ROUTED: 'ROUTED',
  DELIVERY_TARGET_SELECTED: 'TARGET_SELECTED',
  DELIVERY_BLOCKED: 'BLOCKED',
  DELIVERY_DEFERRED: 'DEFERRED',
  DELIVERY_READY: 'READY',
  DELIVERY_COMPLETED: 'COMPLETED',
  DELIVERY_FAILED: 'FAILED',
  DELIVERY_ARCHIVED: 'ARCHIVED',
};

export function recordDeliveryLifecycleEvent(
  deliveryId: string,
  eventType: DeliveryLifecycleEventType,
  notes = '',
): void {
  const record = getStoredDeliveryRecord(deliveryId);
  if (!record) return;

  const targetState = STATE_MAP[eventType];
  storeDeliveryLifecycleEvent({
    eventId: nextDeliveryLifecycleEventId(),
    deliveryId,
    eventType,
    previousState: record.deliveryState,
    newState: targetState,
    timestamp: Date.now(),
    sourceModule: NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE,
    notes,
  });

  if (record.deliveryState !== targetState) {
    setDeliveryState(deliveryId, targetState, eventType === 'DELIVERY_CREATED');
  }
}

export function listDeliveryLifecycleEvents(deliveryId: string): DeliveryLifecycleEvent[] {
  return listStoredDeliveryLifecycleEvents().filter((e) => e.deliveryId === deliveryId);
}
