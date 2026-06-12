/**
 * Connected Runtime Activation Foundation — constants and registry.
 */

import type { RuntimeState } from './connected-runtime-activation-types.js';

export const CONNECTED_RUNTIME_ACTIVATION_FOUNDATION_PASS_TOKEN =
  'CONNECTED_RUNTIME_ACTIVATION_FOUNDATION_PASS';
export const CONNECTED_RUNTIME_ACTIVATION_OWNER_MODULE =
  'devpulse_connected_runtime_activation_foundation';
export const CONNECTED_RUNTIME_ACTIVATION_PHASE =
  'Phase 25.21 — Connected Runtime Activation Foundation';
export const CONNECTED_RUNTIME_ACTIVATION_REPORT_TITLE =
  'CONNECTED_RUNTIME_ACTIVATION_FOUNDATION_REPORT';
export const CONNECTED_RUNTIME_ACTIVATION_CACHE_KEY_PREFIX =
  'connected-runtime-activation-foundation-v1';
export const MAX_CONNECTED_RUNTIME_ACTIVATION_HISTORY = 16;
export const MAX_ACTIVATION_ENTRIES = 32;
export const MAX_RECOMMENDED_ACTIONS = 12;
export const MAX_MISSING_COMPONENTS = 12;

export const CONNECTED_RUNTIME_ACTIVATION_CORE_QUESTION =
  'Can AiDevEngine prove that generated build outputs are capable of becoming a runnable application runtime?';

export const RUNTIME_STATES: readonly RuntimeState[] = [
  'RUNTIME_READY',
  'RUNTIME_READY_WITH_WARNINGS',
  'RUNTIME_NOT_READY',
  'RUNTIME_BLOCKED',
  'INSUFFICIENT_EVIDENCE',
] as const;

export const REQUIRED_INPUT_AUTHORITIES = [
  'connected-build-execution-foundation',
  'world2-execution-engine',
  'world2-disposable-workspace-creator',
  'world2-disposable-workspace-instantiator',
  'world2-repository-snapshot',
  'world2-repository-snapshot-materializer',
  'world2-change-set-materializer',
  'world2-dry-run-execution-composer',
  'world2-dry-run-execution-verifier',
  'execution-package-runtime',
  'execution-verification-loop',
] as const;

export const ORCHESTRATION_FLOW = [
  'Execution Plan',
  'Build Output Manifest',
  'Runtime Activation Candidate',
  'Runtime Activation Contract',
  'Runtime Readiness Assessment',
] as const;

export const RUNTIME_ACTIVATION_SAFETY_GUARANTEES = [
  'Read-only orchestration only',
  'No runtime launch',
  'No process startup',
  'No command execution',
  'No workspace creation',
  'No file mutation',
  'No preview launch',
  'No deployment',
  'realRuntimeLaunchPerformed always false',
] as const;

export function isRuntimeState(value: string): value is RuntimeState {
  return (RUNTIME_STATES as readonly string[]).includes(value);
}
