/**
 * Connected Build Execution — public API (Phase 26.8 materialization proof).
 */

export {
  CONNECTED_BUILD_EXECUTION_PASS_TOKEN,
  CONNECTED_BUILD_EXECUTION_OWNER_MODULE,
  CONNECTED_BUILD_EXECUTION_PHASE,
  CONNECTED_BUILD_EXECUTION_REPORT_TITLE,
  CONNECTED_BUILD_EXECUTION_CACHE_KEY_PREFIX,
  CONNECTED_BUILD_EXECUTION_CORE_QUESTION,
  WORKSPACE_ROOT_DIR,
  MAX_CONNECTED_BUILD_EXECUTION_HISTORY,
  ORCHESTRATION_FLOW,
  SAFETY_GUARANTEES,
} from './connected-build-execution-registry.js';

export type {
  MaterializationState,
  BuildExecutionProofLevel,
  ArtifactEvidenceLevel,
  ExpectedArtifactEntry,
  BuildMaterializationAssessment,
  BuildArtifactToFileProof,
  GeneratedFileEvidence,
  BuildManifestAssessment,
  ArtifactEvidenceAssessment,
  WorkspaceMaterializationAssessment,
  BuildOutputLinkageAnalysis,
  ConnectedBuildExecutionReport,
  ConnectedBuildFounderQuestions,
  ConnectedBuildExecutionAssessment,
  ObservedFileEvidence,
  AssessConnectedBuildExecutionInput,
  ConnectedBuildExecutionHistoryEntry,
  ConnectedBuildExecutionHistorySummary,
  ConnectedBuildExecutionArtifacts,
} from './connected-build-execution-types.js';

export {
  resetConnectedBuildExecutionHistoryForTests,
  recordConnectedBuildExecutionAssessment,
  getConnectedBuildExecutionHistorySize,
  buildConnectedBuildExecutionHistorySummary,
} from './connected-build-execution-history.js';

export {
  assessConnectedBuildExecution,
  buildConnectedBuildExecutionArtifacts,
  resetConnectedBuildExecutionCounterForTests,
  resetConnectedBuildExecutionModuleForTests,
} from './connected-build-execution-authority.js';

export {
  buildConnectedBuildExecutionReportMarkdown,
  formatConnectedBuildExecutionSummary,
} from './connected-build-execution-report-builder.js';

export {
  materializeBuildContractExpectations,
  deriveMaterializationStateFromEvidence,
} from './build-contract-materializer.js';
export {
  BUILD_PROOF_GAP_MATERIALIZATION_REPAIR_V1_PASS,
  GENERATED_UI_RUNTIME_EXPOSURE_REPAIR_PASS,
  RUNTIME_DEV_SERVER_SOURCE,
  RUNTIME_DEV_SERVER_RELATIVE_PATH,
  materializeBuildProofGapArtifacts,
  computeArtifactToFileProof,
  refreshGeneratedRuntimeDevServer,
  isPathUnderGeneratedBuilderWorkspaces,
} from './build-proof-gap-materializer.js';
export { analyzeGeneratedFiles, scanObservedFileEvidence, mergeObservedEvidence } from './generated-file-analyzer.js';
export { analyzeBuildManifest } from './build-manifest-analyzer.js';
export { analyzeArtifactEvidence } from './artifact-evidence-analyzer.js';
export { analyzeWorkspaceMaterialization } from './workspace-materialization-analyzer.js';
export { analyzeBuildOutputLinkage } from './build-output-linkage-analyzer.js';
