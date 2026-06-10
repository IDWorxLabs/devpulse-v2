/**
 * Prediction Trust Layer — public exports.
 */

import { resetPredictionTrustRegistryForTests } from './prediction-trust-registry.js';
import { resetPredictionTrustCacheForTests } from './prediction-trust-cache.js';
import { resetTrustTrendAnalyzerForTests } from './trust-trend-analyzer.js';
import { resetTrustRiskPredictorForTests } from './trust-risk-predictor.js';
import { resetTrustFailurePredictorForTests } from './trust-failure-predictor.js';
import { resetTrustVolatilityAnalyzerForTests } from './trust-volatility-analyzer.js';
import { resetTrustRecoveryRecommenderForTests } from './trust-recovery-recommender.js';
import { resetTrustPredictionAuthorityBuilderForTests } from './trust-prediction-authority-builder.js';
import { resetTrustPredictionEvaluatorForTests } from './trust-prediction-evaluator.js';
import { resetPredictionTrustHistoryForTests } from './prediction-trust-history.js';
import { resetPredictionTrustReportingForTests } from './prediction-trust-reporting.js';
import { resetPredictionTrustLayerForTests as resetPredictionTrustLayerOrchestrationForTests } from './prediction-trust-layer.js';
import { resetCompletionTruthEngineModuleForTests } from '../completion-truth-engine/index.js';

export {
  PREDICTION_TRUST_LAYER_PASS_TOKEN,
  PREDICTION_TRUST_LAYER_OWNER_MODULE,
  DEFAULT_MAX_PREDICTION_TRUST_HISTORY_SIZE,
  PREDICTION_TRUST_QUESTION_SIGNALS,
  isPredictionTrustLayerQuestion,
} from './prediction-trust-types.js';

export type {
  PredictionTrustRiskLevel,
  PredictionTrustDecision,
  TrustTrendDirection,
  LikelyFailureMode,
  PredictionTrustRecord,
  TrustTrendAnalysis,
  TrustRiskPrediction,
  TrustFailurePrediction,
  TrustRecoveryRecommendation,
  TrustVolatilityAnalysis,
  UnifiedPredictionTrustAuthority,
  PredictionTrustEvaluation,
  PredictionTrustHistoryEntry,
  PredictionTrustReport,
  PredictionTrustInput,
  PredictionTrustResult,
  PredictionTrustRuntimeReport,
} from './prediction-trust-types.js';

export { getPredictionTrustCacheStats, resetPredictionTrustCacheForTests } from './prediction-trust-cache.js';

export {
  registerPredictionTrustRecord,
  getPredictionTrustRecord,
  lookupPredictionByProjectId,
  lookupPredictionByWorkspaceId,
  lookupPredictionByRiskLevel,
  lookupPredictionByDecision,
  listPredictionTrustRecords,
  getPredictionTrustRecordCount,
  resetPredictionTrustRegistryForTests,
} from './prediction-trust-registry.js';

export {
  analyzeTrustTrend,
  getTrendAnalysisCount,
  resetTrustTrendAnalyzerForTests,
} from './trust-trend-analyzer.js';

export {
  predictTrustRisk,
  getRiskPredictionCount,
  resetTrustRiskPredictorForTests,
} from './trust-risk-predictor.js';

export {
  predictTrustFailures,
  getFailurePredictionCount,
  resetTrustFailurePredictorForTests,
} from './trust-failure-predictor.js';

export {
  analyzeTrustVolatility,
  getVolatilityAnalysisCount,
  resetTrustVolatilityAnalyzerForTests,
} from './trust-volatility-analyzer.js';

export {
  recommendTrustRecovery,
  getRecoveryRecommendationCount,
  resetTrustRecoveryRecommenderForTests,
} from './trust-recovery-recommender.js';

export {
  buildUnifiedPredictionTrustAuthority,
  getAuthorityBuildCount,
  resetTrustPredictionAuthorityBuilderForTests,
} from './trust-prediction-authority-builder.js';

export {
  evaluateTrustPrediction,
  getEvaluationCount,
  resetTrustPredictionEvaluatorForTests,
} from './trust-prediction-evaluator.js';

export {
  recordPredictionTrustHistory,
  getPredictionTrustHistory,
  getPredictionTrustHistorySize,
  clearPredictionTrustHistory,
  resetPredictionTrustHistoryForTests,
} from './prediction-trust-history.js';

export {
  generatePredictionTrustReport,
  getReportCount,
  resetPredictionTrustReportingForTests,
} from './prediction-trust-reporting.js';

export {
  getDevPulseV2PredictionTrustLayer,
  registerPredictionTrustLayerWithCentralBrain,
  registerPredictionTrustLayerWithUnifiedTrustRuntime,
  registerPredictionTrustLayerWithEvidenceIntelligence,
  registerPredictionTrustLayerWithRealityVerification,
  registerPredictionTrustLayerWithCompletionTruth,
  registerPredictionTrustLayerWithTrustEngine,
  registerPredictionTrustLayerWithAutonomousVerification,
  registerPredictionTrustLayerWithCompletionEngine,
  registerPredictionTrustLayerWithMultiProjectVerification,
  registerPredictionTrustLayerWithMultiProjectMonitoring,
  registerPredictionTrustLayerWithSelfEvolutionGovernance,
  registerPredictionTrustLayerWithMissingCapabilityEscalation,
  registerPredictionTrustLayerWithWorld2,
  registerPredictionTrustLayerWithUvl,
  evaluatePredictionTrustLayer,
  getPredictionTrustLayerRuntimeReport,
  resetPredictionTrustLayerForTests as resetPredictionTrustLayerOrchestrationForTests,
} from './prediction-trust-layer.js';

export type { PredictionTrustLayerSystemSnapshot } from './prediction-trust-layer.js';

export function resetPredictionTrustLayerForTests(): void {
  resetPredictionTrustRegistryForTests();
  resetPredictionTrustCacheForTests();
  resetTrustTrendAnalyzerForTests();
  resetTrustRiskPredictorForTests();
  resetTrustFailurePredictorForTests();
  resetTrustVolatilityAnalyzerForTests();
  resetTrustRecoveryRecommenderForTests();
  resetTrustPredictionAuthorityBuilderForTests();
  resetTrustPredictionEvaluatorForTests();
  resetPredictionTrustHistoryForTests();
  resetPredictionTrustReportingForTests();
  resetPredictionTrustLayerOrchestrationForTests();
  resetCompletionTruthEngineModuleForTests();
}
