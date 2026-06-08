export {
  createDevPulseV2MissingCapabilityDetector,
  DevPulseV2MissingCapabilityDetector,
  getDevPulseV2MissingCapabilityDetector,
  processCapabilityAnalysis,
  resetDevPulseV2MissingCapabilityDetectorForTests,
  scanModuleForForbiddenPatterns,
  gapStateIncludes,
  gapStructuralKey,
  analysisKey,
  governanceGatesKey,
  GAP_STATE_SEQUENCE,
  MISSING_CAPABILITY_DETECTOR_OWNER_MODULE,
  MISSING_CAPABILITY_DETECTOR_PASS_TOKEN,
} from './missing-capability-detector.js';
export {
  validateAnalysisInput,
  evaluateProjectContext,
} from './capability-analysis-engine.js';
export {
  scanForCapabilityGaps,
  scanKey,
} from './capability-scan-engine.js';
export {
  classifyCapabilityGaps,
  classificationKey,
  countBySeverity,
  overallConfidence,
} from './capability-gap-classifier.js';
export {
  generateRecommendations,
  buildGapRecords,
  resetCapabilityGapCounterForTests,
  recommendationKey,
} from './capability-recommendation-engine.js';
export {
  assertGovernanceDependenciesPresent,
  assertNoGovernanceBypass,
  assertWorld1Protected,
  assertNoRegistryRuntimeMutation,
  assertDistinctFromCrossDeviceContinuity,
  getDetectorGovernanceSummary,
  validateDetectorGovernance,
} from './capability-governance-bridge.js';
export {
  buildCapabilityGapReport,
  buildCapabilityGapReportOutput,
  formatCapabilityGapReport,
} from './capability-gap-report.js';
export type {
  AnalysisSource,
  CapabilityAnalysisInput,
  CapabilityGapRecord,
  CapabilityGapReport,
  CapabilityGapReportOutput,
  CapabilityGapResult,
  CapabilityGapState,
  CapabilityType,
  ConfidenceLevel,
  DetectorConfirmation,
  GapSeverity,
  GateRecord,
  MissingCapabilityDetectorState,
  WorldTarget,
} from './types.js';
export {
  ACQUISITION_BLOCKED_PATTERNS,
  CODE_GEN_BLOCKED_PATTERNS,
  CONFIDENCE_LEVELS,
  DEPENDENCY_SYSTEMS,
  DEPLOY_BLOCKED_PATTERNS,
  DUPLICATE_PATTERNS,
  EXECUTION_BLOCKED_PATTERNS,
  FILE_MOD_BLOCKED_PATTERNS,
  GAP_SEVERITY_LEVELS,
  KNOWN_ANALYSIS_SOURCES,
  KNOWN_CAPABILITY_TYPES,
  SOURCE_CAPABILITY_MAP,
} from './types.js';
