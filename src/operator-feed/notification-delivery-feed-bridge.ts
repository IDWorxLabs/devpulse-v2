/**
 * Notification Delivery Foundation — operator feed bridge.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';
import type { OperatorFeedStage } from './operator-feed-types.js';

export type NotificationDeliveryFeedStage =
  | 'Notification Delivery Created'
  | 'Notification Delivery Planned'
  | 'Notification Delivery Eligibility Checked'
  | 'Notification Delivery Routed'
  | 'Notification Delivery Target Selected'
  | 'Notification Delivery Blocked'
  | 'Notification Delivery Deferred'
  | 'Notification Delivery Ready'
  | 'Notification Delivery Completed'
  | 'Notification Delivery Failed'
  | 'Notification Delivery Archived';

export function publishNotificationDeliveryFeedStage(
  stage: NotificationDeliveryFeedStage,
  query: string,
  deliveryId?: string | null,
): void {
  publishOperatorFeedStage(stage as OperatorFeedStage, 'notification_delivery_foundation', {
    query,
    summary: deliveryId ? `deliveryId=${deliveryId}` : undefined,
  });
}

export function publishNotificationDeliveryFeedStages(
  query: string,
  ready: boolean,
  deliveryId?: string | null,
  blocked = false,
): void {
  publishNotificationDeliveryFeedStage('Notification Delivery Created', query, deliveryId);

  if (ready) {
    publishNotificationDeliveryFeedStage('Notification Delivery Planned', query, deliveryId);
    publishNotificationDeliveryFeedStage('Notification Delivery Eligibility Checked', query, deliveryId);
    publishNotificationDeliveryFeedStage('Notification Delivery Routed', query, deliveryId);
    publishNotificationDeliveryFeedStage('Notification Delivery Target Selected', query, deliveryId);
    publishNotificationDeliveryFeedStage('Notification Delivery Ready', query, deliveryId);
    publishNotificationDeliveryFeedStage('Notification Delivery Completed', query, deliveryId);
  } else if (blocked) {
    publishNotificationDeliveryFeedStage('Notification Delivery Blocked', query, deliveryId);
    publishNotificationDeliveryFeedStage('Notification Delivery Failed', query, deliveryId);
  } else {
    publishNotificationDeliveryFeedStage('Notification Delivery Failed', query, deliveryId);
  }
}

export function publishNotificationDeliveryLifecycleStage(
  stage:
    | 'Notification Delivery Blocked'
    | 'Notification Delivery Deferred'
    | 'Notification Delivery Archived',
  query: string,
  deliveryId?: string | null,
): void {
  publishNotificationDeliveryFeedStage(stage, query, deliveryId);
}
