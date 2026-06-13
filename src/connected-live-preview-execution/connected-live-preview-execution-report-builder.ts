/**
 * Connected Live Preview Execution — markdown report builder.
 */

import {
  CONNECTED_LIVE_PREVIEW_EXECUTION_CORE_QUESTION,
  CONNECTED_LIVE_PREVIEW_EXECUTION_PASS_TOKEN,
  CONNECTED_LIVE_PREVIEW_EXECUTION_PHASE,
  CONNECTED_LIVE_PREVIEW_EXECUTION_REPORT_TITLE,
  ORCHESTRATION_FLOW,
  PREVIEW_EXECUTION_SAFETY_GUARANTEES,
  PREVIEW_EXECUTION_STATES,
  REQUIRED_INPUT_AUTHORITIES,
} from './connected-live-preview-execution-registry.js';
import type { ConnectedLivePreviewExecutionReport } from './connected-live-preview-execution-types.js';

export function buildConnectedLivePreviewExecutionReportMarkdown(
  report: ConnectedLivePreviewExecutionReport,
): string {
  const contract = report.activationContract;
  const evidence = contract?.activationEvidence;
  const lines: string[] = [
    `# ${CONNECTED_LIVE_PREVIEW_EXECUTION_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Core Question',
    '',
    CONNECTED_LIVE_PREVIEW_EXECUTION_CORE_QUESTION,
    '',
    '## Phase',
    '',
    CONNECTED_LIVE_PREVIEW_EXECUTION_PHASE,
    '',
    '## Orchestration Flow',
    '',
    ...ORCHESTRATION_FLOW.map((step, index) => `${index + 1}. ${step}`),
    '',
    '## Input Authorities',
    '',
    ...REQUIRED_INPUT_AUTHORITIES.map((authority) => `- ${authority}`),
    '',
    '## Preview Score',
    '',
    `**${report.previewScore}/100**`,
    '',
    '## Preview State',
    '',
    `**${report.previewState}**`,
    '',
    '## Preview URL',
    '',
    report.previewUrl ? `\`${report.previewUrl}\`` : '_None_',
    '',
    '## Preview Activation Duration',
    '',
    `**${report.previewActivationDurationMs} ms**`,
    '',
  ];

  if (contract) {
    lines.push('## Preview Activation Contract');
    lines.push('');
    lines.push(`Preview ID: \`${contract.previewId}\``);
    lines.push(`Workspace ID: \`${contract.workspaceId}\``);
    lines.push(`Preview type: \`${contract.previewType}\``);
    lines.push(`Founder viewable: ${contract.founderViewable}`);
    lines.push(`Real launch performed: ${contract.realPreviewLaunchPerformed}`);
    lines.push('');
    lines.push('## Preview Evidence');
    lines.push('');
    if (evidence) {
      lines.push('| Field | Value |');
      lines.push('|-------|-------|');
      lines.push(`| previewActivated | ${evidence.previewActivated} |`);
      lines.push(`| previewUrlGenerated | ${evidence.previewUrlGenerated} |`);
      lines.push(`| previewReachable | ${evidence.previewReachable} |`);
      lines.push(`| previewContentServed | ${evidence.previewContentServed} |`);
      lines.push(`| previewArtifactsPresent | ${evidence.previewArtifactsPresent} |`);
      lines.push(`| previewResponseSuccessful | ${evidence.previewResponseSuccessful} |`);
      lines.push(`| previewEndpointAvailable | ${evidence.previewEndpointAvailable} |`);
      lines.push(`| inspectionSource | ${evidence.inspectionSource} |`);
      lines.push('');
    }
    lines.push('## Evidence Entries');
    lines.push('');
    if (contract.previewEvidence.length === 0) {
      lines.push('- None');
    } else {
      for (const entry of contract.previewEvidence) {
        lines.push(`- **${entry.evidenceType}**: ${entry.summary} (${entry.source})`);
      }
    }
    lines.push('');
    lines.push('## Preview Artifacts');
    lines.push('');
    if (contract.previewArtifacts.length === 0) {
      lines.push('- None');
    } else {
      for (const artifact of contract.previewArtifacts) {
        lines.push(`- \`${artifact.path}\` (${artifact.category})`);
      }
    }
    lines.push('');
    lines.push('## Diagnostics');
    lines.push('');
    if (contract.previewDiagnostics.length === 0) {
      lines.push('- None');
    } else {
      for (const diagnostic of contract.previewDiagnostics) {
        lines.push(`- **${diagnostic.label}**: ${diagnostic.value}`);
      }
    }
    lines.push('');
    lines.push('## Warnings');
    lines.push('');
    if (contract.previewWarnings.length === 0) {
      lines.push('- None');
    } else {
      for (const warning of contract.previewWarnings) {
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
  lines.push(`| Was preview activation attempted? | ${qa.previewActivationAttempted} |`);
  lines.push(`| Was a preview URL generated? | ${qa.previewUrlGenerated} |`);
  lines.push(`| Is preview reachable? | ${qa.previewReachable} |`);
  lines.push(`| Is content being served? | ${qa.contentBeingServed} |`);
  lines.push(`| Is preview isolated? | ${qa.previewIsolated} |`);
  lines.push(`| Was World 1 protected? | ${qa.world1Protected} |`);
  lines.push(`| Was activation auditable? | ${qa.activationAuditable} |`);
  lines.push(`| Can founder inspect evidence? | ${qa.founderInspectable} |`);
  lines.push(`| Is preview readiness proven? | ${qa.previewReadinessProven} |`);
  lines.push(`| Is preview activation proven? | ${qa.previewActivationProven} |`);
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
  lines.push('## Preview States');
  lines.push('');
  lines.push(PREVIEW_EXECUTION_STATES.join(', '));
  lines.push('');
  lines.push('## Safety Guarantees');
  lines.push('');
  for (const guarantee of PREVIEW_EXECUTION_SAFETY_GUARANTEES) {
    lines.push(`- ${guarantee}`);
  }
  lines.push('');
  lines.push('## Pass Token');
  lines.push('');
  lines.push(`\`${CONNECTED_LIVE_PREVIEW_EXECUTION_PASS_TOKEN}\``);
  lines.push('');

  return lines.join('\n');
}
