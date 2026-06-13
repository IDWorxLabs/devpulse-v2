/**
 * Autonomous Build Execution Proof — markdown report builder.
 */

import {
  AUTONOMOUS_BUILD_EXECUTION_PROOF_CORE_QUESTION,
  AUTONOMOUS_BUILD_EXECUTION_PROOF_PASS_TOKEN,
  AUTONOMOUS_BUILD_EXECUTION_PROOF_PHASE,
  AUTONOMOUS_BUILD_EXECUTION_PROOF_REPORT_TITLE,
  EXECUTION_PROOF_SAFETY_GUARANTEES,
  ORCHESTRATION_FLOW,
  REQUIRED_INPUT_AUTHORITIES,
} from './autonomous-build-execution-proof-registry.js';
import type { AutonomousBuildExecutionProofReport } from './autonomous-build-execution-proof-types.js';

export function buildAutonomousBuildExecutionProofReportMarkdown(
  report: AutonomousBuildExecutionProofReport,
): string {
  const lines: string[] = [
    `# ${AUTONOMOUS_BUILD_EXECUTION_PROOF_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Core Question',
    '',
    AUTONOMOUS_BUILD_EXECUTION_PROOF_CORE_QUESTION,
    '',
    '## Phase',
    '',
    AUTONOMOUS_BUILD_EXECUTION_PROOF_PHASE,
    '',
    '## Orchestration Flow',
    '',
    ...ORCHESTRATION_FLOW.map((step, index) => `${index + 1}. ${step}`),
    '',
    '## Input Authorities',
    '',
    ...REQUIRED_INPUT_AUTHORITIES.map((authority) => `- ${authority}`),
    '',
    '## AUTONOMOUS BUILD EXECUTION PROOF',
    '',
    `**Chain connected:** ${report.chainConnected ? 'YES' : 'NO'}`,
    '',
    '## Execution Chain Status',
    '',
    '| Stage | Proof | Score | Upstream State |',
    '|-------|-------|-------|----------------|',
  ];

  for (const stage of report.stageProofs) {
    lines.push(
      `| ${stage.stage} | ${stage.proofLevel} | ${stage.score} | ${stage.upstreamState} |`,
    );
  }

  lines.push('');
  lines.push('## First Broken Stage');
  lines.push('');
  lines.push(report.firstBrokenStage ?? 'None — all core stages proven and linked');
  lines.push('');
  lines.push('## Chain Links');
  lines.push('');
  for (const link of report.chainAnalysis.chainLinks) {
    lines.push(`- **${link.fromStage} → ${link.toStage}:** ${link.connected ? 'CONNECTED' : 'BROKEN'} — ${link.detail}`);
  }

  lines.push('');
  lines.push('## Founder Questions');
  lines.push('');
  const q = report.founderQuestions;
  lines.push(`| Question | Answer |`);
  lines.push(`|----------|--------|`);
  lines.push(`| Can AiDevEngine actually build software? | ${q.canActuallyBuildSoftware ? 'YES (proven)' : 'NO'} |`);
  lines.push(`| Can AiDevEngine actually run software? | ${q.canActuallyRunSoftware ? 'YES (proven)' : 'NO'} |`);
  lines.push(`| Can AiDevEngine actually preview software? | ${q.canActuallyPreviewSoftware ? 'YES (proven)' : 'NO'} |`);
  lines.push(`| Can AiDevEngine actually verify software? | ${q.canActuallyVerifySoftware ? 'YES (proven)' : 'NO'} |`);
  lines.push(`| Can a founder go from idea to launch? | ${q.canFounderGoFromIdeaToLaunch ? 'YES (proven)' : 'NO'} |`);
  lines.push(`| What exact stage breaks? | ${q.exactBreakStage ?? 'None'} |`);

  lines.push('');
  lines.push('## Missing Evidence');
  lines.push('');
  if (report.missingEvidence.length === 0) {
    lines.push('- None');
  } else {
    for (const item of report.missingEvidence) {
      lines.push(`- ${item}`);
    }
  }

  lines.push('');
  lines.push('## Launch Impact');
  lines.push('');
  lines.push(report.launchImpact);
  lines.push('');
  lines.push('## Recommended Fix');
  lines.push('');
  lines.push(report.recommendedFix);
  lines.push('');
  lines.push('## Recommended Next Actions');
  lines.push('');
  for (const action of report.recommendedNextActions) {
    lines.push(`- ${action}`);
  }

  lines.push('');
  lines.push('## Stage Detail');
  lines.push('');
  for (const stage of report.stageProofs) {
    lines.push(`### ${stage.stage}`);
    lines.push('');
    lines.push(`Proof: **${stage.proofLevel}** · Score: ${stage.score}/100 · Source: ${stage.sourceAuthority}`);
    if (stage.missingEvidence.length) {
      lines.push('');
      lines.push('Missing evidence:');
      for (const m of stage.missingEvidence) {
        lines.push(`- ${m}`);
      }
    }
    lines.push('');
  }

  lines.push('## Safety Guarantees');
  lines.push('');
  for (const guarantee of EXECUTION_PROOF_SAFETY_GUARANTEES) {
    lines.push(`- ${guarantee}`);
  }

  lines.push('');
  lines.push(`Pass token: \`${AUTONOMOUS_BUILD_EXECUTION_PROOF_PASS_TOKEN}\``);
  lines.push('');

  return lines.join('\n');
}

export function formatAutonomousBuildExecutionProofSummary(
  report: AutonomousBuildExecutionProofReport,
): string {
  const broken = report.firstBrokenStage ? `First break: ${report.firstBrokenStage}.` : 'All core stages proven.';
  return (
    `Autonomous Build Execution Proof: chain ${report.chainConnected ? 'CONNECTED' : 'NOT CONNECTED'} — ` +
    `${broken} Launch blocked by chain: ${report.launchBlockedByChain ? 'yes' : 'no'}.`
  );
}
