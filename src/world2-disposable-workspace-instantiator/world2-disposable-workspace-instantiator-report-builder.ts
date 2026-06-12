/**
 * World 2 Disposable Workspace Instantiator — markdown report builder.
 */

import {
  DEFAULT_INSTANTIATION_MODE,
  WORLD2_INSTANTIATION_MODES,
  WORLD2_INSTANTIATION_RESULT_STATES,
  WORLD2_INSTANTIATOR_SAFETY_GUARANTEES,
  WORLD2_DISPOSABLE_WORKSPACE_INSTANTIATOR_PASS_TOKEN,
  WORLD2_DISPOSABLE_WORKSPACE_INSTANTIATOR_PHASE,
  WORLD2_DISPOSABLE_WORKSPACE_INSTANTIATOR_REPORT_TITLE,
} from './world2-disposable-workspace-instantiator-registry.js';
import type { World2DisposableWorkspaceInstantiatorReport } from './world2-disposable-workspace-instantiator-types.js';

export function buildWorld2DisposableWorkspaceInstantiatorReportMarkdown(
  report: World2DisposableWorkspaceInstantiatorReport,
): string {
  const { assessment } = report;
  const lines: string[] = [
    `# ${WORLD2_DISPOSABLE_WORKSPACE_INSTANTIATOR_REPORT_TITLE}`,
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
    '## Instantiation Modes',
    '',
  ];

  for (const mode of WORLD2_INSTANTIATION_MODES) {
    lines.push(`- ${mode}`);
  }
  lines.push('');

  lines.push('## Result States');
  lines.push('');
  for (const state of WORLD2_INSTANTIATION_RESULT_STATES) {
    lines.push(`- ${state}`);
  }
  lines.push('');

  lines.push('## Instantiation Verdict');
  lines.push('');
  lines.push(`**Result state:** ${assessment.resultState}`);
  lines.push(`Instantiator assessment ID: ${assessment.instantiatorAssessmentId}`);
  lines.push(`Workspace ID: ${assessment.workspaceId}`);
  lines.push(`Default mode: ${DEFAULT_INSTANTIATION_MODE}`);
  lines.push('');

  lines.push('## Safety Guarantees');
  lines.push('');
  for (const guarantee of WORLD2_INSTANTIATOR_SAFETY_GUARANTEES) {
    lines.push(`- ${guarantee}`);
  }
  lines.push('');

  if (assessment.instantiationOperation) {
    const op = assessment.instantiationOperation;
    lines.push('## Instantiation Operation');
    lines.push('');
    lines.push(`Operation ID: ${op.operationId}`);
    lines.push(`Planned root: ${op.plannedRoot}`);
    lines.push(`Mode: ${op.mode}`);
    lines.push(`Eligibility mode: ${op.eligibilityMode}`);
    lines.push(`Result state: ${op.resultState}`);
    lines.push(`Repository copy performed: ${op.repositoryCopyPerformed}`);
    lines.push(`Change set application performed: ${op.changeSetApplicationPerformed}`);
    lines.push('');

    lines.push('### Directories To Create');
    lines.push('');
    for (const item of op.directoriesToCreate.slice(0, 8)) {
      lines.push(`- ${item}`);
    }
    lines.push('');

    lines.push('### Files To Prepare');
    lines.push('');
    for (const item of op.filesToPrepare.slice(0, 8)) {
      lines.push(`- ${item}`);
    }
    lines.push('');

    lines.push('### Safety Checks');
    lines.push('');
    for (const check of op.safetyChecks) {
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
  lines.push(WORLD2_DISPOSABLE_WORKSPACE_INSTANTIATOR_PASS_TOKEN);
  lines.push('');

  return lines.join('\n');
}
