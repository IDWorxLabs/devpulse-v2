/**
 * Connected Runtime Execution — markdown report builder.
 */

import {
  CONNECTED_RUNTIME_EXECUTION_CORE_QUESTION,
  CONNECTED_RUNTIME_EXECUTION_PASS_TOKEN,
  CONNECTED_RUNTIME_EXECUTION_PHASE,
  CONNECTED_RUNTIME_EXECUTION_REPORT_TITLE,
  ORCHESTRATION_FLOW,
  REQUIRED_INPUT_AUTHORITIES,
  RUNTIME_EXECUTION_SAFETY_GUARANTEES,
  RUNTIME_EXECUTION_STATES,
} from './connected-runtime-execution-registry.js';
import type { ConnectedRuntimeExecutionReport } from './connected-runtime-execution-types.js';

export function buildConnectedRuntimeExecutionReportMarkdown(
  report: ConnectedRuntimeExecutionReport,
): string {
  const contract = report.activationContract;
  const evidence = contract?.activationEvidence;
  const lines: string[] = [
    `# ${CONNECTED_RUNTIME_EXECUTION_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Core Question',
    '',
    CONNECTED_RUNTIME_EXECUTION_CORE_QUESTION,
    '',
    '## Phase',
    '',
    CONNECTED_RUNTIME_EXECUTION_PHASE,
    '',
    '## Orchestration Flow',
    '',
    ...ORCHESTRATION_FLOW.map((step, index) => `${index + 1}. ${step}`),
    '',
    '## Input Authorities',
    '',
    ...REQUIRED_INPUT_AUTHORITIES.map((authority) => `- ${authority}`),
    '',
    '## Runtime Score',
    '',
    `**${report.runtimeScore}/100**`,
    '',
    '## Runtime State',
    '',
    `**${report.runtimeState}**`,
    '',
    '## Startup Duration',
    '',
    `**${report.startupDurationMs} ms**`,
    '',
  ];

  if (contract) {
    lines.push('## Runtime Activation Contract');
    lines.push('');
    lines.push(`Runtime ID: \`${contract.runtimeId}\``);
    lines.push(`Workspace ID: \`${contract.workspaceId}\``);
    lines.push(`Runtime type: \`${contract.runtimeType}\``);
    lines.push(`Real launch performed: ${contract.realRuntimeLaunchPerformed}`);
    lines.push('');
    lines.push('## Runtime Evidence');
    lines.push('');
    if (evidence) {
      lines.push('| Field | Value |');
      lines.push('|-------|-------|');
      lines.push(`| runtimeStarted | ${evidence.runtimeStarted} |`);
      lines.push(`| startupSucceeded | ${evidence.startupSucceeded} |`);
      lines.push(`| startupDurationMs | ${evidence.startupDurationMs} |`);
      lines.push(`| processDetected | ${evidence.processDetected} |`);
      lines.push(`| runtimeEndpointAvailable | ${evidence.runtimeEndpointAvailable} |`);
      lines.push(`| startupArtifactsPresent | ${evidence.startupArtifactsPresent} |`);
      lines.push(`| inspectionSource | ${evidence.inspectionSource} |`);
      lines.push('');
    }
    lines.push('## Evidence Entries');
    lines.push('');
    if (contract.runtimeEvidence.length === 0) {
      lines.push('- None');
    } else {
      for (const entry of contract.runtimeEvidence) {
        lines.push(`- **${entry.evidenceType}**: ${entry.summary} (${entry.source})`);
      }
    }
    lines.push('');
    lines.push('## Runtime Artifacts');
    lines.push('');
    if (contract.runtimeArtifacts.length === 0) {
      lines.push('- None');
    } else {
      for (const artifact of contract.runtimeArtifacts) {
        lines.push(`- \`${artifact.path}\` (${artifact.category})`);
      }
    }
    lines.push('');
    lines.push('## Diagnostics');
    lines.push('');
    if (contract.runtimeDiagnostics.length === 0) {
      lines.push('- None');
    } else {
      for (const diagnostic of contract.runtimeDiagnostics) {
        lines.push(`- **${diagnostic.label}**: ${diagnostic.value}`);
      }
    }
    lines.push('');
    lines.push('## Warnings');
    lines.push('');
    if (contract.runtimeWarnings.length === 0) {
      lines.push('- None');
    } else {
      for (const warning of contract.runtimeWarnings) {
        lines.push(`- ${warning}`);
      }
    }
    lines.push('');
  }

  lines.push('## Required Questions');
  lines.push('');
  lines.push('| Question | Answer |');
  lines.push('|----------|--------|');
  const qa = report.questionAnswers;
  lines.push(`| Was runtime activation attempted? | ${qa.runtimeActivationAttempted} |`);
  lines.push(`| Did startup succeed? | ${qa.startupSucceeded} |`);
  lines.push(`| Is the runtime alive? | ${qa.runtimeAlive} |`);
  lines.push(`| Were startup artifacts detected? | ${qa.startupArtifactsDetected} |`);
  lines.push(`| Was activation isolated? | ${qa.activationIsolated} |`);
  lines.push(`| Was World 1 protected? | ${qa.world1Protected} |`);
  lines.push(`| Was activation auditable? | ${qa.activationAuditable} |`);
  lines.push(`| Can founder inspect evidence? | ${qa.founderInspectable} |`);
  lines.push(`| Is runtime readiness proven? | ${qa.runtimeReadinessProven} |`);
  lines.push(`| Is runtime activation proven? | ${qa.runtimeActivationProven} |`);
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
  if (report.recommendedNextActions.length === 0) {
    lines.push('- None');
  } else {
    for (const action of report.recommendedNextActions) {
      lines.push(`- ${action}`);
    }
  }
  lines.push('');
  lines.push('## Runtime States');
  lines.push('');
  lines.push(RUNTIME_EXECUTION_STATES.join(', '));
  lines.push('');
  lines.push('## Safety Guarantees');
  lines.push('');
  for (const guarantee of RUNTIME_EXECUTION_SAFETY_GUARANTEES) {
    lines.push(`- ${guarantee}`);
  }
  lines.push('');
  lines.push('## Pass Token');
  lines.push('');
  lines.push(`\`${CONNECTED_RUNTIME_EXECUTION_PASS_TOKEN}\``);
  lines.push('');

  return lines.join('\n');
}
