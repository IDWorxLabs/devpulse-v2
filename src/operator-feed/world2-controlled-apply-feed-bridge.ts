/**
 * Bridge — publishes World 2 controlled apply stages into Operator Feed.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';

export function publishWorld2ControlledApplyFeedStages(
  query: string,
  packetPresent: boolean,
): void {
  publishOperatorFeedStage('Controlled Apply Started', 'world2_controlled_apply_runtime', { query });
  publishOperatorFeedStage('Controlled Apply Validated', 'world2_controlled_apply_runtime', { query });
  publishOperatorFeedStage('Controlled Apply Gates Evaluated', 'world2_controlled_apply_runtime', { query });
  publishOperatorFeedStage('Controlled Apply Risks Classified', 'world2_controlled_apply_runtime', { query });
  if (packetPresent) {
    publishOperatorFeedStage('Controlled Apply Plan Ready', 'world2_controlled_apply_runtime', { query });
  } else {
    publishOperatorFeedStage('Controlled Apply Blocked', 'world2_controlled_apply_runtime', { query });
  }
}
