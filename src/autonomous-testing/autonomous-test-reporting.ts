/**
 * Autonomous Testing — report generation.
 */

import type { AutonomousTestPlan, AutonomousTestReport, AutonomousTestResult } from './autonomous-testing-types.js';

export function generateAutonomousTestReport(
  plan: AutonomousTestPlan,
  result?: AutonomousTestResult,
): AutonomousTestReport {
  return {
    reportId: `atreport-${plan.id}`,
    planId: plan.id,
    depth: plan.depth,
    categories: [...plan.categories],
    requiredSuites: [...plan.requiredSuites],
    optionalSuites: [...plan.optionalSuites],
    coverageTargets: [...plan.coverageTargets],
    executionOrder: [...plan.executionOrder],
    riskScore: plan.riskScore,
    confidence: plan.confidence,
    readiness: plan.readiness,
    estimatedDurationMs: plan.estimatedDurationMs,
    estimatedCost: plan.estimatedCost,
    resultStatus: result?.status,
    failureSignals: result?.failureSignals ?? [],
    reasoning: [...plan.reasoning],
    generatedAt: Date.now(),
  };
}
