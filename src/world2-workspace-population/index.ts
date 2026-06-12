/**
 * World 2 Workspace Population — public API.
 */

export {
  WORLD2_WORKSPACE_POPULATION_PASS_TOKEN,
  WORLD2_WORKSPACE_POPULATION_OWNER_MODULE,
  WORLD2_WORKSPACE_POPULATION_PHASE,
  WORLD2_WORKSPACE_POPULATION_REPORT_TITLE,
  WORLD2_POPULATION_CACHE_KEY_PREFIX,
  MAX_POPULATION_HISTORY,
  MAX_POPULATION_REASONS,
  MAX_POPULATION_ARTIFACTS,
  WORLD2_POPULATION_CORE_QUESTION,
  WORLD2_POPULATION_CATEGORIES,
  WORLD2_POPULATION_READINESS_STATES,
  REQUIRED_POPULATION_AUTHORITIES,
  WORLD2_POPULATION_NEVER_REQUIRE,
  BASE_REQUIRED_DIRECTORIES,
  isWorld2PopulationReadinessState,
  resolveWorld2PopulationPath,
  clampPopulationReadinessPercent,
} from './world2-workspace-population-registry.js';

export type {
  World2PopulationCategory,
  World2PopulationReadinessState,
  World2PopulationArtifact,
  World2WorkspacePopulationContract,
  World2PopulationInputSnapshot,
  WorkspacePopulationAssessment,
  World2WorkspacePopulationReport,
  AssessWorld2WorkspacePopulationInput,
  World2WorkspacePopulationHistorySummary,
} from './world2-workspace-population-types.js';

export {
  resetWorld2WorkspacePopulationHistoryForTests,
  recordWorld2WorkspacePopulationAssessment,
  getWorld2WorkspacePopulationHistorySize,
  getLatestWorld2WorkspacePopulationAssessment,
  getWorld2WorkspacePopulationHistory,
  buildWorld2WorkspacePopulationHistorySummary,
  countWorld2PopulationReadinessState,
} from './world2-workspace-population-history.js';

export {
  assessWorld2WorkspacePopulation,
  derivePopulationReadinessState,
  buildWorld2WorkspacePopulationReport,
  buildWorld2WorkspacePopulationArtifacts,
  resetWorld2WorkspacePopulationCounterForTests,
  resetWorld2WorkspacePopulationModuleForTests,
} from './world2-workspace-population-authority.js';

export type { PopulationReadinessContext } from './world2-workspace-population-authority.js';

export { buildWorld2WorkspacePopulationReportMarkdown } from './world2-workspace-population-report-builder.js';
