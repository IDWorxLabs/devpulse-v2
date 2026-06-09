/**
 * DevPulse V2 Phase 16.11 — Verification Reporting Engine types.
 * Reporting authority only — no verification execution, trust decisions, or auto-fix.
 */

export const VERIFICATION_REPORTING_ENGINE_PASS_TOKEN = 'VERIFICATION_REPORTING_ENGINE_V1_PASS';
export const VERIFICATION_REPORTING_ENGINE_OWNER_MODULE =
  'devpulse_v2_verification_reporting_engine';

export const INITIAL_REPORT_TYPES = [
  'VERIFICATION_SUMMARY_REPORT',
  'VERIFICATION_FAILURE_REPORT',
  'VERIFICATION_EVIDENCE_REPORT',
  'VERIFICATION_SESSION_REPORT',
  'VERIFICATION_HISTORY_REPORT',
  'VERIFICATION_TREND_REPORT',
  'WORLD2_VERIFICATION_REPORT',
  'COMPLETION_VERIFICATION_REPORT',
  'FOUNDER_VERIFICATION_REPORT',
  'UVL_VERIFICATION_REPORT',
] as const;

export type ReportType = (typeof INITIAL_REPORT_TYPES)[number] | string;

export type ReportStatus = 'DRAFT' | 'READY' | 'BLOCKED' | 'INVALID';

export type ReportVisibility = 'PRIVATE' | 'PROJECT' | 'WORKSPACE' | 'PUBLIC';

export type ReportingAuthorityState = 'REGISTERED' | 'READY' | 'BLOCKED' | 'INVALID';

export const FORBIDDEN_VERIFICATION_REPORTING_DUPLICATES = [
  'auto_fix_engine',
  'trust_engine_decision',
  'uvl_monolith',
  'runtime_brain',
  'reporting_monolith',
] as const;

export const VERIFICATION_REPORTING_QUESTION_SIGNALS = [
  'what happened in verification',
  'what was verified',
  'what failed verification',
  'what evidence is missing',
  'verification reporting',
  'verification reports',
  'verification history',
  'verification trends',
  'verification summary',
  'verification failures report',
  'verification evidence report',
  'founder verification report',
  'verification report export',
  'reporting engine',
  'verification report generated',
  'verification report blocked',
  'why is reporting blocked',
] as const;

export interface ReportOwnership {
  ownerModule: string;
  ownerDomain: string;
  generatedBy: string;
  verificationSession?: string;
  orchestrationId?: string;
  projectId: string;
  workspaceId: string;
  generatedAt: number;
}

export interface VerificationReport {
  reportId: string;
  reportType: ReportType;
  reportOwner: ReportOwnership;
  reportTimestamp: number;
  reportSession?: string;
  reportScope: string;
  reportStatus: ReportStatus;
  reportSummary: string;
  reportFindings: string[];
  reportEvidence: string[];
  reportRisks: string[];
  reportRecommendations: string[];
  reportMetadata: Record<string, string | number | boolean>;
  reportVisibility: ReportVisibility;
  reportReferences: string[];
  reportingOnly: true;
}

export interface ReportValidationIssue {
  code: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  reportId?: string;
}

export interface ReportValidationResult {
  valid: boolean;
  issues: ReportValidationIssue[];
  warnings: string[];
}

export interface ReportHistoryEntry {
  entryId: string;
  reportId: string;
  reportType: ReportType;
  event: 'CREATED' | 'UPDATED' | 'VALIDATED' | 'EXPORTED';
  timestamp: number;
  sessionId?: string;
  outcome?: string;
}

export interface VerificationReportingDiagnostics {
  reportingAuthorityActive: boolean;
  authorityId: string | null;
  reportCount: number;
  reportTypeCount: number;
  historyEntryCount: number;
  trendMetricCount: number;
  validationIssueCount: number;
  lastQuery: string | null;
  lastState: ReportingAuthorityState | null;
}

export interface PrepareVerificationReportingInput {
  query?: string;
  projectId?: string;
  workspaceId?: string;
  projectExists?: boolean;
  workspaceExists?: boolean;
  world1Protected?: boolean;
  ownershipValid?: boolean;
  suppressRuntimeBootstrap?: boolean;
}

export interface PrepareVerificationReportingResult {
  reportingAuthorityId: string;
  authorityState: ReportingAuthorityState;
  diagnostics: VerificationReportingDiagnostics;
  reports: VerificationReport[];
  summaryReport: VerificationReport | null;
  historyEntries: ReportHistoryEntry[];
  validationResult: ReportValidationResult;
  exports: {
    json: string;
    founder: string;
    uvl: string;
    world2: string;
  };
  responseText: string;
}

export function isVerificationReportingQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  return VERIFICATION_REPORTING_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isVerificationReportingAdvisoryQuestion(question: string): boolean {
  return isVerificationReportingQuestion(question);
}

export function isDuplicateVerificationReportingQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return FORBIDDEN_VERIFICATION_REPORTING_DUPLICATES.some((d) => lower.includes(d));
}
