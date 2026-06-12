/**
 * Connected Verification Foundation — constants and registry.
 */

import type { VerificationState } from './connected-verification-types.js';

export const CONNECTED_VERIFICATION_FOUNDATION_PASS_TOKEN = 'CONNECTED_VERIFICATION_FOUNDATION_PASS';
export const CONNECTED_VERIFICATION_OWNER_MODULE = 'devpulse_connected_verification_foundation';
export const CONNECTED_VERIFICATION_PHASE = 'Phase 25.23 — Connected Verification Foundation';
export const CONNECTED_VERIFICATION_REPORT_TITLE = 'CONNECTED_VERIFICATION_FOUNDATION_REPORT';
export const CONNECTED_VERIFICATION_CACHE_KEY_PREFIX = 'connected-verification-foundation-v1';
export const MAX_CONNECTED_VERIFICATION_HISTORY = 16;
export const MAX_VERIFICATION_ENTRIES = 32;
export const MAX_RECOMMENDED_ACTIONS = 12;
export const MAX_MISSING_COMPONENTS = 12;

export const CONNECTED_VERIFICATION_CORE_QUESTION =
  'Can AiDevEngine prove that a generated application is capable of being verified?';

export const VERIFICATION_STATES: readonly VerificationState[] = [
  'VERIFICATION_READY',
  'VERIFICATION_READY_WITH_WARNINGS',
  'VERIFICATION_NOT_READY',
  'VERIFICATION_BLOCKED',
  'INSUFFICIENT_EVIDENCE',
] as const;

export const REQUIRED_INPUT_AUTHORITIES = [
  'connected-live-preview-foundation',
  'connected-runtime-activation-foundation',
  'connected-build-execution-foundation',
  'verification-reality',
  'founder-test-launch-readiness',
  'execution-verification-loop',
  'execution-package-runtime',
  'world2-dry-run-execution-verifier',
  'world2-execution-engine',
  'world2-change-set-materializer',
] as const;

export const ORCHESTRATION_FLOW = [
  'Preview Readiness Contract',
  'Verification Candidate',
  'Verification Readiness Contract',
  'Verification Readiness Assessment',
] as const;

export const VERIFICATION_READINESS_SAFETY_GUARANTEES = [
  'Read-only orchestration only',
  'No verification execution',
  'No UVL execution',
  'No founder test execution',
  'No browser startup',
  'No runtime startup',
  'No deployment',
  'No file mutation',
  'realVerificationExecutionPerformed always false',
] as const;

export function isVerificationState(value: string): value is VerificationState {
  return (VERIFICATION_STATES as readonly string[]).includes(value);
}
