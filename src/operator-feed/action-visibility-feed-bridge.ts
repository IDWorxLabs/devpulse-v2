/**
 * Bridge — publishes action visibility stages into Operator Feed.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';
import type { OperatorFeedStage } from './operator-feed-types.js';

export const ACTION_VISIBILITY_FEED_STAGES: readonly OperatorFeedStage[] = [
  'Action Identified',
  'Action Evaluated',
  'Action Recommended',
  'Action Deferred',
  'Action Blocked',
  'Action Completed',
  'Response Ready',
] as const;

export function publishActionVisibilityFeedStages(query: string): void {
  const lower = query.toLowerCase();
  publishOperatorFeedStage('Action Identified', 'action_visibility_engine', { query });
  publishOperatorFeedStage('Action Evaluated', 'action_visibility_engine', { query });

  if (lower.includes('recommended') || lower.includes('what should we do')) {
    publishOperatorFeedStage('Action Recommended', 'action_visibility_engine', { query });
  }
  if (lower.includes('deferred')) {
    publishOperatorFeedStage('Action Deferred', 'action_visibility_engine', { query });
  }
  if (lower.includes('blocked')) {
    publishOperatorFeedStage('Action Blocked', 'action_visibility_engine', { query });
  }
  if (lower.includes('completed') || lower.includes('has it completed')) {
    publishOperatorFeedStage('Action Completed', 'action_visibility_engine', { query });
  }

  publishOperatorFeedStage('Response Ready', 'action_visibility_engine', { query });
}
