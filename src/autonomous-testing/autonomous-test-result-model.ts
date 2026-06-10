/**
 * Autonomous Testing — planning-safe result model.
 */

import type {
  AutonomousTestPlan,
  AutonomousTestResult,
  AutonomousTestResultStatus,
} from './autonomous-testing-types.js';

export function createAutonomousTestResultModel(
  plan: AutonomousTestPlan,
  simulate?: 'SIMULATED_PASS' | 'SIMULATED_FAIL',
): AutonomousTestResult {
  if (!simulate) {
    return {
      planId: plan.id,
      status: 'NOT_EXECUTED',
      passedSuites: [],
      failedSuites: [],
      skippedSuites: [...plan.optionalSuites],
      confidenceAfterTesting: plan.confidence,
      failureSignals: [],
      generatedAt: Date.now(),
    };
  }

  if (simulate === 'SIMULATED_FAIL') {
    const failed = plan.requiredSuites.slice(0, 1);
    const passed = plan.requiredSuites.slice(1);
    return {
      planId: plan.id,
      status: 'SIMULATED_FAIL',
      passedSuites: passed,
      failedSuites: failed,
      skippedSuites: plan.optionalSuites,
      confidenceAfterTesting: Math.max(0, plan.confidence - 25),
      failureSignals: failed.map((s) => `SIMULATED failure signal for ${s}`),
      generatedAt: Date.now(),
    };
  }

  return {
    planId: plan.id,
    status: 'SIMULATED_PASS',
    passedSuites: [...plan.requiredSuites],
    failedSuites: [],
    skippedSuites: plan.optionalSuites,
    confidenceAfterTesting: Math.min(100, plan.confidence + 5),
    failureSignals: [],
    generatedAt: Date.now(),
  };
}

export function isSimulatedResult(status: AutonomousTestResultStatus): boolean {
  return status === 'SIMULATED_PASS' || status === 'SIMULATED_FAIL';
}
