/**
 * Launch Readiness Authority V2 — markdown report builder.
 */

import type {
  LaunchDecisionExplanation,
  LaunchEvidenceDashboard,
  LaunchReadinessPipelineResult,
  LaunchVerdictResult,
} from './launch-readiness-types.js';

export function buildLaunchReadinessReport(input: {
  pipelineId: string;
  verdict: LaunchVerdictResult;
  explanation: LaunchDecisionExplanation;
  dashboard: LaunchEvidenceDashboard;
}): string {
  const lines: string[] = [
    '# Launch Readiness Authority V2 — Engineering Report',
    '',
    `Pipeline: ${input.pipelineId}`,
    `Verdict: **${input.verdict.verdict}**`,
    `Primary reason: ${input.verdict.primaryReason}`,
    '',
    '## Confidence',
    `- Overall: ${input.verdict.confidence.overallConfidence}`,
    `- Engineering: ${input.verdict.confidence.engineeringConfidence}`,
    `- User: ${input.verdict.confidence.userConfidence}`,
    `- Launch: ${input.verdict.confidence.launchConfidence}`,
    '',
    '## Evidence coverage',
    `- Collected: ${input.dashboard.evidenceCoverage.collected}/${input.dashboard.evidenceCoverage.required}`,
  ];

  if (input.dashboard.evidenceCoverage.missing.length) {
    lines.push(`- Missing: ${input.dashboard.evidenceCoverage.missing.join(', ')}`);
  }

  lines.push('', '## Blockers');
  if (input.dashboard.blockers.length === 0) {
    lines.push('- None');
  } else {
    for (const blocker of input.dashboard.blockers) {
      lines.push(`- [${blocker.kind}] ${blocker.summary} (${blocker.sourceId})`);
    }
  }

  lines.push('', '## Explanation');
  for (const line of input.explanation.summaryLines) {
    lines.push(`- ${line}`);
  }

  if (input.explanation.blockingSections.length) {
    lines.push('', '## Blocking evidence');
    for (const section of input.explanation.blockingSections) {
      lines.push(`### ${section.heading}`);
      for (const line of section.lines) {
        lines.push(`- ${line}`);
      }
    }
  }

  lines.push('', '## Recommended next action', input.explanation.recommendedNextAction);

  if (input.verdict.routingTarget) {
    lines.push('', `Route to: ${input.verdict.routingTarget}`);
  }

  return lines.join('\n');
}

export function buildLaunchReadinessPipelineReport(result: LaunchReadinessPipelineResult): string {
  return result.reportMarkdown;
}
