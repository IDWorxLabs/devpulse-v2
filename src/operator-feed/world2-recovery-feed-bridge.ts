/**
 * World 2 Recovery Runtime — operator feed bridge.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';

export function publishWorld2RecoveryFeedStages(query: string, planReady: boolean): void {
  publishOperatorFeedStage('Recovery Planning Started', 'world2_recovery_runtime', { query });
  publishOperatorFeedStage('Recovery Preconditions Validated', 'world2_recovery_runtime', { query });
  publishOperatorFeedStage('Recovery Failure Classified', 'world2_recovery_runtime', { query });
  publishOperatorFeedStage('Recovery Strategy Selected', 'world2_recovery_runtime', { query });
  publishOperatorFeedStage('Recovery Escalation Evaluated', 'world2_recovery_runtime', { query });
  if (planReady) {
    publishOperatorFeedStage('Recovery Plan Ready', 'world2_recovery_runtime', { query });
  } else {
    publishOperatorFeedStage('Recovery Planning Blocked', 'world2_recovery_runtime', { query });
  }
}
