/**
 * World 2 Disposable Workspace — public API.
 */

export {
  WORLD2_DISPOSABLE_WORKSPACE_PASS_TOKEN,
  WORLD2_DISPOSABLE_WORKSPACE_OWNER_MODULE,
  WORLD2_DISPOSABLE_WORKSPACE_PHASE,
  WORLD2_DISPOSABLE_WORKSPACE_REPORT_TITLE,
  WORLD2_DISPOSABLE_CACHE_KEY_PREFIX,
  MAX_DISPOSABLE_WORKSPACE_HISTORY,
  MAX_DISPOSABLE_WORKSPACE_REASONS,
  WORLD2_DISPOSABLE_CORE_QUESTION,
  WORLD2_WORKSPACE_STATES,
  WORLD2_ISOLATION_MODES,
  WORLD2_LIFECYCLE_DECISIONS,
  WORLD2_FORBIDDEN_PATHS,
  WORLD2_ALLOWED_PATHS,
  WORLD2_FORBIDDEN_OPERATIONS,
  WORLD2_ALLOWED_OPERATIONS,
  REQUIRED_DISPOSABLE_WORKSPACE_AUTHORITIES,
  DEFAULT_SOURCE_PROJECT_ID,
  isWorld2WorkspaceState,
  isWorld2IsolationMode,
  isWorld2WorkspaceLifecycleDecision,
  resolveAllowedPaths,
} from './world2-disposable-workspace-registry.js';

export type {
  World2WorkspaceState,
  World2IsolationMode,
  World2WorkspaceLifecycleDecision,
  World2DisposableWorkspaceContract,
  World2WorkspaceLifecycleAssessment,
  World2DisposableWorkspaceInputSnapshot,
  World2DisposableWorkspaceAssessment,
  World2DisposableWorkspaceReport,
  AssessWorld2DisposableWorkspaceInput,
  World2DisposableWorkspaceHistorySummary,
} from './world2-disposable-workspace-types.js';

export {
  resetWorld2DisposableWorkspaceHistoryForTests,
  recordWorld2DisposableWorkspaceAssessment,
  getWorld2DisposableWorkspaceHistorySize,
  getLatestWorld2DisposableWorkspaceAssessment,
  getWorld2DisposableWorkspaceHistory,
  buildWorld2DisposableWorkspaceHistorySummary,
  countWorld2WorkspaceState,
} from './world2-disposable-workspace-history.js';

export {
  assessWorld2DisposableWorkspace,
  deriveWorld2IsolationMode,
  deriveWorld2WorkspaceState,
  deriveWorld2WorkspaceLifecycleDecision,
  buildWorld2DisposableWorkspaceReport,
  buildWorld2DisposableWorkspaceArtifacts,
  resetWorld2DisposableWorkspaceCounterForTests,
  resetWorld2DisposableWorkspaceModuleForTests,
} from './world2-disposable-workspace-authority.js';

export type { World2WorkspaceEligibilityContext } from './world2-disposable-workspace-authority.js';

export { buildWorld2DisposableWorkspaceReportMarkdown } from './world2-disposable-workspace-report-builder.js';

export {
  WORKSPACE_ISOLATION_AUTHORITATIVE_OWNER,
  evaluateDisposableWorkspaceFoundationBoundaries,
} from './world2-workspace-foundation-bridge.js';
export type { World2WorkspaceFoundationBridgeResult } from './world2-workspace-foundation-bridge.js';
