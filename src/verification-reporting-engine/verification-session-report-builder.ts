/**
 * Verification session report builder.
 */

import { nextReportId } from './verification-report-store.js';
import type { ReportOwnership, VerificationReport } from './verification-report-types.js';

export function buildSessionReport(opts: {
  ownership: ReportOwnership;
  sessions: Array<{ sessionId: string; providerType: string; state: string }>;
  evidenceIds: string[];
}): VerificationReport {
  const sessionId = opts.sessions[0]?.sessionId ?? 'vsess-none';
  return {
    reportId: nextReportId(),
    reportType: 'VERIFICATION_SESSION_REPORT',
    reportOwner: { ...opts.ownership, verificationSession: sessionId },
    reportTimestamp: Date.now(),
    reportSession: sessionId,
    reportScope: 'sessions',
    reportStatus: 'READY',
    reportSummary: `Session report — ${opts.sessions.length} verification session(s) registered`,
    reportFindings: opts.sessions.map((s) => `${s.sessionId} — ${s.providerType} — ${s.state}`),
    reportEvidence: opts.evidenceIds.slice(0, 3),
    reportRisks: [],
    reportRecommendations: ['Session lifecycle only — no provider execution in Phase 16.11'],
    reportMetadata: { sessionCount: opts.sessions.length },
    reportVisibility: 'PROJECT',
    reportReferences: opts.sessions.map((s) => s.sessionId),
    reportingOnly: true,
  };
}
