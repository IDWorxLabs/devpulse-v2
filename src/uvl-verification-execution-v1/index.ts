/**
 * UVL Verification Execution V1 — public API.
 */

export {
  UVL_VERIFICATION_EXECUTION_V1_PASS_TOKEN,
  UVL_VERIFICATION_EXECUTION_V1_REPORT_TITLE,
  UVL_VERIFICATION_EXECUTION_V1_ARTIFACT_DIR,
  MIN_VERIFIED_CATEGORIES,
  MIN_VERIFICATION_COVERAGE_PERCENT,
  MIN_VERIFICATION_CONFIDENCE_SCORE,
  MAX_UVL_VERIFICATION_EXECUTION_HISTORY,
} from './uvl-verification-execution-v1-bounds.js';

export { runUvlVerificationExecutionV1 } from './uvl-verification-execution-assessor.js';

export { runVerificationForCategory } from './uvl-verification-execution-runner.js';

export {
  getLastUvlVerificationExecutionAssessment,
  listUvlVerificationExecutionHistory,
  resetUvlVerificationExecutionHistoryForTests,
  seedUvlVerificationExecutionHistoryForTests,
} from './uvl-verification-execution-history.js';

export { buildUvlVerificationExecutionV1ReportMarkdown } from './uvl-verification-execution-report-builder.js';

export { buildVerificationCoverageReport } from './verification-coverage.js';

export { buildVerificationProofRecords } from './verification-proof-builder.js';

export { buildVerificationMatrix, formatVerificationMatrixText } from './verification-matrix-builder.js';

export {
  buildVerificationFailureIntelligence,
  buildFailureDistribution,
} from './failure-intelligence.js';

export {
  buildVerificationConfidenceReport,
  computeCategoryVerificationConfidence,
} from './verification-confidence.js';

export {
  computeAflaVerificationCoveragePenalty,
  adjustLaunchConfidenceForVerificationCoverage,
} from './uvl-afla-integration.js';

export {
  classifyProductArchitectVerificationStatus,
  summarizeVerificationRealityForProductArchitect,
} from './uvl-pai-integration.js';

export type {
  VerificationFailureClass,
  VerificationVerdict,
  VerificationProofEvidence,
  VerificationCategoryMetrics,
  VerificationCategoryResult,
  VerificationProofRecord,
  VerificationCoverageReport,
  VerificationMatrixEntry,
  VerificationFailureIntelligenceEntry,
  VerificationConfidenceReport,
  UvlVerificationExecutionV1Assessment,
} from './uvl-verification-execution-v1-types.js';
