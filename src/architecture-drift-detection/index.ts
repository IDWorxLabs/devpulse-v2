/**
 * DevPulse V2 Phase 9.4 Architecture Drift Detection Foundation — public API.
 */

export {
  architectureContextKey,
  evaluateDriftProjectContext,
  validateDriftAnalysisInput,
} from './architecture-context-engine.js';

export {
  evaluateExpectedArchitectureRules,
  expectedRulesKey,
} from './expected-rules-engine.js';

export {
  evaluateObservedArchitectureSignals,
  observedSignalsKey,
} from './observed-signals-engine.js';

export { driftScanKey, scanArchitectureDrift } from './drift-scan-engine.js';

export {
  classifyDriftFindings,
  driftClassificationKey,
  isCapabilityAcquisitionDrift,
  isDependencyDrift,
  isDuplicateOwnershipDrift,
  isDuplicateSourceOfTruthDrift,
  isExecutionAuthorityDrift,
  isGovernanceBypassDrift,
  isKnownDriftType,
  isLearningOverlapDrift,
  isMobileStackDrift,
  isPhaseOrderDrift,
  isSelfEvolutionDrift,
  isWorldBoundaryDrift,
} from './drift-classifier.js';

export {
  computeDriftConfidence,
  computeOverallDriftRisk,
  countBySeverity,
  driftSeverityKey,
  isCriticalSeverity,
  isHighSeverity,
  isLowSeverity,
  isMediumSeverity,
  scorePrimarySeverity,
} from './drift-severity-engine.js';

export {
  createDriftRecommendations,
  driftRecommendationKey,
} from './drift-recommendation-engine.js';

export {
  assertDistinctFromProtectedModules,
  assertGovernanceDependenciesPresent,
  assertNoDuplicateDriftDetection,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertObserverNotSourceOfTruth,
  assertWorld1Protected,
  assertWorld2Protected,
  getDriftGovernanceSummary,
  governanceGatesKey,
  validateDriftGovernance,
} from './drift-governance-bridge.js';

export {
  assertNoAutoFixCapability,
  assertNoExecutionMethods,
  ownershipGatesKey,
} from './drift-security-engine.js';

export {
  buildArchitectureDriftReport,
  buildArchitectureDriftReportOutput,
  formatArchitectureDriftReport,
} from './architecture-drift-report.js';

export {
  createDevPulseV2ArchitectureDriftDetection,
  DevPulseV2ArchitectureDriftDetection,
  driftStateIncludes,
  driftStructuralKey,
  getDevPulseV2ArchitectureDriftDetection,
  processDriftAnalysis,
  resetDevPulseV2ArchitectureDriftDetectionForTests,
  scanModuleForForbiddenPatterns,
} from './architecture-drift-detection.js';

export type {
  ArchitectureDriftDetectionState,
  ArchitectureDriftReport,
  ArchitectureDriftReportOutput,
  ArchitectureDriftResult,
  AuthStatus,
  DriftAnalysisInput,
  DriftAnalysisSource,
  DriftConfidence,
  DriftConfirmation,
  DriftFinding,
  DriftSeverity,
  DriftState,
  DriftType,
  GateRecord,
  GovernanceStatus,
  OverallDriftRisk,
} from './types.js';

export {
  ARCHITECTURE_DRIFT_DETECTION_OWNER_MODULE,
  ARCHITECTURE_DRIFT_DETECTION_PASS_TOKEN,
  AUTO_FIX_BLOCKED_PATTERNS,
  DEPENDENCY_SYSTEMS,
  DRIFT_CONFIDENCE_LEVELS,
  DRIFT_SEVERITY_LEVELS,
  DRIFT_STATE_SEQUENCE,
  DUPLICATE_PATTERNS,
  KNOWN_ANALYSIS_SOURCES,
  KNOWN_DRIFT_TYPES,
  OVERALL_DRIFT_RISK_LEVELS,
  PROTECTED_DOMAINS,
  resetDriftCountersForTests,
  SIGNAL_TO_DRIFT_TYPE,
} from './types.js';
