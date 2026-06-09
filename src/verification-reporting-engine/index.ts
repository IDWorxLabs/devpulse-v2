/**
 * DevPulse V2 Phase 16.11 — Verification Reporting Engine public API.
 */

export {
  VERIFICATION_REPORTING_ENGINE_PASS_TOKEN,
  VERIFICATION_REPORTING_ENGINE_OWNER_MODULE,
  VERIFICATION_REPORTING_QUESTION_SIGNALS,
  FORBIDDEN_VERIFICATION_REPORTING_DUPLICATES,
  INITIAL_REPORT_TYPES,
  isVerificationReportingQuestion,
  isVerificationReportingAdvisoryQuestion,
  isDuplicateVerificationReportingQuestion,
  type ReportType,
  type ReportStatus,
  type ReportVisibility,
  type ReportingAuthorityState,
  type ReportOwnership,
  type VerificationReport,
  type ReportValidationIssue,
  type ReportValidationResult,
  type ReportHistoryEntry,
  type VerificationReportingDiagnostics,
  type PrepareVerificationReportingInput,
  type PrepareVerificationReportingResult,
} from './verification-report-types.js';

export {
  registerReport,
  getReport,
  listReports,
  listReportsBySession,
  listReportsByProject,
  listReportsByWorkspace,
  listReportsByType,
  updateReport,
  nextReportId,
  listRegisteredReportTypes,
  resetVerificationReportStoreForTests,
  type RegisterReportResult,
} from './verification-report-store.js';

export { buildVerificationSummaryReport } from './verification-summary-builder.js';
export { buildFailureReport } from './verification-failure-report-builder.js';
export { buildEvidenceReport } from './verification-evidence-report-builder.js';
export { buildSessionReport } from './verification-session-report-builder.js';
export {
  buildHistoryReport,
  recordReportHistory,
  listReportHistory,
  resetVerificationHistoryForTests,
} from './verification-history-report-builder.js';
export {
  buildTrendReport,
  computeTrendMetrics,
  type TrendMetrics,
} from './verification-trend-report-builder.js';

export {
  queryReports,
  countReportsByType,
  type ReportQueryCriteria,
} from './verification-report-query.js';

export {
  getVerificationReportingDiagnostics,
  updateVerificationReportingDiagnostics,
  resetVerificationReportingDiagnostics,
  verificationReportingEngineKey,
} from './verification-report-diagnostics.js';

export {
  validateReportIntegrity,
  evaluateReportingGates,
  validateVerificationReporting,
  type ReportGateReport,
} from './verification-report-validator.js';

export {
  exportReportsAsJson,
  exportFounderReport,
  exportUvlReport,
  exportWorld2Report,
  buildReportExportBundle,
  type ReportExportBundle,
} from './verification-report-export.js';

export {
  prepareVerificationReporting,
  processVerificationReportingRequest,
  getVerificationReportingContext,
  composeVerificationReportingResponse,
  buildVerificationReportingFailureContext,
  nextReportingAuthorityId,
  resetVerificationReportingAuthorityCounterForTests,
  type VerificationReportingFailureContext,
} from './verification-report-builder.js';

export function getDevPulseV2VerificationReportingEngine(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_verification_reporting_engine',
    passToken: 'VERIFICATION_REPORTING_ENGINE_V1_PASS',
    phase: 16.11,
    extensionOnly: true,
  };
}
