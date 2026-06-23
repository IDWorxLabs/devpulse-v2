/**
 * Phase 26.90 — Product readiness completion boundary repair report builder (V1).
 */

import type { ProductReadinessCompletionBoundaryRepairReport } from './product-readiness-completion-boundary-repair-types.js';
import {
  COMPLETION_CHAIN_STEPS,
  PRODUCT_READINESS_COMPLETION_BOUNDARY_REPAIR_CORE_QUESTION,
  PRODUCT_READINESS_COMPLETION_BOUNDARY_REPAIR_PASS,
} from './product-readiness-completion-boundary-repair-registry.js';

export function buildProductReadinessCompletionBoundaryRepairReportMarkdown(
  report: ProductReadinessCompletionBoundaryRepairReport,
): string {
  const { settlementAudit, completionDetection, stageTransition, repairPlan } = report;
  const lines = [
    '# Product Readiness Completion Boundary Repair Report',
    '',
    `**Repair ID:** ${report.repairId}`,
    `**Generated:** ${report.generatedAt}`,
    `**Pass token:** ${report.passToken ?? 'pending'}`,
    '',
    '## Core question',
    '',
    PRODUCT_READINESS_COMPLETION_BOUNDARY_REPAIR_CORE_QUESTION,
    '',
    '## Completion chain',
    '',
    ...COMPLETION_CHAIN_STEPS.map((step, index) => {
      const arrow = index < COMPLETION_CHAIN_STEPS.length - 1 ? ' →' : '';
      return `- ${step}${arrow}`;
    }),
    '',
    '## Settlement audit',
    '',
    `| Signal | Value |`,
    `|--------|-------|`,
    `| started | ${settlementAudit.startedCount} |`,
    `| settled | ${settlementAudit.settledCount} |`,
    `| pending | ${settlementAudit.pendingCount} |`,
    `| Rule 1 satisfied | ${settlementAudit.rule1Satisfied ? 'yes' : 'no'} |`,
    `| completionBoundaryReached | ${settlementAudit.completionBoundaryReached ? 'yes' : 'no'} |`,
    '',
    settlementAudit.reason ? `**Reason:** ${settlementAudit.reason}` : '',
    '',
    '## Completion detection',
    '',
    `- productReadinessComplete: ${completionDetection.productReadinessComplete}`,
    `- completionCheckEmitted: ${completionDetection.completionCheckEmitted}`,
    `- productReadinessCompletePropagated: ${completionDetection.productReadinessCompletePropagated}`,
    `- PRODUCT_READINESS_COMPLETE emitted: ${completionDetection.productReadinessCompleteEventEmitted}`,
    `- failureClass: ${completionDetection.failureClass}`,
    completionDetection.reason ? `- reason: ${completionDetection.reason}` : '',
    '',
    '## Stage transition',
    '',
    `- intakeValidationRunning: ${stageTransition.intakeValidationRunning}`,
    `- intakeValidationComplete: ${stageTransition.intakeValidationComplete}`,
    `- planningGateEligible: ${stageTransition.planningGateEligible}`,
    `- missingBoundary: ${stageTransition.missingCompletionBoundary ?? 'none'}`,
    `- stageAdvancementBlocked: ${stageTransition.stageAdvancementBlocked}`,
    stageTransition.reason ? `- reason: ${stageTransition.reason}` : '',
    '',
    '## Repair plan',
    '',
    `- repairRequired: ${repairPlan.repairRequired}`,
    `- failureClass: ${repairPlan.failureClass}`,
    `- actions: ${repairPlan.actions.join(' → ') || 'none'}`,
    `- repairApplied: ${report.repairApplied}`,
    '',
    '## Investigation checklist',
    '',
    '1. Did settlement complete?',
    `   - ${settlementAudit.rule1Satisfied ? 'YES' : 'NO'}`,
    '2. Did completion detection fire?',
    `   - ${completionDetection.completionCheckEmitted ? 'YES' : 'NO'}`,
    '3. Did completion event emit?',
    `   - ${completionDetection.productReadinessCompleteEventEmitted ? 'YES' : 'NO'}`,
    '4. Did stage advancement execute?',
    `   - ${stageTransition.intakeValidationComplete ? 'YES' : 'NO'}`,
    '5. Was completion state overwritten?',
    `   - ${completionDetection.productReadinessCompletePropagated && !completionDetection.productReadinessCompleteEventEmitted ? 'POSSIBLE' : 'NO'}`,
    '6. Was completion event dropped?',
    `   - ${completionDetection.failureClass === 'COMPLETION_EVENT_DROPPED' ? 'YES' : 'NO'}`,
    '7. Did propagation stop after settlement?',
    `   - ${completionDetection.failureClass === 'PROPAGATION_FAILURE' ? 'YES' : 'NO'}`,
    '',
  ];

  if (report.passToken === PRODUCT_READINESS_COMPLETION_BOUNDARY_REPAIR_PASS) {
    lines.push('## Result', '', `**PASS:** ${PRODUCT_READINESS_COMPLETION_BOUNDARY_REPAIR_PASS}`, '');
  }

  return lines.filter(Boolean).join('\n');
}

export function buildProductReadinessCompletionRepairReportMarkdown(
  report: ProductReadinessCompletionBoundaryRepairReport,
): string {
  return [
    '# Product Readiness Completion Repair Report',
    '',
    `Repair applied: ${report.repairApplied ? 'yes' : 'no'}`,
    `Failure class before repair: ${report.repairPlan.failureClass}`,
    `Actions: ${report.repairPlan.actions.join(', ') || 'none'}`,
    '',
    buildProductReadinessCompletionBoundaryRepairReportMarkdown(report),
  ].join('\n');
}

export function buildProductReadinessCompletionValidationMarkdown(
  report: ProductReadinessCompletionBoundaryRepairReport,
): string {
  return [
    '# Product Readiness Completion Validation',
    '',
    `- [${report.settlementAudit.rule1Satisfied ? 'x' : ' '}] Rule 1: started == settled and pending == 0`,
    `- [${report.completionDetection.productReadinessComplete ? 'x' : ' '}] productReadinessComplete true`,
    `- [${report.completionDetection.productReadinessCompleteEventEmitted ? 'x' : ' '}] PRODUCT_READINESS_COMPLETE emitted once`,
    `- [${report.stageTransition.intakeValidationComplete ? 'x' : ' '}] Intake Validation completes`,
    `- [${report.stageTransition.planningGateEligible ? 'x' : ' '}] Planning Gate eligible`,
    `- [${report.passToken === PRODUCT_READINESS_COMPLETION_BOUNDARY_REPAIR_PASS ? 'x' : ' '}] PASS token: ${PRODUCT_READINESS_COMPLETION_BOUNDARY_REPAIR_PASS}`,
    '',
  ].join('\n');
}
