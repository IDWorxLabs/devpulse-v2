/**
 * Validation Runtime Audit V1 — public API.
 */

export {
  VALIDATION_RUNTIME_AUDIT_V1_PASS_TOKEN,
  VALIDATION_RUNTIME_AUDIT_V1_REPORT_TITLE,
  VALIDATION_RUNTIME_AUDIT_V1_ARTIFACT_DIR,
  MEASURED_RUNTIME_BASELINES,
  TYPICAL_PHASE_REGRESSION_VALIDATORS,
  TYPICAL_IMPLEMENTATION_MINUTES,
} from './validation-runtime-audit-bounds.js';

export type {
  RuntimeCostTier,
  MeasurementSource,
  GovernanceAction,
  ValidatorCategory,
  WorkPatternCounts,
  ValidatorRuntimeMetric,
  ValidatorRankingEntry,
  DuplicateWorkEntry,
  DependencyGraphNode,
  DependencyGraph,
  BottleneckEntry,
  GovernanceRecommendation,
  RegressionChainAnalysis,
  ValidationRuntimeAuditAssessment,
} from './validation-runtime-audit-types.js';

export { buildValidatorRegistry, loadPackageValidateScripts } from './validator-registry.js';
export type { ValidatorRegistryEntry } from './validator-registry.js';

export {
  classifyValidatorCategory,
  analyzeWorkPatterns,
  detectValidationMode,
  extractMaxRuntimeBoundMs,
  extractNestedValidatorTargets,
} from './validator-static-analyzer.js';

export { estimateRuntimeSeconds, classifyCostTier } from './runtime-estimator.js';
export { buildDuplicateWorkAnalysis } from './duplicate-work-analyzer.js';
export { buildDependencyGraph } from './dependency-graph-builder.js';
export { buildBottleneckReport } from './bottleneck-analyzer.js';
export { buildGovernanceRecommendations } from './governance-recommendations.js';
export { buildRegressionChainAnalysis } from './regression-chain-analyzer.js';

export {
  buildValidationRuntimeAudit,
  type ValidationRuntimeAuditResult,
} from './validation-runtime-audit-assessor.js';

export { buildValidationRuntimeAuditV1ReportMarkdown } from './validation-runtime-audit-report-builder.js';
