/**
 * World 2 Disposable Workspace — markdown report builder.
 */

import {
  WORLD2_DISPOSABLE_WORKSPACE_PASS_TOKEN,
  WORLD2_DISPOSABLE_WORKSPACE_PHASE,
  WORLD2_DISPOSABLE_WORKSPACE_REPORT_TITLE,
  WORLD2_FORBIDDEN_PATHS,
  WORLD2_ISOLATION_MODES,
  WORLD2_LIFECYCLE_DECISIONS,
  WORLD2_WORKSPACE_STATES,
} from './world2-disposable-workspace-registry.js';
import type { World2DisposableWorkspaceReport } from './world2-disposable-workspace-types.js';

export function buildWorld2DisposableWorkspaceReportMarkdown(
  report: World2DisposableWorkspaceReport,
): string {
  const { assessment } = report;
  const lines: string[] = [
    `# ${WORLD2_DISPOSABLE_WORKSPACE_REPORT_TITLE}`,
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
    '## Workspace States',
    '',
  ];

  for (const state of WORLD2_WORKSPACE_STATES) {
    lines.push(`- ${state}`);
  }
  lines.push('');

  lines.push('## Isolation Modes');
  lines.push('');
  for (const mode of WORLD2_ISOLATION_MODES) {
    lines.push(`- ${mode}`);
  }
  lines.push('');

  lines.push('## Lifecycle Decisions');
  lines.push('');
  for (const decision of WORLD2_LIFECYCLE_DECISIONS) {
    lines.push(`- ${decision}`);
  }
  lines.push('');

  lines.push('## Workspace Verdict');
  lines.push('');
  lines.push(`**State:** ${assessment.workspaceState}`);
  lines.push(`**Isolation mode:** ${assessment.isolationMode}`);
  lines.push(`**Lifecycle decision:** ${assessment.lifecycleAssessment.decision}`);
  lines.push('');
  lines.push(`Assessment ID: ${assessment.assessmentId}`);
  lines.push('');

  lines.push('## Forbidden Live Workspace Paths');
  lines.push('');
  for (const path of WORLD2_FORBIDDEN_PATHS) {
    lines.push(`- ${path}`);
  }
  lines.push('');

  if (assessment.workspaceContract) {
    const contract = assessment.workspaceContract;
    lines.push('## Workspace Contract');
    lines.push('');
    lines.push(`Workspace ID: ${contract.workspaceId}`);
    lines.push(`Source project: ${contract.sourceProjectId}`);
    lines.push(`Disposal required: ${contract.disposalRequired}`);
    lines.push(`Validation required: ${contract.validationRequired}`);
    lines.push(`Rollback reference: ${contract.rollbackReference ?? 'none'}`);
    lines.push('');
    lines.push('### Allowed Paths');
    lines.push('');
    for (const path of contract.allowedPaths.slice(0, 6)) {
      lines.push(`- ${path}`);
    }
    lines.push('');
    lines.push('### Forbidden Paths');
    lines.push('');
    for (const path of contract.forbiddenPaths.slice(0, 6)) {
      lines.push(`- ${path}`);
    }
    lines.push('');
    lines.push('### Forbidden Operations');
    lines.push('');
    for (const op of contract.forbiddenOperations.slice(0, 6)) {
      lines.push(`- ${op}`);
    }
    lines.push('');
  }

  if (assessment.lifecycleAssessment.reasons.length > 0) {
    lines.push('## Lifecycle Reasons');
    lines.push('');
    for (const reason of assessment.lifecycleAssessment.reasons.slice(0, 8)) {
      lines.push(`- ${reason}`);
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
  lines.push(WORLD2_DISPOSABLE_WORKSPACE_PASS_TOKEN);
  lines.push('');

  return lines.join('\n');
}
