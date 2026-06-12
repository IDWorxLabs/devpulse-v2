/**
 * World 2 Repository Snapshot — constants, exclusions, and bounds registry.
 */

import type { World2SnapshotState } from './world2-repository-snapshot-types.js';

export const WORLD2_REPOSITORY_SNAPSHOT_PASS_TOKEN = 'WORLD2_REPOSITORY_SNAPSHOT_PASS';
export const WORLD2_REPOSITORY_SNAPSHOT_OWNER_MODULE = 'devpulse_world2_repository_snapshot';
export const WORLD2_REPOSITORY_SNAPSHOT_PHASE =
  'Phase 24T — World 2 Repository Snapshot Authority';
export const WORLD2_REPOSITORY_SNAPSHOT_REPORT_TITLE = 'WORLD2_REPOSITORY_SNAPSHOT_REPORT';
export const WORLD2_SNAPSHOT_CACHE_KEY_PREFIX = 'world2-repository-snapshot-v1';
export const MAX_SNAPSHOT_HISTORY = 16;
export const MAX_SNAPSHOT_REASONS = 12;

export const WORLD2_SNAPSHOT_CORE_QUESTION =
  'What repository snapshot is allowed to enter the disposable workspace?';

export const WORLD2_SNAPSHOT_STATES: readonly World2SnapshotState[] = [
  'SNAPSHOT_READY',
  'SNAPSHOT_READY_WITH_RESTRICTIONS',
  'SNAPSHOT_BLOCKED',
  'INSUFFICIENT_EVIDENCE',
  'NOT_READY',
] as const;

export const MAX_SNAPSHOT_FILES = 48;
export const MAX_SNAPSHOT_DIRECTORIES = 32;
export const MAX_SNAPSHOT_ESTIMATED_SIZE = 'VERY_LARGE';
export const MAX_SNAPSHOT_SENSITIVE_MATCHES = 0;
export const MAX_SNAPSHOT_ATTEMPTS = 3;

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

export const WORLD2_GIT_METADATA_ONLY_PATHS: readonly string[] = [
  '.git/HEAD',
  '.git/config',
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
  /^\/{0,1}$/,
] as const;

export const WORLD2_STANDARD_SNAPSHOT_EXCLUSIONS: readonly string[] = [
  WORLD2_NODE_MODULES_EXCLUSION,
  ...WORLD2_GIT_INTERNALS_EXCLUSIONS,
  ...WORLD2_BUILD_OUTPUT_EXCLUSIONS,
  ...WORLD2_CACHE_DIRECTORY_EXCLUSIONS,
  '.env',
  '.env.local',
  '.env.production',
  'secrets/**',
  'credentials.json',
] as const;

export const REQUIRED_SNAPSHOT_AUTHORITIES = [
  'world2-disposable-workspace-instantiator',
  'world2-workspace-materialization',
  'world2-workspace-population',
  'world2-disposable-workspace',
] as const;

export const WORLD2_SNAPSHOT_SAFETY_GUARANTEES = [
  'No repository copy',
  'No file read beyond bounded fixtures',
  'No file creation',
  'No file modification',
  'No workspace creation',
  'No code execution',
  'No network access',
  'Secrets and env files excluded',
  'node_modules excluded',
  '.git internals excluded except metadata-only paths',
  'Build outputs excluded',
  'Cache directories excluded',
  'Unbounded root copy blocked',
  'External network copy blocked',
] as const;

export const WORLD2_SNAPSHOT_SAFETY_CHECK_IDS = [
  'no-live-mutation-paths',
  'no-production-paths',
  'no-secrets-included',
  'node-modules-excluded',
  'git-internals-excluded',
  'build-outputs-excluded',
  'cache-directories-excluded',
  'no-unbounded-root-copy',
  'no-external-network-copy',
  'required-exclusions-present',
] as const;

export function isWorld2SnapshotState(value: string): value is World2SnapshotState {
  return (WORLD2_SNAPSHOT_STATES as readonly string[]).includes(value);
}

export function pathMatchesPatterns(path: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(path));
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

export function isUnboundedRootCopyPath(path: string): boolean {
  return pathMatchesPatterns(path.trim(), WORLD2_UNBOUNDED_ROOT_COPY_PATTERNS);
}

export function isGitMetadataOnlyPath(path: string): boolean {
  const normalized = path.replace(/\\/g, '/');
  return WORLD2_GIT_METADATA_ONLY_PATHS.some(
    (meta) => normalized === meta || normalized.endsWith(`/${meta}`),
  );
}
