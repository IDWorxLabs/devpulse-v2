/**
 * DevPulse V2 Phase 9.6 Future Problem Prediction Foundation — public API.
 */

export {
  evaluatePredictionProjectContext,
  systemContextKey,
  validatePredictionAnalysisInput,
} from './system-context-engine.js';

export {
  evaluatePredictionSignals,
  isHighRiskSignal,
  isLowRiskSignal,
  predictionSignalsKey,
} from './signal-evaluation-engine.js';

export {
  computeForecastTimeframe,
  computeRiskLevel,
  countCriticalRiskForecasts,
  countHighRiskForecasts,
  createRiskForecasts,
  isCriticalRiskLevel,
  isHighRiskLevel,
  isLowRiskLevel,
  isMediumRiskLevel,
  riskForecastKey,
} from './risk-forecast-engine.js';

export {
  computeOverallFutureRisk,
  computePredictionConfidence,
  createProblemPredictions,
  getPrimaryPrediction,
  getTopPredictions,
  isComplexityPrediction,
  isDependencyPrediction,
  isDriftPrediction,
  overallFutureRiskKey,
  predictFromType,
  problemPredictionKey,
} from './problem-prediction-engine.js';

export {
  aggregateConfidenceLevels,
  allConfidenceLevelsDefined,
  confidenceScoreKey,
  deterministicConfidence,
  isHighConfidence,
  isVeryHighConfidence,
  scorePredictionConfidence,
} from './confidence-scoring-engine.js';

export {
  createPreventionRecommendations,
  preventionRecommendationKey,
  recommendationForType,
} from './prevention-recommendation-engine.js';

export {
  assertDistinctFromProtectedModules,
  assertGovernanceDependenciesPresent,
  assertNoDuplicateFutureProblemPrediction,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertNotComplexityScorer,
  assertNotDriftDetector,
  assertPredictionNotSourceOfTruth,
  assertWorld1Protected,
  assertWorld2Protected,
  getPredictionGovernanceSummary,
  governanceGatesKey,
  validatePredictionGovernance,
} from './prediction-governance-bridge.js';

export {
  assertNoAutoFixCapability,
  assertNoExecutionMethods,
  ownershipGatesKey,
} from './prediction-security-engine.js';

export {
  buildPredictionReport,
  buildPredictionReportOutput,
  formatPredictionReport,
} from './future-problem-report.js';

export {
  createDevPulseV2FutureProblemPrediction,
  DevPulseV2FutureProblemPrediction,
  getDevPulseV2FutureProblemPrediction,
  predictionStateIncludes,
  predictionStructuralKey,
  processPredictionAnalysis,
  resetDevPulseV2FutureProblemPredictionForTests,
  scanModuleForForbiddenPatterns,
} from './future-problem-prediction.js';

export type {
  AuthStatus,
  ConfidenceLevel,
  ForecastTimeframe,
  FutureProblemPredictionState,
  GateRecord,
  GovernanceStatus,
  OverallFutureRisk,
  PredictionAnalysisInput,
  PredictionAnalysisSource,
  PredictionConfirmation,
  PredictionReport,
  PredictionReportOutput,
  PredictionResult,
  PredictionState,
  PredictionType,
  ProblemPrediction,
  RiskForecast,
  RiskLevel,
  SystemArea,
} from './types.js';

export {
  CONFIDENCE_LEVELS,
  DEPENDENCY_SYSTEMS,
  DUPLICATE_PATTERNS,
  FORECAST_TIMEFRAMES,
  FUTURE_PROBLEM_PREDICTION_OWNER_MODULE,
  FUTURE_PROBLEM_PREDICTION_PASS_TOKEN,
  KNOWN_ANALYSIS_SOURCES,
  KNOWN_PREDICTION_TYPES,
  KNOWN_SYSTEM_AREAS,
  PREDICTION_STATE_SEQUENCE,
  resetPredictionCountersForTests,
  RISK_LEVELS,
  RISK_THRESHOLDS,
} from './types.js';
