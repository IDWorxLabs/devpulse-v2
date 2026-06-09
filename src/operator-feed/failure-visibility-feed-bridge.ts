/**
 * Bridge — publishes failure visibility stages into Operator Feed.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';
import type { OperatorFeedStage } from './operator-feed-types.js';

export const FAILURE_VISIBILITY_FEED_STAGES: readonly OperatorFeedStage[] = [
  'Failure Detected',
  'Failure Evaluated',
  'Severity Calculated',
  'Impact Evaluated',
  'Next Step Generated',
  'Failure Ready',
  'Response Ready',
] as const;

export function publishFailureVisibilityFeedStages(query: string): void {
  publishOperatorFeedStage('Failure Detected', 'failure_visibility_engine', { query });
  publishOperatorFeedStage('Failure Evaluated', 'failure_visibility_engine', { query });
  publishOperatorFeedStage('Severity Calculated', 'failure_visibility_engine', { query });
  publishOperatorFeedStage('Impact Evaluated', 'failure_visibility_engine', { query });
  publishOperatorFeedStage('Next Step Generated', 'failure_visibility_engine', { query });
  publishOperatorFeedStage('Failure Ready', 'failure_visibility_engine', { query });
  publishOperatorFeedStage('Response Ready', 'failure_visibility_engine', { query });
}
