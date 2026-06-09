/**
 * Bridge — publishes learning visibility stages into Operator Feed.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';
import type { OperatorFeedStage } from './operator-feed-types.js';

export const LEARNING_VISIBILITY_FEED_STAGES: readonly OperatorFeedStage[] = [
  'Learning Analysis Started',
  'Patterns Evaluated',
  'Failures Evaluated',
  'Recommendations Evaluated',
  'Learning Ready',
  'Response Ready',
] as const;

export function publishLearningVisibilityFeedStages(query: string): void {
  publishOperatorFeedStage('Learning Analysis Started', 'learning_visibility_engine', { query });
  publishOperatorFeedStage('Patterns Evaluated', 'learning_visibility_engine', { query });
  publishOperatorFeedStage('Failures Evaluated', 'learning_visibility_engine', { query });
  publishOperatorFeedStage('Recommendations Evaluated', 'learning_visibility_engine', { query });
  publishOperatorFeedStage('Learning Ready', 'learning_visibility_engine', { query });
  publishOperatorFeedStage('Response Ready', 'learning_visibility_engine', { query });
}
