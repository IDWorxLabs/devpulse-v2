/**
 * Connected Autonomous Build Execution Foundation — public API.
 */

export {
  CONNECTED_BUILD_EXECUTION_FOUNDATION_PASS_TOKEN,
  CONNECTED_BUILD_EXECUTION_OWNER_MODULE,
  CONNECTED_BUILD_EXECUTION_PHASE,
  CONNECTED_BUILD_EXECUTION_REPORT_TITLE,
  CONNECTED_BUILD_EXECUTION_CACHE_KEY_PREFIX,
  CONNECTED_BUILD_EXECUTION_CORE_QUESTION,
  MAX_CONNECTED_BUILD_EXECUTION_HISTORY,
  MAX_MANIFEST_ENTRIES,
  MAX_RECOMMENDED_ACTIONS,
  MAX_MISSING_COMPONENTS,
  BUILD_OUTPUT_STATES,
  REQUIRED_INPUT_AUTHORITIES,
  ORCHESTRATION_FLOW,
  BUILD_OUTPUT_SAFETY_GUARANTEES,
  isBuildOutputState,
} from './connected-build-execution-registry.js';

export type {
  BuildOutputState,
  BuildOutputManifestEntry,
  BuildOutputArtifactEntry,
  BuildOutputManifest,
  BuildOutputQuestionAnswers,
  ConnectedBuildExecutionInputSnapshot,
  ConnectedBuildExecutionReport,
  ConnectedBuildExecutionAssessment,
  AssessConnectedBuildExecutionInput,
  ConnectedBuildExecutionHistoryEntry,
  ConnectedBuildExecutionHistorySummary,
  ConnectedBuildExecutionArtifacts,
} from './connected-build-execution-types.js';

export {
  resetConnectedBuildExecutionHistoryForTests,
  recordConnectedBuildExecutionAssessment,
  getConnectedBuildExecutionHistorySize,
  getLatestConnectedBuildExecutionHistoryEntry,
  getConnectedBuildExecutionHistory,
  countBuildOutputState,
  buildConnectedBuildExecutionHistorySummary,
} from './connected-build-execution-history.js';

export {
  assessConnectedAutonomousBuildExecution,
  buildConnectedBuildExecutionArtifacts,
  buildBuildOutputManifest,
  deriveBuildOutputQuestionAnswers,
  deriveBuildOutputScore,
  deriveBuildOutputState,
  deriveOutputCompleteness,
  deriveProofCompleteness,
  resetConnectedBuildExecutionCounterForTests,
  resetConnectedBuildExecutionModuleForTests,
} from './connected-build-execution-authority.js';

export { buildConnectedBuildExecutionReportMarkdown } from './connected-build-execution-report-builder.js';
