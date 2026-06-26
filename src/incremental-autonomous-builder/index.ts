/**
 * Incremental Autonomous Builder — public exports.
 */

import { resetIncrementalAutonomousBuilderForTests } from './incremental-build-orchestrator.js';

export {
  INCREMENTAL_AUTONOMOUS_BUILDER_PASS_TOKEN,
  INCREMENTAL_AUTONOMOUS_BUILDER_OWNER_MODULE,
  DEFAULT_MAX_INCREMENTAL_BUILD_HISTORY,
  DEFAULT_FEATURE_REPAIR_BUDGET,
  DEFAULT_MAX_REGRESSION_GUARD_DEPTH,
} from './incremental-builder-types.js';

export type {
  FeatureSliceStatus,
  IncrementalBuildPermissionVerdict,
  FeatureSlicePlan,
  IncrementalBuildPlan,
  ArchitectureSkeletonResult,
  FeatureSliceArtifact,
  FeatureSliceGenerationResult,
  FeatureSliceValidationResult,
  FeatureRepairPlan,
  FeatureStabilizationResult,
  FeatureCommitRecord,
  FeatureRegressionGuardResult,
  BuildStateSnapshot,
  WholeAppAssemblyResult,
  IncrementalBuildPipelineInput,
  IncrementalBuildPipelineResult,
  LaunchIncrementalBuildEvidence,
} from './incremental-builder-types.js';

export {
  getDevPulseV2IncrementalAutonomousBuilder,
  registerIncrementalBuilderWithLaunchAuthority,
  registerIncrementalBuilderWithIntentUnderstanding,
  registerIncrementalBuilderWithPromptFaithfulness,
  registerIncrementalBuilderWithCapabilityPlanning,
} from './incremental-builder-registry.js';

export { buildIncrementalBuildPlan, getOrderedSliceIdsFromPlan, resetIncrementalBuildPlanForTests } from './incremental-build-plan.js';
export { planFeatureSlices, resetFeatureSlicePlannerForTests } from './feature-slice-planner.js';
export { orderFeatureSlices, getOrderingRules, type FeatureOrderingResult } from './feature-dependency-ordering.js';
export { buildArchitectureSkeleton, resetArchitectureSkeletonBuilderForTests } from './architecture-skeleton-builder.js';
export { generateFeatureSlice } from './feature-slice-generator.js';
export { validateFeatureSlice } from './feature-slice-validator.js';
export { planFeatureRepair, resetFeatureRepairPlannerForTests } from './feature-repair-planner.js';
export { evaluateFeatureStabilization, isFeatureStable } from './feature-stabilization-gate.js';
export {
  recordFeatureCommit,
  getFeatureCommitLog,
  getFeatureCommitLogSize,
  resetFeatureCommitLogForTests,
} from './feature-commit-log.js';
export { runFeatureRegressionGuard, resetFeatureRegressionGuardForTests } from './feature-regression-guard.js';
export {
  saveBuildState,
  loadBuildState,
  createInitialBuildState,
  updateBuildState,
  getResumableSliceId,
  resetBuildStateStoreForTests,
} from './build-state-store.js';
export { assembleWholeApplication, resetWholeAppAssemblyForTests } from './whole-app-assembly.js';
export { buildIncrementalBuildPipelineReport } from './incremental-build-report-builder.js';
export { recordIncrementalBuildHistory, getIncrementalBuildHistorySize, resetIncrementalBuildHistoryForTests } from './incremental-build-history.js';
export {
  assessIncrementalBuildReadiness,
  type IncrementalBuildReadinessResult,
} from './incremental-build-readiness.js';
export {
  runIncrementalBuildPipeline,
  getLastIncrementalBuildPipelineResult,
  isIncrementalBuildReadyForGeneration,
  buildLaunchIncrementalBuildEvidence,
  getIncrementalAutonomousBuilderPassToken,
  resetIncrementalAutonomousBuilderForTests,
} from './incremental-build-orchestrator.js';

export function resetIncrementalAutonomousBuilderModuleForTests(): void {
  resetIncrementalAutonomousBuilderForTests();
}
