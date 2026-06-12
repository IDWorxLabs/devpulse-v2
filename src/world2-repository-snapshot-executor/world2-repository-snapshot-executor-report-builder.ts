/**
 * World 2 Repository Snapshot Executor — markdown report builder.
 */

import {
  DEFAULT_SNAPSHOT_EXECUTION_MODE,
  MAX_EXECUTION_ATTEMPTS,
  MAX_EXECUTION_DIRECTORIES,
  MAX_EXECUTION_FILES,
  WORLD2_GIT_INTERNALS_EXCLUSIONS,
  WORLD2_NODE_MODULES_EXCLUSION,
  WORLD2_REPOSITORY_SNAPSHOT_EXECUTOR_PASS_TOKEN,
  WORLD2_REPOSITORY_SNAPSHOT_EXECUTOR_PHASE,
  WORLD2_REPOSITORY_SNAPSHOT_EXECUTOR_REPORT_TITLE,
  WORLD2_SNAPSHOT_EXECUTION_MODES,
  WORLD2_SNAPSHOT_EXECUTION_STATES,
  WORLD2_SNAPSHOT_EXECUTOR_SAFETY_GUARANTEES,
} from './world2-repository-snapshot-executor-registry.js';
import type { World2RepositorySnapshotExecutorReport } from './world2-repository-snapshot-executor-types.js';

export function buildWorld2RepositorySnapshotExecutorReportMarkdown(
  report: World2RepositorySnapshotExecutorReport,
): string {
  const { assessment } = report;
  const lines: string[] = [
    `# ${WORLD2_REPOSITORY_SNAPSHOT_EXECUTOR_REPORT_TITLE}`,
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
    '## Execution Modes',
    '',
  ];

  for (const mode of WORLD2_SNAPSHOT_EXECUTION_MODES) {
    lines.push(`- ${mode}`);
  }
  lines.push('');

  lines.push('## Execution States');
  lines.push('');
  for (const state of WORLD2_SNAPSHOT_EXECUTION_STATES) {
    lines.push(`- ${state}`);
  }
  lines.push('');

  lines.push('## Execution Verdict');
  lines.push('');
  lines.push(`**Execution state:** ${assessment.executionState}`);
  lines.push(`Executor assessment ID: ${assessment.executorAssessmentId}`);
  lines.push(`Workspace ID: ${assessment.workspaceId}`);
  lines.push(`Default mode: ${DEFAULT_SNAPSHOT_EXECUTION_MODE}`);
  lines.push('');

  lines.push('## Safety Guarantees');
  lines.push('');
  for (const guarantee of WORLD2_SNAPSHOT_EXECUTOR_SAFETY_GUARANTEES) {
    lines.push(`- ${guarantee}`);
  }
  lines.push('');

  lines.push('## Standard Exclusions');
  lines.push('');
  lines.push(`- node_modules: ${WORLD2_NODE_MODULES_EXCLUSION}`);
  for (const rule of WORLD2_GIT_INTERNALS_EXCLUSIONS.slice(0, 4)) {
    lines.push(`- .git: ${rule}`);
  }
  lines.push('');

  lines.push('## Execution Bounds (Registry Defaults)');
  lines.push('');
  lines.push(`- maxFiles: ${MAX_EXECUTION_FILES}`);
  lines.push(`- maxDirectories: ${MAX_EXECUTION_DIRECTORIES}`);
  lines.push(`- maxAttempts: ${MAX_EXECUTION_ATTEMPTS}`);
  lines.push('');

  if (assessment.executionRequest) {
    const req = assessment.executionRequest;
    lines.push('## Snapshot Execution Request');
    lines.push('');
    lines.push(`Request ID: ${req.requestId}`);
    lines.push(`Snapshot ID: ${req.snapshotId}`);
    lines.push(`Source project ID: ${req.sourceProjectId}`);
    lines.push(`Mode: ${req.mode}`);
    lines.push(`Eligibility mode: ${req.eligibilityMode}`);
    lines.push(`Execution state: ${req.executionState}`);
    lines.push(`Repository copy performed: ${req.repositoryCopyPerformed}`);
    lines.push('');

    lines.push('### Included Paths');
    lines.push('');
    for (const item of req.includedPaths.slice(0, 8)) {
      lines.push(`- ${item}`);
    }
    lines.push('');

    lines.push('### Excluded Paths');
    lines.push('');
    for (const item of req.excludedPaths.slice(0, 8)) {
      lines.push(`- ${item}`);
    }
    lines.push('');

    lines.push('### Manifest Entries');
    lines.push('');
    for (const entry of req.manifestEntries.slice(0, 8)) {
      lines.push(`- [${entry.included ? 'IN' : 'OUT'}] ${entry.path}`);
    }
    lines.push('');

    lines.push('### Safety Checks');
    lines.push('');
    for (const check of req.safetyChecks) {
      lines.push(`- [${check.passed ? 'PASS' : 'FAIL'}] ${check.label}: ${check.detail}`);
    }
    lines.push('');
  }

  if (assessment.dryRunExecutionResult) {
    const result = assessment.dryRunExecutionResult;
    lines.push('## Dry-Run Execution Result');
    lines.push('');
    lines.push(`Result ID: ${result.resultId}`);
    lines.push(`Mode: ${result.mode}`);
    lines.push(`Simulated files: ${result.simulatedFileCount}`);
    lines.push(`Simulated directories: ${result.simulatedDirectoryCount}`);
    lines.push(`Repository copy performed: ${result.repositoryCopyPerformed}`);
    lines.push(`Completed at: ${result.completedAt}`);
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
  lines.push(WORLD2_REPOSITORY_SNAPSHOT_EXECUTOR_PASS_TOKEN);
  lines.push('');

  return lines.join('\n');
}
