/**
 * Founder Confidence Engine — types and models.
 * Read-only founder confidence validation. No UI, execution, or state mutation.
 */

export const FOUNDER_CONFIDENCE_ENGINE_PASS_TOKEN = 'FOUNDER_CONFIDENCE_ENGINE_V1_PASS';
export const FOUNDER_CONFIDENCE_ENGINE_PASS = 'FOUNDER_CONFIDENCE_ENGINE_PASS';
export const FOUNDER_CONFIDENCE_OWNER_MODULE = 'devpulse_v2_founder_confidence_engine';
export const DEFAULT_MAX_FOUNDER_CONFIDENCE_HISTORY_SIZE = 128;
export const MAX_CONFIDENCE_GAPS = 64;

export const CONFIDENCE_CONTEXT_PASS = 'CONFIDENCE_CONTEXT_PASS';
export const UNDERSTANDING_CONFIDENCE_PASS = 'UNDERSTANDING_CONFIDENCE_PASS';
export const REASONING_VISIBILITY_PASS = 'REASONING_VISIBILITY_PASS';
export const PROGRESS_TRUTH_PASS = 'PROGRESS_TRUTH_PASS';
export const NEXT_STEP_CONFIDENCE_PASS = 'NEXT_STEP_CONFIDENCE_PASS';
export const DECISION_CONFIDENCE_PASS = 'DECISION_CONFIDENCE_PASS';
export const UNCERTAINTY_HONESTY_PASS = 'UNCERTAINTY_HONESTY_PASS';
export const FOUNDER_CONTROL_CONFIDENCE_PASS = 'FOUNDER_CONTROL_CONFIDENCE_PASS';
export const CONFIDENCE_GAP_ANALYSIS_PASS = 'CONFIDENCE_GAP_ANALYSIS_PASS';
export const CONFIDENCE_ROADMAP_PASS = 'ROADMAP_PASS';
export const FOUNDER_CONFIDENCE_REPORTING_PASS = 'REPORTING_PASS';

export type FounderConfidenceResult = 'PASS' | 'PASS_WITH_WARNINGS' | 'FAIL';
export type ConfidenceGapSeverity = 'MINOR' | 'MAJOR' | 'CRITICAL';

export type ConfidenceContextId =
  | 'PROJECT_UNDERSTANDING_CONFIDENCE'
  | 'ACTION_REASONING_CONFIDENCE'
  | 'PROGRESS_TRUTH_CONFIDENCE'
  | 'NEXT_STEP_CONFIDENCE'
  | 'DECISION_CONFIDENCE'
  | 'UNCERTAINTY_CONFIDENCE'
  | 'CONTROL_CONFIDENCE';

export interface ConfidenceContext {
  contextId: ConfidenceContextId;
  contextName: string;
  confidenceIntent: string;
  expectedFounderSignal: string;
  requiredEvidence: string[];
  passToken: typeof CONFIDENCE_CONTEXT_PASS;
}

export interface ConfidenceGap {
  gapId: string;
  title: string;
  description: string;
  severity: ConfidenceGapSeverity;
  detectionCode: string;
  sourceValidator: string;
  confidenceContext?: ConfidenceContextId;
}

export interface ConfidenceValidatorResult {
  validatorType: string;
  score: number;
  detectionCodes: string[];
  gaps: ConfidenceGap[];
  passToken: string;
}

export interface UnderstandingConfidenceValidation extends ConfidenceValidatorResult {
  passToken: typeof UNDERSTANDING_CONFIDENCE_PASS;
}

export interface ReasoningVisibilityValidation extends ConfidenceValidatorResult {
  passToken: typeof REASONING_VISIBILITY_PASS;
}

export interface ProgressTruthValidation extends ConfidenceValidatorResult {
  passToken: typeof PROGRESS_TRUTH_PASS;
}

export interface NextStepConfidenceValidation extends ConfidenceValidatorResult {
  passToken: typeof NEXT_STEP_CONFIDENCE_PASS;
}

export interface DecisionConfidenceValidation extends ConfidenceValidatorResult {
  passToken: typeof DECISION_CONFIDENCE_PASS;
}

export interface UncertaintyHonestyValidation extends ConfidenceValidatorResult {
  passToken: typeof UNCERTAINTY_HONESTY_PASS;
}

export interface FounderControlConfidenceValidation extends ConfidenceValidatorResult {
  passToken: typeof FOUNDER_CONTROL_CONFIDENCE_PASS;
}

export interface ConfidenceGapAnalysis {
  gaps: ConfidenceGap[];
  criticalConfidenceGaps: ConfidenceGap[];
  majorConfidenceGaps: ConfidenceGap[];
  minorConfidenceGaps: ConfidenceGap[];
  passToken: typeof CONFIDENCE_GAP_ANALYSIS_PASS;
}

export interface FounderConfidenceRoadmap {
  criticalConfidenceFixes: ConfidenceGap[];
  highPriorityImprovements: ConfidenceGap[];
  mediumImprovements: ConfidenceGap[];
  futureConfidenceOptimization: ConfidenceGap[];
  passToken: typeof CONFIDENCE_ROADMAP_PASS;
}

export interface FounderConfidenceAuthority {
  authorityId: string;
  contexts: ConfidenceContext[];
  understandingConfidence: UnderstandingConfidenceValidation;
  reasoningVisibility: ReasoningVisibilityValidation;
  progressTruth: ProgressTruthValidation;
  nextStepConfidence: NextStepConfidenceValidation;
  decisionConfidence: DecisionConfidenceValidation;
  uncertaintyHonesty: UncertaintyHonestyValidation;
  founderControlConfidence: FounderControlConfidenceValidation;
  gapAnalysis: ConfidenceGapAnalysis;
  roadmap: FounderConfidenceRoadmap;
  founderConfidenceScore: number;
  founderConfidenceResult: FounderConfidenceResult;
  confidence: number;
  createdAt: number;
}

export interface FounderConfidenceScore {
  overallScore: number;
  understandingConfidenceScore: number;
  reasoningVisibilityScore: number;
  progressTruthScore: number;
  nextStepConfidenceScore: number;
  decisionConfidenceScore: number;
  uncertaintyHonestyScore: number;
  founderControlConfidenceScore: number;
}

export interface FounderConfidenceRecord {
  founderConfidenceId: string;
  projectId: string;
  workspaceId: string;
  overallScore: number;
  founderConfidenceResult: FounderConfidenceResult;
  totalGaps: number;
  criticalGaps: number;
  confidence: number;
  generatedAt: number;
}

export interface FounderConfidenceEvaluation {
  overallScore: number;
  founderConfidenceResult: FounderConfidenceResult;
  confidence: number;
  confidenceVerdict: string;
  scores: FounderConfidenceScore;
  totalGaps: number;
  criticalGaps: number;
}

export interface FounderConfidenceReport {
  founderConfidenceScore: number;
  founderConfidenceResult: FounderConfidenceResult;
  understandingConfidenceScore: number;
  reasoningVisibilityScore: number;
  progressTruthScore: number;
  nextStepConfidenceScore: number;
  decisionConfidenceScore: number;
  uncertaintyHonestyScore: number;
  founderControlConfidenceScore: number;
  detectedConfidenceGaps: ConfidenceGap[];
  criticalConfidenceGaps: ConfidenceGap[];
  majorConfidenceGaps: ConfidenceGap[];
  minorConfidenceGaps: ConfidenceGap[];
  founderConfidenceRoadmap: FounderConfidenceRoadmap;
  recommendedPriorityFixes: string[];
  evaluation: FounderConfidenceEvaluation;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
  passToken: typeof FOUNDER_CONFIDENCE_REPORTING_PASS;
}

export interface FounderConfidenceEngineInput {
  requestId: string;
  projectId?: string;
  workspaceId?: string;
  understandingWeak?: boolean;
  reasoningHidden?: boolean;
  progressInflated?: boolean;
  nextStepUnclear?: boolean;
  decisionUnsupported?: boolean;
  uncertaintyHidden?: boolean;
  controlBoundaryWeak?: boolean;
  vagueAuthorityClaims?: boolean;
  unsupportedPassClaims?: boolean;
  missingEvidence?: boolean;
  governanceBlocked?: boolean;
}

export interface FounderConfidenceResultBundle {
  record: FounderConfidenceRecord;
  report: FounderConfidenceReport;
  authority: FounderConfidenceAuthority;
  result: FounderConfidenceResult;
  score: FounderConfidenceScore;
}

export interface FounderConfidenceRuntimeReport {
  contextBuildCount: number;
  understandingValidateCount: number;
  reasoningValidateCount: number;
  progressTruthValidateCount: number;
  nextStepValidateCount: number;
  decisionValidateCount: number;
  uncertaintyValidateCount: number;
  controlValidateCount: number;
  gapAnalysisCount: number;
  roadmapBuildCount: number;
  authorityBuildCount: number;
  evaluationCount: number;
  reportCount: number;
  recordCount: number;
  cacheHits: number;
  cacheMisses: number;
  cacheEvictions: number;
  bootstrapReuseCount: number;
  sourceTextCacheHits: number;
}

export const FOUNDER_CONFIDENCE_QUESTION_SIGNALS = [
  'founder confidence',
  'confidence engine',
  'progress truth',
  'reasoning visibility',
  'trust progress',
  'understanding confidence',
] as const;

export function isFounderConfidenceQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return FOUNDER_CONFIDENCE_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function resolveFounderConfidenceResult(
  overallScore: number,
  criticalGaps: number,
  warningCount: number,
  blocked?: boolean,
): FounderConfidenceResult {
  if (blocked === true) return 'FAIL';
  if (criticalGaps > 0 || overallScore < 55) return 'FAIL';
  if (warningCount > 0 || overallScore < 80) return 'PASS_WITH_WARNINGS';
  return 'PASS';
}

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}
