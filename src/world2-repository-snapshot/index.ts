/**
 * World 2 Repository Snapshot — public API.
 */

export {
  WORLD2_REPOSITORY_SNAPSHOT_PASS_TOKEN,
  WORLD2_REPOSITORY_SNAPSHOT_OWNER_MODULE,
  WORLD2_REPOSITORY_SNAPSHOT_PHASE,
  WORLD2_REPOSITORY_SNAPSHOT_REPORT_TITLE,
  WORLD2_SNAPSHOT_CACHE_KEY_PREFIX,
  MAX_SNAPSHOT_HISTORY,
  MAX_SNAPSHOT_REASONS,
  WORLD2_SNAPSHOT_CORE_QUESTION,
  WORLD2_SNAPSHOT_STATES,
  MAX_SNAPSHOT_FILES,
  MAX_SNAPSHOT_DIRECTORIES,
  MAX_SNAPSHOT_ESTIMATED_SIZE,
  MAX_SNAPSHOT_SENSITIVE_MATCHES,
  MAX_SNAPSHOT_ATTEMPTS,
  WORLD2_LIVE_PATH_PATTERNS,
  WORLD2_PRODUCTION_PATH_PATTERNS,
  WORLD2_SECRETS_PATH_PATTERNS,
  WORLD2_NODE_MODULES_EXCLUSION,
  WORLD2_GIT_INTERNALS_EXCLUSIONS,
  WORLD2_GIT_METADATA_ONLY_PATHS,
  WORLD2_BUILD_OUTPUT_EXCLUSIONS,
  WORLD2_CACHE_DIRECTORY_EXCLUSIONS,
  WORLD2_UNBOUNDED_ROOT_COPY_PATTERNS,
  WORLD2_STANDARD_SNAPSHOT_EXCLUSIONS,
  REQUIRED_SNAPSHOT_AUTHORITIES,
  WORLD2_SNAPSHOT_SAFETY_GUARANTEES,
  WORLD2_SNAPSHOT_SAFETY_CHECK_IDS,
  isWorld2SnapshotState,
  pathMatchesPatterns,
  pathMatchesAnyExclusion,
  isUnboundedRootCopyPath,
  isGitMetadataOnlyPath,
} from './world2-repository-snapshot-registry.js';

export type {
  World2SnapshotState,
  World2SnapshotBounds,
  World2SnapshotSafetyCheck,
  World2SnapshotManifestEntry,
  World2SnapshotManifest,
  World2RepositorySnapshotScope,
  World2RepositorySnapshotInputSnapshot,
  World2RepositorySnapshotAssessment,
  World2RepositorySnapshotReport,
  AssessWorld2RepositorySnapshotInput,
  World2RepositorySnapshotHistorySummary,
  SnapshotStateContext,
} from './world2-repository-snapshot-types.js';

export {
  resetWorld2RepositorySnapshotHistoryForTests,
  recordWorld2RepositorySnapshotAssessment,
  getWorld2RepositorySnapshotHistorySize,
  getLatestWorld2RepositorySnapshotAssessment,
  getWorld2RepositorySnapshotHistory,
  buildWorld2RepositorySnapshotHistorySummary,
  countWorld2SnapshotState,
} from './world2-repository-snapshot-history.js';

export {
  assessWorld2RepositorySnapshot,
  deriveSnapshotState,
  performWorld2SnapshotSafetyChecks,
  buildWorld2RepositorySnapshotReport,
  buildWorld2RepositorySnapshotArtifacts,
  resetWorld2RepositorySnapshotCounterForTests,
  resetWorld2RepositorySnapshotModuleForTests,
} from './world2-repository-snapshot-authority.js';

export { buildWorld2RepositorySnapshotReportMarkdown } from './world2-repository-snapshot-report-builder.js';
