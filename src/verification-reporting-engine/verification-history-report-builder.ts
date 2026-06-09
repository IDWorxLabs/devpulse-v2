/**
 * Verification history report builder — reporting only, not prediction.
 */

import { nextReportId } from './verification-report-store.js';
import type { ReportHistoryEntry, ReportOwnership, VerificationReport } from './verification-report-types.js';

const historyEntries: ReportHistoryEntry[] = [];
let historyCounter = 0;

export function resetVerificationHistoryForTests(): void {
  historyEntries.length = 0;
  historyCounter = 0;
}

function nextHistoryId(): string {
  historyCounter += 1;
  return `vhist-${historyCounter.toString().padStart(4, '0')}`;
}

export function recordReportHistory(
  report: VerificationReport,
  event: ReportHistoryEntry['event'],
  outcome?: string,
): ReportHistoryEntry {
  const entry: ReportHistoryEntry = {
    entryId: nextHistoryId(),
    reportId: report.reportId,
    reportType: report.reportType,
    event,
    timestamp: Date.now(),
    sessionId: report.reportSession,
    outcome,
  };
  historyEntries.push(entry);
  return entry;
}

export function listReportHistory(): ReportHistoryEntry[] {
  return [...historyEntries];
}

export function buildHistoryReport(opts: {
  ownership: ReportOwnership;
  reports: VerificationReport[];
  history: ReportHistoryEntry[];
}): VerificationReport {
  return {
    reportId: nextReportId(),
    reportType: 'VERIFICATION_HISTORY_REPORT',
    reportOwner: opts.ownership,
    reportTimestamp: Date.now(),
    reportScope: 'history',
    reportStatus: 'READY',
    reportSummary: `History report — ${opts.history.length} event(s), ${opts.reports.length} report(s)`,
    reportFindings: opts.history.slice(-10).map(
      (h) => `${h.event} — ${h.reportType} — ${h.reportId}`,
    ),
    reportEvidence: opts.reports.flatMap((r) => r.reportEvidence).slice(0, 10),
    reportRisks: [],
    reportRecommendations: ['Historical reporting only — no forecasting'],
    reportMetadata: {
      historyCount: opts.history.length,
      reportCount: opts.reports.length,
    },
    reportVisibility: 'PROJECT',
    reportReferences: opts.reports.map((r) => r.reportId),
    reportingOnly: true,
  };
}
