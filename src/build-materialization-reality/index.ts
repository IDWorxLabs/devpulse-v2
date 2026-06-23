export {
  BUILD_MATERIALIZATION_REALITY_PASS,
  BUILD_MATERIALIZATION_REALITY_OWNER_MODULE,
  BUILD_MATERIALIZATION_REALITY_PHASE,
  BUILD_MATERIALIZATION_REALITY_REPORT_TITLE,
  BUILD_MATERIALIZATION_REALITY_CORE_QUESTION,
  WORKSPACE_ROOT_DIR,
  MATERIALIZATION_CHAIN_STAGES,
  FOUNDER_MATERIALIZATION_QUESTIONS,
  ORCHESTRATION_FLOW,
  SAFETY_GUARANTEES,
} from './build-materialization-reality-registry.js';

export type {
  BuildMaterializationVerdict,
  MaterializationGapKind,
  MaterializationChainStep,
  ArtifactFileReality,
  WorkspaceReality,
  ArtifactRealityScanSummary,
  MaterializationVerdictAnalysis,
  BuildMaterializationFounderAnswers,
  BuildMaterializationRealityReport,
  BuildMaterializationRealityAssessment,
  AssessBuildMaterializationRealityInput,
  BuildMaterializationRealityHistoryEntry,
} from './build-materialization-reality-types.js';

export {
  listGeneratedWorkspaceIds,
  scanArtifactReality,
  scanWorkspaceArtifactReality,
  findFirstMissingExpectedFile,
} from './artifact-scanner.js';

export {
  analyzeWorkspaceLinkage,
  selectPrimaryWorkspace,
  summarizeAllWorkspaces,
} from './workspace-scanner.js';

export type { WorkspaceLinkageSummary } from './workspace-scanner.js';

export {
  buildMaterializationChain,
  resolveFirstBrokenChainLink,
} from './chain-linker.js';

export {
  analyzeMaterializationVerdict,
  buildFounderAnswersFromVerdict,
} from './materialization-analyzer.js';

export {
  resetBuildMaterializationRealityHistoryForTests,
  recordBuildMaterializationRealityAssessment,
  getBuildMaterializationRealityHistorySize,
  getLatestBuildMaterializationRealityHistoryEntry,
  getBuildMaterializationRealityHistory,
} from './build-materialization-reality-history.js';

export { buildBuildMaterializationRealityReportMarkdown } from './build-materialization-reality-report-builder.js';

export {
  assessBuildMaterializationReality,
  resetBuildMaterializationRealityCounterForTests,
  resetBuildMaterializationRealityModuleForTests,
} from './build-materialization-reality-authority.js';
