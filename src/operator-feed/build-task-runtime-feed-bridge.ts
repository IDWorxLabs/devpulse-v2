/**
 * Bridge — publishes build task runtime foundation stages into Operator Feed.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';
import type { OperatorFeedStage } from './operator-feed-types.js';

export const BUILD_TASK_RUNTIME_FEED_STAGES: readonly OperatorFeedStage[] = [
  'Build Task Planning Started',
  'Task Request Parsed',
  'Dependencies Resolved',
  'Safety Gates Evaluated',
  'Verification Plan Created',
  'Build Task Plan Ready',
  'Response Ready',
] as const;

export function publishBuildTaskRuntimeFeedStages(query: string): void {
  publishOperatorFeedStage('Build Task Planning Started', 'build_task_runtime', { query });
  publishOperatorFeedStage('Task Request Parsed', 'build_task_runtime', { query });
  publishOperatorFeedStage('Dependencies Resolved', 'build_task_runtime', { query });
  publishOperatorFeedStage('Safety Gates Evaluated', 'build_task_runtime', { query });
  publishOperatorFeedStage('Verification Plan Created', 'build_task_runtime', { query });
  publishOperatorFeedStage('Build Task Plan Ready', 'build_task_runtime', { query });
  publishOperatorFeedStage('Response Ready', 'build_task_runtime', { query });
}
