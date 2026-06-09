/**
 * Verification trend report builder — historical metrics only, no forecasting.
 */

import { nextReportId } from './verification-report-store.js';
import type { ReportHistoryEntry, ReportOwnership, VerificationReport } from './verification-report-types.js';

export interface TrendMetrics {
  verificationVolume: number;
  verificationFrequency: number;
  failureFrequency: number;
  evidenceGrowth: number;
  verificationCoverage: number;
  historicalReportGeneration: number;
}

export function computeTrendMetrics(opts: {
  reportCount: number;
  evidenceCount: number;
  targetCount: number;
  blockedCount: number;
  historyCount: number;
}): TrendMetrics {
  return {
    verificationVolume: opts.reportCount,
    verificationFrequency: opts.historyCount,
    failureFrequency: opts.blockedCount,
    evidenceGrowth: opts.evidenceCount,
    verificationCoverage: opts.targetCount > 0 ? Math.round((opts.evidenceCount / opts.targetCount) * 100) / 100 : 0,
    historicalReportGeneration: opts.reportCount,
  };
}

export function buildTrendReport(opts: {
  ownership: ReportOwnership;
  metrics: TrendMetrics;
  evidenceIds: string[];
  history: ReportHistoryEntry[];
}): VerificationReport {
  return {
    reportId: nextReportId(),
    reportType: 'VERIFICATION_TREND_REPORT',
    reportOwner: opts.ownership,
    reportTimestamp: Date.now(),
    reportScope: 'trends',
    reportStatus: 'READY',
    reportSummary: `Trend report — volume ${opts.metrics.verificationVolume}, coverage ${opts.metrics.verificationCoverage}`,
    reportFindings: [
      `Verification volume: ${opts.metrics.verificationVolume}`,
      `Verification frequency: ${opts.metrics.verificationFrequency}`,
      `Failure frequency: ${opts.metrics.failureFrequency}`,
      `Evidence growth: ${opts.metrics.evidenceGrowth}`,
      `Verification coverage: ${opts.metrics.verificationCoverage}`,
      `Historical report generation: ${opts.metrics.historicalReportGeneration}`,
    ],
    reportEvidence: opts.evidenceIds.slice(0, 5),
    reportRisks: opts.metrics.failureFrequency > 0 ? [`${opts.metrics.failureFrequency} failure(s) in trend window`] : [],
    reportRecommendations: ['Trend metrics are historical only — no forecasting'],
    reportMetadata: { ...opts.metrics },
    reportVisibility: 'PROJECT',
    reportReferences: opts.history.map((h) => h.entryId).slice(-5),
    reportingOnly: true,
  };
}
