/**
 * World 2 Execution Engine — constants, bounds, and scope registry.
 */

import type { World2ExecutionMode, World2EngineFinalState } from './world2-execution-engine-types.js';

export const WORLD2_EXECUTION_ENGINE_PASS_TOKEN = 'WORLD2_EXECUTION_ENGINE_PASS';
export const WORLD2_EXECUTION_ENGINE_OWNER_MODULE = 'devpulse_world2_execution_engine';
export const WORLD2_EXECUTION_ENGINE_PHASE = 'Phase 24L — World 2 Execution Engine Foundation';
export const WORLD2_EXECUTION_ENGINE_REPORT_TITLE = 'WORLD2_EXECUTION_ENGINE_REPORT';
export const WORLD2_ENGINE_CACHE_KEY_PREFIX = 'world2-execution-engine-v1';

export const MAX_ENGINE_HISTORY = 16;
export const MAX_ENGINE_REASONS = 12;
export const MAX_QUEUED_STEPS = 24;
export const MAX_SIMULATED_STEPS = 16;
export const MAX_RUN_DURATION_MS = 300_000;
export const MAX_AUDIT_TRAIL_ENTRIES = 64;

export const WORLD2_ENGINE_CORE_QUESTION =
  'Given a READY_FOR_WORLD2 execution contract, what bounded execution steps should World 2 run?';

export const WORLD2_EXECUTION_MODES: readonly World2ExecutionMode[] = [
  'DRY_RUN',
  'SIMULATED_EXECUTION',
  'SANDBOX_EXECUTION_ELIGIBLE',
  'BLOCKED',
] as const;

export const WORLD2_FORBIDDEN_SCOPE: readonly string[] = [
  'Live DevPulse workspace',
  'World 1 live project workspace',
  'Production repositories',
  'Production systems',
  'Project history deletion',
  'Repository deletion',
  'External network mutation',
  'Unbounded recursive execution runs',
] as const;

export const WORLD2_ALLOWED_SCOPE: readonly string[] = [
  'Isolated World 2 disposable workspace',
  'Contract-bound plan steps only',
  'Read-only validation simulation',
  'Advisory evidence collection',
  'Bounded queue operations',
] as const;

export const REQUIRED_WORLD2_ENGINE_AUTHORITIES = [
  'world2-controlled-execution-runtime',
  'autonomous-builder-execution-sandbox',
  'autonomous-builder-execution-planner',
] as const;

export function isWorld2ExecutionMode(value: string): value is World2ExecutionMode {
  return (WORLD2_EXECUTION_MODES as readonly string[]).includes(value);
}

export function isWorld2EngineFinalState(value: string): value is World2EngineFinalState {
  return (
    value === 'SANDBOX_EXECUTION_ELIGIBLE' ||
    value === 'SIMULATED_EXECUTION' ||
    value === 'DRY_RUN_COMPLETE' ||
    value === 'BLOCKED' ||
    value === 'INSUFFICIENT_EVIDENCE'
  );
}
