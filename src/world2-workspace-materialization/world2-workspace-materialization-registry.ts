/**
 * World 2 Workspace Materialization — constants and blueprint registry.
 */

import type {
  World2MaterializationState,
  World2WorkspaceSizeEstimate,
} from './world2-workspace-materialization-types.js';

export const WORLD2_WORKSPACE_MATERIALIZATION_PASS_TOKEN = 'WORLD2_WORKSPACE_MATERIALIZATION_PASS';
export const WORLD2_WORKSPACE_MATERIALIZATION_OWNER_MODULE =
  'devpulse_world2_workspace_materialization';
export const WORLD2_WORKSPACE_MATERIALIZATION_PHASE =
  'Phase 24P — World 2 Workspace Materialization Authority';
export const WORLD2_WORKSPACE_MATERIALIZATION_REPORT_TITLE =
  'WORLD2_WORKSPACE_MATERIALIZATION_REPORT';
export const WORLD2_MATERIALIZATION_CACHE_KEY_PREFIX = 'world2-workspace-materialization-v1';
export const MAX_MATERIALIZATION_HISTORY = 16;
export const MAX_MATERIALIZATION_REASONS = 12;
export const MAX_BLUEPRINT_ENTRIES = 48;

export const WORLD2_MATERIALIZATION_CORE_QUESTION = 'What exact workspace would be created?';

export const WORLD2_MATERIALIZATION_STATES: readonly World2MaterializationState[] = [
  'NOT_READY',
  'READY',
  'READY_WITH_WARNINGS',
  'BLOCKED',
  'INSUFFICIENT_EVIDENCE',
] as const;

export const WORLD2_WORKSPACE_SIZE_ESTIMATES: readonly World2WorkspaceSizeEstimate[] = [
  'SMALL',
  'MEDIUM',
  'LARGE',
  'VERY_LARGE',
] as const;

export const REQUIRED_MATERIALIZATION_AUTHORITIES = [
  'world2-workspace-population',
  'world2-disposable-workspace',
  'world2-change-set-authority',
] as const;

export const WORLD2_FORBIDDEN_BLUEPRINT_PATTERNS: readonly RegExp[] = [
  /^\/live-devpulse-workspace/i,
  /^\/world1-project-root/i,
  /^\/production-repositories/i,
  /\/production\//i,
] as const;

export function isWorld2MaterializationState(value: string): value is World2MaterializationState {
  return (WORLD2_MATERIALIZATION_STATES as readonly string[]).includes(value);
}

export function isWorld2WorkspaceSizeEstimate(value: string): value is World2WorkspaceSizeEstimate {
  return (WORLD2_WORKSPACE_SIZE_ESTIMATES as readonly string[]).includes(value);
}

export function computeWorkspaceSizeEstimate(input: {
  directoryCount: number;
  fileCount: number;
  artifactCount: number;
}): World2WorkspaceSizeEstimate {
  const total = input.directoryCount + input.fileCount + input.artifactCount;
  if (total <= 8) return 'SMALL';
  if (total <= 16) return 'MEDIUM';
  if (total <= 32) return 'LARGE';
  return 'VERY_LARGE';
}
