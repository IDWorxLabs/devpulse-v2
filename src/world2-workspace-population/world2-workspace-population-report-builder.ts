/**
 * World 2 Workspace Population — markdown report builder.
 */

import {
  WORLD2_POPULATION_CATEGORIES,
  WORLD2_POPULATION_NEVER_REQUIRE,
  WORLD2_POPULATION_READINESS_STATES,
  WORLD2_WORKSPACE_POPULATION_PASS_TOKEN,
  WORLD2_WORKSPACE_POPULATION_PHASE,
  WORLD2_WORKSPACE_POPULATION_REPORT_TITLE,
} from './world2-workspace-population-registry.js';
import type { World2WorkspacePopulationReport } from './world2-workspace-population-types.js';

export function buildWorld2WorkspacePopulationReportMarkdown(
  report: World2WorkspacePopulationReport,
): string {
  const { assessment } = report;
  const lines: string[] = [
    `# ${WORLD2_WORKSPACE_POPULATION_REPORT_TITLE}`,
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
    '## Readiness States',
    '',
  ];

  for (const state of WORLD2_POPULATION_READINESS_STATES) {
    lines.push(`- ${state}`);
  }
  lines.push('');

  lines.push('## Population Categories');
  lines.push('');
  for (const category of WORLD2_POPULATION_CATEGORIES) {
    lines.push(`- ${category}`);
  }
  lines.push('');

  lines.push('## Population Verdict');
  lines.push('');
  lines.push(`**State:** ${assessment.readinessState}`);
  lines.push(`**Readiness:** ${assessment.populationReadiness}%`);
  lines.push('');
  lines.push(`Population ID: ${assessment.populationId}`);
  lines.push(`Workspace ID: ${assessment.workspaceId}`);
  lines.push('');

  lines.push('## Safety — Never Require');
  lines.push('');
  for (const item of WORLD2_POPULATION_NEVER_REQUIRE) {
    lines.push(`- ${item}`);
  }
  lines.push('');

  if (assessment.populationContract) {
    const contract = assessment.populationContract;
    lines.push('## Population Contract');
    lines.push('');
    lines.push(`Contract ID: ${contract.contractId}`);
    lines.push('');
    lines.push('### Required Validation Assets');
    lines.push('');
    for (const item of contract.requiredValidationAssets.slice(0, 8)) {
      lines.push(`- ${item}`);
    }
    lines.push('');
    lines.push('### Required Rollback Assets');
    lines.push('');
    for (const item of contract.requiredRollbackAssets.slice(0, 8)) {
      lines.push(`- ${item}`);
    }
    lines.push('');
    lines.push('### Required Metadata');
    lines.push('');
    for (const item of contract.requiredMetadata) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }

  if (assessment.missingArtifacts.length > 0) {
    lines.push('## Missing Artifacts');
    lines.push('');
    for (const item of assessment.missingArtifacts.slice(0, 10)) {
      lines.push(`- ${item.category}: ${item.name}`);
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
  lines.push(WORLD2_WORKSPACE_POPULATION_PASS_TOKEN);
  lines.push('');

  return lines.join('\n');
}
