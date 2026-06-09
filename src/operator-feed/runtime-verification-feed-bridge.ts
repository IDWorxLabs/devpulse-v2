/**
 * Bridge — publishes runtime verification layer stages into Operator Feed.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';
import type { OperatorFeedStage } from './operator-feed-types.js';

export const RUNTIME_VERIFICATION_FEED_STAGES: readonly OperatorFeedStage[] = [
  'Runtime Verification Started',
  'Verification Evidence Collected',
  'Verification Gaps Evaluated',
  'Trust Assessment Calculated',
  'Verification Score Calculated',
  'Runtime Verification Report Ready',
  'Response Ready',
] as const;

export function publishRuntimeVerificationFeedStages(query: string): void {
  publishOperatorFeedStage('Runtime Verification Started', 'runtime_verification_layer', { query });
  publishOperatorFeedStage('Verification Evidence Collected', 'runtime_verification_layer', { query });
  publishOperatorFeedStage('Verification Gaps Evaluated', 'runtime_verification_layer', { query });
  publishOperatorFeedStage('Trust Assessment Calculated', 'runtime_verification_layer', { query });
  publishOperatorFeedStage('Verification Score Calculated', 'runtime_verification_layer', { query });
  publishOperatorFeedStage('Runtime Verification Report Ready', 'runtime_verification_layer', { query });
  publishOperatorFeedStage('Response Ready', 'runtime_verification_layer', { query });
}
