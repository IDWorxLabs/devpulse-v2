/**
 * Unified Verification Entry Point — operator feed bridge.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';

export function publishUnifiedVerificationFeedStages(query: string, ready: boolean): void {
  publishOperatorFeedStage('Verification Requested', 'unified_verification_entry', { query });
  publishOperatorFeedStage('Verification Routed', 'unified_verification_entry', { query });
  publishOperatorFeedStage('Verification Scope Built', 'unified_verification_entry', { query });
  publishOperatorFeedStage('Verification Context Built', 'unified_verification_entry', { query });
  publishOperatorFeedStage('Unified Verification Session Created', 'unified_verification_entry', { query });
  publishOperatorFeedStage('Verification State Updated', 'unified_verification_entry', { query });
  publishOperatorFeedStage('Verification Response Generated', 'unified_verification_entry', { query });

  if (ready) {
    publishOperatorFeedStage('Verification Complete', 'unified_verification_entry', { query });
    publishOperatorFeedStage('Unified Verification Ready', 'unified_verification_entry', { query });
  } else {
    publishOperatorFeedStage('Unified Verification Blocked', 'unified_verification_entry', { query });
  }
}
