/**
 * Cloud Runtime Foundation — operator feed bridge.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';

export function publishCloudRuntimeFeedStages(query: string, ready: boolean): void {
  publishOperatorFeedStage('Cloud Runtime Created', 'cloud_runtime_foundation', { query });
  publishOperatorFeedStage('Cloud Runtime Initialized', 'cloud_runtime_foundation', { query });
  if (ready) {
    publishOperatorFeedStage('Cloud Runtime Activated', 'cloud_runtime_foundation', { query });
    publishOperatorFeedStage('Cloud Runtime Completed', 'cloud_runtime_foundation', { query });
    publishOperatorFeedStage('Cloud Runtime Ready', 'cloud_runtime_foundation', { query });
  } else {
    publishOperatorFeedStage('Cloud Runtime Failed', 'cloud_runtime_foundation', { query });
    publishOperatorFeedStage('Cloud Runtime Blocked', 'cloud_runtime_foundation', { query });
  }
}

export function publishCloudRuntimeLifecycleStage(
  stage:
    | 'Cloud Runtime Paused'
    | 'Cloud Runtime Resumed'
    | 'Cloud Runtime Archived',
  query: string,
): void {
  publishOperatorFeedStage(stage, 'cloud_runtime_foundation', { query });
}
