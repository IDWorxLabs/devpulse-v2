/**
 * Build task verification plan — proof criteria without running verification.
 */

import type { BuildTaskVerificationPlan } from './build-task-runtime-types.js';

export function createBuildTaskVerificationPlan(query: string): BuildTaskVerificationPlan {
  const lower = query.toLowerCase();

  const checks = [
    'Build task request parsed and scoped correctly',
    'All required dependencies identified and status recorded',
    'Safety gates evaluated — simulation-only confirmed',
    'Execution packet linked with executionAllowed false',
    'Step order validated against dependency graph',
    'No file writes or commands performed during planning',
  ];

  const rollbackConsiderations = [
    'Future execution must support rollback via verification-gated apply',
    'Build task plan can be discarded without runtime mutation',
    'Execution packet state can revert to BLOCKED if gates fail',
    'No autonomous rollback in Phase 14.2 — advisory only',
  ];

  const proofCriteria = [
    'All planned steps completed in simulation review',
    'Dependency satisfaction recorded for each prerequisite',
    'Safety gates show passed for intelligence-only constraints',
    'Verification checks documented before any future apply',
    'Execution Runtime Foundation confirms readiness basis',
  ];

  if (lower.includes('verification would prove') || lower.includes('prove it worked')) {
    proofCriteria.unshift('Operator-visible proof criteria defined before any governed execution');
  }

  return {
    planId: `bverify-${Date.now().toString(36).slice(-6)}`,
    checks,
    rollbackConsiderations,
    proofCriteria,
    simulationOnly: true,
  };
}
