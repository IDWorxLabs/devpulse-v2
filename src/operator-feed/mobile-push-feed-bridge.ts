/**
 * Mobile Push Foundation — operator feed bridge (13 stages).
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';
import type { OperatorFeedStage } from './operator-feed-types.js';

export type MobilePushFeedStage =
  | 'Mobile Push Created'
  | 'Mobile Push Planned'
  | 'Mobile Push Eligibility Checked'
  | 'Mobile Push Token Metadata Checked'
  | 'Mobile Push Payload Planned'
  | 'Mobile Push Routed'
  | 'Mobile Push Target Selected'
  | 'Mobile Push Blocked'
  | 'Mobile Push Deferred'
  | 'Mobile Push Ready'
  | 'Mobile Push Completed'
  | 'Mobile Push Failed'
  | 'Mobile Push Archived';

export function publishMobilePushFeedStage(
  stage: MobilePushFeedStage,
  query: string,
  pushId?: string | null,
): void {
  publishOperatorFeedStage(stage as OperatorFeedStage, 'mobile_push_foundation', {
    query,
    summary: pushId ? `pushId=${pushId}` : undefined,
  });
}

export function publishMobilePushFeedStages(
  query: string,
  ready: boolean,
  pushId?: string | null,
  blocked = false,
): void {
  publishMobilePushFeedStage('Mobile Push Created', query, pushId);

  if (ready) {
    publishMobilePushFeedStage('Mobile Push Planned', query, pushId);
    publishMobilePushFeedStage('Mobile Push Eligibility Checked', query, pushId);
    publishMobilePushFeedStage('Mobile Push Token Metadata Checked', query, pushId);
    publishMobilePushFeedStage('Mobile Push Payload Planned', query, pushId);
    publishMobilePushFeedStage('Mobile Push Routed', query, pushId);
    publishMobilePushFeedStage('Mobile Push Target Selected', query, pushId);
    publishMobilePushFeedStage('Mobile Push Ready', query, pushId);
    publishMobilePushFeedStage('Mobile Push Completed', query, pushId);
  } else if (blocked) {
    publishMobilePushFeedStage('Mobile Push Blocked', query, pushId);
    publishMobilePushFeedStage('Mobile Push Failed', query, pushId);
  } else {
    publishMobilePushFeedStage('Mobile Push Failed', query, pushId);
  }
}

export function publishMobilePushLifecycleStage(
  stage:
    | 'Mobile Push Blocked'
    | 'Mobile Push Deferred'
    | 'Mobile Push Archived',
  query: string,
  pushId?: string | null,
): void {
  publishMobilePushFeedStage(stage, query, pushId);
}
