/**
 * Completion Truth Engine — types and models.
 */

export const COMPLETION_TRUTH_ENGINE_PASS_TOKEN = 'COMPLETION_TRUTH_ENGINE_V1_PASS';
export const COMPLETION_TRUTH_ENGINE_OWNER_MODULE = 'devpulse_v2_completion_truth_engine';
export const DEFAULT_MAX_COMPLETION_TRUTH_HISTORY_SIZE = 128;

export type CompletionTruthState =
  | 'UNKNOWN'
  | 'INCOMPLETE'
  | 'PARTIALLY_COMPLETE'
  | 'SUBSTANTIALLY_COMPLETE'
  | 'COMPLETE'
  | 'FALSE_COMPLETION'
  | 'CONTRADICTED';

export type CompletionTruthDecision =
  | 'NOT_COMPLETE'
  | 'NEEDS_VERIFICATION'
  | 'NEEDS_EVIDENCE'
  | 'NEEDS_REALITY_VALIDATION'
  | 'COMPLETE'
  | 'FALSE_COMPLETION_DETECTED'
  | 'BLOCKED';

export type CompletionClaimType =
  | 'build_completed'
  | 'verification_completed'
  | 'project_completed'
  | 'feature_completed'
  | 'fix_completed';

export type FalseCompletionState = 'FALSE_COMPLETION' | 'SUSPECT_COMPLETION' | 'VALID_COMPLETION';

export interface RawCompletionClaimInput {
  claimType: CompletionClaimType | string;
  projectId?: string;
  workspaceId?: string;
  reportedComplete?: boolean;
  strength?: number;
  coverage?: number;
  reliability?: number;
  blockersRemaining?: number;
}

export interface RawCompletionEvidenceInput {
  source?: string;
  strength?: number;
  quality?: number;
  agreement?: boolean;
  verified?: boolean;
}

export interface RawCompletionRealityInput {
  realityComplete?: boolean;
  verificationPresent?: boolean;
  evidencePresent?: boolean;
  trustPresent?: boolean;
  governanceApproved?: boolean;
  contradictions?: number;
}

export interface CompletionClaimAnalysis {
  claimType: CompletionClaimType;
  claimStrength: number;
  claimCoverage: number;
  claimReliability: number;
}

export interface CompletionEvidenceValidation {
  evidenceCoverageScore: number;
  evidenceQualityScore: number;
  evidenceAgreementScore: number;
}

export interface CompletionRealityValidation {
  realityCompletionScore: number;
  realityGaps: string[];
}

export interface FalseCompletionDetection {
  state: FalseCompletionState;
  riskScore: number;
  reasons: string[];
}

export interface CompletionConsistencyScores {
  consistencyScore: number;
  stabilityScore: number;
  agreementScore: number;
}

export interface CompletionGap {
  gapType: 'missing_evidence' | 'missing_verification' | 'missing_reality' | 'missing_trust' | 'missing_governance';
  description: string;
}

export interface UnifiedCompletionTruthAuthority {
  authorityId: string;
  truthState: CompletionTruthState;
  decision: CompletionTruthDecision;
  completionTruthScore: number;
  falseCompletionRisk: number;
  claimCount: number;
  gapCount: number;
  createdAt: number;
}

export interface CompletionTruthEvaluation {
  completionConfidence: number;
  completionTruthScore: number;
  completionReadiness: number;
  completionStability: number;
  truthState: CompletionTruthState;
  decision: CompletionTruthDecision;
}

export interface CompletionTruthRecord {
  recordId: string;
  authority: UnifiedCompletionTruthAuthority;
  evaluation: CompletionTruthEvaluation;
  claimAnalyses: CompletionClaimAnalysis[];
  evidenceValidation: CompletionEvidenceValidation;
  realityValidation: CompletionRealityValidation;
  falseCompletion: FalseCompletionDetection;
  consistency: CompletionConsistencyScores;
  gaps: CompletionGap[];
  createdAt: number;
}

export interface CompletionTruthHistoryEntry {
  recordId: string;
  truthState: CompletionTruthState;
  decision: CompletionTruthDecision;
  completionTruthScore: number;
  recordedAt: number;
}

export interface CompletionTruthReport {
  truthScore: number;
  confidence: number;
  falseCompletionRisk: number;
  missingProof: CompletionGap[];
  blockers: string[];
  recommendedAction: CompletionTruthDecision;
  evaluation: CompletionTruthEvaluation;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface CompletionTruthInput {
  requestId: string;
  projectId?: string;
  workspaceId?: string;
  completionClaims: RawCompletionClaimInput[];
  evidenceSignals?: RawCompletionEvidenceInput[];
  realitySignals?: RawCompletionRealityInput[];
}

export interface CompletionTruthResult {
  record: CompletionTruthRecord;
  report: CompletionTruthReport;
}

export interface CompletionTruthRuntimeReport {
  claimAnalysisCount: number;
  evidenceValidationCount: number;
  realityValidationCount: number;
  falseCompletionDetectionCount: number;
  consistencyAnalysisCount: number;
  gapAnalysisCount: number;
  authorityBuildCount: number;
  evaluationCount: number;
  recordCount: number;
  cacheHits: number;
  cacheMisses: number;
  cacheEvictions: number;
  bootstrapReuseCount: number;
}

export const COMPLETION_TRUTH_QUESTION_SIGNALS = [
  'completion truth',
  'completion truth engine',
  'false completion',
  'completion reality',
  'truth authority',
] as const;

export function isCompletionTruthEngineQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return COMPLETION_TRUTH_QUESTION_SIGNALS.some((s) => lower.includes(s));
}
