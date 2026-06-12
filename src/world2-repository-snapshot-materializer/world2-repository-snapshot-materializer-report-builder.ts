/**
 * World 2 Repository Snapshot Materializer — markdown report builder.
 */

import {
  DEFAULT_MATERIALIZATION_MODE,
  WORLD2_DISPOSABLE_WORKSPACE_ROOT_PREFIX,
  WORLD2_MATERIALIZATION_POSTCONDITIONS,
  WORLD2_REPOSITORY_SNAPSHOT_MATERIALIZER_PASS_TOKEN,
  WORLD2_REPOSITORY_SNAPSHOT_MATERIALIZER_PHASE,
  WORLD2_REPOSITORY_SNAPSHOT_MATERIALIZER_REPORT_TITLE,
  WORLD2_SNAPSHOT_MATERIALIZATION_MODES,
  WORLD2_SNAPSHOT_MATERIALIZATION_STATES,
  WORLD2_SNAPSHOT_MATERIALIZER_SAFETY_GUARANTEES,
} from './world2-repository-snapshot-materializer-registry.js';
import type { World2RepositorySnapshotMaterializerReport } from './world2-repository-snapshot-materializer-types.js';

export function buildWorld2RepositorySnapshotMaterializerReportMarkdown(
  report: World2RepositorySnapshotMaterializerReport,
): string {
  const { assessment } = report;
  const lines: string[] = [
    `# ${WORLD2_REPOSITORY_SNAPSHOT_MATERIALIZER_REPORT_TITLE}`,
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

  for (const mode of WORLD2_SNAPSHOT_MATERIALIZATION_MODES) {
    lines.push(`- ${mode}`);
  }
  lines.push('');

  lines.push('## Materialization States');
  lines.push('');
  for (const state of WORLD2_SNAPSHOT_MATERIALIZATION_STATES) {
    lines.push(`- ${state}`);
  }
  lines.push('');

  lines.push('## Materialization Verdict');
  lines.push('');
  lines.push(`**Materialization state:** ${assessment.materializationState}`);
  lines.push(`Materializer assessment ID: ${assessment.materializerAssessmentId}`);
  lines.push(`Workspace ID: ${assessment.workspaceId}`);
  lines.push(`Default mode: ${DEFAULT_MATERIALIZATION_MODE}`);
  lines.push(`Disposable root prefix: ${WORLD2_DISPOSABLE_WORKSPACE_ROOT_PREFIX}`);
  lines.push('');

  lines.push('## Safety Guarantees');
  lines.push('');
  for (const guarantee of WORLD2_SNAPSHOT_MATERIALIZER_SAFETY_GUARANTEES) {
    lines.push(`- ${guarantee}`);
  }
  lines.push('');

  lines.push('## Postconditions');
  lines.push('');
  for (const item of WORLD2_MATERIALIZATION_POSTCONDITIONS) {
    lines.push(`- ${item}`);
  }
  lines.push('');

  if (assessment.materializationOperation) {
    const op = assessment.materializationOperation;
    lines.push('## Materialization Operation');
    lines.push('');
    lines.push(`Operation ID: ${op.operationId}`);
    lines.push(`Request ID: ${op.requestId}`);
    lines.push(`Snapshot ID: ${op.snapshotId}`);
    lines.push(`Target workspace root: ${op.targetWorkspaceRoot}`);
    lines.push(`Mode: ${op.mode}`);
    lines.push(`Eligibility mode: ${op.eligibilityMode}`);
    lines.push(`Repository copy performed: ${op.repositoryCopyPerformed}`);
    lines.push(`Live file read performed: ${op.liveFileReadPerformed}`);
    lines.push('');

    lines.push('### Planned Writes');
    lines.push('');
    for (const item of op.plannedWrites.slice(0, 8)) {
      lines.push(`- ${item}`);
    }
    lines.push('');

    lines.push('### Planned Skips');
    lines.push('');
    for (const item of op.plannedSkips.slice(0, 8)) {
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

  if (assessment.dryRunMaterializationResult) {
    const result = assessment.dryRunMaterializationResult;
    lines.push('## Dry-Run Materialization Result');
    lines.push('');
    lines.push(`Result ID: ${result.resultId}`);
    lines.push(`Simulated writes: ${result.simulatedWriteCount}`);
    lines.push(`Simulated skips: ${result.simulatedSkipCount}`);
    lines.push(`Repository copy performed: ${result.repositoryCopyPerformed}`);
    lines.push(`Live file read performed: ${result.liveFileReadPerformed}`);
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
  lines.push(WORLD2_REPOSITORY_SNAPSHOT_MATERIALIZER_PASS_TOKEN);
  lines.push('');

  return lines.join('\n');
}
