/**
 * World 2 Change Set Materializer — constants and mode registry.
 */

import type {
  World2ChangeMaterializationMode,
  World2ChangeMaterializationState,
} from './world2-change-set-materializer-types.js';

export const WORLD2_CHANGE_SET_MATERIALIZER_PASS_TOKEN = 'WORLD2_CHANGE_SET_MATERIALIZER_PASS';
export const WORLD2_CHANGE_SET_MATERIALIZER_OWNER_MODULE =
  'devpulse_world2_change_set_materializer';
export const WORLD2_CHANGE_SET_MATERIALIZER_PHASE =
  'Phase 24W — World 2 Change Set Materializer';
export const WORLD2_CHANGE_SET_MATERIALIZER_REPORT_TITLE =
  'WORLD2_CHANGE_SET_MATERIALIZER_REPORT';
export const WORLD2_CHANGE_MATERIALIZER_CACHE_KEY_PREFIX = 'world2-change-set-materializer-v1';
export const MAX_CHANGE_MATERIALIZER_HISTORY = 16;
export const MAX_CHANGE_MATERIALIZER_REASONS = 12;
export const DEFAULT_CHANGE_MATERIALIZATION_MODE: World2ChangeMaterializationMode = 'DRY_RUN';
export const MAX_PLANNED_OPERATIONS = 32;

export const WORLD2_CHANGE_MATERIALIZER_CORE_QUESTION =
  'Can the approved change set be materialized inside the disposable workspace, and what exact file operations would be performed?';

export const WORLD2_CHANGE_MATERIALIZATION_MODES: readonly World2ChangeMaterializationMode[] = [
  'DRY_RUN',
  'SIMULATED_CHANGE_MATERIALIZATION',
  'REAL_CHANGE_MATERIALIZATION_ELIGIBLE',
  'BLOCKED',
] as const;

export const WORLD2_CHANGE_MATERIALIZATION_STATES: readonly World2ChangeMaterializationState[] =
  [
    'CHANGE_MATERIALIZATION_READY',
    'CHANGE_MATERIALIZATION_SIMULATED',
    'CHANGE_MATERIALIZATION_BLOCKED',
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
  /\/prod\//i,
] as const;

export const MAX_UNBOUNDED_DELETE_THRESHOLD = 3;

export const WORLD2_CHANGE_MATERIALIZATION_POSTCONDITIONS: readonly string[] = [
  'No real file creation performed',
  'No real file modification performed',
  'No real file deletion performed',
  'No repository copy performed',
  'Disposable workspace boundary preserved',
  'Rollback map recorded for mutating operations',
  'Verification requirements preserved',
] as const;

export const REQUIRED_CHANGE_SET_MATERIALIZER_AUTHORITIES = [
  'world2-change-set-authority',
  'world2-workspace-materialization',
  'world2-repository-snapshot-materializer',
  'world2-disposable-workspace-instantiator',
] as const;

export const WORLD2_CHANGE_MATERIALIZER_SAFETY_GUARANTEES = [
  'No real file creation',
  'No real file modification',
  'No real file deletion',
  'No repository copy',
  'No workspace creation',
  'No code execution',
  'No network access',
  'Default dry-run only',
  'Target workspace root disposable-only',
  'Rollback map required',
  'Verification required',
  'Unbounded delete blocked',
] as const;

export function isWorld2ChangeMaterializationMode(
  value: string,
): value is World2ChangeMaterializationMode {
  return (WORLD2_CHANGE_MATERIALIZATION_MODES as readonly string[]).includes(value);
}

export function isWorld2ChangeMaterializationState(
  value: string,
): value is World2ChangeMaterializationState {
  return (WORLD2_CHANGE_MATERIALIZATION_STATES as readonly string[]).includes(value);
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

export function isMutatingOperationType(
  operationType: string,
): boolean {
  return (
    operationType === 'CREATE_FILE' ||
    operationType === 'MODIFY_FILE' ||
    operationType === 'DELETE_FILE' ||
    operationType === 'MOVE_FILE' ||
    operationType === 'CREATE_DIRECTORY' ||
    operationType === 'DELETE_DIRECTORY'
  );
}

export function isDeleteOperationType(operationType: string): boolean {
  return operationType === 'DELETE_FILE' || operationType === 'DELETE_DIRECTORY';
}
