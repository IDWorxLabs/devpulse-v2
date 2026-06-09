/**
 * Notification Delivery Foundation — state manager.
 */

import {
  getStoredDeliveryRecord,
  appendDeliveryStateHistory,
  storeDeliveryRecord,
  getStoredDeliveryStateHistory,
} from './notification-delivery-store.js';
import type { DeliveryState, DeliveryStateHistoryEntry } from './notification-delivery-types.js';
import { isValidDeliveryStateTransition } from './notification-delivery-types.js';

export function setDeliveryState(
  deliveryId: string,
  newState: DeliveryState,
  force = false,
): { ok: boolean; previousState: DeliveryState | null; error?: string } {
  const record = getStoredDeliveryRecord(deliveryId);
  if (!record) {
    return { ok: false, previousState: null, error: `Delivery record not found: ${deliveryId}` };
  }

  const previousState = record.deliveryState;
  if (!force && !isValidDeliveryStateTransition(previousState, newState)) {
    return { ok: false, previousState, error: `Invalid state transition: ${previousState} → ${newState}` };
  }

  storeDeliveryRecord({
    ...record,
    deliveryState: newState,
    deliveryStatus: resolveStatusForState(newState),
    updatedAt: Date.now(),
  });

  appendDeliveryStateHistory({
    deliveryId,
    previousState,
    newState,
    timestamp: Date.now(),
  });

  return { ok: true, previousState };
}

export function getDeliveryState(deliveryId: string): DeliveryState | null {
  return getStoredDeliveryRecord(deliveryId)?.deliveryState ?? null;
}

export function trackDeliveryStateHistory(deliveryId: string): DeliveryStateHistoryEntry[] {
  return getStoredDeliveryStateHistory(deliveryId);
}

function resolveStatusForState(state: DeliveryState): 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'WAITING' | 'UNKNOWN' {
  if (state === 'READY' || state === 'COMPLETED' || state === 'TARGET_SELECTED') return 'HEALTHY';
  if (state === 'FAILED' || state === 'BLOCKED') return 'BLOCKED';
  if (state === 'CREATED' || state === 'PLANNED' || state === 'ELIGIBILITY_CHECKED' || state === 'ROUTED')
    return 'WAITING';
  if (state === 'DEFERRED' || state === 'ARCHIVED') return 'DEGRADED';
  return 'UNKNOWN';
}
