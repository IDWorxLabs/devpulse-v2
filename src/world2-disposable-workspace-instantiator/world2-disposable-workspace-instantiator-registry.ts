/**
 * World 2 Disposable Workspace Instantiator — constants and mode registry.
 */

import type {
  World2InstantiationMode,
  World2InstantiationResultState,
} from './world2-disposable-workspace-instantiator-types.js';

export const WORLD2_DISPOSABLE_WORKSPACE_INSTANTIATOR_PASS_TOKEN =
  'WORLD2_DISPOSABLE_WORKSPACE_INSTANTIATOR_PASS';
export const WORLD2_DISPOSABLE_WORKSPACE_INSTANTIATOR_OWNER_MODULE =
  'devpulse_world2_disposable_workspace_instantiator';
export const WORLD2_DISPOSABLE_WORKSPACE_INSTANTIATOR_PHASE =
  'Phase 24S — World 2 Disposable Workspace Instantiator';
export const WORLD2_DISPOSABLE_WORKSPACE_INSTANTIATOR_REPORT_TITLE =
  'WORLD2_DISPOSABLE_WORKSPACE_INSTANTIATOR_REPORT';
export const WORLD2_INSTANTIATOR_CACHE_KEY_PREFIX = 'world2-disposable-workspace-instantiator-v1';
export const MAX_INSTANTIATOR_HISTORY = 16;
export const MAX_INSTANTIATOR_REASONS = 12;
export const DEFAULT_INSTANTIATION_MODE: World2InstantiationMode = 'DRY_RUN';

export const WORLD2_INSTANTIATOR_CORE_QUESTION =
  'Can DevPulse instantiate a disposable workspace request safely, and what exact instantiation operation would be performed?';

export const WORLD2_INSTANTIATION_MODES: readonly World2InstantiationMode[] = [
  'DRY_RUN',
  'SIMULATED_INSTANTIATION',
  'REAL_INSTANTIATION_ELIGIBLE',
  'BLOCKED',
] as const;

export const WORLD2_INSTANTIATION_RESULT_STATES: readonly World2InstantiationResultState[] = [
  'INSTANTIATION_READY',
  'INSTANTIATION_SIMULATED',
  'INSTANTIATION_BLOCKED',
  'INSUFFICIENT_EVIDENCE',
  'NOT_READY',
] as const;

export const WORLD2_LIVE_PATH_PATTERNS: readonly RegExp[] = [
  /^\/live-devpulse-workspace/i,
  /^\/world1-project-root/i,
] as const;

export const WORLD2_PRODUCTION_PATH_PATTERNS: readonly RegExp[] = [
  /^\/production-repositories/i,
  /\/production\//i,
] as const;

export const REQUIRED_INSTANTIATOR_AUTHORITIES = [
  'world2-disposable-workspace-creator',
  'world2-workspace-materialization',
  'world2-workspace-instantiation-governance',
] as const;

export const WORLD2_INSTANTIATOR_SAFETY_GUARANTEES = [
  'No repository copy',
  'No change set application',
  'No live workspace mutation',
  'No production mutation',
  'No code execution',
  'No browser startup',
  'No server startup',
  'No network access',
  'Default dry-run only',
  'Creator foundation gate required',
  'Disposal policy required',
  'Validation assets required',
  'Rollback assets required',
  'Expiration policy required',
] as const;

export const WORLD2_INSTANTIATOR_SAFETY_CHECK_IDS = [
  'creator-state-eligible',
  'planned-root-not-live',
  'planned-root-not-production',
  'disposal-policy-present',
  'validation-assets-present',
  'rollback-assets-present',
  'expiration-policy-present',
  'no-repository-copy',
  'no-change-set-application',
] as const;

export function isWorld2InstantiationMode(value: string): value is World2InstantiationMode {
  return (WORLD2_INSTANTIATION_MODES as readonly string[]).includes(value);
}

export function isWorld2InstantiationResultState(
  value: string,
): value is World2InstantiationResultState {
  return (WORLD2_INSTANTIATION_RESULT_STATES as readonly string[]).includes(value);
}

export function pathMatchesPatterns(path: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(path));
}
