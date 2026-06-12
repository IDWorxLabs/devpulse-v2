/**
 * World 2 Disposable Workspace — constants, paths, and boundary registry.
 */

import type {
  World2IsolationMode,
  World2WorkspaceLifecycleDecision,
  World2WorkspaceState,
} from './world2-disposable-workspace-types.js';

export const WORLD2_DISPOSABLE_WORKSPACE_PASS_TOKEN = 'WORLD2_DISPOSABLE_WORKSPACE_PASS';
export const WORLD2_DISPOSABLE_WORKSPACE_OWNER_MODULE = 'devpulse_world2_disposable_workspace';
export const WORLD2_DISPOSABLE_WORKSPACE_PHASE = 'Phase 24M — World 2 Disposable Workspace Authority';
export const WORLD2_DISPOSABLE_WORKSPACE_REPORT_TITLE = 'WORLD2_DISPOSABLE_WORKSPACE_REPORT';
export const WORLD2_DISPOSABLE_CACHE_KEY_PREFIX = 'world2-disposable-workspace-v1';
export const MAX_DISPOSABLE_WORKSPACE_HISTORY = 16;
export const MAX_DISPOSABLE_WORKSPACE_REASONS = 12;

export const WORLD2_DISPOSABLE_CORE_QUESTION =
  'Is there a safe disposable workspace boundary for this World 2 execution?';

export const WORLD2_WORKSPACE_STATES: readonly World2WorkspaceState[] = [
  'NOT_CREATED',
  'READY',
  'READY_WITH_WARNINGS',
  'BLOCKED',
  'DISPOSED',
  'INSUFFICIENT_EVIDENCE',
] as const;

export const WORLD2_ISOLATION_MODES: readonly World2IsolationMode[] = [
  'DRY_RUN_ONLY',
  'SIMULATED_WORKSPACE',
  'DISPOSABLE_COPY_ELIGIBLE',
  'BLOCKED',
] as const;

export const WORLD2_LIFECYCLE_DECISIONS: readonly World2WorkspaceLifecycleDecision[] = [
  'CREATE_ALLOWED',
  'CREATE_WITH_RESTRICTIONS',
  'DO_NOT_CREATE',
  'DISPOSE_REQUIRED',
  'ESCALATE',
] as const;

export const WORLD2_FORBIDDEN_PATHS: readonly string[] = [
  '/live-devpulse-workspace',
  '/world1-project-root',
  '/production-repositories',
  '/.git/hooks/live-mutation',
  '/node_modules/live-symlink',
  '/architecture/live-mutation-lock',
] as const;

export const WORLD2_ALLOWED_PATHS: readonly string[] = [
  '/world2/disposable/{workspaceId}',
  '/world2/simulated/{workspaceId}',
  '/world2/dry-run/{workspaceId}',
  '/world2/audit/{workspaceId}',
] as const;

export const WORLD2_FORBIDDEN_OPERATIONS: readonly string[] = [
  'Modify live DevPulse workspace',
  'Modify World 1 live project workspace',
  'Delete production repositories',
  'Delete project history',
  'Bypass disposal requirement',
  'Bypass validation requirement',
  'External network mutation against production',
] as const;

export const WORLD2_ALLOWED_OPERATIONS: readonly string[] = [
  'Define disposable workspace boundary',
  'Simulate workspace lifecycle',
  'Validate isolation contract',
  'Record rollback reference',
  'Mark disposal required',
  'Generate workspace authority report',
] as const;

export const REQUIRED_DISPOSABLE_WORKSPACE_AUTHORITIES = [
  'world2-controlled-execution-runtime',
  'world2-execution-engine',
  'autonomous-builder-execution-sandbox',
] as const;

export const DEFAULT_SOURCE_PROJECT_ID = 'devpulse-v2-live';

export function isWorld2WorkspaceState(value: string): value is World2WorkspaceState {
  return (WORLD2_WORKSPACE_STATES as readonly string[]).includes(value);
}

export function isWorld2IsolationMode(value: string): value is World2IsolationMode {
  return (WORLD2_ISOLATION_MODES as readonly string[]).includes(value);
}

export function isWorld2WorkspaceLifecycleDecision(
  value: string,
): value is World2WorkspaceLifecycleDecision {
  return (WORLD2_LIFECYCLE_DECISIONS as readonly string[]).includes(value);
}

export function resolveAllowedPaths(workspaceId: string): string[] {
  return WORLD2_ALLOWED_PATHS.map((p) => p.replace('{workspaceId}', workspaceId));
}
