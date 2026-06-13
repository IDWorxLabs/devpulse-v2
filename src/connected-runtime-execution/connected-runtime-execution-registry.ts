/**
 * Connected Runtime Execution — constants and registry.
 */

import type { RuntimeExecutionState } from './connected-runtime-execution-types.js';

export const CONNECTED_RUNTIME_EXECUTION_PASS_TOKEN = 'CONNECTED_RUNTIME_EXECUTION_PASS';
export const CONNECTED_RUNTIME_EXECUTION_OWNER_MODULE = 'devpulse_connected_runtime_execution';
export const CONNECTED_RUNTIME_EXECUTION_PHASE = 'Phase 25.28 — Connected Runtime Execution';
export const CONNECTED_RUNTIME_EXECUTION_REPORT_TITLE = 'CONNECTED_RUNTIME_EXECUTION_REPORT';
export const CONNECTED_RUNTIME_EXECUTION_CACHE_KEY_PREFIX = 'connected-runtime-execution-v1';
export const MAX_CONNECTED_RUNTIME_EXECUTION_HISTORY = 16;
export const MAX_RUNTIME_WARNINGS = 12;
export const MAX_RUNTIME_BLOCKERS = 12;
export const MAX_RECOMMENDED_ACTIONS = 12;
export const MAX_RUNTIME_ARTIFACTS = 16;
export const MAX_RUNTIME_EVIDENCE = 32;
export const MAX_RUNTIME_DIAGNOSTICS = 16;
export const DEFAULT_RUNTIME_PORT = 9876;
export const RUNTIME_STARTUP_TIMEOUT_MS = 8_000;

export const CONNECTED_RUNTIME_EXECUTION_CORE_QUESTION =
  'Can AiDevEngine activate a generated application runtime from produced build artifacts?';

export const RUNTIME_EXECUTION_STATES: readonly RuntimeExecutionState[] = [
  'RUNTIME_ACTIVATED',
  'RUNTIME_ACTIVATED_WITH_WARNINGS',
  'RUNTIME_ACTIVATION_FAILED',
  'RUNTIME_ACTIVATION_BLOCKED',
  'INSUFFICIENT_EVIDENCE',
] as const;

export const REQUIRED_INPUT_AUTHORITIES = [
  'connected-build-execution',
  'connected-runtime-activation-foundation',
  'execution-package-runtime',
  'execution-verification-loop',
  'world2-controlled-execution-runtime',
  'founder-acceptance-gate',
  'execution-proof-evolution',
] as const;

export const ORCHESTRATION_FLOW = [
  'Execution Plan',
  'Workspace Created',
  'Build Executed',
  'Runtime Activation Foundation',
  'Real Runtime Activation',
  'Runtime Evidence',
] as const;

export const RUNTIME_EXECUTION_SAFETY_GUARANTEES = [
  'Bounded execution only — max 1 runtime per validation run',
  'Automatic runtime cleanup after validation',
  'No World 1 mutation',
  'No production mutation',
  'No deployment',
  'No external infrastructure mutation',
  'No preview launch',
  'No verification execution',
  'Runtime processes only inside generated builder workspaces root',
] as const;

export function isRuntimeExecutionState(value: string): value is RuntimeExecutionState {
  return (RUNTIME_EXECUTION_STATES as readonly string[]).includes(value);
}
