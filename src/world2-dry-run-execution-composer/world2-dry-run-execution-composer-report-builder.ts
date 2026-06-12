/**
 * World 2 Dry-Run Execution Composer — markdown report builder.
 */

import {
  WORLD2_DRY_RUN_COMPOSER_CORE_QUESTION,
  WORLD2_DRY_RUN_COMPOSER_SAFETY_GUARANTEES,
  WORLD2_DRY_RUN_EXECUTION_COMPOSER_PASS_TOKEN,
  WORLD2_DRY_RUN_EXECUTION_COMPOSER_PHASE,
  WORLD2_DRY_RUN_EXECUTION_COMPOSER_REPORT_TITLE,
  WORLD2_DRY_RUN_ORDERED_STEP_DEFINITIONS,
  WORLD2_DRY_RUN_PACKAGE_POSTCONDITIONS,
  WORLD2_DRY_RUN_PACKAGE_STATES,
} from './world2-dry-run-execution-composer-registry.js';
import type { World2DryRunExecutionComposerReport } from './world2-dry-run-execution-composer-types.js';

export function buildWorld2DryRunExecutionComposerReportMarkdown(
  report: World2DryRunExecutionComposerReport,
): string {
  const { assessment } = report;
  const lines: string[] = [
    `# ${WORLD2_DRY_RUN_EXECUTION_COMPOSER_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Phase',
    '',
    report.phaseName,
    '',
    '## Purpose',
    '',
    report.purpose,
    '',
    '## Core Question',
    '',
    assessment.coreQuestion,
    '',
    '## Package States',
    '',
  ];

  for (const state of WORLD2_DRY_RUN_PACKAGE_STATES) {
    lines.push(`- ${state}`);
  }
  lines.push('');

  lines.push('## Package Verdict');
  lines.push('');
  lines.push(`**Package state:** ${assessment.packageState}`);
  lines.push(`Composer assessment ID: ${assessment.composerAssessmentId}`);
  lines.push(`Workspace ID: ${assessment.workspaceId}`);
  lines.push('');

  lines.push('## Ordered Step Definitions');
  lines.push('');
  for (const step of WORLD2_DRY_RUN_ORDERED_STEP_DEFINITIONS) {
    lines.push(`${step.order}. ${step.label} (${step.sourceAuthority})`);
  }
  lines.push('');

  lines.push('## Safety Guarantees');
  lines.push('');
  for (const guarantee of WORLD2_DRY_RUN_COMPOSER_SAFETY_GUARANTEES) {
    lines.push(`- ${guarantee}`);
  }
  lines.push('');

  lines.push('## Postconditions');
  lines.push('');
  for (const item of WORLD2_DRY_RUN_PACKAGE_POSTCONDITIONS) {
    lines.push(`- ${item}`);
  }
  lines.push('');

  if (assessment.executionPackage) {
    const pkg = assessment.executionPackage;
    lines.push('## Dry-Run Execution Package');
    lines.push('');
    lines.push(`Package ID: ${pkg.packageId}`);
    lines.push(`Final readiness state: ${pkg.finalReadinessState}`);
    lines.push(`Real execution performed: ${pkg.realExecutionPerformed}`);
    lines.push(`Ordered steps: ${pkg.orderedSteps.length}`);
    lines.push(`Validation steps: ${pkg.validationSteps.length}`);
    lines.push(`Rollback steps: ${pkg.rollbackSteps.length}`);
    lines.push(`Audit trail entries: ${pkg.auditTrail.length}`);
    lines.push('');

    lines.push('### Ordered Steps');
    lines.push('');
    for (const step of pkg.orderedSteps) {
      lines.push(`${step.order}. ${step.label} [${step.stepId}]`);
    }
    lines.push('');

    lines.push('### Safety Checks');
    lines.push('');
    for (const check of pkg.safetyChecks) {
      lines.push(`- [${check.passed ? 'PASS' : 'FAIL'}] ${check.label}: ${check.detail}`);
    }
    lines.push('');
  }

  if (assessment.blockingReasons.length > 0) {
    lines.push('## Blocking Reasons');
    lines.push('');
    for (const reason of assessment.blockingReasons.slice(0, 8)) {
      lines.push(`- ${reason}`);
    }
    lines.push('');
  }

  if (assessment.warningReasons.length > 0) {
    lines.push('## Warnings');
    lines.push('');
    for (const reason of assessment.warningReasons.slice(0, 8)) {
      lines.push(`- ${reason}`);
    }
    lines.push('');
  }

  lines.push('## Pass Token');
  lines.push('');
  lines.push(WORLD2_DRY_RUN_EXECUTION_COMPOSER_PASS_TOKEN);
  lines.push('');

  return lines.join('\n');
}
