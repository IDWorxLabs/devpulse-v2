/**
 * World 2 Disposable Workspace Creator — public API.
 */

export {
  WORLD2_DISPOSABLE_WORKSPACE_CREATOR_PASS_TOKEN,
  WORLD2_DISPOSABLE_WORKSPACE_CREATOR_OWNER_MODULE,
  WORLD2_DISPOSABLE_WORKSPACE_CREATOR_PHASE,
  WORLD2_DISPOSABLE_WORKSPACE_CREATOR_REPORT_TITLE,
  WORLD2_CREATOR_CACHE_KEY_PREFIX,
  MAX_CREATOR_HISTORY,
  MAX_CREATOR_REASONS,
  WORLD2_CREATOR_CORE_QUESTION,
  WORLD2_CREATION_STATES,
  MAX_CREATION_DIRECTORIES,
  MAX_CREATION_FILES,
  MAX_CREATION_ARTIFACTS,
  MAX_CREATION_ATTEMPTS,
  MAX_CREATION_TTL_MS,
  MAX_ESTIMATED_SIZE_LABEL,
  WORLD2_LIVE_PATH_PATTERNS,
  WORLD2_PRODUCTION_PATH_PATTERNS,
  REQUIRED_CREATOR_AUTHORITIES,
  WORLD2_CREATOR_SAFETY_GUARANTEES,
  isWorld2CreationState,
  resolvePlannedRoot,
} from './world2-disposable-workspace-creator-registry.js';

export type {
  World2CreationState,
  World2CreationBounds,
  World2DisposalPolicy,
  World2CreationSafetyAudit,
  World2DisposableWorkspaceCreationPlan,
  World2CreatorInputSnapshot,
  World2DisposableWorkspaceCreatorAssessment,
  World2DisposableWorkspaceCreatorReport,
  AssessWorld2DisposableWorkspaceCreatorInput,
  World2DisposableWorkspaceCreatorHistorySummary,
  CreationStateContext,
} from './world2-disposable-workspace-creator-types.js';

export {
  resetWorld2DisposableWorkspaceCreatorHistoryForTests,
  recordWorld2DisposableWorkspaceCreatorAssessment,
  getWorld2DisposableWorkspaceCreatorHistorySize,
  getLatestWorld2DisposableWorkspaceCreatorAssessment,
  getWorld2DisposableWorkspaceCreatorHistory,
  buildWorld2DisposableWorkspaceCreatorHistorySummary,
  countWorld2CreationState,
} from './world2-disposable-workspace-creator-history.js';

export {
  assessWorld2DisposableWorkspaceCreator,
  deriveCreationState,
  performWorld2CreationSafetyAudit,
  buildWorld2DisposableWorkspaceCreatorReport,
  buildWorld2DisposableWorkspaceCreatorArtifacts,
  resetWorld2DisposableWorkspaceCreatorCounterForTests,
  resetWorld2DisposableWorkspaceCreatorModuleForTests,
} from './world2-disposable-workspace-creator-authority.js';

export { buildWorld2DisposableWorkspaceCreatorReportMarkdown } from './world2-disposable-workspace-creator-report-builder.js';
