/**
 * Phase 27.05 — Intake validation stage transition report builder (V1).
 */

import type { IntakeValidationStageTransitionRepairReport } from './intake-validation-stage-transition-repair-types.js';
import { STAGE2_TRANSITION_CHAIN } from './intake-validation-stage-transition-repair-registry.js';

export function buildIntakeValidationStageTransitionReportMarkdown(
  report: IntakeValidationStageTransitionRepairReport,
): string {
  return [
    '# Intake Validation Stage Transition Repair',
    '',
    `Repair ID: ${report.repairId}`,
    `Generated: ${report.generatedAt}`,
    `Repair applied: ${report.repairApplied ? 'yes' : 'no'}`,
    `Pass token: ${report.passToken ?? 'none'}`,
    '',
    '## Stage 2 chain',
    '',
    ...STAGE2_TRANSITION_CHAIN.map((step, index) => `${index + 1}. ${step}`),
    '',
    '## Boundary audit',
    '',
    `- Launch readiness assessment complete: ${report.boundaryAudit.launchReadinessAssessmentComplete}`,
    `- Launch readiness report built: ${report.boundaryAudit.launchReadinessReportBuilt}`,
    `- Launch readiness artifacts built: ${report.boundaryAudit.launchReadinessArtifactsBuilt}`,
    `- Rule 1 satisfied: ${report.boundaryAudit.rule1Satisfied}`,
    `- Intake stage running: ${report.boundaryAudit.intakeStageRunning}`,
    '',
    '## Repair plan',
    '',
    `- Repair required: ${report.repairPlan.repairRequired}`,
    `- Actions: ${report.repairPlan.actions.join(', ') || 'none'}`,
    `- Failure class: ${report.repairPlan.failureClass}`,
  ].join('\n');
}

export function buildIntakeValidationTransitionRepairReportMarkdown(
  report: IntakeValidationStageTransitionRepairReport,
): string {
  return buildIntakeValidationStageTransitionReportMarkdown(report);
}

export function buildIntakeValidationTransitionValidationMarkdown(input: {
  passToken: string | null;
  checks: readonly { name: string; passed: boolean; detail: string }[];
}): string {
  return [
    '# Intake Validation Stage Transition Validation',
    '',
    `Result: ${input.passToken ?? 'FAILED'}`,
    '',
    ...input.checks.map((check) => `- [${check.passed ? 'x' : ' '}] ${check.name}: ${check.detail}`),
    '',
    input.passToken ? `**${input.passToken}**` : '',
  ].join('\n');
}
