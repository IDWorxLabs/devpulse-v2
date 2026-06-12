/**
 * Autonomous Builder Execution Sandbox — constants, boundaries, and eligibility registry.
 */

import type { SandboxEligibilityState } from './autonomous-builder-execution-sandbox-types.js';

export const AUTONOMOUS_BUILDER_EXECUTION_SANDBOX_PASS_TOKEN =
  'AUTONOMOUS_BUILDER_EXECUTION_SANDBOX_PASS';
export const AUTONOMOUS_BUILDER_EXECUTION_SANDBOX_OWNER_MODULE =
  'devpulse_autonomous_builder_execution_sandbox';
export const AUTONOMOUS_BUILDER_EXECUTION_SANDBOX_PHASE =
  'Phase 24J — Autonomous Builder Execution Sandbox';
export const AUTONOMOUS_BUILDER_EXECUTION_SANDBOX_REPORT_TITLE =
  'AUTONOMOUS_BUILDER_EXECUTION_SANDBOX_REPORT';
export const SANDBOX_CACHE_KEY_PREFIX = 'autonomous-builder-execution-sandbox-v1';
export const MAX_SANDBOX_HISTORY = 16;
export const MAX_SANDBOX_REASONS = 12;

export const SANDBOX_CORE_QUESTION =
  'Can this execution plan safely enter a sandbox workspace?';

export const SANDBOX_ELIGIBILITY_STATES: readonly SandboxEligibilityState[] = [
  'NOT_ELIGIBLE',
  'ELIGIBLE',
  'ELIGIBLE_WITH_WARNINGS',
  'BLOCKED',
  'INSUFFICIENT_EVIDENCE',
] as const;

export const SANDBOX_FORBIDDEN_ACTIONS: readonly string[] = [
  'Modify live project workspace',
  'Modify production systems',
  'Delete project history',
  'Delete repositories',
  'Perform external network mutation',
  'Execute against non-disposable workspace',
  'Bypass rollback or verification contract',
] as const;

export const SANDBOX_ALLOWED_ACTIONS: readonly string[] = [
  'Simulate plan steps in isolated disposable sandbox',
  'Run read-only validation scripts inside sandbox context',
  'Collect before/after advisory evidence',
  'Evaluate execution proof without live mutation',
  'Evaluate founder test and acceptance read-only signals',
  'Generate sandbox execution report',
] as const;

export const REQUIRED_SANDBOX_AUTHORITIES = [
  'execution-planner',
  'repair-loop',
  'execution-proof-evolution',
  'founder-acceptance-gate',
] as const;

export function isSandboxEligibilityState(value: string): value is SandboxEligibilityState {
  return (SANDBOX_ELIGIBILITY_STATES as readonly string[]).includes(value);
}

export function clampReadinessPercent(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}
