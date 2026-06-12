/**
 * World 2 Workspace Materialization — public API.
 */

export {
  WORLD2_WORKSPACE_MATERIALIZATION_PASS_TOKEN,
  WORLD2_WORKSPACE_MATERIALIZATION_OWNER_MODULE,
  WORLD2_WORKSPACE_MATERIALIZATION_PHASE,
  WORLD2_WORKSPACE_MATERIALIZATION_REPORT_TITLE,
  WORLD2_MATERIALIZATION_CACHE_KEY_PREFIX,
  MAX_MATERIALIZATION_HISTORY,
  MAX_MATERIALIZATION_REASONS,
  MAX_BLUEPRINT_ENTRIES,
  WORLD2_MATERIALIZATION_CORE_QUESTION,
  WORLD2_MATERIALIZATION_STATES,
  WORLD2_WORKSPACE_SIZE_ESTIMATES,
  REQUIRED_MATERIALIZATION_AUTHORITIES,
  WORLD2_FORBIDDEN_BLUEPRINT_PATTERNS,
  isWorld2MaterializationState,
  isWorld2WorkspaceSizeEstimate,
  computeWorkspaceSizeEstimate,
} from './world2-workspace-materialization-registry.js';

export type {
  World2MaterializationState,
  World2WorkspaceSizeEstimate,
  World2BlueprintFileEntry,
  World2BlueprintDirectoryEntry,
  World2BlueprintArtifactEntry,
  World2WorkspaceBlueprint,
  World2MaterializationContract,
  World2BlueprintValidationResult,
  World2MaterializationInputSnapshot,
  World2WorkspaceMaterializationAssessment,
  World2WorkspaceMaterializationReport,
  AssessWorld2WorkspaceMaterializationInput,
  World2WorkspaceMaterializationHistorySummary,
  WorkspaceSizeAnalysisInput,
} from './world2-workspace-materialization-types.js';

export {
  resetWorld2WorkspaceMaterializationHistoryForTests,
  recordWorld2WorkspaceMaterializationAssessment,
  getWorld2WorkspaceMaterializationHistorySize,
  getLatestWorld2WorkspaceMaterializationAssessment,
  getWorld2WorkspaceMaterializationHistory,
  buildWorld2WorkspaceMaterializationHistorySummary,
  countWorld2MaterializationState,
} from './world2-workspace-materialization-history.js';

export {
  assessWorld2WorkspaceMaterialization,
  validateWorld2WorkspaceBlueprint,
  deriveMaterializationState,
  buildWorld2WorkspaceMaterializationReport,
  buildWorld2WorkspaceMaterializationArtifacts,
  resetWorld2WorkspaceMaterializationCounterForTests,
  resetWorld2WorkspaceMaterializationModuleForTests,
} from './world2-workspace-materialization-authority.js';

export type { MaterializationStateContext } from './world2-workspace-materialization-authority.js';

export { buildWorld2WorkspaceMaterializationReportMarkdown } from './world2-workspace-materialization-report-builder.js';
