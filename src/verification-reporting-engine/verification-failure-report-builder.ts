/**
 * Verification failure report builder.
 */

import { nextReportId } from './verification-report-store.js';
import type { ReportOwnership, VerificationReport } from './verification-report-types.js';

export function buildFailureReport(opts: {
  ownership: ReportOwnership;
  blockedTargets: string[];
  blockedReasons: string[];
  evidenceIds: string[];
}): VerificationReport {
  return {
    reportId: nextReportId(),
    reportType: 'VERIFICATION_FAILURE_REPORT',
    reportOwner: opts.ownership,
    reportTimestamp: Date.now(),
    reportSession: opts.ownership.verificationSession,
    reportScope: 'verification_failures',
    reportStatus: opts.blockedTargets.length > 0 ? 'READY' : 'DRAFT',
    reportSummary: `Verification failure report — ${opts.blockedTargets.length} blocked target(s), ${opts.blockedReasons.length} reason(s)`,
    reportFindings: opts.blockedTargets.map((t) => `Blocked: ${t}`),
    reportEvidence: opts.evidenceIds.slice(0, 5),
    reportRisks: opts.blockedReasons.slice(0, 5),
    reportRecommendations: ['Resolve dependency and ownership blockers before orchestration'],
    reportMetadata: { blockedCount: opts.blockedTargets.length },
    reportVisibility: 'PROJECT',
    reportReferences: opts.blockedTargets,
    reportingOnly: true,
  };
}
