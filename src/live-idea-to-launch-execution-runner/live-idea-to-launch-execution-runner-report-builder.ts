/**
 * Live Idea-To-Launch Execution Runner — markdown report builder.
 */

import {
  LIVE_IDEA_TO_LAUNCH_EXECUTION_RUNNER_CORE_QUESTION,
  LIVE_IDEA_TO_LAUNCH_EXECUTION_RUNNER_PASS_TOKEN,
  LIVE_IDEA_TO_LAUNCH_EXECUTION_RUNNER_PHASE,
  LIVE_IDEA_TO_LAUNCH_EXECUTION_RUNNER_REPORT_TITLE,
  SAFETY_GUARANTEES,
} from './live-idea-to-launch-execution-runner-registry.js';
import type {
  LiveIdeaToLaunchExecutionRunnerReport,
  StageAnalysis,
} from './live-idea-to-launch-execution-runner-types.js';

function stageSection(title: string, stage: StageAnalysis): string[] {
  return [
    `## ${title}`,
    '',
    `- stage: **${stage.stage}**`,
    `- evidence level: **${stage.evidenceLevel}**`,
    `- confirmed: ${stage.confirmed ? 'YES' : 'NO'}`,
    `- score: ${stage.score}/100`,
    `- sources: ${stage.sourceAuthorities.join(', ') || 'none'}`,
    '',
    '### Evidence',
    '',
    ...stage.evidence.map((e) => `- [${e.present ? '✓' : '✗'}] ${e.label}: ${e.detail} (${e.sourceAuthority})`),
    ...(stage.evidence.length === 0 ? ['- none'] : []),
    '',
    '### Missing Evidence',
    '',
    ...stage.missingEvidence.map((m) => `- ${m}`),
    ...(stage.missingEvidence.length === 0 ? ['- none'] : []),
    '',
  ];
}

export function buildLiveIdeaToLaunchExecutionRunnerReportMarkdown(
  report: LiveIdeaToLaunchExecutionRunnerReport,
): string {
  const lines: string[] = [
    `# ${LIVE_IDEA_TO_LAUNCH_EXECUTION_RUNNER_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Core Question',
    '',
    LIVE_IDEA_TO_LAUNCH_EXECUTION_RUNNER_CORE_QUESTION,
    '',
    '## Phase',
    '',
    LIVE_IDEA_TO_LAUNCH_EXECUTION_RUNNER_PHASE,
    '',
    '# Live Idea-To-Launch Execution Runner',
    '',
    '## Execution State',
    '',
    `- state: **${report.executionState}**`,
    `- verdict: **${report.executionVerdict}**`,
    '',
    '## Overall Execution Score',
    '',
    `${report.overallExecutionScore}/100`,
    '',
    '## Stage Breakdown',
    '',
    '| Stage | Confirmed | Level | Score |',
    '|-------|-----------|-------|-------|',
    ...[report.idea, report.planning, report.build, report.validation, report.runtime, report.launch].map(
      (s) => `| ${s.stage} | ${s.confirmed ? 'YES' : 'NO'} | ${s.evidenceLevel} | ${s.score} |`,
    ),
    '',
    ...stageSection('Idea Analysis', report.idea),
    ...stageSection('Planning Analysis', report.planning),
    ...stageSection('Build Analysis', report.build),
    ...stageSection('Validation Analysis', report.validation),
    ...stageSection('Runtime Analysis', report.runtime),
    ...stageSection('Launch Analysis', report.launch),
    '## Execution Chain Gaps',
    '',
    `- chain connected: ${report.chain.chainConnected ? 'YES' : 'NO'}`,
    `- first broken stage: ${report.chain.firstBrokenStage ?? 'none'}`,
    `- next required stage: ${report.chain.nextRequiredStage ?? 'none'}`,
    `- completed: ${report.chain.completedStages.join(', ') || 'none'}`,
    `- incomplete: ${report.chain.incompleteStages.join(', ') || 'none'}`,
    `- blocked: ${report.chain.blockedStages.join(', ') || 'none'}`,
    '',
    ...report.chain.executionGaps.map((g) => `- ${g}`),
    ...(report.chain.executionGaps.length === 0 ? ['- none'] : []),
    '',
    '## Risk Assessment',
    '',
    `- risk level: **${report.risk.riskLevel}**`,
    `- highest risk stage: ${report.risk.highestRiskStage ?? 'none'}`,
    '',
    ...report.risk.riskFactors.map((f) => `- ${f}`),
    ...(report.risk.riskFactors.length === 0 ? ['- none'] : []),
    '',
    '## Next Required Stage',
    '',
    report.chain.nextRequiredStage ?? 'All stages confirmed — lifecycle complete.',
    '',
    '## Recommended Fix',
    '',
    report.recommendedFix,
    '',
    '## Final Verdict',
    '',
    report.executionVerdict === 'PROVEN'
      ? 'Lifecycle **PROVEN** — connected evidence supports idea-to-launch progression.'
      : report.executionVerdict === 'PARTIAL'
        ? 'Lifecycle **PARTIAL** — some stages evidenced but chain not fully proven.'
        : report.executionVerdict === 'UNKNOWN'
          ? 'Lifecycle **UNKNOWN** — insufficient evidence to assess progression.'
          : 'Lifecycle **NOT PROVEN** — missing or weak evidence blocks lifecycle claims.',
    '',
    '## Safety Guarantees',
    '',
    ...SAFETY_GUARANTEES.map((g) => `- ${g}`),
    '',
    '---',
    '',
    LIVE_IDEA_TO_LAUNCH_EXECUTION_RUNNER_PASS_TOKEN,
  ];

  return lines.join('\n');
}

export function formatLiveExecutionRunnerSummary(report: LiveIdeaToLaunchExecutionRunnerReport): string {
  return (
    `Live execution ${report.executionVerdict} — state ${report.executionState}; ` +
    `score ${report.overallExecutionScore}/100; ` +
    `next stage ${report.chain.nextRequiredStage ?? 'complete'}.`
  );
}
