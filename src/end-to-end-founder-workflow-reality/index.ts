/**
 * End-to-End Founder Workflow Reality — public exports.
 */

export {
  END_TO_END_FOUNDER_WORKFLOW_REALITY_PASS_TOKEN,
  END_TO_END_FOUNDER_WORKFLOW_REALITY_OWNER_MODULE,
  MAX_HISTORY_ENTRIES,
  MAX_REGISTRY_ENTRIES,
  MAX_WORKFLOW_BLOCKERS,
  MAX_WORKFLOW_EVIDENCE,
} from './end-to-end-founder-workflow-reality-bounds.js';

export type {
  AssessFounderWorkflowRealityInput,
  FounderWorkflowAnalyzerResults,
  FounderWorkflowBlocker,
  FounderWorkflowEvidence,
  FounderWorkflowMatrixRow,
  FounderWorkflowRealityAssessment,
  FounderWorkflowReport,
  FounderWorkflowStage,
  FounderWorkflowSubscores,
  UpstreamRealityBundle,
  WorkflowModulePresenceEvidence,
} from './end-to-end-founder-workflow-reality-types.js';

export type {
  FounderExperienceLevel,
  FounderWorkflowStageId,
  LaunchReadinessRealityLevel,
  StageEvidenceLevel,
  WorkflowContinuityLevel,
  WorkflowTransitionResult,
  WorkflowTruthMapLabel,
} from './end-to-end-founder-workflow-reality-analyzer-types.js';

export {
  analyzeFounderBottlenecks,
  analyzeFounderExperience,
  analyzeLaunchReadinessReality,
  analyzeWorkflowContinuity,
  analyzeWorkflowStageReality,
  collectFounderWorkflowEvidence,
  collectUpstreamRealityBundle,
  detectWorkflowModulePresenceEvidence,
  resolveLastProvenStage,
  runAllFounderWorkflowRealityAnalyzers,
} from './end-to-end-founder-workflow-reality-analyzers.js';

export {
  getFounderWorkflowHistoryCount,
  listFounderWorkflowHistory,
  recordFounderWorkflowHistory,
  resetFounderWorkflowRealityHistoryForTests,
} from './end-to-end-founder-workflow-reality-history.js';

export {
  getFounderWorkflowRegistryCount,
  listFounderWorkflowRegistryEntries,
  resetFounderWorkflowRealityRegistryForTests,
  storeFounderWorkflowRegistryEntry,
} from './end-to-end-founder-workflow-reality-registry.js';

export {
  assessFounderWorkflowReality,
  buildFounderWorkflowRealityReport,
  resetFounderWorkflowRealityCounterForTests,
  writeFounderWorkflowRealityReportFile,
} from './end-to-end-founder-workflow-reality-authority.js';
