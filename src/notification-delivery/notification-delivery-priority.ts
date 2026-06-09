/**
 * Notification Delivery Foundation — priority metadata.
 */

import { listStoredDeliveryRecords } from './notification-delivery-store.js';
import type { DeliveryCategory, DeliveryPriority, DeliveryPriorityMeta } from './notification-delivery-types.js';

export function buildDefaultDeliveryPriority(
  category: DeliveryCategory,
  priority: DeliveryPriority = 'NORMAL',
): DeliveryPriorityMeta {
  const escalated = category === 'FOUNDER_ALERT_DELIVERY' || priority === 'CRITICAL';
  return {
    priority: category === 'FOUNDER_ALERT_DELIVERY' ? 'CRITICAL' : priority,
    priorityReason: `Priority for ${category}`,
    escalated,
    escalationReason: escalated ? 'Founder alert or critical delivery category' : null,
  };
}

export function registerDeliveryPriority(
  deliveryId: string,
  priorityMeta: DeliveryPriorityMeta,
): DeliveryPriorityMeta {
  return priorityMeta;
}

export function getDeliveryPriority(deliveryId: string): DeliveryPriorityMeta | null {
  const record = listStoredDeliveryRecords().find((r) => r.deliveryId === deliveryId);
  return record?.deliveryPriority ?? null;
}

export function listDeliveriesByPriority(priority: DeliveryPriority): import('./notification-delivery-types.js').NotificationDeliveryRecord[] {
  return listStoredDeliveryRecords().filter((r) => r.deliveryPriority.priority === priority);
}
