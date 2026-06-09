/**
 * Bridge — publishes execution runtime foundation stages into Operator Feed.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';
import type { OperatorFeedStage } from './operator-feed-types.js';

export const EXECUTION_RUNTIME_FEED_STAGES: readonly OperatorFeedStage[] = [
  'Execution Evaluation Started',
  'Readiness Evaluation',
  'Dependency Check',
  'Safety Check',
  'Execution Readiness Ready',
  'Response Ready',
] as const;

export function publishExecutionRuntimeFeedStages(query: string): void {
  publishOperatorFeedStage('Execution Evaluation Started', 'execution_runtime', { query });
  publishOperatorFeedStage('Readiness Evaluation', 'execution_runtime', { query });
  publishOperatorFeedStage('Dependency Check', 'execution_runtime', { query });
  publishOperatorFeedStage('Safety Check', 'execution_runtime', { query });
  publishOperatorFeedStage('Execution Readiness Ready', 'execution_runtime', { query });
  publishOperatorFeedStage('Response Ready', 'execution_runtime', { query });
}
