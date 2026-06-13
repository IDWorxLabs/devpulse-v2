/**
 * Connected Verification Execution — markdown report builder.
 */

import {
  CONNECTED_VERIFICATION_EXECUTION_CORE_QUESTION,
  CONNECTED_VERIFICATION_EXECUTION_PASS_TOKEN,
  CONNECTED_VERIFICATION_EXECUTION_PHASE,
  CONNECTED_VERIFICATION_EXECUTION_REPORT_TITLE,
  ORCHESTRATION_FLOW,
  REQUIRED_INPUT_AUTHORITIES,
  VERIFICATION_EXECUTION_SAFETY_GUARANTEES,
  VERIFICATION_EXECUTION_STATES,
} from './connected-verification-execution-registry.js';
import type { ConnectedVerificationExecutionReport } from './connected-verification-execution-types.js';

export function buildConnectedVerificationExecutionReportMarkdown(
  report: ConnectedVerificationExecutionReport,
): string {
  const contract = report.executionContract;
  const evidence = contract?.executionEvidence;
  const lines: string[] = [
    `# ${CONNECTED_VERIFICATION_EXECUTION_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Core Question',
    '',
    CONNECTED_VERIFICATION_EXECUTION_CORE_QUESTION,
    '',
    '## Phase',
    '',
    CONNECTED_VERIFICATION_EXECUTION_PHASE,
    '',
    '## Orchestration Flow',
    '',
    ...ORCHESTRATION_FLOW.map((step, index) => `${index + 1}. ${step}`),
    '',
    '## Input Authorities',
    '',
    ...REQUIRED_INPUT_AUTHORITIES.map((authority) => `- ${authority}`),
    '',
    '## Verification Score',
    '',
    `**${report.verificationScore}/100**`,
    '',
    '## Verification State',
    '',
    `**${report.verificationState}**`,
    '',
    '## Verification Coverage',
    '',
    `**${report.verificationCoverage}%**`,
    '',
    '## Probe and Evidence Results',
    '',
    `| Result | Status |`,
    `|--------|--------|`,
    `| Preview probe | ${report.previewProbeResult} |`,
    `| Workspace evidence | ${report.workspaceEvidenceResult} |`,
    `| Runtime evidence | ${report.runtimeEvidenceResult} |`,
    `| Preview evidence | ${report.previewEvidenceResult} |`,
    '',
  ];

  if (contract) {
    lines.push('## Verification Contract');
    lines.push('');
    lines.push(`Verification ID: \`${contract.verificationId}\``);
    lines.push(`Workspace ID: \`${contract.workspaceId}\``);
    lines.push(`Preview URL: \`${contract.previewUrl}\``);
    lines.push(`Duration: ${contract.verificationDurationMs} ms`);
    lines.push('');
    lines.push('## Verification Evidence');
    lines.push('');
    if (evidence) {
      lines.push('| Field | Value |');
      lines.push('|-------|-------|');
      lines.push(`| verificationStarted | ${evidence.verificationStarted} |`);
      lines.push(`| verificationCompleted | ${evidence.verificationCompleted} |`);
      lines.push(`| verificationChecksExecuted | ${evidence.verificationChecksExecuted} |`);
      lines.push(`| verificationArtifactsGenerated | ${evidence.verificationArtifactsGenerated} |`);
      lines.push(`| verificationCoverageCollected | ${evidence.verificationCoverageCollected} |`);
      lines.push(`| verificationSucceeded | ${evidence.verificationSucceeded} |`);
      lines.push(`| previewProbeStatus | ${evidence.previewProbeStatus} |`);
      lines.push(`| workspaceEvidenceStatus | ${evidence.workspaceEvidenceStatus} |`);
      lines.push(`| runtimeEvidenceStatus | ${evidence.runtimeEvidenceStatus} |`);
      lines.push(`| previewEvidenceStatus | ${evidence.previewEvidenceStatus} |`);
      lines.push('');
    }
    lines.push('## Verification Results');
    lines.push('');
    if (contract.verificationResults.length === 0) {
      lines.push('- None');
    } else {
      for (const result of contract.verificationResults) {
        lines.push(`- **${result.checkId}** (${result.status}): ${result.detail}`);
      }
    }
    lines.push('');
    lines.push('## Verification Artifacts');
    lines.push('');
    if (contract.verificationArtifacts.length === 0) {
      lines.push('- None');
    } else {
      for (const artifact of contract.verificationArtifacts) {
        lines.push(`- \`${artifact.path}\` (${artifact.category})`);
      }
    }
    lines.push('');
    lines.push('## Diagnostics');
    lines.push('');
    if (contract.verificationDiagnostics.length === 0) {
      lines.push('- None');
    } else {
      for (const diagnostic of contract.verificationDiagnostics) {
        lines.push(`- **${diagnostic.label}**: ${diagnostic.value}`);
      }
    }
    lines.push('');
    lines.push('## Warnings');
    lines.push('');
    if (contract.verificationWarnings.length === 0) {
      lines.push('- None');
    } else {
      for (const warning of contract.verificationWarnings) {
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
  lines.push(`| Was verification executed? | ${qa.verificationExecuted} |`);
  lines.push(`| Were checks actually run? | ${qa.checksActuallyRun} |`);
  lines.push(`| Were results collected? | ${qa.resultsCollected} |`);
  lines.push(`| Were verification artifacts generated? | ${qa.verificationArtifactsGenerated} |`);
  lines.push(`| Was execution isolated? | ${qa.executionIsolated} |`);
  lines.push(`| Was World 1 protected? | ${qa.world1Protected} |`);
  lines.push(`| Was verification auditable? | ${qa.verificationAuditable} |`);
  lines.push(`| Can founder inspect evidence? | ${qa.founderInspectable} |`);
  lines.push(`| Is verification readiness proven? | ${qa.verificationReadinessProven} |`);
  lines.push(`| Is verification execution proven? | ${qa.verificationExecutionProven} |`);
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
  lines.push('## Verification States');
  lines.push('');
  lines.push(VERIFICATION_EXECUTION_STATES.join(', '));
  lines.push('');
  lines.push('## Safety Guarantees');
  lines.push('');
  for (const guarantee of VERIFICATION_EXECUTION_SAFETY_GUARANTEES) {
    lines.push(`- ${guarantee}`);
  }
  lines.push('');
  lines.push('## Pass Token');
  lines.push('');
  lines.push(`\`${CONNECTED_VERIFICATION_EXECUTION_PASS_TOKEN}\``);
  lines.push('');

  return lines.join('\n');
}
