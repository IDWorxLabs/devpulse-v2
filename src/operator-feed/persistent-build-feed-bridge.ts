/**
 * Persistent Build Runtime Foundation — operator feed bridge.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';

export function publishPersistentBuildFeedStages(query: string, ready: boolean): void {
  publishOperatorFeedStage('Persistent Build Created', 'persistent_build_runtime_foundation', { query });
  publishOperatorFeedStage('Persistent Build Initialized', 'persistent_build_runtime_foundation', { query });
  publishOperatorFeedStage('Persistent Build Linked To Runtime', 'persistent_build_runtime_foundation', { query });
  publishOperatorFeedStage('Persistent Build Linked To Workspace', 'persistent_build_runtime_foundation', { query });
  if (ready) {
    publishOperatorFeedStage('Persistent Build Activated', 'persistent_build_runtime_foundation', { query });
    publishOperatorFeedStage('Persistent Build Completed', 'persistent_build_runtime_foundation', { query });
    publishOperatorFeedStage('Persistent Build Runtime Ready', 'persistent_build_runtime_foundation', { query });
  } else {
    publishOperatorFeedStage('Persistent Build Failed', 'persistent_build_runtime_foundation', { query });
    publishOperatorFeedStage('Persistent Build Runtime Blocked', 'persistent_build_runtime_foundation', { query });
  }
}

export function publishPersistentBuildLifecycleStage(
  stage:
    | 'Persistent Build Paused'
    | 'Persistent Build Resumed'
    | 'Persistent Build Waiting For Approval'
    | 'Persistent Build Waiting For Verification'
    | 'Persistent Build Waiting For Recovery'
    | 'Persistent Build Archived',
  query: string,
): void {
  publishOperatorFeedStage(stage, 'persistent_build_runtime_foundation', { query });
}
