/**
 * Unified Trust Score — public exports.
 */

import { resetUnifiedTrustScoreRegistryForTests } from './unified-trust-score-registry.js';
import { resetUnifiedTrustScoreCacheForTests } from './unified-trust-score-cache.js';
import { resetTrustScoreInputCollectorForTests } from './trust-score-input-collector.js';
import { resetTrustScoreNormalizerForTests } from './trust-score-normalizer.js';
import { resetTrustWeightingEngineForTests } from './trust-weighting-engine.js';
import { resetTrustScoreConsistencyAnalyzerForTests } from './trust-score-consistency-analyzer.js';
import { resetTrustConfidenceEvaluatorForTests } from './trust-confidence-evaluator.js';
import { resetTrustScoreAuthorityBuilderForTests } from './trust-score-authority-builder.js';
import { resetUnifiedTrustScoreEvaluatorForTests } from './unified-trust-score-evaluator.js';
import { resetUnifiedTrustScoreHistoryForTests } from './unified-trust-score-history.js';
import { resetUnifiedTrustScoreReportingForTests } from './unified-trust-score-reporting.js';
import { resetUnifiedTrustScoreOrchestrationForTests } from './unified-trust-score.js';
import { resetPredictionTrustLayerForTests } from '../prediction-trust-layer/index.js';

export {
  UNIFIED_TRUST_SCORE_PASS_TOKEN,
  UNIFIED_TRUST_SCORE_OWNER_MODULE,
  DEFAULT_MAX_UNIFIED_TRUST_SCORE_HISTORY_SIZE,
  UNIFIED_TRUST_SCORE_QUESTION_SIGNALS,
  isUnifiedTrustScoreQuestion,
  resolveTrustScoreLevel,
  resolveTrustDecision,
  resolveConfidenceLevel,
} from './unified-trust-score-types.js';

export type {
  UnifiedTrustScoreLevel,
  UnifiedTrustDecision,
  TrustConfidenceLevel,
  UnifiedTrustScoreRecord,
  UnifiedTrustScoreInputs,
  NormalizedTrustScores,
  TrustWeightContribution,
  TrustConsistencyAnalysis,
  UnifiedTrustScoreAuthority,
  TrustConfidenceEvaluation,
  UnifiedTrustScoreEvaluation,
  UnifiedTrustScoreHistoryEntry,
  UnifiedTrustScoreReport,
  UnifiedTrustScoreInput,
  UnifiedTrustScoreResult,
  UnifiedTrustScoreRuntimeReport,
} from './unified-trust-score-types.js';

export { getUnifiedTrustScoreCacheStats, resetUnifiedTrustScoreCacheForTests } from './unified-trust-score-cache.js';

export {
  registerUnifiedTrustScoreRecord,
  getUnifiedTrustScoreRecord,
  lookupTrustScoreByProjectId,
  lookupTrustScoreByWorkspaceId,
  lookupTrustScoreByTrustLevel,
  lookupTrustScoreByDecision,
  listUnifiedTrustScoreRecords,
  getUnifiedTrustScoreRecordCount,
  resetUnifiedTrustScoreRegistryForTests,
} from './unified-trust-score-registry.js';

export {
  collectTrustScoreInputs,
  getInputCollectionCount,
  resetTrustScoreInputCollectorForTests,
} from './trust-score-input-collector.js';

export {
  normalizeTrustScores,
  getNormalizationCount,
  resetTrustScoreNormalizerForTests,
} from './trust-score-normalizer.js';

export {
  computeTrustWeighting,
  getWeightingCount,
  resetTrustWeightingEngineForTests,
} from './trust-weighting-engine.js';

export {
  analyzeTrustScoreConsistency,
  getConsistencyAnalysisCount,
  resetTrustScoreConsistencyAnalyzerForTests,
} from './trust-score-consistency-analyzer.js';

export {
  evaluateTrustConfidence,
  getConfidenceEvaluationCount,
  resetTrustConfidenceEvaluatorForTests,
} from './trust-confidence-evaluator.js';

export {
  buildUnifiedTrustScoreAuthority,
  getAuthorityBuildCount,
  resetTrustScoreAuthorityBuilderForTests,
} from './trust-score-authority-builder.js';

export {
  evaluateUnifiedTrustScore,
  getEvaluationCount,
  resetUnifiedTrustScoreEvaluatorForTests,
} from './unified-trust-score-evaluator.js';

export {
  recordUnifiedTrustScoreHistory,
  getUnifiedTrustScoreHistory,
  getUnifiedTrustScoreHistorySize,
  clearUnifiedTrustScoreHistory,
  resetUnifiedTrustScoreHistoryForTests,
} from './unified-trust-score-history.js';

export {
  generateUnifiedTrustScoreReport,
  getReportCount,
  resetUnifiedTrustScoreReportingForTests,
} from './unified-trust-score-reporting.js';

export {
  getDevPulseV2UnifiedTrustScore,
  registerUnifiedTrustScoreWithCentralBrain,
  registerUnifiedTrustScoreWithUnifiedTrustRuntime,
  registerUnifiedTrustScoreWithEvidenceIntelligence,
  registerUnifiedTrustScoreWithRealityVerification,
  registerUnifiedTrustScoreWithCompletionTruth,
  registerUnifiedTrustScoreWithPredictionTrust,
  registerUnifiedTrustScoreWithTrustEngine,
  registerUnifiedTrustScoreWithAutonomousVerification,
  registerUnifiedTrustScoreWithCompletionEngine,
  registerUnifiedTrustScoreWithMultiProjectVerification,
  registerUnifiedTrustScoreWithMultiProjectMonitoring,
  registerUnifiedTrustScoreWithSelfEvolutionGovernance,
  registerUnifiedTrustScoreWithMissingCapabilityEscalation,
  registerUnifiedTrustScoreWithWorld2,
  registerUnifiedTrustScoreWithUvl,
  evaluateUnifiedTrustScoreEngine,
  getUnifiedTrustScoreRuntimeReport,
} from './unified-trust-score.js';

export type { UnifiedTrustScoreSystemSnapshot } from './unified-trust-score.js';

export function resetUnifiedTrustScoreForTests(): void {
  resetUnifiedTrustScoreRegistryForTests();
  resetUnifiedTrustScoreCacheForTests();
  resetTrustScoreInputCollectorForTests();
  resetTrustScoreNormalizerForTests();
  resetTrustWeightingEngineForTests();
  resetTrustScoreConsistencyAnalyzerForTests();
  resetTrustConfidenceEvaluatorForTests();
  resetTrustScoreAuthorityBuilderForTests();
  resetUnifiedTrustScoreEvaluatorForTests();
  resetUnifiedTrustScoreHistoryForTests();
  resetUnifiedTrustScoreReportingForTests();
  resetUnifiedTrustScoreOrchestrationForTests();
  resetPredictionTrustLayerForTests();
}
