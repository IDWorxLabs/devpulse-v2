/**
 * Real Build Execution Pipeline V1 — public API.
 */

export {
  REAL_BUILD_EXECUTION_PIPELINE_V1_PASS_TOKEN,
  REAL_BUILD_EXECUTION_OWNER_MODULE,
  REAL_BUILD_EXECUTION_PIPELINE_REPORT_TITLE,
  REAL_BUILD_EXECUTION_ARTIFACT_DIR,
  MIN_REAL_BUILD_SUITE_COUNT,
  MAX_REAL_BUILD_EXECUTION_HISTORY,
  EXECUTION_GENERALIZATION_PASS_THRESHOLD,
  MIN_GENERATION_SUCCESS_RATE,
  MIN_BUILD_SUCCESS_RATE,
  MIN_PREVIEW_SUCCESS_RATE,
} from './real-build-execution-pipeline-bounds.js';

export {
  REAL_BUILD_EXECUTION_SUITE,
  resolveRealBuildSuiteEntry,
  listRealBuildSuiteProfiles,
} from './real-build-execution-suite-registry.js';

export {
  runRealBuildExecutionPipeline,
  resolveRealBuildExecutionCategory,
} from './real-build-execution-assessor.js';

export { runRealBuildForCategory } from './real-build-execution-runner.js';

export {
  getLastRealBuildExecutionAssessment,
  listRealBuildExecutionHistory,
  resetRealBuildExecutionHistoryForTests,
} from './real-build-execution-history.js';

export { buildRealBuildExecutionPipelineReportMarkdown } from './real-build-execution-report-builder.js';

export { computeExecutionMetrics } from './real-build-execution-metrics.js';

export { computeExecutionGeneralizationScore } from './real-build-generalization-score.js';

export { computeAflaExecutionProofPenalty, adjustAflaScoreForExecutionProof } from './real-build-afla-integration.js';

export { computeUvlExecutionProofPenalty, adjustVerificationConfidence } from './real-build-uvl-integration.js';

export { assessExecutionRealityForProductArchitect } from './real-build-pai-integration.js';

export type {
  ExecutionFailureClass,
  RealBuildSuiteEntry,
  BuildExecutionProofEvidence,
  RealBuildCategoryMetrics,
  RealBuildCategoryResult,
  RealBuildExecutionMetrics,
  RunRealBuildExecutionPipelineInput,
  RealBuildExecutionPipelineAssessment,
} from './real-build-execution-pipeline-types.js';
