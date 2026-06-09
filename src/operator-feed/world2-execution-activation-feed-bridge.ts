/**
 * Bridge — publishes World 2 execution activation stages into Operator Feed.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';
import type { OperatorFeedStage } from './operator-feed-types.js';

export const WORLD2_EXECUTION_ACTIVATION_FEED_STAGES: readonly OperatorFeedStage[] = [
  'World 2 Activation Started',
  'Workspace Isolation Checked',
  'Governance Gates Checked',
  'Runtime Chain Linked',
  'Activation Readiness Evaluated',
  'World 2 Activation Plan Ready',
  'Response Ready',
] as const;

export function publishWorld2ExecutionActivationFeedStages(query: string): void {
  publishOperatorFeedStage('World 2 Activation Started', 'world2_execution_activation', { query });
  publishOperatorFeedStage('Workspace Isolation Checked', 'world2_execution_activation', { query });
  publishOperatorFeedStage('Governance Gates Checked', 'world2_execution_activation', { query });
  publishOperatorFeedStage('Runtime Chain Linked', 'world2_execution_activation', { query });
  publishOperatorFeedStage('Activation Readiness Evaluated', 'world2_execution_activation', { query });
  publishOperatorFeedStage('World 2 Activation Plan Ready', 'world2_execution_activation', { query });
  publishOperatorFeedStage('Response Ready', 'world2_execution_activation', { query });
}
