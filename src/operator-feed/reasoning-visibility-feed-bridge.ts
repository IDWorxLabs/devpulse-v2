/**
 * Bridge — publishes reasoning visibility stages into Operator Feed.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';
import type { OperatorFeedStage } from './operator-feed-types.js';

export const REASONING_VISIBILITY_FEED_STAGES: readonly OperatorFeedStage[] = [
  'Reasoning Started',
  'Evidence Collected',
  'Risks Evaluated',
  'Blockers Evaluated',
  'Confidence Calculated',
  'Reasoning Ready',
  'Response Ready',
] as const;

export function publishReasoningVisibilityFeedStages(query: string): void {
  publishOperatorFeedStage('Reasoning Started', 'reasoning_visibility_engine', { query });
  publishOperatorFeedStage('Evidence Collected', 'reasoning_visibility_engine', { query });
  publishOperatorFeedStage('Risks Evaluated', 'reasoning_visibility_engine', { query });
  publishOperatorFeedStage('Blockers Evaluated', 'reasoning_visibility_engine', { query });
  publishOperatorFeedStage('Confidence Calculated', 'reasoning_visibility_engine', { query });
  publishOperatorFeedStage('Reasoning Ready', 'reasoning_visibility_engine', { query });
  publishOperatorFeedStage('Response Ready', 'reasoning_visibility_engine', { query });
}
