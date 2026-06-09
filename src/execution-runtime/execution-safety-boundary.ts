/**
 * Execution safety boundary — blocks real execution patterns in foundation phase.
 */

import type { ExecutionSafetyStatus } from './execution-runtime-types.js';

const FORBIDDEN_ACTION_PATTERNS = [
  'deploy',
  'write file',
  'modify file',
  'auto-fix',
  'auto fix',
  'spawn',
  'child_process',
  'exec(',
  'run command',
  'apply change',
  'code generation',
  'world 2 execution',
  'cloud execution',
] as const;

const CAUTION_PATTERNS = [
  'execute',
  'run this',
  'apply',
  'recovery action',
  'autonomous',
] as const;

export function assessRequestedActionSafety(requestedAction: string): ExecutionSafetyStatus {
  const lower = requestedAction.toLowerCase();

  for (const pattern of FORBIDDEN_ACTION_PATTERNS) {
    if (lower.includes(pattern)) return 'FORBIDDEN';
  }

  for (const pattern of CAUTION_PATTERNS) {
    if (lower.includes(pattern)) return 'CAUTION';
  }

  return 'SAFE';
}

export function foundationBlocksRealExecution(): true {
  return true;
}

export function safetyViolationsForQuery(query: string): string[] {
  const lower = query.toLowerCase();
  const violations: string[] = [];

  for (const pattern of FORBIDDEN_ACTION_PATTERNS) {
    if (lower.includes(pattern)) {
      violations.push(`Forbidden execution pattern detected: ${pattern}`);
    }
  }

  return violations;
}

export function aggregateSafetyStatus(
  actionStatus: ExecutionSafetyStatus,
  violations: string[],
): ExecutionSafetyStatus {
  if (violations.length > 0 || actionStatus === 'FORBIDDEN') return 'FORBIDDEN';
  if (actionStatus === 'CAUTION') return 'CAUTION';
  if (violations.length > 0) return 'BLOCKED';
  return 'SAFE';
}
