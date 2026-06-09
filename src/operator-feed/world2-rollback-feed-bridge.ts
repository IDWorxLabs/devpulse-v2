/**
 * Bridge — publishes World 2 rollback stages into Operator Feed.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';

export function publishWorld2RollbackFeedStages(query: string, planPresent: boolean): void {
  publishOperatorFeedStage('Rollback Planning Started', 'world2_rollback_runtime', { query });
  publishOperatorFeedStage('Rollback Preconditions Validated', 'world2_rollback_runtime', { query });
  publishOperatorFeedStage('Rollback Snapshot Requirements Evaluated', 'world2_rollback_runtime', { query });
  publishOperatorFeedStage('Rollback Risks Classified', 'world2_rollback_runtime', { query });
  if (planPresent) {
    publishOperatorFeedStage('Rollback Plan Ready', 'world2_rollback_runtime', { query });
  } else {
    publishOperatorFeedStage('Rollback Planning Blocked', 'world2_rollback_runtime', { query });
  }
}
