/**
 * DevPulse V2 Phase 9.5 Complexity Score Foundation — public API.
 */

export {
  evaluateComplexityProjectContext,
  systemContextKey,
  validateComplexityAnalysisInput,
} from './system-context-engine.js';

export {
  complexitySignalsKey,
  evaluateComplexitySignals,
  isHighComplexitySignal,
  isLowComplexitySignal,
} from './complexity-signal-engine.js';

export {
  countCriticalFactors,
  countHighFactors,
  createFactorScores,
  factorScoresKey,
  isDependencyFactor,
  isDriftFactor,
  isModuleCountFactor,
} from './factor-score-engine.js';

export {
  aggregateComplexityScore,
  buildComplexityReasons,
  complexityScoreKey,
  computeComplexityConfidence,
  getTopComplexityFactors,
  isMaximumScore,
  isMinimumScore,
  isScoreInRange,
} from './complexity-score-engine.js';

export {
  computeRiskBand,
  isCriticalRiskBand,
  isHighRiskBand,
  isLowRiskBand,
  isMediumRiskBand,
  riskBandKey,
  scoreForRiskBand,
} from './risk-band-engine.js';

export {
  interpretComplexityPressure,
  pressureInterpretationKey,
} from './pressure-interpretation-engine.js';

export {
  complexityRecommendationKey,
  createComplexityRecommendations,
} from './complexity-recommendation-engine.js';

export {
  assertDistinctFromProtectedModules,
  assertGovernanceDependenciesPresent,
  assertMeasurementNotSourceOfTruth,
  assertNoDuplicateComplexityScore,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertNotDriftDetector,
  assertWorld1Protected,
  assertWorld2Protected,
  getComplexityGovernanceSummary,
  governanceGatesKey,
  validateComplexityGovernance,
} from './complexity-governance-bridge.js';

export {
  assertNoAutoFixCapability,
  assertNoExecutionMethods,
  ownershipGatesKey,
} from './complexity-security-engine.js';

export {
  buildComplexityScoreReport,
  buildComplexityScoreReportOutput,
  formatComplexityScoreReport,
} from './complexity-score-report.js';

export {
  complexityStateIncludes,
  complexityStructuralKey,
  createDevPulseV2ComplexityScoreFoundation,
  DevPulseV2ComplexityScoreFoundation,
  getDevPulseV2ComplexityScoreFoundation,
  processComplexityAnalysis,
  resetDevPulseV2ComplexityScoreFoundationForTests,
  scanModuleForForbiddenPatterns,
} from './complexity-score-foundation.js';

export type {
  AuthStatus,
  ComplexityAnalysisInput,
  ComplexityAnalysisSource,
  ComplexityConfidence,
  ComplexityConfirmation,
  ComplexityFactorType,
  ComplexityRiskBand,
  ComplexityScoreFoundationState,
  ComplexityScoreReport,
  ComplexityScoreReportOutput,
  ComplexityScoreResult,
  ComplexityState,
  FactorScore,
  GateRecord,
  GovernanceStatus,
  SystemArea,
} from './types.js';

export {
  COMPLEXITY_CONFIDENCE_LEVELS,
  COMPLEXITY_RISK_BANDS,
  COMPLEXITY_SCORE_FOUNDATION_OWNER_MODULE,
  COMPLEXITY_SCORE_FOUNDATION_PASS_TOKEN,
  COMPLEXITY_STATE_SEQUENCE,
  DEPENDENCY_SYSTEMS,
  DUPLICATE_PATTERNS,
  FACTOR_WEIGHTS,
  KNOWN_ANALYSIS_SOURCES,
  KNOWN_COMPLEXITY_FACTORS,
  KNOWN_SYSTEM_AREAS,
  resetComplexityCountersForTests,
  RISK_BAND_THRESHOLDS,
  SIGNAL_PATTERNS,
} from './types.js';
