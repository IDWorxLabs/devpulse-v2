/**
 * Real Build Execution Pipeline V1.1 — public API.
 */

export {
  REAL_BUILD_EXECUTION_PIPELINE_V1_1_PASS_TOKEN,
  REAL_BUILD_EXECUTION_V11_REPORT_TITLE,
  REAL_BUILD_EXECUTION_V11_ARTIFACT_DIR,
  MIN_FULL_PROOF_CATEGORIES,
  EXECUTION_GENERALIZATION_V2_PASS_THRESHOLD,
  MIN_PROOF_COVERAGE_PERCENT,
  MAX_REAL_BUILD_EXECUTION_V11_HISTORY,
} from './real-build-execution-pipeline-v11-bounds.js';

export { runRealBuildExecutionPipelineV11 } from './real-build-execution-v11-assessor.js';

export {
  getLastRealBuildExecutionV11Assessment,
  listRealBuildExecutionV11History,
  resetRealBuildExecutionV11HistoryForTests,
  seedRealBuildExecutionV11HistoryForTests,
} from './real-build-execution-v11-history.js';

export { buildRealBuildExecutionPipelineV11ReportMarkdown } from './real-build-execution-v11-report-builder.js';

export { buildBuildProofRecords } from './build-proof-builder.js';

export {
  buildExecutionMatrix,
  formatExecutionMatrixText,
} from './execution-matrix-builder.js';

export {
  buildExecutionFailureIntelligence,
  buildFailureIntelligenceSummary,
} from './failure-intelligence.js';

export { buildProofCoverageReport } from './proof-coverage.js';

export { computeExecutionGeneralizationScoreV2 } from './generalization-score-v2.js';

export { adjustUvlConfidenceForProofCoverage } from './real-build-v11-uvl-integration.js';

export {
  computeAflaProofCoveragePenalty,
  adjustLaunchConfidenceForProofCoverage,
} from './real-build-v11-afla-integration.js';

export { classifyProductArchitectExecutionStatus } from './real-build-v11-pai-integration.js';

export type {
  BuildProofRecord,
  ExecutionMatrixEntry,
  ExecutionFailureIntelligenceEntry,
  ProofCoverageReport,
  RealBuildExecutionPipelineV11Assessment,
} from './real-build-execution-pipeline-v11-types.js';
