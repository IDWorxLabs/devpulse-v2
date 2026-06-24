/**
 * Multi-Project Concurrent Execution V1 — public API.
 */

export {
  MULTI_PROJECT_CONCURRENT_EXECUTION_V1_PASS_TOKEN,
  MULTI_PROJECT_CONCURRENT_EXECUTION_V1_FAIL_TOKEN,
  MULTI_PROJECT_CONCURRENT_EXECUTION_V1_ARTIFACT_DIR,
  MULTI_PROJECT_CONCURRENT_EXECUTION_V1_REPORT_TITLE,
  CONCURRENT_EXECUTION_SUITE_PROFILES,
  MIN_CONCURRENT_PROJECTS_PROOF,
  MIN_CONCURRENT_WORLD2_EXECUTIONS,
  PRIOR_PASS_TOKENS,
} from './multi-project-concurrent-execution-v1-bounds.js';

export type {
  ConcurrentExecutionJob,
  ConcurrentQueueSnapshot,
  ConcurrentContaminationAssessment,
  ConcurrentBuildProof,
  ConcurrentVerificationAssessment,
  ConcurrentFailureClassification,
  MultiProjectConcurrentExecutionAssessment,
  ConcurrentProjectResult,
  World2ConcurrentResult,
} from './multi-project-concurrent-execution-v1-types.js';

export { runConcurrentExecutionCoordinator } from './concurrent-execution-coordinator.js';
export { runMultiProjectConcurrentExecutionV1 } from './multi-project-concurrent-execution-assessor.js';
export { writeMultiProjectConcurrentExecutionArtifacts } from './multi-project-concurrent-artifact-writer.js';
export {
  isMultiProjectConcurrentExecutionProven,
  loadMultiProjectConcurrentExecutionAssessmentFromDisk,
} from './multi-project-concurrent-evidence-loader.js';
export { buildMultiProjectConcurrentExecutionV1ReportMarkdown } from './multi-project-concurrent-execution-report-builder.js';
export { assessConcurrentContamination } from './concurrent-contamination-assessor.js';
export { getConcurrentExecutionQueueSnapshot } from './concurrent-execution-queue.js';
