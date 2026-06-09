/**
 * Cloud Recovery Foundation — operator feed bridge.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';

export function publishCloudRecoveryFeedStages(query: string, ready: boolean): void {
  publishOperatorFeedStage('Cloud Failure Identified', 'cloud_recovery_foundation', { query });
  publishOperatorFeedStage('Cloud Recovery Candidate Identified', 'cloud_recovery_foundation', { query });
  publishOperatorFeedStage('Cloud Recovery Plan Registered', 'cloud_recovery_foundation', { query });
  publishOperatorFeedStage('Cloud Recovery Linked To Runtime', 'cloud_recovery_foundation', { query });
  publishOperatorFeedStage('Cloud Recovery Linked To Workspace', 'cloud_recovery_foundation', { query });
  publishOperatorFeedStage('Cloud Recovery Linked To Build', 'cloud_recovery_foundation', { query });
  publishOperatorFeedStage('Cloud Recovery Linked To Verification', 'cloud_recovery_foundation', { query });
  if (ready) {
    publishOperatorFeedStage('Cloud Recovery Ready', 'cloud_recovery_foundation', { query });
    publishOperatorFeedStage('Cloud Recovery Completed', 'cloud_recovery_foundation', { query });
  } else {
    publishOperatorFeedStage('Cloud Recovery Failed', 'cloud_recovery_foundation', { query });
    publishOperatorFeedStage('Cloud Recovery Foundation Blocked', 'cloud_recovery_foundation', { query });
  }
}

export function publishCloudRecoveryLifecycleStage(
  stage: 'Cloud Recovery Archived',
  query: string,
): void {
  publishOperatorFeedStage(stage, 'cloud_recovery_foundation', { query });
}
