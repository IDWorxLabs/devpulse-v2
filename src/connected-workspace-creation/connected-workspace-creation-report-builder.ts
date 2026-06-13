/**
 * Connected Workspace Creation — markdown report builder.
 */

import {
  CONNECTED_WORKSPACE_CREATION_CORE_QUESTION,
  CONNECTED_WORKSPACE_CREATION_PASS_TOKEN,
  CONNECTED_WORKSPACE_CREATION_PHASE,
  CONNECTED_WORKSPACE_CREATION_REPORT_TITLE,
  ORCHESTRATION_FLOW,
  REQUIRED_INPUT_AUTHORITIES,
  WORKSPACE_CREATION_SAFETY_GUARANTEES,
  WORKSPACE_CREATION_STATES,
} from './connected-workspace-creation-registry.js';
import type { ConnectedWorkspaceCreationReport } from './connected-workspace-creation-types.js';

export function buildConnectedWorkspaceCreationReportMarkdown(
  report: ConnectedWorkspaceCreationReport,
): string {
  const contract = report.creationContract;
  const lines: string[] = [
    `# ${CONNECTED_WORKSPACE_CREATION_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Core Question',
    '',
    CONNECTED_WORKSPACE_CREATION_CORE_QUESTION,
    '',
    '## Phase',
    '',
    CONNECTED_WORKSPACE_CREATION_PHASE,
    '',
    '## Orchestration Flow',
    '',
    ...ORCHESTRATION_FLOW.map((step, index) => `${index + 1}. ${step}`),
    '',
    '## Input Authorities',
    '',
    ...REQUIRED_INPUT_AUTHORITIES.map((authority) => `- ${authority}`),
    '',
    '## Workspace Creation Score',
    '',
    `**${report.workspaceCreationScore}/100**`,
    '',
    '## Workspace State',
    '',
    `**${report.workspaceState}**`,
    '',
  ];

  if (contract) {
    lines.push('## Workspace Root');
    lines.push('');
    lines.push(`Physical: \`${contract.workspaceRoot}\``);
    lines.push(`Logical: \`${contract.logicalRoot}\``);
    lines.push('');
    lines.push('## Created Directories');
    lines.push('');
    if (contract.createdDirectories.length === 0) {
      lines.push('- None');
    } else {
      for (const dir of contract.createdDirectories) {
        lines.push(`- ${dir}`);
      }
    }
    lines.push('');
    lines.push('## Creation Evidence');
    lines.push('');
    lines.push('| Field | Value |');
    lines.push('|-------|-------|');
    lines.push(`| workspaceExists | ${contract.filesystemEvidence.workspaceExists} |`);
    lines.push(`| workspaceRootExists | ${contract.filesystemEvidence.workspaceRootExists} |`);
    lines.push(`| directoryCount | ${contract.filesystemEvidence.directoryCount} |`);
    lines.push(`| artifactCount | ${contract.filesystemEvidence.artifactCount} |`);
    lines.push(`| creationDurationMs | ${contract.filesystemEvidence.creationDurationMs} |`);
    lines.push(`| creationSuccessful | ${contract.filesystemEvidence.creationSuccessful} |`);
    lines.push(`| inspectionSource | ${contract.filesystemEvidence.inspectionSource} |`);
    lines.push('');
    lines.push('## Evidence Entries');
    lines.push('');
    for (const entry of contract.creationEvidence.slice(0, 12)) {
      lines.push(`- **${entry.evidenceType}** — ${entry.summary} (${entry.source})`);
    }
  }

  lines.push('');
  lines.push('## Required Questions');
  lines.push('');
  lines.push('| Question | Answer |');
  lines.push('|----------|--------|');
  lines.push(`| Was a workspace created? | ${report.questionAnswers.workspaceCreated ? 'YES' : 'NO'} |`);
  lines.push(`| Does the workspace exist? | ${report.questionAnswers.workspaceExists ? 'YES' : 'NO'} |`);
  lines.push(`| Is it disposable? | ${report.questionAnswers.isDisposable ? 'YES' : 'NO'} |`);
  lines.push(`| Is it isolated? | ${report.questionAnswers.isIsolated ? 'YES' : 'NO'} |`);
  lines.push(`| Is World 1 protected? | ${report.questionAnswers.world1Protected ? 'YES' : 'NO'} |`);
  lines.push(`| Was governance satisfied? | ${report.questionAnswers.governanceSatisfied ? 'YES' : 'NO'} |`);
  lines.push(`| Was creation auditable? | ${report.questionAnswers.creationAuditable ? 'YES' : 'NO'} |`);
  lines.push(`| Is rollback available? | ${report.questionAnswers.rollbackAvailable ? 'YES' : 'NO'} |`);
  lines.push(`| Can founder inspect creation evidence? | ${report.questionAnswers.founderInspectable ? 'YES' : 'NO'} |`);
  lines.push(`| Is workspace creation proven? | ${report.questionAnswers.workspaceCreationProven ? 'YES' : 'NO'} |`);
  lines.push('');
  lines.push('## Warnings');
  lines.push('');
  if (report.warningReasons.length === 0) {
    lines.push('- None');
  } else {
    for (const warning of report.warningReasons) {
      lines.push(`- ${warning}`);
    }
  }
  lines.push('');
  lines.push('## Blockers');
  lines.push('');
  if (report.blockingReasons.length === 0) {
    lines.push('- None');
  } else {
    for (const blocker of report.blockingReasons) {
      lines.push(`- ${blocker}`);
    }
  }
  lines.push('');
  lines.push('## Recommended Next Actions');
  lines.push('');
  for (const action of report.recommendedNextActions) {
    lines.push(`- ${action}`);
  }
  lines.push('');
  lines.push('## Workspace States');
  lines.push('');
  lines.push(WORKSPACE_CREATION_STATES.join(' · '));
  lines.push('');
  lines.push('## Runtime Safeguards');
  lines.push('');
  for (const guarantee of WORKSPACE_CREATION_SAFETY_GUARANTEES) {
    lines.push(`- ${guarantee}`);
  }
  lines.push('');
  lines.push('## Pass Token');
  lines.push('');
  lines.push(CONNECTED_WORKSPACE_CREATION_PASS_TOKEN);
  lines.push('');

  return lines.join('\n');
}
