/**
 * Verification summary report builder.
 */

import { nextReportId } from './verification-report-store.js';
import type { ReportOwnership, VerificationReport } from './verification-report-types.js';

export function buildVerificationSummaryReport(opts: {
  ownership: ReportOwnership;
  evidenceIds: string[];
  targetCount: number;
  orchestrationId: string;
  blockedTargets: string[];
  readyTargets: string[];
}): VerificationReport {
  return {
    reportId: nextReportId(),
    reportType: 'VERIFICATION_SUMMARY_REPORT',
    reportOwner: opts.ownership,
    reportTimestamp: Date.now(),
    reportSession: opts.ownership.verificationSession,
    reportScope: 'project',
    reportStatus: 'READY',
    reportSummary: `Verification summary — ${opts.targetCount} targets, ${opts.evidenceIds.length} evidence records, ${opts.readyTargets.length} ready, ${opts.blockedTargets.length} blocked`,
    reportFindings: [
      `Targets registered: ${opts.targetCount}`,
      `Ready targets: ${opts.readyTargets.join(', ') || 'none'}`,
      `Blocked targets: ${opts.blockedTargets.join(', ') || 'none'}`,
      `Orchestration: ${opts.orchestrationId}`,
    ],
    reportEvidence: [...opts.evidenceIds],
    reportRisks: opts.blockedTargets.length > 0 ? [`${opts.blockedTargets.length} blocked verification targets`] : [],
    reportRecommendations: ['Review blocked targets before future verification execution'],
    reportMetadata: {
      targetCount: opts.targetCount,
      evidenceCount: opts.evidenceIds.length,
      orchestrationId: opts.orchestrationId,
    },
    reportVisibility: 'PROJECT',
    reportReferences: [opts.orchestrationId],
    reportingOnly: true,
  };
}
