/**
 * Unified Verification Lab Runtime — operator feed bridge.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';

export function publishUvlRuntimeFeedStages(query: string, ready: boolean): void {
  publishOperatorFeedStage('Verification Provider Registered', 'unified_verification_lab_runtime', { query });
  publishOperatorFeedStage('Verification Session Created', 'unified_verification_lab_runtime', { query });
  publishOperatorFeedStage('Verification Session Started', 'unified_verification_lab_runtime', { query });
  publishOperatorFeedStage('Verification Session Completed', 'unified_verification_lab_runtime', { query });
  publishOperatorFeedStage('Verification Session Failed', 'unified_verification_lab_runtime', { query });

  if (ready) {
    publishOperatorFeedStage('Verification Runtime Ready', 'unified_verification_lab_runtime', { query });
  } else {
    publishOperatorFeedStage('Verification Runtime Blocked', 'unified_verification_lab_runtime', { query });
  }
}
