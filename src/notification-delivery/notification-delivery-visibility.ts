/**
 * Notification Delivery Foundation — visibility metadata.
 */

import { getStoredDeliveryRecord, storeDeliveryRecord } from './notification-delivery-store.js';
import type { DeliveryCategory, DeliveryVisibility } from './notification-delivery-types.js';

export function buildDefaultDeliveryVisibility(category: DeliveryCategory): DeliveryVisibility {
  return {
    visibleInPlanning: true,
    visibleOnMobile: category === 'MOBILE_DELIVERY' || category === 'FOUNDER_ALERT_DELIVERY',
    visibleOnDesktop: true,
    visibleOnCloud: category === 'CLOUD_DELIVERY' || category === 'WORLD2_DELIVERY',
    visibleInOperatorFeed: category !== 'SYSTEM_DELIVERY',
    visibleInProjectVault: category === 'PROJECT_DELIVERY' || category === 'SYSTEM_DELIVERY',
    visibilityReason: `Default visibility for ${category} — planning only`,
  };
}

export function registerDeliveryVisibility(
  deliveryId: string,
  visibility: DeliveryVisibility,
): DeliveryVisibility | null {
  const record = getStoredDeliveryRecord(deliveryId);
  if (!record) return null;
  storeDeliveryRecord({ ...record, deliveryVisibility: visibility, updatedAt: Date.now() });
  return visibility;
}

export function getDeliveryVisibility(deliveryId: string): DeliveryVisibility | null {
  return getStoredDeliveryRecord(deliveryId)?.deliveryVisibility ?? null;
}

export function validateDeliveryVisibility(visibility: DeliveryVisibility): boolean {
  return visibility.visibleInPlanning === true;
}
