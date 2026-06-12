/**
 * Founder Test Execution Chain Integration — markdown report builder.
 */

import {
  EXECUTION_CHAIN_SAFETY_GUARANTEES,
  EXECUTION_CHAIN_STATES,
  FOUNDER_TEST_EXECUTION_CHAIN_CORE_QUESTION,
  FOUNDER_TEST_EXECUTION_CHAIN_INTEGRATION_PASS_TOKEN,
  FOUNDER_TEST_EXECUTION_CHAIN_INTEGRATION_PHASE,
  FOUNDER_TEST_EXECUTION_CHAIN_INTEGRATION_REPORT_TITLE,
  ORCHESTRATION_FLOW,
  REQUIRED_INPUT_AUTHORITIES,
} from './founder-test-execution-chain-integration-registry.js';
import type { FounderExecutionChainReport } from './founder-test-execution-chain-integration-types.js';

export function buildFounderTestExecutionChainReportMarkdown(
  report: FounderExecutionChainReport,
): string {
  const lines: string[] = [
    `# ${FOUNDER_TEST_EXECUTION_CHAIN_INTEGRATION_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Core Question',
    '',
    FOUNDER_TEST_EXECUTION_CHAIN_CORE_QUESTION,
    '',
    '## Phase',
    '',
    FOUNDER_TEST_EXECUTION_CHAIN_INTEGRATION_PHASE,
    '',
    '## Orchestration Flow',
    '',
    ...ORCHESTRATION_FLOW.map((step, index) => `${index + 1}. ${step}`),
    '',
    '## Input Authorities',
    '',
    ...REQUIRED_INPUT_AUTHORITIES.map((authority) => `- ${authority}`),
    '',
    '## Execution Chain Score',
    '',
    `**${report.executionChainScore}/100**`,
    '',
    '## Execution Chain State',
    '',
    `**${report.executionChainState}**`,
    '',
    '## Execution Chain Connected',
    '',
    report.executionChainConnected ? '**YES**' : '**NO**',
    '',
    '## Chain Completeness',
    '',
    `${report.executionChainCompleteness}%`,
    '',
    '## Stage Status',
    '',
    '| Stage | Status |',
    '|-------|--------|',
    `| Build | ${report.buildStatus} |`,
    `| Runtime | ${report.runtimeStatus} |`,
    `| Preview | ${report.previewStatus} |`,
    `| Verification | ${report.verificationStatus} |`,
    `| End-to-End | ${report.endToEndStatus} |`,
    '',
    '## Weakest / Strongest Stage',
    '',
    `- Weakest: **${report.weakestExecutionStage}**`,
    `- Strongest: **${report.strongestExecutionStage}**`,
    `- Launch blocking stage: **${report.launchBlockingStage ?? 'None'}**`,
    '',
    '## Launch Impact',
    '',
    report.launchImpact,
    '',
    '## Required Questions',
    '',
    '| Question | Answer |',
    '|----------|--------|',
    `| Is build output proven? | ${report.questionAnswers.buildOutputProven ? 'YES' : 'NO'} |`,
    `| Is runtime readiness proven? | ${report.questionAnswers.runtimeReadinessProven ? 'YES' : 'NO'} |`,
    `| Is preview readiness proven? | ${report.questionAnswers.previewReadinessProven ? 'YES' : 'NO'} |`,
    `| Is verification readiness proven? | ${report.questionAnswers.verificationReadinessProven ? 'YES' : 'NO'} |`,
    `| Is end-to-end proof present? | ${report.questionAnswers.endToEndProofPresent ? 'YES' : 'NO'} |`,
    `| Which stage is weakest? | ${report.weakestExecutionStage} |`,
    `| Which stage blocks launch? | ${report.launchBlockingStage ?? 'None'} |`,
    `| Can founder inspect chain health? | ${report.questionAnswers.founderCanInspectChainHealth ? 'YES' : 'NO'} |`,
    `| Is connected execution measurable? | ${report.questionAnswers.connectedExecutionMeasurable ? 'YES' : 'NO'} |`,
    `| Is connected execution proven? | ${report.questionAnswers.connectedExecutionProven ? 'YES' : 'NO'} |`,
    '',
    '## Execution Chain Blockers',
    '',
  ];

  if (report.executionChainBlockers.length === 0) {
    lines.push('- None');
  } else {
    for (const blocker of report.executionChainBlockers) {
      lines.push(`- **${blocker.stage}** (${blocker.sourceAuthority}): ${blocker.explanation}`);
    }
  }

  lines.push('');
  lines.push('## Execution Chain Warnings');
  lines.push('');

  if (report.executionChainWarnings.length === 0) {
    lines.push('- None');
  } else {
    for (const warning of report.executionChainWarnings) {
      lines.push(`- **${warning.stage}** (${warning.sourceAuthority}): ${warning.explanation}`);
    }
  }

  lines.push('');
  lines.push('## Recommended Next Actions');
  lines.push('');

  for (const action of report.recommendedNextActions) {
    lines.push(`- ${action}`);
  }

  lines.push('');
  lines.push('## Execution Chain States');
  lines.push('');
  lines.push(EXECUTION_CHAIN_STATES.join(' · '));
  lines.push('');
  lines.push('## Runtime Safeguards');
  lines.push('');
  for (const guarantee of EXECUTION_CHAIN_SAFETY_GUARANTEES) {
    lines.push(`- ${guarantee}`);
  }
  lines.push('');
  lines.push('## Pass Token');
  lines.push('');
  lines.push(FOUNDER_TEST_EXECUTION_CHAIN_INTEGRATION_PASS_TOKEN);
  lines.push('');

  return lines.join('\n');
}
