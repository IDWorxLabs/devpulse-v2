/**
 * Autonomous Fixing — fix report generation.
 */

import type { FixPlan, FixReport } from './autonomous-fixing-types.js';
import type { RollbackPlan } from './autonomous-fixing-types.js';

let reportCounter = 0;

export function generateFixReport(plan: FixPlan, rollback?: RollbackPlan): FixReport {
  reportCounter += 1;

  return {
    reportId: `fix-report-${reportCounter}`,
    planId: plan.id,
    failureCategory: plan.failureCategory,
    strategy: plan.strategy,
    confidence: plan.confidence,
    riskScore: plan.riskScore,
    readiness: plan.readiness,
    rootCauses: [...plan.rootCauseCandidates],
    repairCandidates: [...plan.repairCandidates],
    rollbackRequired: plan.rollbackRequired,
    rollbackScope: rollback?.scope ?? (plan.rollbackRequired ? 'SUBSYSTEM' : 'NONE'),
    reasoning: [...plan.reasoning],
    generatedAt: Date.now(),
  };
}

export function resetFixReportCounterForTests(): void {
  reportCounter = 0;
}
