/**
 * World 2 Change Set Authority — constants, operation registry, and safety bounds.
 */

import type {
  World2ChangeOperationType,
  World2ChangeSetEligibilityState,
  World2ChangeImpactLevel,
} from './world2-change-set-types.js';

export const WORLD2_CHANGE_SET_AUTHORITY_PASS_TOKEN = 'WORLD2_CHANGE_SET_AUTHORITY_PASS';
export const WORLD2_CHANGE_SET_AUTHORITY_OWNER_MODULE = 'devpulse_world2_change_set_authority';
export const WORLD2_CHANGE_SET_AUTHORITY_PHASE = 'Phase 24N — World 2 Change Set Authority';
export const WORLD2_CHANGE_SET_AUTHORITY_REPORT_TITLE = 'WORLD2_CHANGE_SET_AUTHORITY_REPORT';
export const WORLD2_CHANGE_SET_CACHE_KEY_PREFIX = 'world2-change-set-authority-v1';
export const MAX_CHANGE_SET_HISTORY = 16;
export const MAX_CHANGE_SET_REASONS = 12;
export const MAX_OPERATIONS_PER_CHANGE_SET = 32;
export const MAX_DELETE_OPERATIONS = 3;

export const WORLD2_CHANGE_SET_CORE_QUESTION =
  'What exact changes would World 2 be allowed to perform?';

export const WORLD2_CHANGE_OPERATION_TYPES: readonly World2ChangeOperationType[] = [
  'CREATE_FILE',
  'MODIFY_FILE',
  'DELETE_FILE',
  'MOVE_FILE',
  'CREATE_DIRECTORY',
  'DELETE_DIRECTORY',
  'NO_CHANGE',
] as const;

export const WORLD2_CHANGE_ELIGIBILITY_STATES: readonly World2ChangeSetEligibilityState[] = [
  'READY',
  'READY_WITH_WARNINGS',
  'BLOCKED',
  'INSUFFICIENT_EVIDENCE',
] as const;

export const WORLD2_CHANGE_IMPACT_LEVELS: readonly World2ChangeImpactLevel[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
] as const;

export const WORLD2_BLOCKED_PATH_PATTERNS: readonly RegExp[] = [
  /^\/live-devpulse-workspace/i,
  /^\/world1-project-root/i,
  /^\/production-repositories/i,
  /^\/architecture\/live-mutation-lock/i,
  /^\s*$/,
  /^undefined$/i,
  /^null$/i,
] as const;

export const WORLD2_PRODUCTION_PATH_PATTERNS: readonly RegExp[] = [
  /\/production\//i,
  /\/prod\//i,
  /\.env\.production/i,
] as const;

export const REQUIRED_CHANGE_SET_AUTHORITIES = [
  'world2-disposable-workspace',
  'world2-execution-engine',
  'autonomous-builder-execution-planner',
] as const;

export function isWorld2ChangeOperationType(value: string): value is World2ChangeOperationType {
  return (WORLD2_CHANGE_OPERATION_TYPES as readonly string[]).includes(value);
}

export function isWorld2ChangeSetEligibilityState(
  value: string,
): value is World2ChangeSetEligibilityState {
  return (WORLD2_CHANGE_ELIGIBILITY_STATES as readonly string[]).includes(value);
}

export function resolveWorld2TargetPath(workspaceId: string, relativePath: string): string {
  const clean = relativePath.replace(/^\/+/, '');
  return `/world2/disposable/${workspaceId}/${clean}`;
}
