/**
 * World 2 Repository Snapshot Executor — public API.
 */

export {
  WORLD2_REPOSITORY_SNAPSHOT_EXECUTOR_PASS_TOKEN,
  WORLD2_REPOSITORY_SNAPSHOT_EXECUTOR_OWNER_MODULE,
  WORLD2_REPOSITORY_SNAPSHOT_EXECUTOR_PHASE,
  WORLD2_REPOSITORY_SNAPSHOT_EXECUTOR_REPORT_TITLE,
  WORLD2_SNAPSHOT_EXECUTOR_CACHE_KEY_PREFIX,
  MAX_SNAPSHOT_EXECUTOR_HISTORY,
  MAX_SNAPSHOT_EXECUTOR_REASONS,
  DEFAULT_SNAPSHOT_EXECUTION_MODE,
  MAX_SNAPSHOT_EXECUTION_TTL_MS,
  WORLD2_SNAPSHOT_EXECUTOR_CORE_QUESTION,
  WORLD2_SNAPSHOT_EXECUTION_MODES,
  WORLD2_SNAPSHOT_EXECUTION_STATES,
  MAX_EXECUTION_FILES,
  MAX_EXECUTION_DIRECTORIES,
  MAX_EXECUTION_ESTIMATED_SIZE,
  MAX_EXECUTION_ATTEMPTS,
  WORLD2_LIVE_PATH_PATTERNS,
  WORLD2_PRODUCTION_PATH_PATTERNS,
  WORLD2_SECRETS_PATH_PATTERNS,
  WORLD2_NODE_MODULES_EXCLUSION,
  WORLD2_GIT_INTERNALS_EXCLUSIONS,
  WORLD2_BUILD_OUTPUT_EXCLUSIONS,
  WORLD2_CACHE_DIRECTORY_EXCLUSIONS,
  WORLD2_UNBOUNDED_ROOT_COPY_PATTERNS,
  REQUIRED_SNAPSHOT_EXECUTOR_AUTHORITIES,
  WORLD2_SNAPSHOT_EXECUTOR_SAFETY_GUARANTEES,
  isWorld2SnapshotExecutionMode,
  isWorld2SnapshotExecutionState,
  pathMatchesPatterns,
  isUnboundedRootCopyPath,
  pathMatchesSecrets,
} from './world2-repository-snapshot-executor-registry.js';

export type {
  World2SnapshotExecutionMode,
  World2SnapshotExecutionState,
  World2SnapshotExecutionOverride,
  World2SnapshotExecutionSafetyCheck,
  World2SnapshotExecutionBounds,
  World2SnapshotExecutionRequest,
  World2SnapshotDryRunExecutionResult,
  World2SnapshotExecutorInputSnapshot,
  World2RepositorySnapshotExecutorAssessment,
  World2RepositorySnapshotExecutorReport,
  AssessWorld2RepositorySnapshotExecutorInput,
  World2RepositorySnapshotExecutorHistorySummary,
  SnapshotExecutionModeContext,
} from './world2-repository-snapshot-executor-types.js';

export {
  resetWorld2RepositorySnapshotExecutorHistoryForTests,
  recordWorld2RepositorySnapshotExecutorAssessment,
  getWorld2RepositorySnapshotExecutorHistorySize,
  getLatestWorld2RepositorySnapshotExecutorAssessment,
  getWorld2RepositorySnapshotExecutorHistory,
  buildWorld2RepositorySnapshotExecutorHistorySummary,
  countWorld2SnapshotExecutionState,
} from './world2-repository-snapshot-executor-history.js';

export {
  assessWorld2RepositorySnapshotExecutor,
  deriveSnapshotExecutionEligibilityMode,
  deriveSnapshotExecutionState,
  performWorld2SnapshotExecutionSafetyChecks,
  buildWorld2RepositorySnapshotExecutorReport,
  buildWorld2RepositorySnapshotExecutorArtifacts,
  resetWorld2RepositorySnapshotExecutorCounterForTests,
  resetWorld2RepositorySnapshotExecutorModuleForTests,
} from './world2-repository-snapshot-executor-authority.js';

export { buildWorld2RepositorySnapshotExecutorReportMarkdown } from './world2-repository-snapshot-executor-report-builder.js';
