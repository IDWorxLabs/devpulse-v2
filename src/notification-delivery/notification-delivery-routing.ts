/**
 * Notification Delivery Foundation — routing metadata (planning only).
 */

import {
  nextDeliveryRouteId,
  getStoredDeliveryRecord,
  storeDeliveryRecord,
  storeDeliveryRoute,
  listStoredDeliveryRoutes,
  listStoredDeliveryRecords,
} from './notification-delivery-store.js';
import type { NotificationDeliveryRecord } from './notification-delivery-types.js';
import { recordDeliveryHistoryEntry } from './notification-delivery-history.js';
import type { DeliveryChannel, DeliveryRoute } from './notification-delivery-types.js';
import { NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE } from './notification-delivery-types.js';

export function registerDeliveryRoute(input: {
  deliveryId: string;
  targetChannel: DeliveryChannel;
  targetDevice: string;
  routingReason?: string;
  sourceRuntime?: string;
}): DeliveryRoute | null {
  const record = getStoredDeliveryRecord(input.deliveryId);
  if (!record) return null;

  const route: DeliveryRoute = {
    routeId: nextDeliveryRouteId(),
    deliveryId: input.deliveryId,
    sourceRuntime: input.sourceRuntime ?? NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE,
    targetChannel: input.targetChannel,
    targetDevice: input.targetDevice,
    routingReason: input.routingReason ?? `Route to ${input.targetChannel} — planning only, no real delivery`,
    routingTimestamp: Date.now(),
    routingStatus: 'ROUTED',
  };

  storeDeliveryRoute(route);
  storeDeliveryRecord({ ...record, deliveryRoute: route, updatedAt: Date.now() });

  recordDeliveryHistoryEntry({
    deliveryId: input.deliveryId,
    category: 'ROUTING',
    summary: `Routed to ${input.targetChannel} via ${route.routeId}`,
    scopeUsed: route.routeId,
  });

  return route;
}

export function getDeliveryRoute(routeId: string): DeliveryRoute | null {
  return listStoredDeliveryRoutes().find((r) => r.routeId === routeId) ?? null;
}

export function listRoutesForDelivery(deliveryId: string): DeliveryRoute[] {
  const record = getStoredDeliveryRecord(deliveryId);
  if (!record?.deliveryRoute) return [];
  return [record.deliveryRoute];
}

export function listDeliveriesByChannel(channel: DeliveryChannel): NotificationDeliveryRecord[] {
  return listStoredDeliveryRecords().filter(
    (r) =>
      r.deliveryRoute?.targetChannel === channel ||
      r.deliveryIntent?.intentChannel === channel ||
      r.deliveryEligibility?.channel === channel,
  );
}
