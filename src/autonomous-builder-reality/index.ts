export {
  AUTONOMOUS_BUILDER_REALITY_PASS_TOKEN,
  AUTONOMOUS_BUILDER_REALITY_OWNER_MODULE,
  MAX_BUILDER_EVIDENCE,
  MAX_BUILDER_BLOCKERS,
  MAX_REGISTRY_ENTRIES,
  MAX_HISTORY_ENTRIES,
  MAX_CAPABILITY_MATRIX_ROWS,
} from './autonomous-builder-reality-bounds.js';

export type {
  AssessAutonomousBuilderRealityInput,
  AutonomousBuilderRealityAssessment,
  AutonomousCompletionLevel,
  BuilderAnalyzerResults,
  BuilderExecutionBlocker,
  BuilderExecutionEvidence,
  BuilderExecutionReport,
  BuilderExecutionStage,
  BuilderRealityHistoryEntry,
  BuilderRealityRegistryEntry,
  BuilderRealitySubscores,
  BuildCapabilityLevel,
  CapabilityMatrixRow,
  EvidenceLevel,
  FileGenerationRealityLevel,
  ModulePresenceEvidence,
  PlanningRealityLevel,
  ValidationRealityLevel,
  WorkspaceBuilderSignals,
} from './autonomous-builder-reality-types.js';

export {
  analyzeAutonomousCompletion,
  analyzeBuildExecutionReality,
  analyzeFileGenerationReality,
  analyzePlanningReality,
  analyzeValidationReality,
  collectBuilderExecutionEvidence,
  runAllBuilderRealityAnalyzers,
} from './autonomous-builder-reality-analyzers.js';

export {
  getBuilderRealityHistoryCount,
  listBuilderRealityHistory,
  recordBuilderRealityHistory,
  resetAutonomousBuilderRealityHistoryForTests,
} from './autonomous-builder-reality-history.js';

export {
  getBuilderRealityRegistryCount,
  listBuilderRealityRegistryEntries,
  resetAutonomousBuilderRealityRegistryForTests,
  storeBuilderRealityRegistryEntry,
} from './autonomous-builder-reality-registry.js';

export {
  assessAutonomousBuilderReality,
  buildAutonomousBuilderRealityReport,
  detectModulePresenceEvidence,
  resetAutonomousBuilderRealityCounterForTests,
} from './autonomous-builder-reality-authority.js';
