/**
 * Universal Build Pipeline Verification V1 — public API.
 */

export {
  UNIVERSAL_BUILD_PIPELINE_V1_PASS_TOKEN,
  UNIVERSAL_BUILD_PIPELINE_OWNER_MODULE,
  UNIVERSAL_BUILD_PIPELINE_ARTIFACT_DIR,
  UNIVERSAL_BUILD_PIPELINE_REPORT_MD,
  UNIVERSAL_BUILD_PIPELINE_REPORT_JSON,
  MIN_UNIVERSAL_BUILD_MATRIX_COUNT,
  PIPELINE_STAGE_ORDER,
} from './universal-build-pipeline-bounds.js';

export {
  UNIVERSAL_BUILD_PIPELINE_MATRIX,
  UNIVERSAL_BUILD_LISA_PROMPT,
  listUniversalBuildMatrixCategoryIds,
  resolveUniversalBuildMatrixEntry,
} from './universal-build-pipeline-matrix.js';

export {
  runUniversalBuildPipeline,
  resetUniversalBuildPipelineForTests,
  getLastUniversalBuildPipelineAssessment,
} from './universal-build-pipeline-runner.js';

export { traceUniversalBuildPipeline } from './pipeline-stage-tracer.js';

export {
  evaluateBuildContinuationPolicy,
  shouldOverrideAseMaterializationDenial,
  evaluateRuntimeBuildContinuation,
  collectRuntimeBuildContinuationEvidence,
  isPromptFaithfulnessPassedForContinuation,
  ASE_CONTINUATION_OVERRIDE_MESSAGE,
  isSafetyOrStructuralBlocker,
  isOverstrictPreBuildBlocker,
} from './build-continuation-policy.js';

export type {
  RuntimeBuildContinuationEvidence,
  RuntimeBuildContinuationInput,
} from './build-continuation-policy.js';

export {
  evaluateProfilePolicy,
  shouldInjectAuthRequirement,
  promptExplicitlyRequiresAuth,
} from './build-profile-policy.js';

export {
  evaluateFeatureRealityPolicy,
  featureRealityBlocksBuild,
} from './build-feature-reality-policy.js';

export {
  resolveBuildOutcome,
  isPostGenerationOutcome,
  normalizeFailureStageLabel,
} from './build-outcome-policy.js';

export {
  classifyBlocker,
  groupBlockersByClass,
  detectSystemicPatterns,
  buildRecommendedFixes,
} from './blocker-classifier.js';

export { buildUniversalBuildPipelineReportMarkdown } from './universal-build-pipeline-report-builder.js';

export type {
  PipelineStageId,
  BlockerClass,
  BuildOutcome,
  StageDecision,
  PipelineStageTrace,
  ClassifiedBlocker,
  UniversalBuildMatrixEntry,
  UniversalBuildCategoryResult,
  UniversalBuildPipelineAssessment,
  RunUniversalBuildPipelineInput,
  BuildContinuationPolicyInput,
  BuildContinuationPolicyResult,
} from './universal-build-pipeline-types.js';
