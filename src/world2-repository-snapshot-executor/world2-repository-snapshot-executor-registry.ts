/**
 * World 2 Repository Snapshot Executor — constants and execution mode registry.
 */

import type {
  World2SnapshotExecutionMode,
  World2SnapshotExecutionState,
} from './world2-repository-snapshot-executor-types.js';

export const WORLD2_REPOSITORY_SNAPSHOT_EXECUTOR_PASS_TOKEN =
  'WORLD2_REPOSITORY_SNAPSHOT_EXECUTOR_PASS';
export const WORLD2_REPOSITORY_SNAPSHOT_EXECUTOR_OWNER_MODULE =
  'devpulse_world2_repository_snapshot_executor';
export const WORLD2_REPOSITORY_SNAPSHOT_EXECUTOR_PHASE =
  'Phase 24U — World 2 Repository Snapshot Executor Foundation';
export const WORLD2_REPOSITORY_SNAPSHOT_EXECUTOR_REPORT_TITLE =
  'WORLD2_REPOSITORY_SNAPSHOT_EXECUTOR_REPORT';
export const WORLD2_SNAPSHOT_EXECUTOR_CACHE_KEY_PREFIX = 'world2-repository-snapshot-executor-v1';
export const MAX_SNAPSHOT_EXECUTOR_HISTORY = 16;
export const MAX_SNAPSHOT_EXECUTOR_REASONS = 12;
export const DEFAULT_SNAPSHOT_EXECUTION_MODE: World2SnapshotExecutionMode = 'DRY_RUN';
export const MAX_SNAPSHOT_EXECUTION_TTL_MS = 300_000;

export const WORLD2_SNAPSHOT_EXECUTOR_CORE_QUESTION =
  'Given an approved repository snapshot scope, what exact snapshot execution request is allowed?';

export const WORLD2_SNAPSHOT_EXECUTION_MODES: readonly World2SnapshotExecutionMode[] = [
  'DRY_RUN',
  'SIMULATED_SNAPSHOT',
  'REAL_SNAPSHOT_ELIGIBLE',
  'BLOCKED',
] as const;

export const WORLD2_SNAPSHOT_EXECUTION_STATES: readonly World2SnapshotExecutionState[] = [
  'SNAPSHOT_EXECUTION_READY',
  'SNAPSHOT_EXECUTION_SIMULATED',
  'SNAPSHOT_EXECUTION_BLOCKED',
  'INSUFFICIENT_EVIDENCE',
  'NOT_READY',
] as const;

export const MAX_EXECUTION_FILES = 48;
export const MAX_EXECUTION_DIRECTORIES = 32;
export const MAX_EXECUTION_ESTIMATED_SIZE = 'VERY_LARGE';
export const MAX_EXECUTION_ATTEMPTS = 3;

export const WORLD2_LIVE_PATH_PATTERNS: readonly RegExp[] = [
  /^\/live-devpulse-workspace/i,
  /^\/world1-project-root/i,
  /live-mutation/i,
] as const;

export const WORLD2_PRODUCTION_PATH_PATTERNS: readonly RegExp[] = [
  /^\/production-repositories/i,
  /\/production\//i,
] as const;

export const WORLD2_SECRETS_PATH_PATTERNS: readonly RegExp[] = [
  /\.env$/i,
  /\.env\./i,
  /secrets?\//i,
  /credentials\.json$/i,
  /\.pem$/i,
  /\.key$/i,
] as const;

export const WORLD2_NODE_MODULES_EXCLUSION = 'node_modules/**';

export const WORLD2_GIT_INTERNALS_EXCLUSIONS: readonly string[] = [
  '.git/objects/**',
  '.git/hooks/**',
  '.git/logs/**',
  '.git/refs/**',
] as const;

export const WORLD2_BUILD_OUTPUT_EXCLUSIONS: readonly string[] = [
  'dist/**',
  'build/**',
  'out/**',
  '.next/**',
] as const;

export const WORLD2_CACHE_DIRECTORY_EXCLUSIONS: readonly string[] = [
  '.cache/**',
  'tmp/**',
  '.turbo/**',
  'coverage/**',
] as const;

export const WORLD2_UNBOUNDED_ROOT_COPY_PATTERNS: readonly RegExp[] = [
  /^\/$/,
  /^\*\*$/,
  /^\/world1-project-root\/?$/,
] as const;

export const REQUIRED_SNAPSHOT_EXECUTOR_AUTHORITIES = [
  'world2-repository-snapshot',
  'world2-disposable-workspace-instantiator',
  'world2-disposable-workspace-creator',
] as const;

export const WORLD2_SNAPSHOT_EXECUTOR_SAFETY_GUARANTEES = [
  'No repository copy',
  'No file reads from live repo',
  'No file creation',
  'No file modification',
  'No workspace creation',
  'No code execution',
  'No network access',
  'Default dry-run only',
  'Secrets excluded',
  'node_modules excluded',
  '.git internals excluded',
  'Build and cache outputs excluded',
  'Unbounded root copy blocked',
  'Live workspace mutation blocked',
] as const;

export function isWorld2SnapshotExecutionMode(value: string): value is World2SnapshotExecutionMode {
  return (WORLD2_SNAPSHOT_EXECUTION_MODES as readonly string[]).includes(value);
}

export function isWorld2SnapshotExecutionState(
  value: string,
): value is World2SnapshotExecutionState {
  return (WORLD2_SNAPSHOT_EXECUTION_STATES as readonly string[]).includes(value);
}

export function pathMatchesPatterns(path: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(path));
}

export function isUnboundedRootCopyPath(path: string): boolean {
  return pathMatchesPatterns(path.trim(), WORLD2_UNBOUNDED_ROOT_COPY_PATTERNS);
}

export function pathMatchesSecrets(path: string): boolean {
  return pathMatchesPatterns(path, WORLD2_SECRETS_PATH_PATTERNS);
}
