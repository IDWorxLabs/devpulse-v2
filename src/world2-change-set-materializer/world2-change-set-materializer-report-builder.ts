/**
 * World 2 Change Set Materializer — markdown report builder.
 */

import {
  DEFAULT_CHANGE_MATERIALIZATION_MODE,
  WORLD2_CHANGE_MATERIALIZATION_POSTCONDITIONS,
  WORLD2_CHANGE_MATERIALIZATION_MODES,
  WORLD2_CHANGE_MATERIALIZATION_STATES,
  WORLD2_CHANGE_MATERIALIZER_SAFETY_GUARANTEES,
  WORLD2_CHANGE_SET_MATERIALIZER_PASS_TOKEN,
  WORLD2_CHANGE_SET_MATERIALIZER_PHASE,
  WORLD2_CHANGE_SET_MATERIALIZER_REPORT_TITLE,
  WORLD2_DISPOSABLE_WORKSPACE_ROOT_PREFIX,
} from './world2-change-set-materializer-registry.js';
import type { World2ChangeSetMaterializerReport } from './world2-change-set-materializer-types.js';

export function buildWorld2ChangeSetMaterializerReportMarkdown(
  report: World2ChangeSetMaterializerReport,
): string {
  const { assessment } = report;
  const lines: string[] = [
    `# ${WORLD2_CHANGE_SET_MATERIALIZER_REPORT_TITLE}`,
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
    '## Materialization Modes',
    '',
  ];

  for (const mode of WORLD2_CHANGE_MATERIALIZATION_MODES) {
    lines.push(`- ${mode}`);
  }
  lines.push('');

  lines.push('## Materialization States');
  lines.push('');
  for (const state of WORLD2_CHANGE_MATERIALIZATION_STATES) {
    lines.push(`- ${state}`);
  }
  lines.push('');

  lines.push('## Materialization Verdict');
  lines.push('');
  lines.push(`**Materialization state:** ${assessment.materializationState}`);
  lines.push(`Materializer assessment ID: ${assessment.materializerAssessmentId}`);
  lines.push(`Workspace ID: ${assessment.workspaceId}`);
  lines.push(`Default mode: ${DEFAULT_CHANGE_MATERIALIZATION_MODE}`);
  lines.push(`Disposable root prefix: ${WORLD2_DISPOSABLE_WORKSPACE_ROOT_PREFIX}`);
  lines.push('');

  lines.push('## Safety Guarantees');
  lines.push('');
  for (const guarantee of WORLD2_CHANGE_MATERIALIZER_SAFETY_GUARANTEES) {
    lines.push(`- ${guarantee}`);
  }
  lines.push('');

  lines.push('## Postconditions');
  lines.push('');
  for (const item of WORLD2_CHANGE_MATERIALIZATION_POSTCONDITIONS) {
    lines.push(`- ${item}`);
  }
  lines.push('');

  if (assessment.materializationOperation) {
    const op = assessment.materializationOperation;
    lines.push('## Change Materialization Operation');
    lines.push('');
    lines.push(`Operation ID: ${op.operationId}`);
    lines.push(`Change set ID: ${op.changeSetId}`);
    lines.push(`Target workspace root: ${op.targetWorkspaceRoot}`);
    lines.push(`Mode: ${op.mode}`);
    lines.push(`Eligibility mode: ${op.eligibilityMode}`);
    lines.push(`Real file mutation performed: ${op.realFileMutationPerformed}`);
    lines.push('');

    lines.push('### Planned File Creates');
    lines.push('');
    for (const item of op.plannedFileCreates.slice(0, 6)) {
      lines.push(`- ${item}`);
    }
    lines.push('');

    lines.push('### Planned File Modifies');
    lines.push('');
    for (const item of op.plannedFileModifies.slice(0, 6)) {
      lines.push(`- ${item}`);
    }
    lines.push('');

    lines.push('### Rollback Map');
    lines.push('');
    for (const entry of op.rollbackMap.slice(0, 6)) {
      lines.push(`- ${entry.operationId}: ${entry.targetPath} -> ${entry.rollbackAction}`);
    }
    lines.push('');

    lines.push('### Safety Checks');
    lines.push('');
    for (const check of op.safetyChecks) {
      lines.push(`- [${check.passed ? 'PASS' : 'FAIL'}] ${check.label}: ${check.detail}`);
    }
    lines.push('');
  }

  if (assessment.dryRunMaterializationResult) {
    const result = assessment.dryRunMaterializationResult;
    lines.push('## Dry-Run Materialization Result');
    lines.push('');
    lines.push(`Result ID: ${result.resultId}`);
    lines.push(`Simulated creates: ${result.simulatedCreateCount}`);
    lines.push(`Simulated modifies: ${result.simulatedModifyCount}`);
    lines.push(`Simulated deletes: ${result.simulatedDeleteCount}`);
    lines.push(`Real file mutation performed: ${result.realFileMutationPerformed}`);
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
  lines.push(WORLD2_CHANGE_SET_MATERIALIZER_PASS_TOKEN);
  lines.push('');

  return lines.join('\n');
}
