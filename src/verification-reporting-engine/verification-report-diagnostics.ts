/**
 * Verification report diagnostics tracker.
 */

import type {
  ReportingAuthorityState,
  VerificationReportingDiagnostics,
} from './verification-report-types.js';

const diagnostics: VerificationReportingDiagnostics = {
  reportingAuthorityActive: false,
  authorityId: null,
  reportCount: 0,
  reportTypeCount: 0,
  historyEntryCount: 0,
  trendMetricCount: 0,
  validationIssueCount: 0,
  lastQuery: null,
  lastState: null,
};

export function verificationReportingEngineKey(): string {
  return 'verification_reporting_engine';
}

export function getVerificationReportingDiagnostics(): VerificationReportingDiagnostics {
  return { ...diagnostics };
}

export function updateVerificationReportingDiagnostics(
  query: string,
  state: ReportingAuthorityState,
  authorityId: string,
  reportCount: number,
  reportTypeCount: number,
  historyEntryCount: number,
  trendMetricCount: number,
  validationIssueCount: number,
): void {
  diagnostics.reportingAuthorityActive = true;
  diagnostics.lastQuery = query;
  diagnostics.lastState = state;
  diagnostics.authorityId = authorityId;
  diagnostics.reportCount = reportCount;
  diagnostics.reportTypeCount = reportTypeCount;
  diagnostics.historyEntryCount = historyEntryCount;
  diagnostics.trendMetricCount = trendMetricCount;
  diagnostics.validationIssueCount = validationIssueCount;
}

export function resetVerificationReportingDiagnostics(): void {
  diagnostics.reportingAuthorityActive = false;
  diagnostics.authorityId = null;
  diagnostics.reportCount = 0;
  diagnostics.reportTypeCount = 0;
  diagnostics.historyEntryCount = 0;
  diagnostics.trendMetricCount = 0;
  diagnostics.validationIssueCount = 0;
  diagnostics.lastQuery = null;
  diagnostics.lastState = null;
}
