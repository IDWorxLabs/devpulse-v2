/**
 * Capability Planning Engine — public exports.
 */

import { resetCapabilityPlanRegistryForTests } from './capability-plan-registry.js';
import { resetCapabilityPlanningCacheForTests } from './capability-planning-cache.js';
import { resetScopePlannerForTests } from './capability-scope-planner.js';
import { resetImpactAnalyzerForTests } from './capability-impact-analyzer.js';
import { resetRiskAnalyzerForTests } from './capability-risk-analyzer.js';
import { resetVerificationPlannerForTests } from './capability-verification-planner.js';
import { resetDependencyPlannerForTests } from './capability-dependency-planner.js';
import { resetApprovalPlannerForTests } from './capability-approval-planner.js';
import { resetPlanBuilderForTests } from './capability-plan-builder.js';
import { resetCapabilityPlanningHistoryForTests } from './capability-planning-history.js';
import { resetCapabilityPlanningReportCounterForTests } from './capability-planning-reporting.js';
import { resetCapabilityPlanningEngineForTests } from './capability-planning-engine.js';
import { resetCapabilityResearchEngineModuleForTests } from '../capability-research-engine/index.js';
import { resetCapabilityAuthorityForTests } from './capability-authority.js';
import { resetCapabilityPlanningRegistryForTests } from './capability-planning-registry.js';

export {
  CAPABILITY_PLANNING_ENGINE_PASS_TOKEN,
  CAPABILITY_PLANNING_ENGINE_OWNER_MODULE,
  DEFAULT_MAX_PLANNING_HISTORY_SIZE,
  PLANNING_QUESTION_SIGNALS,
  isCapabilityPlanningQuestion,
} from './capability-planning-types.js';

export type {
  CapabilityPlanType,
  CapabilityApprovalRequirement,
  VerificationDepth,
  ImpactLevel,
  RiskLevel,
  CapabilityPlan,
  CapabilityPlanningInput,
  CapabilityScopePlan,
  CapabilityImpactAnalysis,
  CapabilityRiskAnalysis,
  CapabilityVerificationPlan,
  CapabilityDependencyPlan,
  CapabilityApprovalPlan,
  CapabilityPlanningReport,
  CapabilityPlanHistoryEntry,
  CapabilityPlanningRuntimeReport,
  CapabilityPlanResult,
  CapabilityStatus,
  CapabilityGapDecision,
  GenerationPermissionVerdict,
  CapabilityRecord,
  RequiredCapability,
  ExistingCapabilitySearchResult,
  CapabilityGap,
  ComposedCapabilityPlan,
  CapabilityGenerationPlanEra3,
  CapabilityValidationPlanEra3,
  CapabilityInstallationPlanEra3,
  CapabilityDependencyGraphResult,
  CapabilityPlanningPipelineResult,
  CapabilityPlanningPipelineInput,
  LaunchCapabilityEvidence,
} from './capability-planning-types.js';

export {
  registerCapabilityPlan,
  getCapabilityPlan,
  listCapabilityPlans,
  listCapabilityPlansByType,
  listCapabilityPlansByApproval,
  getCapabilityPlanCount,
  resetCapabilityPlanRegistryForTests,
} from './capability-plan-registry.js';

export { planCapabilityScope, getScopePlanCount, resetScopePlannerForTests } from './capability-scope-planner.js';
export { analyzeCapabilityImpact, getImpactAnalysisCount, resetImpactAnalyzerForTests } from './capability-impact-analyzer.js';
export { analyzeCapabilityPlanRisk, getRiskAnalysisCount, resetRiskAnalyzerForTests } from './capability-risk-analyzer.js';
export { planCapabilityVerification, getVerificationPlanCount, resetVerificationPlannerForTests } from './capability-verification-planner.js';
export { planCapabilityDependencies, getDependencyAnalysisCount, resetDependencyPlannerForTests } from './capability-dependency-planner.js';
export { determineCapabilityApproval, getApprovalDecisionCount, resetApprovalPlannerForTests } from './capability-approval-planner.js';
export {
  buildCapabilityPlan,
  getPlansCreatedCount,
  getDuplicateDetectionCount,
  resetPlanBuilderForTests,
} from './capability-plan-builder.js';
export {
  recordCapabilityPlanHistory,
  getCapabilityPlanHistory,
  getCapabilityPlanHistorySize,
  resetCapabilityPlanningHistoryForTests,
} from './capability-planning-history.js';
export { generateCapabilityPlanningReport, resetCapabilityPlanningReportCounterForTests } from './capability-planning-reporting.js';
export { getCapabilityPlanningCacheStats, resetCapabilityPlanningCacheForTests } from './capability-planning-cache.js';

export {
  getDevPulseV2CapabilityPlanningEngine,
  registerCapabilityPlanningEngineWithCentralBrain,
  registerCapabilityPlanningEngineWithProjectVault,
  registerCapabilityPlanningEngineWithTrustEngine,
  registerCapabilityPlanningEngineWithMissingCapabilityEscalation,
  registerCapabilityPlanningEngineWithCapabilityResearchEngine,
  registerCapabilityPlanningEngineWithAutonomousBuilder,
  registerCapabilityPlanningEngineWithAutonomousVerification,
  registerCapabilityPlanningEngineWithCompletionEngine,
  registerCapabilityPlanningEngineWithMultiProjectMonitoring,
  registerCapabilityPlanningEngineWithUvl,
  evaluateCapabilityPlanning,
  getCapabilityPlanningEngineRuntimeReport,
  resetCapabilityPlanningEngineForTests,
} from './capability-planning-engine.js';

export type { CapabilityPlanningEngineSystemSnapshot } from './capability-planning-engine.js';

export {
  discoverRequiredCapabilities,
  resetCapabilityDiscoveryForTests,
} from './capability-discovery.js';
export { searchExistingCapabilities } from './existing-capability-search.js';
export { analyzeCapabilityGaps, resetCapabilityGapAnalyzerForTests } from './capability-gap-analyzer.js';
export { composeCapabilitiesFromGaps, resetCapabilityCompositionEngineForTests } from './capability-composition-engine.js';
export { planCapabilityGeneration, resetCapabilityGenerationPlannerForTests } from './capability-generation-planner.js';
export { planCapabilityValidations, resetCapabilityValidationPlannerEra3ForTests } from './capability-validation-planner.js';
export { planCapabilityInstallations, resetCapabilityInstallationPlannerForTests } from './capability-installation-planner.js';
export { analyzeCapabilityReuse } from './capability-reuse-analyzer.js';
export type { CapabilityReuseSummary } from './capability-reuse-analyzer.js';
export { buildCapabilityDependencyGraph, resetCapabilityDependencyGraphForTests } from './capability-dependency-graph.js';
export { buildCapabilityPlanningPipelineReport } from './capability-planning-report-builder.js';
export {
  listCapabilityUniverse,
  getCapabilityRecord,
  registerCapabilityRecord,
  searchCapabilityUniverse,
  resetCapabilityPlanningRegistryForTests,
} from './capability-planning-registry.js';
export {
  runCapabilityPlanningPipeline,
  getLastCapabilityPlanningPipelineResult,
  isCapabilityPlanningReadyForGeneration,
  buildLaunchCapabilityEvidence,
  registerCapabilityPlanningWithLaunchAuthority,
  registerCapabilityPlanningWithIntentUnderstanding,
  registerCapabilityPlanningWithPromptFaithfulness,
  resetCapabilityAuthorityForTests,
} from './capability-authority.js';

export function resetCapabilityPlanningEngineModuleForTests(): void {
  resetCapabilityPlanRegistryForTests();
  resetCapabilityPlanningCacheForTests();
  resetScopePlannerForTests();
  resetImpactAnalyzerForTests();
  resetRiskAnalyzerForTests();
  resetVerificationPlannerForTests();
  resetDependencyPlannerForTests();
  resetApprovalPlannerForTests();
  resetPlanBuilderForTests();
  resetCapabilityPlanningHistoryForTests();
  resetCapabilityPlanningReportCounterForTests();
  resetCapabilityPlanningEngineForTests();
  resetCapabilityResearchEngineModuleForTests();
  resetCapabilityAuthorityForTests();
  resetCapabilityPlanningRegistryForTests();
}
