/**
 * World 2 Workspace Materialization — markdown report builder.
 */

import {
  WORLD2_MATERIALIZATION_STATES,
  WORLD2_WORKSPACE_MATERIALIZATION_PASS_TOKEN,
  WORLD2_WORKSPACE_MATERIALIZATION_PHASE,
  WORLD2_WORKSPACE_MATERIALIZATION_REPORT_TITLE,
  WORLD2_WORKSPACE_SIZE_ESTIMATES,
} from './world2-workspace-materialization-registry.js';
import type { World2WorkspaceMaterializationReport } from './world2-workspace-materialization-types.js';

export function buildWorld2WorkspaceMaterializationReportMarkdown(
  report: World2WorkspaceMaterializationReport,
): string {
  const { assessment } = report;
  const lines: string[] = [
    `# ${WORLD2_WORKSPACE_MATERIALIZATION_REPORT_TITLE}`,
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
    '## Materialization States',
    '',
  ];

  for (const state of WORLD2_MATERIALIZATION_STATES) {
    lines.push(`- ${state}`);
  }
  lines.push('');

  lines.push('## Materialization Verdict');
  lines.push('');
  lines.push(`**State:** ${assessment.materializationState}`);
  lines.push(`**Size estimate:** ${assessment.sizeEstimate}`);
  lines.push('');
  lines.push(`Materialization ID: ${assessment.materializationId}`);
  lines.push(`Workspace ID: ${assessment.workspaceId}`);
  lines.push('');

  if (assessment.blueprint) {
    const bp = assessment.blueprint;
    lines.push('## Workspace Blueprint');
    lines.push('');
    lines.push(`Blueprint ID: ${bp.blueprintId}`);
    lines.push(`Directories: ${bp.directories.length}`);
    lines.push(`Files: ${bp.files.length}`);
    lines.push(`Artifacts: ${bp.artifacts.length}`);
    lines.push('');
    lines.push('### Directories');
    lines.push('');
    for (const dir of bp.directories.slice(0, 8)) {
      lines.push(`- ${dir.path}`);
    }
    lines.push('');
    lines.push('### Files');
    lines.push('');
    for (const file of bp.files.slice(0, 8)) {
      lines.push(`- ${file.path} (${file.source})`);
    }
    lines.push('');
  }

  lines.push('## Size Analysis');
  lines.push('');
  for (const size of WORLD2_WORKSPACE_SIZE_ESTIMATES) {
    lines.push(`- ${size}${size === assessment.sizeEstimate ? ' ← current' : ''}`);
  }
  lines.push('');

  lines.push('## Forbidden Path Analysis');
  lines.push('');
  if (assessment.forbiddenPathAnalysis.length === 0) {
    lines.push('- No forbidden paths detected');
  } else {
    for (const path of assessment.forbiddenPathAnalysis.slice(0, 8)) {
      lines.push(`- ${path}`);
    }
  }
  lines.push('');

  if (assessment.materializationContract) {
    const contract = assessment.materializationContract;
    lines.push('## Materialization Contract');
    lines.push('');
    lines.push(`Contract ID: ${contract.contractId}`);
    lines.push('');
    lines.push('### Planned Validation Assets');
    lines.push('');
    for (const item of contract.plannedValidationAssets.slice(0, 6)) {
      lines.push(`- ${item}`);
    }
    lines.push('');
    lines.push('### Planned Rollback Assets');
    lines.push('');
    for (const item of contract.plannedRollbackAssets.slice(0, 6)) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }

  if (assessment.blueprint) {
    lines.push('## Validation Assets');
    lines.push('');
    for (const item of assessment.blueprint.validationAssets.slice(0, 6)) {
      lines.push(`- ${item}`);
    }
    lines.push('');
    lines.push('## Rollback Assets');
    lines.push('');
    for (const item of assessment.blueprint.rollbackAssets.slice(0, 6)) {
      lines.push(`- ${item}`);
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

  lines.push('## Pass Token');
  lines.push('');
  lines.push(WORLD2_WORKSPACE_MATERIALIZATION_PASS_TOKEN);
  lines.push('');

  return lines.join('\n');
}
