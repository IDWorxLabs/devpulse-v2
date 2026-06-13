/**
 * Connected Verification Execution — constants and registry.
 */

import type { VerificationExecutionState } from './connected-verification-execution-types.js';

export const CONNECTED_VERIFICATION_EXECUTION_PASS_TOKEN = 'CONNECTED_VERIFICATION_EXECUTION_PASS';
export const CONNECTED_VERIFICATION_EXECUTION_OWNER_MODULE = 'devpulse_connected_verification_execution';
export const CONNECTED_VERIFICATION_EXECUTION_PHASE = 'Phase 25.30 — Connected Verification Execution';
export const CONNECTED_VERIFICATION_EXECUTION_REPORT_TITLE = 'CONNECTED_VERIFICATION_EXECUTION_REPORT';
export const CONNECTED_VERIFICATION_EXECUTION_CACHE_KEY_PREFIX = 'connected-verification-execution-v1';
export const MAX_CONNECTED_VERIFICATION_EXECUTION_HISTORY = 16;
export const MAX_VERIFICATION_WARNINGS = 12;
export const MAX_VERIFICATION_BLOCKERS = 12;
export const MAX_RECOMMENDED_ACTIONS = 12;
export const MAX_VERIFICATION_ARTIFACTS = 16;
export const MAX_VERIFICATION_EVIDENCE = 32;
export const MAX_VERIFICATION_DIAGNOSTICS = 16;
export const MAX_VERIFICATION_RESULTS = 24;
export const VERIFICATION_PROBE_TIMEOUT_MS = 8_000;

export const CONNECTED_VERIFICATION_EXECUTION_CORE_QUESTION =
  'Can AiDevEngine actually verify a generated application and collect proof of verification?';

export const VERIFICATION_EXECUTION_STATES: readonly VerificationExecutionState[] = [
  'VERIFICATION_EXECUTED',
  'VERIFICATION_EXECUTED_WITH_WARNINGS',
  'VERIFICATION_EXECUTION_FAILED',
  'VERIFICATION_EXECUTION_BLOCKED',
  'INSUFFICIENT_EVIDENCE',
] as const;

export const REQUIRED_BOUNDED_CHECKS = [
  'workspace-exists',
  'generated-files-exist',
  'build-artifacts-exist',
  'runtime-evidence-exists',
  'preview-evidence-exists',
  'preview-url-reachable',
  'preview-response-successful',
  'verification-artifact-written',
] as const;

export const OPTIONAL_BOUNDED_CHECKS = [
  'package-metadata-exists',
  'startup-marker-exists',
  'preview-marker-exists',
  'founder-metadata-exists',
] as const;

export const VERIFICATION_PLAN = [
  ...REQUIRED_BOUNDED_CHECKS,
  ...OPTIONAL_BOUNDED_CHECKS,
] as const;

export const REQUIRED_INPUT_AUTHORITIES = [
  'connected-live-preview-execution',
  'connected-verification-foundation',
  'verification-reality',
  'execution-verification-loop',
  'world2-dry-run-execution-verifier',
  'founder-acceptance-gate',
  'execution-proof-evolution',
  'connected-runtime-execution',
  'connected-build-execution',
  'connected-workspace-creation',
] as const;

export const ORCHESTRATION_FLOW = [
  'Execution Plan',
  'Workspace Created',
  'Build Executed',
  'Runtime Activated',
  'Live Preview Activated',
  'Verification Foundation',
  'Real Verification Execution',
  'Verification Evidence',
] as const;

export const VERIFICATION_EXECUTION_SAFETY_GUARANTEES = [
  'Bounded execution only — max 1 verification execution per validation run',
  'Automatic runtime and workspace cleanup after validation',
  'No World 1 mutation',
  'No production deployment',
  'No external infrastructure mutation',
  'No full UVL execution',
  'No browser startup',
  'No unbounded validator suite execution',
  'Verification only inside generated builder workspaces root',
] as const;

export function isVerificationExecutionState(value: string): value is VerificationExecutionState {
  return (VERIFICATION_EXECUTION_STATES as readonly string[]).includes(value);
}
