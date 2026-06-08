/**
 * DevPulse V2 Phase 10.2 Trust Engine Expansion Foundation — public API.
 */

export {
  validateTrustAssessmentInput,
  evaluateTrustProjectContext,
  trustContextKey,
} from './trust-context-engine.js';

export {
  evaluateTrustSignals,
  trustSignalsKey,
  isStrongTrustSignal,
  isWeakTrustSignal,
  isRiskFactor,
} from './trust-signal-engine.js';

export {
  createTrustFactorScores,
  factorScoresKey,
  countPositiveFactors,
  countRiskFactors,
  getFactorByType,
  isEvidenceQualityFactor,
  isVerificationStrengthFactor,
  isPredictionRiskFactor,
} from './trust-factor-score-engine.js';

export {
  aggregateTrustScore,
  trustScoreKey,
  computeTrustLevel,
  computeTrustRiskLevel,
  buildTrustReasons,
  getTopTrustFactors,
  isScoreInRange,
  isVeryLowTrust,
  isVeryHighTrust,
  isCriticalRisk,
  scoreForTrustLevel,
} from './trust-score-engine.js';

export {
  createTrustWarnings,
  trustWarningsKey,
  countCriticalWarnings,
} from './trust-warning-engine.js';

export {
  createTrustRecommendations,
  trustRecommendationKey,
} from './trust-recommendation-engine.js';

export {
  assertGovernanceDependenciesPresent,
  assertNoGovernanceBypass,
  assertWorld1Protected,
  assertWorld2Protected,
  assertNoRegistryRuntimeMutation,
  assertDistinctFromTrustEngine,
  assertNotReplacingSourceSystems,
  assertNoDuplicateTrustEngineExpansion,
  assertTrustAggregationOnly,
  getTrustGovernanceSummary,
  governanceGatesKey,
  validateTrustGovernance,
} from './trust-governance-bridge.js';

export {
  assertNoExecutionMethods,
  assertNoAutoFixCapability,
  assertNoReplacementCapability,
  ownershipGatesKey,
} from './trust-security-engine.js';

export {
  processTrustAssessment,
  trustStructuralKey,
  trustStateIncludes,
  scanModuleForForbiddenPatterns,
  DevPulseV2TrustEngineExpansion,
  createDevPulseV2TrustEngineExpansion,
  getDevPulseV2TrustEngineExpansion,
  resetDevPulseV2TrustEngineExpansionForTests,
  TRUST_STATE_SEQUENCE,
  TRUST_ENGINE_EXPANSION_OWNER_MODULE,
  TRUST_ENGINE_EXPANSION_PASS_TOKEN,
} from './trust-engine-expansion.js';

export {
  buildTrustEngineReport,
  buildTrustEngineReportOutput,
  formatTrustEngineReport,
} from './trust-engine-report.js';

export type {
  TrustAssessmentSource,
  TrustAssessmentTarget,
  TrustFactorType,
  TrustState,
  TrustLevel,
  TrustRiskLevel,
  GovernanceStatus,
  AuthStatus,
  GateRecord,
  TrustAssessmentInput,
  TrustFactorScore,
  TrustConfirmation,
  TrustAssessmentResult,
  TrustEngineReportOutput,
  TrustEngineReport,
  TrustEngineExpansionState,
} from './types.js';

export {
  KNOWN_ASSESSMENT_SOURCES,
  KNOWN_ASSESSMENT_TARGETS,
  KNOWN_TRUST_FACTORS,
  POSITIVE_TRUST_FACTORS,
  RISK_TRUST_FACTORS,
  TRUST_FACTOR_WEIGHTS,
  TRUST_LEVEL_THRESHOLDS,
  DEPENDENCY_SYSTEMS,
  DUPLICATE_PATTERNS,
  EXECUTION_BLOCKED_PATTERNS,
  CODE_GEN_BLOCKED_PATTERNS,
  FILE_MOD_BLOCKED_PATTERNS,
  DEPLOY_BLOCKED_PATTERNS,
  AUTO_FIX_BLOCKED_PATTERNS,
  GOVERNANCE_MUTATION_BLOCKED_PATTERNS,
  REGISTRY_MUTATION_BLOCKED_PATTERNS,
  REPLACEMENT_BLOCKED_PATTERNS,
  nextTrustAssessmentId,
  nextTrustScoreId,
  resetTrustCountersForTests,
} from './types.js';
