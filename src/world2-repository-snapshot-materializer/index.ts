/**
 * World 2 Repository Snapshot Materializer — public API.
 */

export {
  WORLD2_REPOSITORY_SNAPSHOT_MATERIALIZER_PASS_TOKEN,
  WORLD2_REPOSITORY_SNAPSHOT_MATERIALIZER_OWNER_MODULE,
  WORLD2_REPOSITORY_SNAPSHOT_MATERIALIZER_PHASE,
  WORLD2_REPOSITORY_SNAPSHOT_MATERIALIZER_REPORT_TITLE,
  WORLD2_SNAPSHOT_MATERIALIZER_CACHE_KEY_PREFIX,
  MAX_SNAPSHOT_MATERIALIZER_HISTORY,
  MAX_SNAPSHOT_MATERIALIZER_REASONS,
  DEFAULT_MATERIALIZATION_MODE,
  WORLD2_SNAPSHOT_MATERIALIZER_CORE_QUESTION,
  WORLD2_SNAPSHOT_MATERIALIZATION_MODES,
  WORLD2_SNAPSHOT_MATERIALIZATION_STATES,
  WORLD2_DISPOSABLE_WORKSPACE_ROOT_PREFIX,
  WORLD2_LIVE_PATH_PATTERNS,
  WORLD2_PRODUCTION_PATH_PATTERNS,
  WORLD2_SECRETS_PATH_PATTERNS,
  WORLD2_NODE_MODULES_EXCLUSION,
  WORLD2_GIT_INTERNALS_EXCLUSIONS,
  WORLD2_BUILD_OUTPUT_EXCLUSIONS,
  WORLD2_CACHE_DIRECTORY_EXCLUSIONS,
  WORLD2_UNBOUNDED_ROOT_COPY_PATTERNS,
  WORLD2_MATERIALIZATION_POSTCONDITIONS,
  REQUIRED_SNAPSHOT_MATERIALIZER_AUTHORITIES,
  WORLD2_SNAPSHOT_MATERIALIZER_SAFETY_GUARANTEES,
  isWorld2SnapshotMaterializationMode,
  isWorld2SnapshotMaterializationState,
  resolveTargetWorkspaceRoot,
  isDisposableOnlyTargetRoot,
  pathMatchesPatterns,
  pathMatchesSecrets,
  isUnboundedRootCopyPath,
  pathMatchesAnyExclusion,
} from './world2-repository-snapshot-materializer-registry.js';

export type {
  World2SnapshotMaterializationMode,
  World2SnapshotMaterializationState,
  World2SnapshotMaterializationOverride,
  World2SnapshotMaterializationSafetyCheck,
  World2SnapshotMaterializationOperation,
  World2SnapshotDryRunMaterializationResult,
  World2SnapshotMaterializerInputSnapshot,
  World2RepositorySnapshotMaterializerAssessment,
  World2RepositorySnapshotMaterializerReport,
  AssessWorld2RepositorySnapshotMaterializerInput,
  World2RepositorySnapshotMaterializerHistorySummary,
  SnapshotMaterializationModeContext,
} from './world2-repository-snapshot-materializer-types.js';

export {
  resetWorld2RepositorySnapshotMaterializerHistoryForTests,
  recordWorld2RepositorySnapshotMaterializerAssessment,
  getWorld2RepositorySnapshotMaterializerHistorySize,
  getLatestWorld2RepositorySnapshotMaterializerAssessment,
  getWorld2RepositorySnapshotMaterializerHistory,
  buildWorld2RepositorySnapshotMaterializerHistorySummary,
  countWorld2SnapshotMaterializationState,
} from './world2-repository-snapshot-materializer-history.js';

export {
  assessWorld2RepositorySnapshotMaterializer,
  deriveSnapshotMaterializationEligibilityMode,
  deriveSnapshotMaterializationState,
  performWorld2SnapshotMaterializationSafetyChecks,
  buildWorld2RepositorySnapshotMaterializerReport,
  buildWorld2RepositorySnapshotMaterializerArtifacts,
  resetWorld2RepositorySnapshotMaterializerCounterForTests,
  resetWorld2RepositorySnapshotMaterializerModuleForTests,
} from './world2-repository-snapshot-materializer-authority.js';

export { buildWorld2RepositorySnapshotMaterializerReportMarkdown } from './world2-repository-snapshot-materializer-report-builder.js';
