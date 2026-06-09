/**
 * Fix verification plan — proof criteria without running verification.
 */

import type { FixVerificationPlan } from './auto-fix-runtime-types.js';

let verificationCounter = 0;

function nextVerificationId(): string {
  verificationCounter += 1;
  return `fver-${verificationCounter.toString().padStart(4, '0')}`;
}

export function resetFixVerificationCounterForTests(): void {
  verificationCounter = 0;
}

export function createFixVerificationPlan(query: string): FixVerificationPlan {
  const lower = query.toLowerCase();

  const proofCriteria = [
    'Phase validation script passes with correct pass token',
    'typecheck exits 0 with no new errors',
    'No file writes in auto-fix-runtime module source',
    'executionAllowed remains false on linked execution packet',
    'Code generation change proposals remain applied: false',
    'Testing plan remains simulation-only with no test execution',
    'Failure records remain linked but unresolved (advisory only)',
    'Operator feed publishes full auto-fix planning sequence',
  ];

  const checks = [
    'Routing: AUTO_FIX_RUNTIME_FOUNDATION primary for success questions',
    'Blocked intent: auto-fix advisory questions not blocked',
    'Linkage: linkedFailureIds, linkedTestingId, linkedGenerationId populated',
    'Simulated results: all have applied: false',
    'No child_process, spawn, exec, or writeFileSync in module',
  ];

  if (lower.includes('verification') || lower.includes('prove')) {
    proofCriteria.push('Simulated fix SUCCESS results align with verification proof criteria');
  }

  return {
    verificationId: nextVerificationId(),
    proofCriteria,
    checks,
    simulationOnly: true,
  };
}
