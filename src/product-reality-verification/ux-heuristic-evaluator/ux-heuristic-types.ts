/**
 * UX Heuristic Evaluator — types and models.
 * Read-only product experience evaluation. No UI modification or execution.
 */

export const UX_HEURISTIC_EVALUATOR_PASS_TOKEN = 'UX_HEURISTIC_EVALUATOR_V1_PASS';
export const UX_HEURISTIC_EVALUATOR_PASS = 'UX_HEURISTIC_EVALUATOR_PASS';
export const UX_HEURISTIC_EVALUATOR_OWNER_MODULE = 'devpulse_v2_ux_heuristic_evaluator';
export const DEFAULT_MAX_UX_HEURISTIC_HISTORY_SIZE = 128;

export const NAVIGATION_CLARITY_PASS = 'NAVIGATION_CLARITY_PASS';
export const FEATURE_DISCOVERABILITY_PASS = 'FEATURE_DISCOVERABILITY_PASS';
export const ACTION_CLARITY_PASS = 'ACTION_CLARITY_PASS';
export const FEEDBACK_QUALITY_PASS = 'FEEDBACK_QUALITY_PASS';
export const SYSTEM_STATUS_VISIBILITY_PASS = 'SYSTEM_STATUS_VISIBILITY_PASS';
export const ERROR_PREVENTION_PASS = 'ERROR_PREVENTION_PASS';
export const USER_CONTROL_PASS = 'USER_CONTROL_PASS';
export const COGNITIVE_LOAD_PASS = 'COGNITIVE_LOAD_PASS';
export const TRUST_CLARITY_PASS = 'TRUST_CLARITY_PASS';
export const WORKFLOW_CONTINUITY_PASS = 'WORKFLOW_CONTINUITY_PASS';
export const INTELLIGENCE_VISIBILITY_PASS = 'INTELLIGENCE_VISIBILITY_PASS';
export const FOUNDER_USABILITY_PASS = 'FOUNDER_USABILITY_PASS';
export const UX_HEURISTIC_REPORTING_PASS = 'REPORTING_PASS';

export type UXHeuristicResult = 'PASS' | 'PASS_WITH_WARNINGS' | 'FAIL';

export interface UXHeuristicRecord {
  uxHeuristicId: string;
  projectId: string;
  workspaceId: string;
  overallScore: number;
  uxHeuristicResult: UXHeuristicResult;
  confidence: number;
  generatedAt: number;
}

export interface NavigationClarityAnalysis {
  navigationClarityScore: number;
  navigationConfusion: boolean;
  unclearProductArea: boolean;
  missingLocationContext: boolean;
  navigationProblems: string[];
  passToken: typeof NAVIGATION_CLARITY_PASS;
}

export interface FeatureDiscoverabilityAnalysis {
  featureDiscoverabilityScore: number;
  featureHidden: boolean;
  featureDiscoverabilityRisk: boolean;
  unlabeledCapability: boolean;
  hiddenFeatures: string[];
  discoverabilityProblems: string[];
  passToken: typeof FEATURE_DISCOVERABILITY_PASS;
}

export interface ActionClarityAnalysis {
  actionClarityScore: number;
  unclearAction: boolean;
  ambiguousButton: boolean;
  primaryActionHidden: boolean;
  actionProblems: string[];
  passToken: typeof ACTION_CLARITY_PASS;
}

export interface FeedbackQualityAnalysis {
  feedbackQualityScore: number;
  missingFeedback: boolean;
  weakProgressFeedback: boolean;
  actionResultUnclear: boolean;
  feedbackProblems: string[];
  passToken: typeof FEEDBACK_QUALITY_PASS;
}

export interface SystemStatusVisibilityAnalysis {
  systemStatusVisibilityScore: number;
  statusHidden: boolean;
  statusMisleading: boolean;
  readinessConfusion: boolean;
  statusProblems: string[];
  passToken: typeof SYSTEM_STATUS_VISIBILITY_PASS;
}

export interface ErrorPreventionAnalysis {
  errorPreventionScore: number;
  errorPreventionRisk: boolean;
  destructiveActionRisk: boolean;
  recoveryPathUnclear: boolean;
  errorPreventionProblems: string[];
  passToken: typeof ERROR_PREVENTION_PASS;
}

export interface UserControlAnalysis {
  userControlScore: number;
  userControlWeakness: boolean;
  noClearEscapePath: boolean;
  controlVisibilityRisk: boolean;
  controlProblems: string[];
  passToken: typeof USER_CONTROL_PASS;
}

export interface CognitiveLoadAnalysis {
  cognitiveLoadScore: number;
  cognitiveOverload: boolean;
  technicalLanguageRisk: boolean;
  uxNoise: boolean;
  cognitiveProblems: string[];
  passToken: typeof COGNITIVE_LOAD_PASS;
}

export interface TrustClarityAnalysis {
  trustClarityScore: number;
  trustGap: boolean;
  unsupportedConfidence: boolean;
  completionClarityRisk: boolean;
  trustProblems: string[];
  passToken: typeof TRUST_CLARITY_PASS;
}

export interface WorkflowContinuityAnalysis {
  workflowContinuityScore: number;
  workflowBreak: boolean;
  nextStepUnclear: boolean;
  contextLoss: boolean;
  workflowProblems: string[];
  passToken: typeof WORKFLOW_CONTINUITY_PASS;
}

export interface IntelligenceVisibilityAnalysis {
  intelligenceVisibilityScore: number;
  intelligenceHidden: boolean;
  reasoningNotVisible: boolean;
  smartSystemFeelsStatic: boolean;
  intelligenceProblems: string[];
  passToken: typeof INTELLIGENCE_VISIBILITY_PASS;
}

export interface FounderUsabilityAnalysis {
  founderUsabilityScore: number;
  founderUsabilityRisk: boolean;
  founderConfusionRisk: boolean;
  founderTrustRisk: boolean;
  founderProblems: string[];
  passToken: typeof FOUNDER_USABILITY_PASS;
}

export interface UXHeuristicAuthority {
  authorityId: string;
  overallScore: number;
  navigationClarityScore: number;
  featureDiscoverabilityScore: number;
  actionClarityScore: number;
  feedbackQualityScore: number;
  systemStatusVisibilityScore: number;
  errorPreventionScore: number;
  userControlScore: number;
  cognitiveLoadScore: number;
  trustClarityScore: number;
  workflowContinuityScore: number;
  intelligenceVisibilityScore: number;
  founderUsabilityScore: number;
  uxHeuristicResult: UXHeuristicResult;
  confidence: number;
  createdAt: number;
}

export interface UXHeuristicEvaluation {
  overallScore: number;
  uxHeuristicResult: UXHeuristicResult;
  confidence: number;
  founderAcceptanceReadiness: number;
  navigationClarityScore: number;
  featureDiscoverabilityScore: number;
  actionClarityScore: number;
  feedbackQualityScore: number;
  systemStatusVisibilityScore: number;
  errorPreventionScore: number;
  userControlScore: number;
  cognitiveLoadScore: number;
  trustClarityScore: number;
  workflowContinuityScore: number;
  intelligenceVisibilityScore: number;
  founderUsabilityScore: number;
}

export interface UXHeuristicHistoryEntry {
  uxHeuristicId: string;
  overallScore: number;
  uxHeuristicResult: UXHeuristicResult;
  recordedAt: number;
}

export interface UXHeuristicReport {
  overallScore: number;
  navigationClarityScore: number;
  featureDiscoverabilityScore: number;
  actionClarityScore: number;
  feedbackQualityScore: number;
  systemStatusVisibilityScore: number;
  errorPreventionScore: number;
  userControlScore: number;
  cognitiveLoadScore: number;
  trustClarityScore: number;
  workflowContinuityScore: number;
  intelligenceVisibilityScore: number;
  founderUsabilityScore: number;
  uxHeuristicResult: UXHeuristicResult;
  detectedUxProblems: string[];
  founderFrictionRisks: string[];
  trustRisks: string[];
  hiddenIntelligenceRisks: string[];
  recommendedPriorityFixes: string[];
  founderAcceptanceNotes: string[];
  evaluation: UXHeuristicEvaluation;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
  passToken: typeof UX_HEURISTIC_REPORTING_PASS;
}

export interface UXHeuristicInput {
  requestId: string;
  projectId?: string;
  workspaceId?: string;
  navigationConfusion?: boolean;
  unclearProductArea?: boolean;
  missingLocationContext?: boolean;
  hiddenFeatures?: string[];
  featureHidden?: boolean;
  featureDiscoverabilityRisk?: boolean;
  unlabeledCapability?: boolean;
  unclearAction?: boolean;
  ambiguousButton?: boolean;
  primaryActionHidden?: boolean;
  missingFeedback?: boolean;
  weakProgressFeedback?: boolean;
  actionResultUnclear?: boolean;
  statusHidden?: boolean;
  statusMisleading?: boolean;
  readinessConfusion?: boolean;
  errorPreventionRisk?: boolean;
  destructiveActionRisk?: boolean;
  recoveryPathUnclear?: boolean;
  userControlWeakness?: boolean;
  noClearEscapePath?: boolean;
  controlVisibilityRisk?: boolean;
  cognitiveOverload?: boolean;
  technicalLanguageRisk?: boolean;
  uxNoise?: boolean;
  trustGap?: boolean;
  unsupportedConfidence?: boolean;
  completionClarityRisk?: boolean;
  workflowBreak?: boolean;
  nextStepUnclear?: boolean;
  contextLoss?: boolean;
  intelligenceHidden?: boolean;
  reasoningNotVisible?: boolean;
  smartSystemFeelsStatic?: boolean;
  founderUsabilityRisk?: boolean;
  founderConfusionRisk?: boolean;
  founderTrustRisk?: boolean;
  governanceBlocked?: boolean;
}

export interface UXHeuristicResultBundle {
  record: UXHeuristicRecord;
  report: UXHeuristicReport;
}

export interface UXHeuristicRuntimeReport {
  navigationAnalysisCount: number;
  discoverabilityAnalysisCount: number;
  actionClarityAnalysisCount: number;
  feedbackAnalysisCount: number;
  statusVisibilityAnalysisCount: number;
  errorPreventionAnalysisCount: number;
  userControlAnalysisCount: number;
  cognitiveLoadAnalysisCount: number;
  trustClarityAnalysisCount: number;
  workflowContinuityAnalysisCount: number;
  intelligenceVisibilityAnalysisCount: number;
  founderUsabilityAnalysisCount: number;
  authorityBuildCount: number;
  evaluationCount: number;
  recordCount: number;
  cacheHits: number;
  cacheMisses: number;
  cacheEvictions: number;
  bootstrapReuseCount: number;
  sourceTextCacheHits: number;
}

export const UX_HEURISTIC_QUESTION_SIGNALS = [
  'ux heuristic',
  'usability',
  'user experience',
  'founder usability',
  'feature discoverability',
  'navigation clarity',
  'intelligence visibility',
  'workflow continuity',
] as const;

export function isUXHeuristicQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return UX_HEURISTIC_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function resolveUXHeuristicResult(
  overallScore: number,
  criticalFailures: number,
  warningCount: number,
  blocked?: boolean,
): UXHeuristicResult {
  if (blocked === true) return 'FAIL';
  if (criticalFailures > 0 || overallScore < 55) return 'FAIL';
  if (warningCount > 0 || overallScore < 80) return 'PASS_WITH_WARNINGS';
  return 'PASS';
}

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}
