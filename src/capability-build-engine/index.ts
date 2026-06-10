/**
 * Capability Build Engine — public exports.
 */

import { resetCapabilityBuildRegistryForTests } from './capability-build-registry.js';
import { resetCapabilityBuildCacheForTests } from './capability-build-cache.js';
import { resetModuleBuilderForTests } from './capability-module-builder.js';
import { resetIntegrationBuilderForTests } from './capability-integration-builder.js';
import { resetSequenceBuilderForTests } from './capability-sequence-builder.js';
import { resetRolloutBuilderForTests } from './capability-rollout-builder.js';
import { resetRollbackBuilderForTests } from './capability-rollback-builder.js';
import { resetBuildRiskAnalyzerForTests } from './capability-build-risk-analyzer.js';
import { resetBuildValidationPlannerForTests } from './capability-build-validation-planner.js';
import { resetBuildPipelineForTests } from './capability-build-pipeline.js';
import { resetCapabilityBuildHistoryForTests } from './capability-build-history.js';
import { resetCapabilityBuildReportCounterForTests } from './capability-build-reporting.js';
import { resetCapabilityBuildEngineForTests } from './capability-build-engine.js';
import { resetCapabilityPlanningEngineModuleForTests } from '../capability-planning-engine/index.js';

export {
  CAPABILITY_BUILD_ENGINE_PASS_TOKEN,
  CAPABILITY_BUILD_ENGINE_OWNER_MODULE,
  DEFAULT_MAX_BUILD_HISTORY_SIZE,
  BUILD_QUESTION_SIGNALS,
  isCapabilityBuildQuestion,
} from './capability-build-types.js';

export type {
  CapabilityBuildType,
  BuildExecutionStrategy,
  RolloutStrategy,
  RiskLevel,
  CapabilityBuildPlan,
  CapabilityBuildInput,
  CapabilityModulePlan,
  CapabilityIntegrationPlan,
  CapabilitySequencePlan,
  CapabilityRolloutPlan,
  CapabilityRollbackPlan,
  CapabilityBuildRiskAnalysis,
  CapabilityBuildValidationPlan,
  CapabilityBuildReport,
  CapabilityBuildHistoryEntry,
  CapabilityBuildRuntimeReport,
  CapabilityConstructionResult,
} from './capability-build-types.js';

export {
  registerCapabilityBuildPlan,
  getCapabilityBuildPlan,
  listCapabilityBuildPlans,
  listCapabilityBuildPlansByType,
  listCapabilityBuildPlansByStrategy,
  getCapabilityBuildPlanCount,
  resetCapabilityBuildRegistryForTests,
} from './capability-build-registry.js';

export { buildCapabilityModules, getModulesPlannedCount, resetModuleBuilderForTests } from './capability-module-builder.js';
export { buildCapabilityIntegrations, getIntegrationsPlannedCount, resetIntegrationBuilderForTests } from './capability-integration-builder.js';
export { buildCapabilitySequence, resetSequenceBuilderForTests } from './capability-sequence-builder.js';
export { buildCapabilityRolloutPlan, getRolloutPlansCount, resetRolloutBuilderForTests } from './capability-rollout-builder.js';
export { buildCapabilityRollbackPlan, getRollbackPlansCount, resetRollbackBuilderForTests } from './capability-rollback-builder.js';
export { analyzeCapabilityBuildRisk, resetBuildRiskAnalyzerForTests } from './capability-build-risk-analyzer.js';
export { planCapabilityBuildValidation, getValidationPlansCount, resetBuildValidationPlannerForTests } from './capability-build-validation-planner.js';
export { buildCapabilityConstructionPlan, getBuildPlansCreatedCount, resetBuildPipelineForTests } from './capability-build-pipeline.js';
export {
  recordCapabilityBuildHistory,
  getCapabilityBuildHistory,
  getCapabilityBuildHistorySize,
  resetCapabilityBuildHistoryForTests,
} from './capability-build-history.js';
export { generateCapabilityBuildReport, resetCapabilityBuildReportCounterForTests } from './capability-build-reporting.js';
export { getCapabilityBuildCacheStats, resetCapabilityBuildCacheForTests } from './capability-build-cache.js';

export {
  getDevPulseV2CapabilityBuildEngine,
  registerCapabilityBuildEngineWithCentralBrain,
  registerCapabilityBuildEngineWithProjectVault,
  registerCapabilityBuildEngineWithTrustEngine,
  registerCapabilityBuildEngineWithMissingCapabilityEscalation,
  registerCapabilityBuildEngineWithCapabilityResearchEngine,
  registerCapabilityBuildEngineWithCapabilityPlanningEngine,
  registerCapabilityBuildEngineWithAutonomousBuilder,
  registerCapabilityBuildEngineWithAutonomousVerification,
  registerCapabilityBuildEngineWithCompletionEngine,
  registerCapabilityBuildEngineWithMultiProjectMonitoring,
  registerCapabilityBuildEngineWithUvl,
  evaluateCapabilityBuild,
  getCapabilityBuildEngineRuntimeReport,
  resetCapabilityBuildEngineForTests,
} from './capability-build-engine.js';

export type { CapabilityBuildEngineSystemSnapshot } from './capability-build-engine.js';

export function resetCapabilityBuildEngineModuleForTests(): void {
  resetCapabilityBuildRegistryForTests();
  resetCapabilityBuildCacheForTests();
  resetModuleBuilderForTests();
  resetIntegrationBuilderForTests();
  resetSequenceBuilderForTests();
  resetRolloutBuilderForTests();
  resetRollbackBuilderForTests();
  resetBuildRiskAnalyzerForTests();
  resetBuildValidationPlannerForTests();
  resetBuildPipelineForTests();
  resetCapabilityBuildHistoryForTests();
  resetCapabilityBuildReportCounterForTests();
  resetCapabilityBuildEngineForTests();
  resetCapabilityPlanningEngineModuleForTests();
}
