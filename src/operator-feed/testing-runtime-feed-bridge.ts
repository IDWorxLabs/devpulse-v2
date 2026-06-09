/**
 * Bridge — publishes testing runtime foundation stages into Operator Feed.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';
import type { OperatorFeedStage } from './operator-feed-types.js';

export const TESTING_RUNTIME_FEED_STAGES: readonly OperatorFeedStage[] = [
  'Testing Planning Started',
  'Testing Request Parsed',
  'Test Cases Created',
  'Evidence Requirements Created',
  'Test Risks Evaluated',
  'Simulated Results Created',
  'Testing Plan Ready',
  'Response Ready',
] as const;

export function publishTestingRuntimeFeedStages(query: string): void {
  publishOperatorFeedStage('Testing Planning Started', 'testing_runtime', { query });
  publishOperatorFeedStage('Testing Request Parsed', 'testing_runtime', { query });
  publishOperatorFeedStage('Test Cases Created', 'testing_runtime', { query });
  publishOperatorFeedStage('Evidence Requirements Created', 'testing_runtime', { query });
  publishOperatorFeedStage('Test Risks Evaluated', 'testing_runtime', { query });
  publishOperatorFeedStage('Simulated Results Created', 'testing_runtime', { query });
  publishOperatorFeedStage('Testing Plan Ready', 'testing_runtime', { query });
  publishOperatorFeedStage('Response Ready', 'testing_runtime', { query });
}
