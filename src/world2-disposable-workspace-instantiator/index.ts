/**
 * World 2 Disposable Workspace Instantiator — public API.
 */

export {
  WORLD2_DISPOSABLE_WORKSPACE_INSTANTIATOR_PASS_TOKEN,
  WORLD2_DISPOSABLE_WORKSPACE_INSTANTIATOR_OWNER_MODULE,
  WORLD2_DISPOSABLE_WORKSPACE_INSTANTIATOR_PHASE,
  WORLD2_DISPOSABLE_WORKSPACE_INSTANTIATOR_REPORT_TITLE,
  WORLD2_INSTANTIATOR_CACHE_KEY_PREFIX,
  MAX_INSTANTIATOR_HISTORY,
  MAX_INSTANTIATOR_REASONS,
  DEFAULT_INSTANTIATION_MODE,
  WORLD2_INSTANTIATOR_CORE_QUESTION,
  WORLD2_INSTANTIATION_MODES,
  WORLD2_INSTANTIATION_RESULT_STATES,
  WORLD2_LIVE_PATH_PATTERNS,
  WORLD2_PRODUCTION_PATH_PATTERNS,
  REQUIRED_INSTANTIATOR_AUTHORITIES,
  WORLD2_INSTANTIATOR_SAFETY_GUARANTEES,
  WORLD2_INSTANTIATOR_SAFETY_CHECK_IDS,
  isWorld2InstantiationMode,
  isWorld2InstantiationResultState,
  pathMatchesPatterns,
} from './world2-disposable-workspace-instantiator-registry.js';

export type {
  World2InstantiationMode,
  World2InstantiationResultState,
  World2InstantiationExecutionOverride,
  World2InstantiationSafetyCheck,
  World2DisposableWorkspaceInstantiationOperation,
  World2InstantiatorInputSnapshot,
  World2DisposableWorkspaceInstantiatorAssessment,
  World2DisposableWorkspaceInstantiatorReport,
  AssessWorld2DisposableWorkspaceInstantiatorInput,
  World2DisposableWorkspaceInstantiatorHistorySummary,
  InstantiationModeContext,
} from './world2-disposable-workspace-instantiator-types.js';

export {
  resetWorld2DisposableWorkspaceInstantiatorHistoryForTests,
  recordWorld2DisposableWorkspaceInstantiatorAssessment,
  getWorld2DisposableWorkspaceInstantiatorHistorySize,
  getLatestWorld2DisposableWorkspaceInstantiatorAssessment,
  getWorld2DisposableWorkspaceInstantiatorHistory,
  buildWorld2DisposableWorkspaceInstantiatorHistorySummary,
  countWorld2InstantiationResultState,
} from './world2-disposable-workspace-instantiator-history.js';

export {
  assessWorld2DisposableWorkspaceInstantiator,
  deriveInstantiationEligibilityMode,
  deriveInstantiationResultState,
  performWorld2InstantiationSafetyChecks,
  buildWorld2DisposableWorkspaceInstantiatorReport,
  buildWorld2DisposableWorkspaceInstantiatorArtifacts,
  resetWorld2DisposableWorkspaceInstantiatorCounterForTests,
  resetWorld2DisposableWorkspaceInstantiatorModuleForTests,
} from './world2-disposable-workspace-instantiator-authority.js';

export { buildWorld2DisposableWorkspaceInstantiatorReportMarkdown } from './world2-disposable-workspace-instantiator-report-builder.js';
