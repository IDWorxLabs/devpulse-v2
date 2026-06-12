/**
 * World 2 Disposable Workspace Creator — constants and creation bounds registry.
 */

import type { World2CreationState } from './world2-disposable-workspace-creator-types.js';

export const WORLD2_DISPOSABLE_WORKSPACE_CREATOR_PASS_TOKEN =
  'WORLD2_DISPOSABLE_WORKSPACE_CREATOR_PASS';
export const WORLD2_DISPOSABLE_WORKSPACE_CREATOR_OWNER_MODULE =
  'devpulse_world2_disposable_workspace_creator';
export const WORLD2_DISPOSABLE_WORKSPACE_CREATOR_PHASE =
  'Phase 24R — World 2 Disposable Workspace Creator Foundation';
export const WORLD2_DISPOSABLE_WORKSPACE_CREATOR_REPORT_TITLE =
  'WORLD2_DISPOSABLE_WORKSPACE_CREATOR_REPORT';
export const WORLD2_CREATOR_CACHE_KEY_PREFIX = 'world2-disposable-workspace-creator-v1';
export const MAX_CREATOR_HISTORY = 16;
export const MAX_CREATOR_REASONS = 12;

export const WORLD2_CREATOR_CORE_QUESTION =
  'Given an approved instantiation, what disposable workspace creation plan is allowed?';

export const WORLD2_CREATION_STATES: readonly World2CreationState[] = [
  'CREATION_READY',
  'CREATION_READY_WITH_RESTRICTIONS',
  'CREATION_BLOCKED',
  'INSUFFICIENT_EVIDENCE',
  'NOT_READY',
] as const;

export const MAX_CREATION_DIRECTORIES = 24;
export const MAX_CREATION_FILES = 32;
export const MAX_CREATION_ARTIFACTS = 32;
export const MAX_CREATION_ATTEMPTS = 3;
export const MAX_CREATION_TTL_MS = 300_000;
export const MAX_ESTIMATED_SIZE_LABEL = 'VERY_LARGE';

export const WORLD2_LIVE_PATH_PATTERNS: readonly RegExp[] = [
  /^\/live-devpulse-workspace/i,
  /^\/world1-project-root/i,
] as const;

export const WORLD2_PRODUCTION_PATH_PATTERNS: readonly RegExp[] = [
  /^\/production-repositories/i,
  /\/production\//i,
] as const;

export const REQUIRED_CREATOR_AUTHORITIES = [
  'world2-workspace-instantiation-governance',
  'world2-workspace-materialization',
  'world2-disposable-workspace',
  'world2-workspace-population',
] as const;

export const WORLD2_CREATOR_SAFETY_GUARANTEES = [
  'No real workspace creation',
  'No directory creation',
  'No file creation',
  'No repository copy',
  'No code execution',
  'No live workspace path',
  'No production path mutation',
  'Disposable workspace only',
  'Rollback assets required',
  'Validation assets required',
  'Disposal policy required',
  'Expiration policy required',
] as const;

export function isWorld2CreationState(value: string): value is World2CreationState {
  return (WORLD2_CREATION_STATES as readonly string[]).includes(value);
}

export function resolvePlannedRoot(workspaceId: string): string {
  return `/world2/disposable/${workspaceId}`;
}
