/**
 * Verification Reporting Engine — operator feed bridge.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';

export function publishVerificationReportingFeedStages(query: string, ready: boolean): void {
  publishOperatorFeedStage('Report Created', 'verification_reporting_engine', { query });
  publishOperatorFeedStage('Report Updated', 'verification_reporting_engine', { query });
  publishOperatorFeedStage('Evidence Linked', 'verification_reporting_engine', { query });
  publishOperatorFeedStage('History Updated', 'verification_reporting_engine', { query });
  publishOperatorFeedStage('Trend Updated', 'verification_reporting_engine', { query });
  publishOperatorFeedStage('Report Validated', 'verification_reporting_engine', { query });

  if (ready) {
    publishOperatorFeedStage('Report Exported', 'verification_reporting_engine', { query });
    publishOperatorFeedStage('Report Generated', 'verification_reporting_engine', { query });
    publishOperatorFeedStage('Verification Reporting Ready', 'verification_reporting_engine', { query });
  } else {
    publishOperatorFeedStage('Verification Reporting Blocked', 'verification_reporting_engine', { query });
  }
}
