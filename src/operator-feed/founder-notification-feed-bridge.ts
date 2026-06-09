/**
 * Founder Notification Runtime Foundation — operator feed bridge.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';
import type { OperatorFeedStage } from './operator-feed-types.js';

export type FounderNotificationFeedStage =
  | 'Notification Created'
  | 'Notification Routed'
  | 'Notification Visible'
  | 'Notification Viewed'
  | 'Notification Acknowledged'
  | 'Notification Dismissed'
  | 'Notification Archived'
  | 'Notification Failed';

export function publishFounderNotificationFeedStage(
  stage: FounderNotificationFeedStage,
  query: string,
  notificationId?: string | null,
): void {
  publishOperatorFeedStage(stage as OperatorFeedStage, 'founder_notification_runtime_foundation', {
    query,
    summary: notificationId ? `notificationId=${notificationId}` : undefined,
  });
}

export function publishFounderNotificationFeedStages(
  query: string,
  ready: boolean,
  notificationId?: string | null,
  blocked = false,
): void {
  publishFounderNotificationFeedStage('Notification Created', query, notificationId);

  if (ready) {
    publishFounderNotificationFeedStage('Notification Routed', query, notificationId);
    publishFounderNotificationFeedStage('Notification Visible', query, notificationId);
    publishFounderNotificationFeedStage('Notification Viewed', query, notificationId);
    publishFounderNotificationFeedStage('Notification Acknowledged', query, notificationId);
  } else if (blocked) {
    publishFounderNotificationFeedStage('Notification Failed', query, notificationId);
  } else {
    publishFounderNotificationFeedStage('Notification Failed', query, notificationId);
  }
}

export function publishFounderNotificationLifecycleStage(
  stage: 'Notification Dismissed' | 'Notification Archived',
  query: string,
  notificationId?: string | null,
): void {
  publishFounderNotificationFeedStage(stage, query, notificationId);
}
