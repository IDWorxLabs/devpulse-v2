/**
 * Large-Scale Pipeline Integration V1 — public API.
 */

export {
  LARGE_SCALE_PIPELINE_INTEGRATION_V1_PASS_TOKEN,
  LARGE_SCALE_PIPELINE_INTEGRATION_V1_REPORT_TITLE,
  LARGE_SCALE_PIPELINE_INTEGRATION_V1_ARTIFACT_DIR,
  MIN_PIPELINE_SCORE,
  MIN_RBEP_BUILD_SUCCESS_RATE,
  MIN_BROAD_CATEGORY_COUNT,
  RBEP_SUITE_SIZE,
  GP_SUITE_SIZE,
  CLOUD_SUITE_SIZE,
  PRIOR_PASS_TOKENS,
} from './large-scale-pipeline-integration-v1-bounds.js';

export type {
  CategoryProofFlag,
  GapClassification,
  CategoryMappingEntry,
  PipelineMetrics,
  EvidenceSourceRecord,
  PipelineScoreBreakdown,
  LargeScalePipelineScore,
  GapClassificationEntry,
  AuditImpact,
  LargeScalePipelineIntegrationAssessment,
} from './large-scale-pipeline-integration-v1-types.js';

export {
  loadPipelineEvidenceBundle,
  isPipelineEvidenceSufficient,
  RBEP_ARTIFACT_DIR,
  UVL_ARTIFACT_DIR,
  AFLA_ARTIFACT_DIR,
  PAI_ARTIFACT_DIR,
  LARGE_SCALE_ARTIFACT_DIR,
} from './pipeline-evidence-loader.js';

export { buildCategoryMapping, countFlaggedCategories } from './pipeline-category-mapping.js';
export { computePipelineMetrics } from './pipeline-metrics.js';
export { computeLargeScalePipelineScore } from './pipeline-score.js';
export { buildGapClassification, summarizeRemainingGaps } from './pipeline-gap-classification.js';
export { buildAuditImpact, resolvePassToken } from './pipeline-audit-impact.js';
export {
  runLargeScalePipelineIntegrationV1,
  loadLargeScalePipelineIntegrationSnapshot,
} from './pipeline-integration-assessor.js';
export { buildLargeScalePipelineIntegrationV1ReportMarkdown } from './pipeline-integration-report-builder.js';
