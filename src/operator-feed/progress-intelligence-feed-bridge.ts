/**
 * Bridge — publishes progress intelligence stages into Operator Feed.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';
import type { OperatorFeedStage } from './operator-feed-types.js';

export const PROGRESS_INTELLIGENCE_FEED_STAGES: readonly OperatorFeedStage[] = [
  'Progress Evaluation Started',
  'Milestones Evaluated',
  'Blockers Evaluated',
  'Progress Calculated',
  'Progress Ready',
  'Response Ready',
] as const;

export function publishProgressIntelligenceFeedStages(query: string): void {
  publishOperatorFeedStage('Progress Evaluation Started', 'progress_intelligence', { query });
  publishOperatorFeedStage('Milestones Evaluated', 'progress_intelligence', { query });
  publishOperatorFeedStage('Blockers Evaluated', 'progress_intelligence', { query });
  publishOperatorFeedStage('Progress Calculated', 'progress_intelligence', { query });
  publishOperatorFeedStage('Progress Ready', 'progress_intelligence', { query });
  publishOperatorFeedStage('Response Ready', 'progress_intelligence', { query });
}
