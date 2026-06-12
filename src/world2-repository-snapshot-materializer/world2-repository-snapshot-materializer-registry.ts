/**
 * World 2 Repository Snapshot Materializer — constants and mode registry.
 */

import type {
  World2SnapshotMaterializationMode,
  World2SnapshotMaterializationState,
} from './world2-repository-snapshot-materializer-types.js';

export const WORLD2_REPOSITORY_SNAPSHOT_MATERIALIZER_PASS_TOKEN =
  'WORLD2_REPOSITORY_SNAPSHOT_MATERIALIZER_PASS';
export const WORLD2_REPOSITORY_SNAPSHOT_MATERIALIZER_OWNER_MODULE =
  'devpulse_world2_repository_snapshot_materializer';
export const WORLD2_REPOSITORY_SNAPSHOT_MATERIALIZER_PHASE =
  'Phase 24V — World 2 Repository Snapshot Materializer';
export const WORLD2_REPOSITORY_SNAPSHOT_MATERIALIZER_REPORT_TITLE =
  'WORLD2_REPOSITORY_SNAPSHOT_MATERIALIZER_REPORT';
export const WORLD2_SNAPSHOT_MATERIALIZER_CACHE_KEY_PREFIX =
  'world2-repository-snapshot-materializer-v1';
export const MAX_SNAPSHOT_MATERIALIZER_HISTORY = 16;
export const MAX_SNAPSHOT_MATERIALIZER_REASONS = 12;
export const DEFAULT_MATERIALIZATION_MODE: World2SnapshotMaterializationMode = 'DRY_RUN';

export const WORLD2_SNAPSHOT_MATERIALIZER_CORE_QUESTION =
  'Can the approved repository snapshot request be materialized into the disposable workspace, and what exact materialization operation would be performed?';

export const WORLD2_SNAPSHOT_MATERIALIZATION_MODES: readonly World2SnapshotMaterializationMode[] = [
  'DRY_RUN',
  'SIMULATED_MATERIALIZATION',
  'REAL_MATERIALIZATION_ELIGIBLE',
  'BLOCKED',
] as const;

export const WORLD2_SNAPSHOT_MATERIALIZATION_STATES: readonly World2SnapshotMaterializationState[] =
  [
    'MATERIALIZATION_READY',
    'MATERIALIZATION_SIMULATED',
    'MATERIALIZATION_BLOCKED',
    'INSUFFICIENT_EVIDENCE',
    'NOT_READY',
  ] as const;

export const WORLD2_DISPOSABLE_WORKSPACE_ROOT_PREFIX = '/world2/disposable/';

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

export const WORLD2_MATERIALIZATION_POSTCONDITIONS: readonly string[] = [
  'No live workspace mutation occurred',
  'No repository copy performed',
  'No live file read performed',
  'Excluded paths remain excluded in target workspace',
  'Validation assets remain referenced',
  'Rollback assets remain referenced',
  'Disposable workspace boundary preserved',
] as const;

export const REQUIRED_SNAPSHOT_MATERIALIZER_AUTHORITIES = [
  'world2-repository-snapshot-executor',
  'world2-repository-snapshot',
  'world2-disposable-workspace-instantiator',
] as const;

export const WORLD2_SNAPSHOT_MATERIALIZER_SAFETY_GUARANTEES = [
  'No repository copy',
  'No live file reads',
  'No file creation',
  'No file modification',
  'No workspace creation',
  'No code execution',
  'No network access',
  'Default dry-run only',
  'Target workspace root disposable-only',
  'Secrets excluded',
  'node_modules excluded',
  '.git internals excluded',
  'Unbounded root copy blocked',
] as const;

export function isWorld2SnapshotMaterializationMode(
  value: string,
): value is World2SnapshotMaterializationMode {
  return (WORLD2_SNAPSHOT_MATERIALIZATION_MODES as readonly string[]).includes(value);
}

export function isWorld2SnapshotMaterializationState(
  value: string,
): value is World2SnapshotMaterializationState {
  return (WORLD2_SNAPSHOT_MATERIALIZATION_STATES as readonly string[]).includes(value);
}

export function resolveTargetWorkspaceRoot(workspaceId: string): string {
  return `${WORLD2_DISPOSABLE_WORKSPACE_ROOT_PREFIX}${workspaceId}`;
}

export function isDisposableOnlyTargetRoot(targetRoot: string): boolean {
  const normalized = targetRoot.replace(/\\/g, '/');
  return (
    normalized.startsWith(WORLD2_DISPOSABLE_WORKSPACE_ROOT_PREFIX) &&
    !pathMatchesPatterns(normalized, WORLD2_LIVE_PATH_PATTERNS) &&
    !pathMatchesPatterns(normalized, WORLD2_PRODUCTION_PATH_PATTERNS)
  );
}

export function pathMatchesPatterns(path: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(path));
}

export function pathMatchesSecrets(path: string): boolean {
  return pathMatchesPatterns(path, WORLD2_SECRETS_PATH_PATTERNS);
}

export function isUnboundedRootCopyPath(path: string): boolean {
  return pathMatchesPatterns(path.trim(), WORLD2_UNBOUNDED_ROOT_COPY_PATTERNS);
}

export function pathMatchesAnyExclusion(path: string, exclusions: readonly string[]): boolean {
  const normalized = path.replace(/\\/g, '/').toLowerCase();
  return exclusions.some((exclusion) => {
    const rule = exclusion.replace(/\\/g, '/').toLowerCase();
    if (rule.endsWith('/**')) {
      const prefix = rule.slice(0, -3);
      return normalized === prefix || normalized.startsWith(`${prefix}/`);
    }
    return normalized === rule || normalized.endsWith(`/${rule}`);
  });
}
