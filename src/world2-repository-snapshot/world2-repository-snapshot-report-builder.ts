/**
 * World 2 Repository Snapshot — markdown report builder.
 */

import {
  MAX_SNAPSHOT_ATTEMPTS,
  MAX_SNAPSHOT_DIRECTORIES,
  MAX_SNAPSHOT_FILES,
  WORLD2_GIT_INTERNALS_EXCLUSIONS,
  WORLD2_NODE_MODULES_EXCLUSION,
  WORLD2_REPOSITORY_SNAPSHOT_PASS_TOKEN,
  WORLD2_REPOSITORY_SNAPSHOT_PHASE,
  WORLD2_REPOSITORY_SNAPSHOT_REPORT_TITLE,
  WORLD2_SNAPSHOT_SAFETY_GUARANTEES,
  WORLD2_SNAPSHOT_STATES,
  WORLD2_STANDARD_SNAPSHOT_EXCLUSIONS,
} from './world2-repository-snapshot-registry.js';
import type { World2RepositorySnapshotReport } from './world2-repository-snapshot-types.js';

export function buildWorld2RepositorySnapshotReportMarkdown(
  report: World2RepositorySnapshotReport,
): string {
  const { assessment } = report;
  const lines: string[] = [
    `# ${WORLD2_REPOSITORY_SNAPSHOT_REPORT_TITLE}`,
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
    '## Snapshot States',
    '',
  ];

  for (const state of WORLD2_SNAPSHOT_STATES) {
    lines.push(`- ${state}`);
  }
  lines.push('');

  lines.push('## Snapshot Verdict');
  lines.push('');
  lines.push(`**Snapshot state:** ${assessment.snapshotState}`);
  lines.push(`Snapshot assessment ID: ${assessment.snapshotAssessmentId}`);
  lines.push(`Workspace ID: ${assessment.workspaceId}`);
  lines.push('');

  lines.push('## Safety Guarantees');
  lines.push('');
  for (const guarantee of WORLD2_SNAPSHOT_SAFETY_GUARANTEES) {
    lines.push(`- ${guarantee}`);
  }
  lines.push('');

  lines.push('## Standard Exclusions');
  lines.push('');
  lines.push(`- node_modules: ${WORLD2_NODE_MODULES_EXCLUSION}`);
  for (const rule of WORLD2_GIT_INTERNALS_EXCLUSIONS.slice(0, 4)) {
    lines.push(`- .git: ${rule}`);
  }
  for (const rule of WORLD2_STANDARD_SNAPSHOT_EXCLUSIONS.slice(0, 6)) {
    lines.push(`- ${rule}`);
  }
  lines.push('');

  lines.push('## Snapshot Bounds (Registry Defaults)');
  lines.push('');
  lines.push(`- maxFiles: ${MAX_SNAPSHOT_FILES}`);
  lines.push(`- maxDirectories: ${MAX_SNAPSHOT_DIRECTORIES}`);
  lines.push(`- maxSnapshotAttempts: ${MAX_SNAPSHOT_ATTEMPTS}`);
  lines.push('');

  if (assessment.snapshotScope) {
    const scope = assessment.snapshotScope;
    lines.push('## Snapshot Scope');
    lines.push('');
    lines.push(`Snapshot ID: ${scope.snapshotId}`);
    lines.push(`Source project ID: ${scope.sourceProjectId}`);
    lines.push(`Manifest ID: ${scope.snapshotManifest.manifestId}`);
    lines.push(`Repository copy performed: ${scope.snapshotManifest.repositoryCopyPerformed}`);
    lines.push('');

    lines.push('### Included Paths');
    lines.push('');
    for (const item of scope.includedPaths.slice(0, 8)) {
      lines.push(`- ${item}`);
    }
    lines.push('');

    lines.push('### Excluded Paths');
    lines.push('');
    for (const item of scope.excludedPaths.slice(0, 8)) {
      lines.push(`- ${item}`);
    }
    lines.push('');

    lines.push('### Snapshot Manifest');
    lines.push('');
    lines.push(`Inclusions: ${scope.snapshotManifest.inclusionCount}`);
    lines.push(`Exclusions: ${scope.snapshotManifest.exclusionCount}`);
    for (const entry of scope.snapshotManifest.entries.slice(0, 8)) {
      lines.push(`- [${entry.included ? 'IN' : 'OUT'}] ${entry.path} (${entry.kind})`);
    }
    lines.push('');

    lines.push('### Safety Checks');
    lines.push('');
    for (const check of scope.safetyChecks) {
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
  lines.push(WORLD2_REPOSITORY_SNAPSHOT_PASS_TOKEN);
  lines.push('');

  return lines.join('\n');
}
