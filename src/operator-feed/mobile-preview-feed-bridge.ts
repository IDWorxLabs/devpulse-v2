/**
 * Mobile Preview Runtime Foundation — operator feed bridge.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';

export type MobilePreviewFeedStage =
  | 'Mobile Preview Session Created'
  | 'Eligibility Checked'
  | 'Safety Checked'
  | 'Allowed'
  | 'Blocked'
  | 'Desktop Recommended'
  | 'Link Registered'
  | 'Pending'
  | 'Ready'
  | 'Completed'
  | 'Failed'
  | 'Archived';

export function publishMobilePreviewFeedStage(
  stage: MobilePreviewFeedStage,
  query: string,
  mobilePreviewId?: string | null,
): void {
  publishOperatorFeedStage(stage, 'mobile_preview_runtime_foundation', {
    query,
    summary: mobilePreviewId ? `mobilePreviewId=${mobilePreviewId}` : undefined,
  });
}

export function publishMobilePreviewFeedStages(
  query: string,
  ready: boolean,
  mobilePreviewId?: string | null,
  blocked = false,
  desktopRecommended = false,
): void {
  publishMobilePreviewFeedStage('Mobile Preview Session Created', query, mobilePreviewId);

  if (ready) {
    publishMobilePreviewFeedStage('Eligibility Checked', query, mobilePreviewId);
    publishMobilePreviewFeedStage('Safety Checked', query, mobilePreviewId);
    publishMobilePreviewFeedStage('Allowed', query, mobilePreviewId);
    if (desktopRecommended) {
      publishMobilePreviewFeedStage('Desktop Recommended', query, mobilePreviewId);
    }
    publishMobilePreviewFeedStage('Link Registered', query, mobilePreviewId);
    publishMobilePreviewFeedStage('Pending', query, mobilePreviewId);
    publishMobilePreviewFeedStage('Ready', query, mobilePreviewId);
    publishMobilePreviewFeedStage('Completed', query, mobilePreviewId);
  } else if (blocked) {
    publishMobilePreviewFeedStage('Eligibility Checked', query, mobilePreviewId);
    publishMobilePreviewFeedStage('Blocked', query, mobilePreviewId);
    publishMobilePreviewFeedStage('Failed', query, mobilePreviewId);
  } else {
    publishMobilePreviewFeedStage('Failed', query, mobilePreviewId);
  }
}

export function publishMobilePreviewLifecycleStage(
  stage: 'Archived',
  query: string,
  mobilePreviewId?: string | null,
): void {
  publishMobilePreviewFeedStage(stage, query, mobilePreviewId);
}
