/**
 * World 2 Completion Runtime — operator feed bridge.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';

export function publishWorld2CompletionFeedStages(query: string, planReady: boolean): void {
  publishOperatorFeedStage('Completion Planning Started', 'world2_completion_runtime', { query });
  publishOperatorFeedStage('Completion Criteria Evaluated', 'world2_completion_runtime', { query });
  publishOperatorFeedStage('Completion Evidence Evaluated', 'world2_completion_runtime', { query });
  publishOperatorFeedStage('Completion Verification Evaluated', 'world2_completion_runtime', { query });
  publishOperatorFeedStage('Completion Risks Classified', 'world2_completion_runtime', { query });
  if (planReady) {
    publishOperatorFeedStage('Completion Plan Ready', 'world2_completion_runtime', { query });
  } else {
    publishOperatorFeedStage('Completion Planning Blocked', 'world2_completion_runtime', { query });
  }
}
