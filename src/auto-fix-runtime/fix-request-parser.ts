/**
 * Fix request parser — extracts auto-fix planning intent from queries.
 */

import type { AutoFixRequest } from './auto-fix-runtime-types.js';

let requestCounter = 0;

function nextRequestId(): string {
  requestCounter += 1;
  return `freq-${requestCounter.toString().padStart(4, '0')}`;
}

export function resetFixRequestCounterForTests(): void {
  requestCounter = 0;
}

export function parseFixRequest(query: string): AutoFixRequest {
  const lower = query.toLowerCase().trim();
  let title = 'Auto-Fix Planning Request';
  let problem = 'Visible failure or governance gap requiring advisory fix planning';
  let outcome = 'Advisory fix plan with proposals, alternatives, rollback, and verification — no application';

  if (lower.includes('how would you fix') || lower.includes('how would we fix')) {
    title = 'How Would You Fix This';
    problem = 'Failure or blocker identified — define governed fix approach without applying changes';
    outcome = 'Fix proposals with alternatives, risks, rollback, and verification plan';
  } else if (lower.includes('what fix is recommended') || lower.includes('recommended fix')) {
    title = 'Recommended Fix';
    problem = 'Primary fix recommendation for visible failure context';
    outcome = 'Ranked fix proposal — simulation only, not applied';
  } else if (lower.includes('alternative fix') || lower.includes('alternatives exist') || lower.includes('what alternatives')) {
    title = 'Alternative Fixes';
    problem = 'Evaluate alternative fix strategies for the same failure';
    outcome = 'Ranked alternative fix list — advisory only';
  } else if (lower.includes('rollback')) {
    title = 'Rollback Plan';
    problem = 'Define rollback required before or after any future fix application';
    outcome = 'Rollback steps and prerequisites — no changes applied';
  } else if (lower.includes('verification would prove') || lower.includes('prove the fix')) {
    title = 'Fix Verification';
    problem = 'Define what would prove a fix worked in a future governed phase';
    outcome = 'Verification plan with proof criteria — simulation only';
  } else if (lower.includes('can auto-fix run') || lower.includes('can auto fix run') || lower.includes('blocking auto')) {
    title = 'Auto-Fix Readiness';
    problem = 'Assess whether auto-fix could run in a future governed phase';
    outcome = 'Readiness advisory — auto-fix blocked, simulation only';
  } else if (lower.includes('risks exist') || lower.includes('fix risks')) {
    title = 'Fix Risks';
    problem = 'Risks associated with proposed fixes before any application';
    outcome = 'Risk assessment — no fixes applied';
  } else if (lower.includes('auto fix') || lower.includes('auto-fix') || lower.includes('fix proposal')) {
    title = 'Auto-Fix Plan';
    problem = 'Compose full auto-fix plan from failure and intelligence sources';
    outcome = 'Complete fix plan linked to failures, testing, code generation, build task, and execution packet';
  }

  return {
    requestId: nextRequestId(),
    query,
    title,
    problemSummary: problem,
    requestedOutcome: outcome,
    sourceSystem: 'auto_fix_runtime',
    planningOnly: true,
  };
}
