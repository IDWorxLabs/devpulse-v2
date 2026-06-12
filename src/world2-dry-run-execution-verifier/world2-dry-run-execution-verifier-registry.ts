/**
 * World 2 Dry-Run Execution Verifier — constants and registry.
 */

import { WORLD2_DRY_RUN_ORDERED_STEP_DEFINITIONS } from '../world2-dry-run-execution-composer/world2-dry-run-execution-composer-registry.js';
import type { World2DryRunVerificationState } from './world2-dry-run-execution-verifier-types.js';

export const WORLD2_DRY_RUN_EXECUTION_VERIFIER_PASS_TOKEN =
  'WORLD2_DRY_RUN_EXECUTION_VERIFIER_PASS';
export const WORLD2_DRY_RUN_EXECUTION_VERIFIER_OWNER_MODULE =
  'devpulse_world2_dry_run_execution_verifier';
export const WORLD2_DRY_RUN_EXECUTION_VERIFIER_PHASE =
  'Phase 24Y — World 2 Dry-Run Execution Verifier';
export const WORLD2_DRY_RUN_EXECUTION_VERIFIER_REPORT_TITLE =
  'WORLD2_DRY_RUN_EXECUTION_VERIFIER_REPORT';
export const WORLD2_DRY_RUN_VERIFIER_CACHE_KEY_PREFIX = 'world2-dry-run-execution-verifier-v1';
export const MAX_DRY_RUN_VERIFIER_HISTORY = 16;
export const MAX_DRY_RUN_VERIFIER_REASONS = 12;
export const MAX_MISSING_COVERAGE = 12;

export const WORLD2_DRY_RUN_VERIFIER_CORE_QUESTION =
  'Is the composed dry-run World 2 execution package valid enough to be considered execution-ready later?';

export const WORLD2_DRY_RUN_VERIFICATION_STATES: readonly World2DryRunVerificationState[] = [
  'VERIFIED',
  'VERIFIED_WITH_WARNINGS',
  'FAILED',
  'INSUFFICIENT_EVIDENCE',
  'NOT_READY',
] as const;

export const REQUIRED_ORDERED_STEP_DEFINITIONS = WORLD2_DRY_RUN_ORDERED_STEP_DEFINITIONS;

export const READINESS_SCORE_WEIGHTS = {
  orderedSteps: 25,
  safetyChecks: 20,
  validationCoverage: 20,
  rollbackCoverage: 15,
  auditCoverage: 10,
  upstreamConsistency: 10,
} as const;

export const VERIFIED_MIN_SCORE = 90;
export const VERIFIED_WITH_WARNINGS_MIN_SCORE = 75;

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

export const REQUIRED_VERIFIER_AUTHORITIES = [
  'world2-dry-run-execution-composer',
  'world2-repository-snapshot-materializer',
  'world2-change-set-materializer',
  'world2-execution-engine',
] as const;

export const WORLD2_DRY_RUN_VERIFIER_SAFETY_GUARANTEES = [
  'No real execution',
  'No command execution',
  'No file creation',
  'No file modification',
  'No repository copy',
  'No workspace creation',
  'No browser startup',
  'No server startup',
  'No network access',
  'Bounded fixtures only',
  'realExecutionPerformed always false',
] as const;

export const SNAPSHOT_MATERIALIZER_SAFETY_CHECK_IDS = [
  'instantiator-not-blocked',
  'target-root-disposable-only',
  'no-live-workspace-path',
  'no-production-path',
  'repository-copy-not-performed',
] as const;

export const CHANGE_MATERIALIZER_SAFETY_CHECK_IDS = [
  'change-set-state-eligible',
  'workspace-materialization-eligible',
  'snapshot-materializer-not-blocked',
  'instantiator-not-blocked',
  'target-root-disposable-only',
  'no-live-workspace-path',
  'no-production-path',
  'no-unbounded-delete',
  'rollback-map-complete',
  'verification-requirements-complete',
] as const;

export const ENGINE_STEP_ACTION_TYPES = [
  'PLAN_STEP',
  'VALIDATION_STEP',
  'ROLLBACK_CHECK',
] as const;

export function isWorld2DryRunVerificationState(
  value: string,
): value is World2DryRunVerificationState {
  return (WORLD2_DRY_RUN_VERIFICATION_STATES as readonly string[]).includes(value);
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
