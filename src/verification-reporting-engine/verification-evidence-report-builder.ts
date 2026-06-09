/**
 * Verification evidence report builder — consumes Evidence Engine, never invents evidence.
 */

import { nextReportId } from './verification-report-store.js';
import type { EvidenceRecord } from '../verification-evidence-engine/verification-evidence-types.js';
import type { ReportOwnership, VerificationReport } from './verification-report-types.js';

export function buildEvidenceReport(opts: {
  ownership: ReportOwnership;
  evidenceRecords: EvidenceRecord[];
  missingEvidence: string[];
}): VerificationReport {
  const evidenceIds = opts.evidenceRecords.map((e) => e.evidenceId);
  return {
    reportId: nextReportId(),
    reportType: 'VERIFICATION_EVIDENCE_REPORT',
    reportOwner: opts.ownership,
    reportTimestamp: Date.now(),
    reportSession: opts.ownership.verificationSession,
    reportScope: 'evidence',
    reportStatus: 'READY',
    reportSummary: `Evidence report — ${evidenceIds.length} registered, ${opts.missingEvidence.length} missing requirement(s)`,
    reportFindings: opts.evidenceRecords.slice(0, 8).map(
      (e) => `${e.evidenceId} — ${e.evidenceType} — ${e.evidenceOwner.ownerModule}`,
    ),
    reportEvidence: evidenceIds,
    reportRisks: opts.missingEvidence.map((m) => `Missing evidence: ${m}`),
    reportRecommendations: ['All findings reference registered evidence records only'],
    reportMetadata: {
      evidenceCount: evidenceIds.length,
      missingCount: opts.missingEvidence.length,
    },
    reportVisibility: 'PROJECT',
    reportReferences: evidenceIds,
    reportingOnly: true,
  };
}
