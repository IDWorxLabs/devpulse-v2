/**
 * Large-Scale Multi-App Validation V1 — public API.
 */

export {
  LARGE_SCALE_MULTI_APP_VALIDATION_V1_PASS_TOKEN,
  LARGE_SCALE_VALIDATION_OWNER_MODULE,
  LARGE_SCALE_VALIDATION_PHASE,
  LARGE_SCALE_VALIDATION_REPORT_TITLE,
  LARGE_SCALE_VALIDATION_ARTIFACT_DIR,
  MIN_LARGE_SCALE_CATEGORY_COUNT,
  MAX_LARGE_SCALE_VALIDATION_HISTORY,
  GENERALIZATION_SCORE_PASS_THRESHOLD,
} from './large-scale-multi-app-validation-bounds.js';

export type {
  LargeScaleCategoryGroup,
  LargeScaleFailureClass,
  LargeScaleCategoryDefinition,
  LargeScaleCategoryMetrics,
  LargeScaleCategoryResult,
  LargeScalePassRates,
  LargeScaleFailureDistributionEntry,
  LargeScaleCrossAppConsistency,
  LargeScaleCategoryLeaderboardEntry,
  LargeScaleValidationHistoryEntry,
  LargeScaleMultiAppValidationAssessment,
  RunLargeScaleValidationInput,
} from './large-scale-multi-app-validation-types.js';

export {
  LARGE_SCALE_VALIDATION_SUITE,
  resolveLargeScaleCategory,
  listLargeScaleCategoryGroups,
} from './large-scale-category-suite-registry.js';

export { classifyCategoryFailure, buildFailureDistribution } from './large-scale-failure-classifier.js';
export { runCategoryPipelineMetrics, computePassRates } from './large-scale-validation-metrics.js';
export { measureCrossAppConsistency } from './large-scale-cross-app-consistency.js';
export {
  computeGeneralizationScore,
  computeWeakestCategoryPenalty,
} from './large-scale-generalization-score.js';

export {
  resetLargeScaleValidationHistoryForTests,
  recordLargeScaleValidationAssessment,
  getLastLargeScaleValidationAssessment,
  listLargeScaleValidationHistory,
} from './large-scale-validation-history.js';

export {
  runLargeScaleMultiAppValidation,
  assessLargeScaleCategory,
} from './large-scale-multi-app-validation-assessor.js';

export { buildLargeScaleValidationReportMarkdown } from './large-scale-validation-report-builder.js';

export {
  buildUvlCrossCategoryValidationSummary,
  type UvlCrossCategoryValidationSummary,
} from './large-scale-uvl-integration.js';

export { computeLargeScaleTrustAdjustment } from './large-scale-afla-integration.js';
