/**
 * Testing Runtime Foundation diagnostics.
 */

import type { TestingPlan, TestingRuntimeDiagnostics } from './testing-runtime-types.js';

let diagnostics: TestingRuntimeDiagnostics = {
  testingRuntimeActive: false,
  testingPlanCount: 0,
  blockedTestingCount: 0,
  readyForFutureTestingCount: 0,
  lastTestingQuery: null,
  lastTestingReadiness: null,
};

export function getTestingRuntimeDiagnostics(): TestingRuntimeDiagnostics {
  return { ...diagnostics };
}

export function updateTestingRuntimeDiagnostics(query: string, plan: TestingPlan): void {
  diagnostics = {
    testingRuntimeActive: true,
    testingPlanCount: diagnostics.testingPlanCount + 1,
    blockedTestingCount: diagnostics.blockedTestingCount + (plan.blocked ? 1 : 0),
    readyForFutureTestingCount:
      diagnostics.readyForFutureTestingCount +
      (plan.state === 'READY_FOR_FUTURE_TESTING' ? 1 : 0),
    lastTestingQuery: query,
    lastTestingReadiness: plan.readiness,
  };
}

export function resetTestingRuntimeDiagnostics(): void {
  diagnostics = {
    testingRuntimeActive: false,
    testingPlanCount: 0,
    blockedTestingCount: 0,
    readyForFutureTestingCount: 0,
    lastTestingQuery: null,
    lastTestingReadiness: null,
  };
}

export function testingRuntimeKey(): string {
  const d = diagnostics;
  return [
    String(d.testingRuntimeActive),
    String(d.testingPlanCount),
    String(d.blockedTestingCount),
    String(d.readyForFutureTestingCount),
    d.lastTestingQuery ?? 'none',
    d.lastTestingReadiness ?? 'none',
  ].join('|');
}
