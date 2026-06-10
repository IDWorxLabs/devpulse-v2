/**
 * Live Preview Gatekeeper — types and models.
 * Read-only preview verification. No UI, server, or browser automation.
 */

export const LIVE_PREVIEW_GATEKEEPER_PASS_TOKEN = 'LIVE_PREVIEW_GATEKEEPER_V1_PASS';
export const LIVE_PREVIEW_GATEKEEPER_PASS = 'LIVE_PREVIEW_GATEKEEPER_PASS';
export const LIVE_PREVIEW_GATEKEEPER_OWNER_MODULE = 'devpulse_v2_live_preview_gatekeeper';
export const DEFAULT_MAX_LIVE_PREVIEW_HISTORY_SIZE = 128;

export const PREVIEW_CONTEXT_PASS = 'PREVIEW_CONTEXT_PASS';
export const PREVIEW_VISIBILITY_PASS = 'PREVIEW_VISIBILITY_PASS';
export const PREVIEW_UNDERSTANDABILITY_PASS = 'PREVIEW_UNDERSTANDABILITY_PASS';
export const PREVIEW_STATE_MEANINGFULNESS_PASS = 'PREVIEW_STATE_MEANINGFULNESS_PASS';
export const FOUNDER_VERIFICATION_SUPPORT_PASS = 'FOUNDER_VERIFICATION_SUPPORT_PASS';
export const RESPONSIVE_PREVIEW_SUPPORT_PASS = 'RESPONSIVE_PREVIEW_SUPPORT_PASS';
export const PREVIEW_UNAVAILABLE_HONESTY_PASS = 'PREVIEW_UNAVAILABLE_HONESTY_PASS';
export const PREVIEW_MISLEADING_RISK_PASS = 'PREVIEW_MISLEADING_RISK_PASS';
export const PREVIEW_NEXT_ACTION_PASS = 'PREVIEW_NEXT_ACTION_PASS';
export const PREVIEW_REPORT_CONNECTION_PASS = 'PREVIEW_REPORT_CONNECTION_PASS';
export const PRODUCT_READINESS_PREVIEW_PASS = 'PRODUCT_READINESS_PREVIEW_PASS';
export const LIVE_PREVIEW_REPORTING_PASS = 'REPORTING_PASS';

export type LivePreviewResult = 'PASS' | 'PASS_WITH_WARNINGS' | 'FAIL';

export type PreviewContextType =
  | 'DESKTOP_PREVIEW_REVIEW'
  | 'MOBILE_PREVIEW_REVIEW'
  | 'TABLET_PREVIEW_REVIEW'
  | 'FOUNDER_ACCEPTANCE_REVIEW'
  | 'UVL_REPORT_REVIEW'
  | 'WORLD2_PREVIEW_REVIEW'
  | 'PROJECT_BUILD_PREVIEW_REVIEW';

export interface PreviewContext {
  contextType: PreviewContextType;
  previewIntent: string;
  expectedVisiblePreviewState: string;
  expectedUserAction: string;
  expectedReadinessSignal: string;
  likelyConfusionRisks: string[];
  fallbackExpectationWhenUnavailable: string;
  passToken: typeof PREVIEW_CONTEXT_PASS;
}

export interface LivePreviewRecord {
  livePreviewId: string;
  projectId: string;
  workspaceId: string;
  contextType: PreviewContextType;
  overallScore: number;
  livePreviewResult: LivePreviewResult;
  confidence: number;
  generatedAt: number;
}

export interface PreviewVisibilityAnalysis {
  previewVisibilityScore: number;
  previewEntryHidden: boolean;
  previewStateHidden: boolean;
  previewResultHidden: boolean;
  visibilityProblems: string[];
  passToken: typeof PREVIEW_VISIBILITY_PASS;
}

export interface PreviewUnderstandabilityAnalysis {
  previewUnderstandabilityScore: number;
  previewContextUnclear: boolean;
  previewLimitationUnclear: boolean;
  previewFreshnessUnclear: boolean;
  understandabilityProblems: string[];
  passToken: typeof PREVIEW_UNDERSTANDABILITY_PASS;
}

export interface PreviewStateMeaningfulnessAnalysis {
  previewMeaningfulnessScore: number;
  previewNotMeaningful: boolean;
  previewPlaceholderRisk: boolean;
  previewNotRepresentative: boolean;
  meaningfulnessProblems: string[];
  passToken: typeof PREVIEW_STATE_MEANINGFULNESS_PASS;
}

export interface FounderVerificationSupportAnalysis {
  founderVerificationSupportScore: number;
  founderPreviewValueWeak: boolean;
  founderVerificationBlocked: boolean;
  founderNextStepFromPreviewUnclear: boolean;
  founderVerificationProblems: string[];
  passToken: typeof FOUNDER_VERIFICATION_SUPPORT_PASS;
}

export interface ResponsivePreviewSupportAnalysis {
  responsivePreviewSupportScore: number;
  responsivePreviewWeak: boolean;
  mobilePreviewUnusable: boolean;
  viewportSwitchingUnclear: boolean;
  responsiveProblems: string[];
  passToken: typeof RESPONSIVE_PREVIEW_SUPPORT_PASS;
}

export interface PreviewUnavailableHonestyAnalysis {
  previewUnavailableHonestyScore: number;
  previewUnavailableHidden: boolean;
  previewFalseReady: boolean;
  previewFailureReasonMissing: boolean;
  unavailableHonestyProblems: string[];
  passToken: typeof PREVIEW_UNAVAILABLE_HONESTY_PASS;
}

export interface PreviewMisleadingRiskAnalysis {
  misleadingRiskScore: number;
  previewStaleRisk: boolean;
  previewFalseConfidence: boolean;
  previewCompletionMisleading: boolean;
  misleadingProblems: string[];
  passToken: typeof PREVIEW_MISLEADING_RISK_PASS;
}

export interface PreviewNextActionAnalysis {
  previewNextActionScore: number;
  previewNextActionMissing: boolean;
  previewToVerificationGap: boolean;
  previewToFixGap: boolean;
  nextActionProblems: string[];
  passToken: typeof PREVIEW_NEXT_ACTION_PASS;
}

export interface PreviewReportConnectionAnalysis {
  previewReportConnectionScore: number;
  previewReportDisconnected: boolean;
  previewEvidenceNotTraceable: boolean;
  reportConnectionProblems: string[];
  passToken: typeof PREVIEW_REPORT_CONNECTION_PASS;
}

export interface ProductReadinessPreviewAnalysis {
  productReadinessPreviewScore: number;
  previewReadinessWeak: boolean;
  previewLaunchSignalMissing: boolean;
  readinessProblems: string[];
  passToken: typeof PRODUCT_READINESS_PREVIEW_PASS;
}

export interface LivePreviewAuthority {
  authorityId: string;
  overallScore: number;
  previewVisibilityScore: number;
  previewUnderstandabilityScore: number;
  previewMeaningfulnessScore: number;
  founderVerificationSupportScore: number;
  responsivePreviewSupportScore: number;
  previewUnavailableHonestyScore: number;
  misleadingRiskScore: number;
  previewNextActionScore: number;
  previewReportConnectionScore: number;
  productReadinessPreviewScore: number;
  livePreviewResult: LivePreviewResult;
  confidence: number;
  createdAt: number;
}

export interface LivePreviewEvaluation {
  overallScore: number;
  livePreviewResult: LivePreviewResult;
  confidence: number;
  readinessVerdict: string;
  previewVisibilityScore: number;
  previewUnderstandabilityScore: number;
  previewMeaningfulnessScore: number;
  founderVerificationSupportScore: number;
  responsivePreviewSupportScore: number;
  previewUnavailableHonestyScore: number;
  misleadingRiskScore: number;
  previewNextActionScore: number;
  previewReportConnectionScore: number;
  productReadinessPreviewScore: number;
}

export interface LivePreviewHistoryEntry {
  livePreviewId: string;
  overallScore: number;
  livePreviewResult: LivePreviewResult;
  recordedAt: number;
}

export interface LivePreviewReport {
  overallScore: number;
  previewVisibilityScore: number;
  previewUnderstandabilityScore: number;
  previewMeaningfulnessScore: number;
  founderVerificationSupportScore: number;
  responsivePreviewSupportScore: number;
  previewUnavailableHonestyScore: number;
  misleadingRiskScore: number;
  previewNextActionScore: number;
  previewReportConnectionScore: number;
  productReadinessPreviewScore: number;
  livePreviewResult: LivePreviewResult;
  previewContextRisks: string[];
  founderPreviewRisks: string[];
  responsivePreviewRisks: string[];
  misleadingPreviewRisks: string[];
  readinessGaps: string[];
  recommendedPriorityFixes: string[];
  evaluation: LivePreviewEvaluation;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
  passToken: typeof LIVE_PREVIEW_REPORTING_PASS;
}

export interface LivePreviewInput {
  requestId: string;
  projectId?: string;
  workspaceId?: string;
  contextType?: PreviewContextType;
  previewEntryHidden?: boolean;
  previewStateHidden?: boolean;
  previewResultHidden?: boolean;
  previewContextUnclear?: boolean;
  previewLimitationUnclear?: boolean;
  previewFreshnessUnclear?: boolean;
  previewNotMeaningful?: boolean;
  previewPlaceholderRisk?: boolean;
  previewNotRepresentative?: boolean;
  founderPreviewValueWeak?: boolean;
  founderVerificationBlocked?: boolean;
  founderNextStepFromPreviewUnclear?: boolean;
  responsivePreviewWeak?: boolean;
  mobilePreviewUnusable?: boolean;
  viewportSwitchingUnclear?: boolean;
  previewUnavailableHidden?: boolean;
  previewFalseReady?: boolean;
  previewFailureReasonMissing?: boolean;
  previewStaleRisk?: boolean;
  previewFalseConfidence?: boolean;
  previewCompletionMisleading?: boolean;
  previewNextActionMissing?: boolean;
  previewToVerificationGap?: boolean;
  previewToFixGap?: boolean;
  previewReportDisconnected?: boolean;
  previewEvidenceNotTraceable?: boolean;
  previewReadinessWeak?: boolean;
  previewLaunchSignalMissing?: boolean;
  governanceBlocked?: boolean;
}

export interface LivePreviewResultBundle {
  record: LivePreviewRecord;
  report: LivePreviewReport;
  context: PreviewContext;
}

export interface LivePreviewRuntimeReport {
  contextBuildCount: number;
  previewVisibilityAnalysisCount: number;
  previewUnderstandabilityAnalysisCount: number;
  previewMeaningfulnessAnalysisCount: number;
  founderVerificationAnalysisCount: number;
  responsivePreviewAnalysisCount: number;
  unavailableHonestyAnalysisCount: number;
  misleadingRiskAnalysisCount: number;
  previewNextActionAnalysisCount: number;
  reportConnectionAnalysisCount: number;
  productReadinessAnalysisCount: number;
  authorityBuildCount: number;
  evaluationCount: number;
  recordCount: number;
  cacheHits: number;
  cacheMisses: number;
  cacheEvictions: number;
  bootstrapReuseCount: number;
  sourceTextCacheHits: number;
}

export const LIVE_PREVIEW_QUESTION_SIGNALS = [
  'live preview',
  'preview gatekeeper',
  'preview verification',
  'preview unavailable',
  'preview blocked',
  'preview readiness',
  'founder preview',
] as const;

export function isLivePreviewGatekeeperQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return LIVE_PREVIEW_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function resolveLivePreviewResult(
  overallScore: number,
  criticalFailures: number,
  warningCount: number,
  blocked?: boolean,
): LivePreviewResult {
  if (blocked === true) return 'FAIL';
  if (criticalFailures > 0 || overallScore < 55) return 'FAIL';
  if (warningCount > 0 || overallScore < 80) return 'PASS_WITH_WARNINGS';
  return 'PASS';
}

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}
