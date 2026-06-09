/**
 * Cloud Verification Foundation — operator feed bridge.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';

export function publishCloudVerificationFeedStages(query: string, ready: boolean): void {
  publishOperatorFeedStage('Cloud Verification Created', 'cloud_verification_foundation', { query });
  publishOperatorFeedStage('Cloud Verification Initialized', 'cloud_verification_foundation', { query });
  publishOperatorFeedStage('Cloud Verification Linked To Unified Entry', 'cloud_verification_foundation', { query });
  publishOperatorFeedStage('Cloud Verification Linked To Runtime', 'cloud_verification_foundation', { query });
  publishOperatorFeedStage('Cloud Verification Linked To Workspace', 'cloud_verification_foundation', { query });
  publishOperatorFeedStage('Cloud Verification Linked To Persistent Build', 'cloud_verification_foundation', { query });
  if (ready) {
    publishOperatorFeedStage('Cloud Verification Requested', 'cloud_verification_foundation', { query });
    publishOperatorFeedStage('Cloud Verification Evidence Linked', 'cloud_verification_foundation', { query });
    publishOperatorFeedStage('Cloud Verification Report Linked', 'cloud_verification_foundation', { query });
    publishOperatorFeedStage('Cloud Verification Completed', 'cloud_verification_foundation', { query });
    publishOperatorFeedStage('Cloud Verification Foundation Ready', 'cloud_verification_foundation', { query });
  } else {
    publishOperatorFeedStage('Cloud Verification Failed', 'cloud_verification_foundation', { query });
    publishOperatorFeedStage('Cloud Verification Foundation Blocked', 'cloud_verification_foundation', { query });
  }
}

export function publishCloudVerificationLifecycleStage(
  stage: 'Cloud Verification Archived',
  query: string,
): void {
  publishOperatorFeedStage(stage, 'cloud_verification_foundation', { query });
}
