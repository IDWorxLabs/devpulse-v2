/**
 * Unified Trust Score — types and models.
 */

export const UNIFIED_TRUST_SCORE_PASS_TOKEN = 'UNIFIED_TRUST_SCORE_V1_PASS';
export const UNIFIED_TRUST_SCORE_OWNER_MODULE = 'devpulse_v2_unified_trust_score';
export const DEFAULT_MAX_UNIFIED_TRUST_SCORE_HISTORY_SIZE = 128;

export type UnifiedTrustScoreLevel = 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';

export type UnifiedTrustDecision =
  | 'TRUST_REJECTED'
  | 'TRUST_WEAK'
  | 'TRUST_UNCERTAIN'
  | 'TRUST_ACCEPTABLE'
  | 'TRUST_STRONG'
  | 'TRUST_VERIFIED'
  | 'BLOCKED';

export type TrustConfidenceLevel = 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';

export interface UnifiedTrustScoreRecord {
  scoreId: string;
  projectId: string;
  workspaceId: string;
  trustScore: number;
  trustLevel: UnifiedTrustScoreLevel;
  decision: UnifiedTrustDecision;
  confidence: number;
  evidenceContribution: number;
  realityContribution: number;
  completionContribution: number;
  predictionContribution: number;
  generatedAt: number;
}

export interface UnifiedTrustScoreInputs {
  trustRuntimeScore: number;
  evidenceScore: number;
  realityScore: number;
  completionScore: number;
  predictionScore: number;
  trustRuntimeConfidence: number;
  evidenceConfidence: number;
  realityConfidence: number;
  completionConfidence: number;
  predictionConfidence: number;
  missingSignals: string[];
}

export interface NormalizedTrustScores {
  normalizedTrustScore: number;
  normalizedEvidenceScore: number;
  normalizedRealityScore: number;
  normalizedCompletionScore: number;
  normalizedPredictionScore: number;
  normalizedConfidence: number;
}

export interface TrustWeightContribution {
  trustRuntimeContribution: number;
  evidenceContribution: number;
  realityContribution: number;
  completionContribution: number;
  predictionContribution: number;
  weightedScore: number;
}

export interface TrustConsistencyAnalysis {
  consistencyScore: number;
  consistencyWarnings: string[];
  alignedSignals: string[];
  conflictingSignals: string[];
  missingSignals: string[];
  unstableSignals: string[];
}

export interface UnifiedTrustScoreAuthority {
  authorityId: string;
  trustScore: number;
  trustLevel: UnifiedTrustScoreLevel;
  decision: UnifiedTrustDecision;
  confidence: number;
  weightedScore: number;
  consistencyScore: number;
  createdAt: number;
}

export interface TrustConfidenceEvaluation {
  confidenceScore: number;
  confidenceLevel: TrustConfidenceLevel;
}

export interface UnifiedTrustScoreEvaluation {
  finalTrustScore: number;
  trustLevel: UnifiedTrustScoreLevel;
  decision: UnifiedTrustDecision;
  trustReadiness: number;
  scoreStability: number;
}

export interface UnifiedTrustScoreHistoryEntry {
  scoreId: string;
  trustScore: number;
  trustLevel: UnifiedTrustScoreLevel;
  decision: UnifiedTrustDecision;
  recordedAt: number;
}

export interface UnifiedTrustScoreReport {
  finalTrustScore: number;
  trustLevel: UnifiedTrustScoreLevel;
  decision: UnifiedTrustDecision;
  confidence: number;
  contributionBreakdown: TrustWeightContribution;
  consistencyAnalysis: TrustConsistencyAnalysis;
  missingSignals: string[];
  stability: number;
  readiness: number;
  evaluation: UnifiedTrustScoreEvaluation;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface UnifiedTrustScoreInput {
  requestId: string;
  projectId?: string;
  workspaceId?: string;
  trustRuntimeScore?: number;
  evidenceScore?: number;
  realityScore?: number;
  completionScore?: number;
  predictionScore?: number;
  governanceBlocked?: boolean;
  trustSignals?: { source: string; trustContribution?: number; confidence?: number; risk?: number }[];
  evidenceSignals?: { source: string; strength?: number; trustworthiness?: number; reliability?: number; freshness?: number }[];
  realitySignals?: { claimType: string; strength?: number; verificationState?: string; trustLevel?: number }[];
  completionSignals?: { claimType: string; reportedComplete: boolean; strength?: number; coverage?: number; reliability?: number }[];
  predictionSignals?: {
    trustScore?: number;
    evidenceQuality?: number;
    realityConfidence?: number;
    completionTruthScore?: number;
    governanceStable?: boolean;
  };
}

export interface UnifiedTrustScoreResult {
  record: UnifiedTrustScoreRecord;
  report: UnifiedTrustScoreReport;
}

export interface UnifiedTrustScoreRuntimeReport {
  inputCollectionCount: number;
  normalizationCount: number;
  weightingCount: number;
  consistencyAnalysisCount: number;
  confidenceEvaluationCount: number;
  authorityBuildCount: number;
  evaluationCount: number;
  recordCount: number;
  cacheHits: number;
  cacheMisses: number;
  cacheEvictions: number;
  bootstrapReuseCount: number;
}

export const UNIFIED_TRUST_SCORE_QUESTION_SIGNALS = [
  'unified trust score',
  'trust score',
  'overall trust',
  'trust authority',
  'trust confidence',
] as const;

export function isUnifiedTrustScoreQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return UNIFIED_TRUST_SCORE_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function resolveTrustScoreLevel(score: number): UnifiedTrustScoreLevel {
  if (score >= 81) return 'VERY_HIGH';
  if (score >= 61) return 'HIGH';
  if (score >= 41) return 'MODERATE';
  if (score >= 21) return 'LOW';
  return 'VERY_LOW';
}

export function resolveTrustDecision(score: number, governanceBlocked?: boolean): UnifiedTrustDecision {
  if (governanceBlocked === true) return 'BLOCKED';
  if (score >= 86) return 'TRUST_VERIFIED';
  if (score >= 66) return 'TRUST_STRONG';
  if (score >= 51) return 'TRUST_ACCEPTABLE';
  if (score >= 36) return 'TRUST_UNCERTAIN';
  if (score >= 21) return 'TRUST_WEAK';
  return 'TRUST_REJECTED';
}

export function resolveConfidenceLevel(score: number): TrustConfidenceLevel {
  if (score >= 81) return 'VERY_HIGH';
  if (score >= 61) return 'HIGH';
  if (score >= 41) return 'MODERATE';
  if (score >= 21) return 'LOW';
  return 'VERY_LOW';
}
