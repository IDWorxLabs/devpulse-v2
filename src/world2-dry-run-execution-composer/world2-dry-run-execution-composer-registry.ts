/**
 * World 2 Dry-Run Execution Composer — constants and registry.
 */

import type { World2DryRunPackageState } from './world2-dry-run-execution-composer-types.js';

export const WORLD2_DRY_RUN_EXECUTION_COMPOSER_PASS_TOKEN =
  'WORLD2_DRY_RUN_EXECUTION_COMPOSER_PASS';
export const WORLD2_DRY_RUN_EXECUTION_COMPOSER_OWNER_MODULE =
  'devpulse_world2_dry_run_execution_composer';
export const WORLD2_DRY_RUN_EXECUTION_COMPOSER_PHASE =
  'Phase 24X — World 2 Dry-Run Execution Composer';
export const WORLD2_DRY_RUN_EXECUTION_COMPOSER_REPORT_TITLE =
  'WORLD2_DRY_RUN_EXECUTION_COMPOSER_REPORT';
export const WORLD2_DRY_RUN_COMPOSER_CACHE_KEY_PREFIX = 'world2-dry-run-execution-composer-v1';
export const MAX_DRY_RUN_COMPOSER_HISTORY = 16;
export const MAX_DRY_RUN_COMPOSER_REASONS = 12;
export const MAX_ORDERED_STEPS = 8;
export const MAX_VALIDATION_STEPS = 16;
export const MAX_ROLLBACK_STEPS = 16;
export const MAX_AUDIT_TRAIL_ENTRIES = 16;

export const WORLD2_DRY_RUN_COMPOSER_CORE_QUESTION =
  'What complete ordered dry-run execution package would World 2 run?';

export const WORLD2_DRY_RUN_PACKAGE_STATES: readonly World2DryRunPackageState[] = [
  'DRY_RUN_PACKAGE_READY',
  'DRY_RUN_PACKAGE_READY_WITH_WARNINGS',
  'DRY_RUN_PACKAGE_BLOCKED',
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

export const WORLD2_DRY_RUN_ORDERED_STEP_DEFINITIONS: readonly {
  stepId: string;
  order: number;
  label: string;
  description: string;
  sourceAuthority: string;
}[] = [
  {
    stepId: 'prepare-disposable-workspace-root',
    order: 1,
    label: 'Prepare disposable workspace root',
    description: 'Resolve and validate disposable-only workspace root before any materialization.',
    sourceAuthority: 'world2-disposable-workspace-instantiator',
  },
  {
    stepId: 'materialize-repository-snapshot',
    order: 2,
    label: 'Materialize repository snapshot',
    description: 'Apply bounded snapshot materialization plan inside disposable workspace (dry-run).',
    sourceAuthority: 'world2-repository-snapshot-materializer',
  },
  {
    stepId: 'apply-change-set-materialization-plan',
    order: 3,
    label: 'Apply change-set materialization plan',
    description: 'Apply bounded change-set file operation plan inside disposable workspace (dry-run).',
    sourceAuthority: 'world2-change-set-materializer',
  },
  {
    stepId: 'run-validation-requirements',
    order: 4,
    label: 'Run validation requirements',
    description: 'Collect required validation signals without live mutation or command execution.',
    sourceAuthority: 'world2-controlled-execution-runtime',
  },
  {
    stepId: 'collect-execution-proof-requirements',
    order: 5,
    label: 'Collect execution proof requirements',
    description: 'Record execution proof and acceptance requirements for post-materialization audit.',
    sourceAuthority: 'world2-execution-engine',
  },
  {
    stepId: 'prepare-rollback-disposal',
    order: 6,
    label: 'Prepare rollback/disposal',
    description: 'Prepare rollback map and disposable workspace disposal plan without executing disposal.',
    sourceAuthority: 'world2-dry-run-execution-composer',
  },
] as const;

export const WORLD2_DRY_RUN_PACKAGE_POSTCONDITIONS: readonly string[] = [
  'No real file creation performed',
  'No real file modification performed',
  'No real file deletion performed',
  'No repository copy performed',
  'No workspace creation performed',
  'No command execution performed',
  'realExecutionPerformed remains false',
] as const;

export const REQUIRED_DRY_RUN_COMPOSER_AUTHORITIES = [
  'world2-repository-snapshot-materializer',
  'world2-change-set-materializer',
  'world2-execution-engine',
  'world2-controlled-execution-runtime',
] as const;

export const WORLD2_DRY_RUN_COMPOSER_SAFETY_GUARANTEES = [
  'No real file creation',
  'No real file modification',
  'No real file deletion',
  'No repository copy',
  'No workspace creation',
  'No command execution',
  'No browser startup',
  'No server startup',
  'No network access',
  'Bounded fixtures only',
  'Default dry-run only',
  'realExecutionPerformed always false',
] as const;

export function isWorld2DryRunPackageState(value: string): value is World2DryRunPackageState {
  return (WORLD2_DRY_RUN_PACKAGE_STATES as readonly string[]).includes(value);
}

export function pathMatchesPatterns(path: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(path));
}

export function isDisposableOnlyTargetRoot(targetRoot: string): boolean {
  const normalized = targetRoot.replace(/\\/g, '/');
  return (
    normalized.startsWith(WORLD2_DISPOSABLE_WORKSPACE_ROOT_PREFIX) &&
    !pathMatchesPatterns(normalized, WORLD2_LIVE_PATH_PATTERNS) &&
    !pathMatchesPatterns(normalized, WORLD2_PRODUCTION_PATH_PATTERNS)
  );
}
