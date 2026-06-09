/**
 * Verification Evidence Engine — operator feed bridge.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';

export function publishVerificationEvidenceFeedStages(query: string, ready: boolean): void {
  publishOperatorFeedStage('Evidence Registered', 'verification_evidence_engine', { query });
  publishOperatorFeedStage('Evidence Ownership Assigned', 'verification_evidence_engine', { query });
  publishOperatorFeedStage('Evidence Lineage Updated', 'verification_evidence_engine', { query });
  publishOperatorFeedStage('Evidence Traceability Linked', 'verification_evidence_engine', { query });
  publishOperatorFeedStage('Evidence Validation Complete', 'verification_evidence_engine', { query });

  if (ready) {
    publishOperatorFeedStage('Evidence Report Generated', 'verification_evidence_engine', { query });
    publishOperatorFeedStage('Verification Evidence Ready', 'verification_evidence_engine', { query });
  } else {
    publishOperatorFeedStage('Verification Evidence Blocked', 'verification_evidence_engine', { query });
  }
}
