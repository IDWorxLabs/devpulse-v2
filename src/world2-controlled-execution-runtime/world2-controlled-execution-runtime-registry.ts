/**
 * World 2 Controlled Execution Runtime — constants, limits, and safety registry.
 */

import type { World2ExecutionState } from './world2-controlled-execution-runtime-types.js';

export const WORLD2_CONTROLLED_EXECUTION_RUNTIME_PASS_TOKEN =
  'WORLD2_CONTROLLED_EXECUTION_RUNTIME_PASS';
export const WORLD2_CONTROLLED_EXECUTION_RUNTIME_OWNER_MODULE =
  'devpulse_world2_controlled_execution_runtime';
export const WORLD2_CONTROLLED_EXECUTION_RUNTIME_PHASE =
  'Phase 24K — World 2 Controlled Execution Runtime';
export const WORLD2_CONTROLLED_EXECUTION_RUNTIME_REPORT_TITLE =
  'WORLD2_CONTROLLED_EXECUTION_RUNTIME_REPORT';
export const WORLD2_CACHE_KEY_PREFIX = 'world2-controlled-execution-runtime-v1';
export const MAX_WORLD2_HISTORY = 16;
export const MAX_WORLD2_REASONS = 12;

export const WORLD2_CORE_QUESTION = 'Can this plan enter World 2 execution?';

export const WORLD2_EXECUTION_STATES: readonly World2ExecutionState[] = [
  'NOT_READY',
  'READY_FOR_WORLD2',
  'READY_WITH_RESTRICTIONS',
  'BLOCKED',
  'INSUFFICIENT_EVIDENCE',
] as const;

/** Bounded execution limits — advisory caps, no unbounded execution. */
export const MAX_RUNTIME_MS = 300_000;
export const MAX_ATTEMPTS = 5;
export const MAX_VALIDATIONS = 12;
export const MAX_REPAIRS = 5;
export const MAX_SANDBOX_FAILURES = 3;

export const WORLD2_FORBIDDEN_ACTIONS: readonly string[] = [
  'Modify live DevPulse workspace',
  'Modify production repositories',
  'Delete repositories',
  'Delete project history',
  'Bypass rollback requirements',
  'Bypass verification requirements',
  'Bypass founder acceptance gate',
  'Perform external network mutation against production',
  'Execute against World 1 live project workspace',
] as const;

export const WORLD2_ALLOWED_ACTIONS: readonly string[] = [
  'Enter isolated World 2 disposable workspace',
  'Execute approved plan steps within World 2 boundaries',
  'Run bounded validation scripts inside World 2',
  'Collect before/after evidence in World 2 context',
  'Trigger rollback inside World 2 on regression',
  'Pause or stop World 2 execution on termination signal',
  'Generate World 2 execution runtime report',
] as const;

export const WORLD2_TERMINATION_CONDITIONS: readonly string[] = [
  'Attempt budget exhausted',
  'Sandbox failure threshold reached',
  'Execution proof regression detected',
  'Founder acceptance gate BLOCKED',
  'Repair loop ESCALATE or STOP decision',
  'Critical risk detected during World 2 monitoring',
  'Max runtime exceeded',
] as const;

export const REQUIRED_WORLD2_AUTHORITIES = [
  'autonomous-builder-execution-sandbox',
  'autonomous-builder-execution-planner',
  'autonomous-repair-loop',
  'execution-proof-evolution',
  'founder-acceptance-gate',
] as const;

export function isWorld2ExecutionState(value: string): value is World2ExecutionState {
  return (WORLD2_EXECUTION_STATES as readonly string[]).includes(value);
}

export function buildWorld2ResourceLimits(): {
  maxRuntimeMs: number;
  maxAttempts: number;
  maxValidations: number;
  maxRepairs: number;
  maxSandboxFailures: number;
} {
  return {
    maxRuntimeMs: MAX_RUNTIME_MS,
    maxAttempts: MAX_ATTEMPTS,
    maxValidations: MAX_VALIDATIONS,
    maxRepairs: MAX_REPAIRS,
    maxSandboxFailures: MAX_SANDBOX_FAILURES,
  };
}
