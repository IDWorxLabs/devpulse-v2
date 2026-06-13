/**
 * Build Plan Generator — public API (V1).
 */

export {
  BUILD_PLAN_GENERATOR_V1_PASS,
  BUILD_PLAN_GENERATOR_OWNER_MODULE,
  BUILD_PLAN_GENERATOR_PHASE,
  BUILD_PLAN_GENERATOR_REPORT_TITLE,
  MAX_BUILD_PLAN_HISTORY,
  BUILD_COMPLEXITY_CATEGORIES,
  BUILD_PLAN_READINESS_LEVELS,
  ALLOWED_ARCHITECTURE_READINESS_FOR_BUILD,
  STANDARD_MILESTONES,
  SAFETY_GUARANTEES,
} from './build-plan-registry.js';

export type {
  BuildComplexityCategory,
  BuildPlanReadiness,
  BuildPlanProjectSummary,
  BuildPlanMilestone,
  BuildPlanPhase,
  BuildPlanDependency,
  DependencyMap,
  BuildPriorityItem,
  BuildPlanRiskItem,
  BuildPlan,
  BuildPlanHistoryEntry,
  BuildPlanGeneratorReport,
  GenerateBuildPlanInput,
  BuildPlanGeneration,
  BuildPlanEvidenceBundle,
} from './build-plan-types.js';

export {
  resetBuildPlanHistoryForTests,
  recordBuildPlan,
  getBuildPlanHistorySize,
  getBuildPlanHistory,
  getBuildPlans,
  getLatestBuildPlan,
} from './build-plan-history.js';

export {
  generateBuildPlan,
  runBuildPlanGenerator,
  buildBuildPlanGeneratorArtifacts,
  resetBuildPlanGeneratorModuleForTests,
} from './build-plan-authority.js';

export {
  buildBuildPlanGeneratorReport,
  buildBuildPlanGeneratorReportMarkdown,
} from './build-plan-report-builder.js';

export {
  buildBuildPlan,
  buildBuildPlanEvidenceBundle,
  summarizeBuildProject,
  resetBuildPlanCounterForTests,
} from './build-plan-builder.js';

export { generateMilestones } from './milestone-generator.js';
export { sequencePhases } from './phase-sequencer.js';
export { analyzeDependencies } from './dependency-analyzer.js';
export { detectBuildPlanRisks, prioritizeBuildOrder } from './risk-aware-prioritizer.js';
export {
  validateBuildPlan,
  isBuildPlanStructurallyValid,
  mapBuildComplexityCategory,
  computeBuildComplexityScore,
  mapBuildPlanReadiness,
} from './build-plan-validator.js';
