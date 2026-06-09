/**
 * Bridge — publishes auto-fix runtime foundation stages into Operator Feed.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';
import type { OperatorFeedStage } from './operator-feed-types.js';

export const AUTO_FIX_RUNTIME_FEED_STAGES: readonly OperatorFeedStage[] = [
  'Auto Fix Planning Started',
  'Failure Analysis Complete',
  'Fix Proposals Created',
  'Alternatives Evaluated',
  'Risks Evaluated',
  'Rollback Plan Created',
  'Verification Plan Created',
  'Auto Fix Plan Ready',
  'Response Ready',
] as const;

export function publishAutoFixRuntimeFeedStages(query: string): void {
  publishOperatorFeedStage('Auto Fix Planning Started', 'auto_fix_runtime', { query });
  publishOperatorFeedStage('Failure Analysis Complete', 'auto_fix_runtime', { query });
  publishOperatorFeedStage('Fix Proposals Created', 'auto_fix_runtime', { query });
  publishOperatorFeedStage('Alternatives Evaluated', 'auto_fix_runtime', { query });
  publishOperatorFeedStage('Risks Evaluated', 'auto_fix_runtime', {
    query,
    summary: 'Fix risks evaluated before any future fix application.',
  });
  publishOperatorFeedStage('Rollback Plan Created', 'auto_fix_runtime', { query });
  publishOperatorFeedStage('Verification Plan Created', 'auto_fix_runtime', {
    query,
    summary: 'Fix verification plan created — proof criteria advisory.',
  });
  publishOperatorFeedStage('Auto Fix Plan Ready', 'auto_fix_runtime', { query });
  publishOperatorFeedStage('Response Ready', 'auto_fix_runtime', { query });
}
