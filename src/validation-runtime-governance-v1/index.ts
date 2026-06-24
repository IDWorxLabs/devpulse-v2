/**
 * Validation Runtime Governance V1 — public API.
 */

export {
  VALIDATION_RUNTIME_GOVERNANCE_V1_PASS_TOKEN,
  VALIDATION_RUNTIME_GOVERNANCE_V1_REPORT_TITLE,
  VALIDATION_RUNTIME_GOVERNANCE_V1_ARTIFACT_DIR,
  AUDIT_V1_PASS_TOKEN,
  BASELINE_VALIDATION_OVERHEAD_PERCENT,
  BASELINE_DUPLICATE_WORK_PERCENT,
  TARGET_VALIDATION_OVERHEAD_PERCENT,
  TARGET_DUPLICATE_WORK_PERCENT,
  TIER_TARGET_RUNTIME_SECONDS,
  LAUNCH_TIER_VALIDATORS,
  FAST_FORBIDDEN_PATTERNS,
  AFLA_FORBIDDEN_TIERS,
  REGRESSION_VALIDATORS,
} from './validation-runtime-governance-v1-bounds.js';

export type {
  ValidationTier,
  GovernanceAction,
  RuntimeBudgetCategory,
  TierDefinition,
  ValidatorTierAssignment,
  CapabilityImpactNode,
  CapabilityImpactGraph,
  RuntimeBudgetEntry,
  ReuseStrategy,
  DuplicatePreventionRule,
  GovernanceMetrics,
  ValidationRunPlan,
  GovernancePolicy,
  ValidationRuntimeGovernanceAssessment,
} from './validation-runtime-governance-v1-types.js';

export {
  TIER_DEFINITIONS,
  isValidatorAllowedInTier,
  assignValidatorTier,
  buildTierAssignments,
  getTierDefinition,
  listValidatorsForTier,
} from './tier-registry.js';

export {
  buildCapabilityImpactGraph,
  explainCapabilityImpact,
} from './capability-impact-graph.js';

export {
  buildRuntimeBudgetRegistry,
  isRuntimeBudgetBreached,
} from './runtime-budget-registry.js';

export { buildReuseStrategy } from './reuse-strategy.js';

export {
  acquirePreviewRuntime,
  releasePreviewRuntime,
  getExistingPreviewRuntime,
  getPreviewRuntimePoolStats,
  resetPreviewRuntimePoolForTests,
} from './preview-runtime-pool.js';
export type { PreviewRuntimeLease } from './preview-runtime-pool.js';

export {
  resolveBuildOutput,
  shouldRebuild,
  invalidateBuildOutput,
  computeWorkspaceFingerprint,
  getBuildOutputCacheStats,
  resetBuildOutputCacheForTests,
} from './build-output-cache.js';

export {
  acquirePlaywrightSession,
  releasePlaywrightSession,
  getPlaywrightSessionPoolStats,
  resetPlaywrightSessionPoolForTests,
} from './playwright-session-pool.js';

export {
  registerReusableArtifact,
  resolveReusableArtifact,
  listReusableArtifacts,
  REUSABLE_ARTIFACT_TYPES,
  resetArtifactReuseRegistryForTests,
} from './artifact-reuse-registry.js';
export type { ReusableArtifactType, ArtifactReuseEntry } from './artifact-reuse-registry.js';

export {
  buildDuplicatePreventionRules,
  checkDuplicateOperation,
} from './duplicate-prevention.js';
export type { DuplicateCheckResult } from './duplicate-prevention.js';

export {
  computeGovernanceMetrics,
  estimateTierRuntime,
} from './governance-metrics.js';

export {
  planValidationRun,
  explainValidationDecision,
} from './validation-run-planner.js';

export {
  buildGovernancePolicy,
  isValidationRuntimeGovernanceActive,
  setValidationRuntimeGovernanceActive,
  resetValidationRuntimeGovernanceForTests,
} from './governance-policy-authority.js';

export { buildValidationRuntimeGovernanceAssessment } from './validation-runtime-governance-assessor.js';

export { buildValidationRuntimeGovernanceV1ReportMarkdown } from './validation-runtime-governance-report-builder.js';
