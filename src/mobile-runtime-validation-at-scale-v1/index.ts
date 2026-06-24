/**
 * Mobile Runtime Validation at Scale V1 — public API.
 */

export {
  MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_PASS_TOKEN,
  MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_FAIL_TOKEN,
  MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_REPORT_TITLE,
  MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_ARTIFACT_DIR,
  MIN_MOBILE_CATEGORY_COUNT,
  MIN_MOBILE_WORLD2_EXECUTIONS,
  MIN_MOBILE_PASS_RATE,
  MOBILE_RUNTIME_PROFILE_IDS,
  MOBILE_VALIDATION_SUITE_PROFILES,
  MOBILE_WORLD2_PROFILES,
  PRIOR_PASS_TOKENS,
} from './mobile-runtime-validation-v1-bounds.js';

export type {
  MobileRuntimeProfileId,
  MobileRuntimeProof,
  TouchInteractionAssessment,
  MobileNavigationAssessment,
  MobilePerformanceSummary,
  MobileCategoryResult,
  MobileWorld2Result,
  MobileVerificationEvidence,
  MobileProductCoverage,
  MobileRuntimeValidationAssessment,
} from './mobile-runtime-validation-v1-types.js';

export { runMobileRuntimeValidationAtScaleV1 } from './mobile-runtime-validation-assessor.js';
export { buildMobileRuntimeValidationAtScaleV1ReportMarkdown } from './mobile-runtime-validation-report-builder.js';
export { writeMobileRuntimeValidationArtifacts } from './mobile-artifact-writer.js';
export {
  isMobileRuntimeValidationProven,
  loadMobileRuntimeValidationAssessmentFromDisk,
  loadMobileCategoryResultsFromDisk,
} from './mobile-evidence-loader.js';
export { validateMobileRuntimeForProfile, isCategoryMobileProven } from './mobile-runtime-validator.js';
export { buildMobileVerificationEvidence, adjustUvlConfidenceForMobileProof } from './mobile-uvl-integration.js';
export { adjustAflaScoreForMobileCoverage, mobileRuntimeCoveragePenalty } from './mobile-afla-integration.js';
export { buildMobileProductCoverage } from './mobile-pai-integration.js';
export { runMobileWorld2Executions } from './mobile-world2-runner.js';
