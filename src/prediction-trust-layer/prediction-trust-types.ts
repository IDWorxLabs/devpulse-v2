/**
 * Prediction Trust Layer — types and models.
 */

export const PREDICTION_TRUST_LAYER_PASS_TOKEN = 'PREDICTION_TRUST_LAYER_V1_PASS';
export const PREDICTION_TRUST_LAYER_OWNER_MODULE = 'devpulse_v2_prediction_trust_layer';
export const DEFAULT_MAX_PREDICTION_TRUST_HISTORY_SIZE = 128;

export type PredictionTrustRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type PredictionTrustDecision =
  | 'TRUST_STABLE'
  | 'TRUST_WATCH'
  | 'TRUST_DEGRADING'
  | 'TRUST_FAILURE_LIKELY'
  | 'TRUST_RECOVERY_RECOMMENDED'
  | 'BLOCKED';

export type TrustTrendDirection = 'IMPROVING' | 'STABLE' | 'DEGRADING' | 'VOLATILE';

export type LikelyFailureMode =
  | 'trust_collapse'
  | 'verification_failure'
  | 'evidence_contradiction'
  | 'false_completion'
  | 'governance_block'
  | 'stalled_progress'
  | 'resource_contention';

export interface PredictionTrustRecord {
  predictionId: string;
  projectId: string;
  workspaceId: string;
  riskLevel: PredictionTrustRiskLevel;
  decision: PredictionTrustDecision;
  confidence: number;
  predictedTrustScore: number;
  predictedRiskScore: number;
  generatedAt: number;
}

export interface TrustTrendAnalysis {
  trendDirection: TrustTrendDirection;
  trendConfidence: number;
  volatilityScore: number;
}

export interface TrustRiskPrediction {
  predictedRiskScore: number;
  predictedRiskLevel: PredictionTrustRiskLevel;
  verificationRisk: number;
  completionRisk: number;
  governanceRisk: number;
  multiProjectRisk: number;
}

export interface TrustFailurePrediction {
  likelyFailures: LikelyFailureMode[];
  failureConfidence: number;
}

export interface TrustRecoveryRecommendation {
  action: PredictionTrustDecision;
  recommendations: string[];
}

export interface TrustVolatilityAnalysis {
  volatilityScore: number;
  stabilityScore: number;
  volatilityReasoning: string[];
}

export interface UnifiedPredictionTrustAuthority {
  authorityId: string;
  riskLevel: PredictionTrustRiskLevel;
  decision: PredictionTrustDecision;
  predictedTrustScore: number;
  predictedRiskScore: number;
  confidence: number;
  createdAt: number;
}

export interface PredictionTrustEvaluation {
  predictionConfidence: number;
  predictedTrustScore: number;
  predictedRiskScore: number;
  predictionReadiness: number;
  predictionStability: number;
  decision: PredictionTrustDecision;
}

export interface PredictionTrustHistoryEntry {
  predictionId: string;
  riskLevel: PredictionTrustRiskLevel;
  decision: PredictionTrustDecision;
  predictedTrustScore: number;
  recordedAt: number;
}

export interface PredictionTrustReport {
  predictedTrustScore: number;
  predictedRiskScore: number;
  riskLevel: PredictionTrustRiskLevel;
  decision: PredictionTrustDecision;
  likelyFailureModes: LikelyFailureMode[];
  recoveryRecommendations: string[];
  confidence: number;
  volatility: number;
  stability: number;
  missingSignals: string[];
  evaluation: PredictionTrustEvaluation;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface PredictionTrustInput {
  requestId: string;
  projectId?: string;
  workspaceId?: string;
  trustScore?: number;
  evidenceQuality?: number;
  realityConfidence?: number;
  completionTruthScore?: number;
  governanceStable?: boolean;
  monitoringHealthy?: boolean;
  stallRisk?: boolean;
  resourceContention?: boolean;
  trustHistorySamples?: number[];
}

export interface PredictionTrustResult {
  record: PredictionTrustRecord;
  report: PredictionTrustReport;
}

export interface PredictionTrustRuntimeReport {
  trendAnalysisCount: number;
  riskPredictionCount: number;
  failurePredictionCount: number;
  volatilityAnalysisCount: number;
  recoveryRecommendationCount: number;
  authorityBuildCount: number;
  evaluationCount: number;
  recordCount: number;
  cacheHits: number;
  cacheMisses: number;
  cacheEvictions: number;
  bootstrapReuseCount: number;
}

export const PREDICTION_TRUST_QUESTION_SIGNALS = [
  'prediction trust layer',
  'trust prediction',
  'trust risk prediction',
  'trust failure prediction',
  'trust recovery recommendation',
] as const;

export function isPredictionTrustLayerQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return PREDICTION_TRUST_QUESTION_SIGNALS.some((s) => lower.includes(s));
}
