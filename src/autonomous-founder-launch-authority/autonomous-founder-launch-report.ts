/**
 * Autonomous Founder Launch Authority V1 — markdown report.
 */

import { AUTONOMOUS_FOUNDER_LAUNCH_AUTHORITY_V1_PASS_TOKEN } from './autonomous-founder-launch-authority-registry.js';
import type { AutonomousFounderLaunchAssessment } from './autonomous-founder-launch-authority-types.js';

export function formatAutonomousFounderLaunchReportMarkdown(
  assessment: AutonomousFounderLaunchAssessment,
): string {
  const lines: string[] = [
    '# Autonomous Founder Launch Authority V1',
    '',
    `Generated: ${assessment.generatedAt}`,
    `Product: ${assessment.productName ?? 'unknown'}`,
    `Contract: ${assessment.contractId ?? 'unknown'}`,
    `Verdict: **${assessment.verdict}**`,
    `Pass token: \`${assessment.passToken}\``,
    '',
    '## Scores',
    '',
    `- Senior Engineering Score: ${assessment.scores.seniorEngineeringScore}/100`,
    `- QA Score: ${assessment.scores.qaScore}/100`,
    `- UX Score: ${assessment.scores.uxScore}/100`,
    `- Product Score: ${assessment.scores.productScore}/100`,
    `- Launch Score: ${assessment.scores.launchScore}/100`,
    `- Founder Score: ${assessment.scores.founderScore}/100`,
    `- Overall Founder Score: ${assessment.scores.overallFounderScore}/100`,
    '',
    '## Evidence Inputs',
    '',
  ];

  for (const source of [
    assessment.evidence.buildReality,
    assessment.evidence.blueprintStructure,
    assessment.evidence.blueprintVisual,
    assessment.evidence.featureReality,
    assessment.evidence.universalFeatureContract,
    assessment.evidence.engineeringReality,
    assessment.evidence.launchReadiness,
  ]) {
    lines.push(
      `- **${source.sourceName}**: ${source.passed ? 'PASS' : 'FAIL'} — ${source.score}/100`,
    );
  }

  lines.push('', '## Reviewer Panel', '');
  for (const reviewer of assessment.reviewers) {
    lines.push(`### ${reviewer.reviewerName} — ${reviewer.score}/100`);
    if (reviewer.founderConfidence != null) {
      lines.push(`Founder Confidence: ${reviewer.founderConfidence}/100`);
    }
    if (reviewer.findings.length > 0) {
      lines.push('', 'Findings:');
      for (const finding of reviewer.findings) {
        lines.push(`- ${finding}`);
      }
    }
    if (reviewer.risks.length > 0) {
      lines.push('', 'Risks:');
      for (const risk of reviewer.risks) {
        lines.push(`- ${risk}`);
      }
    }
    lines.push('');
  }

  if (assessment.remediationPlan) {
    lines.push('## FounderRemediationPlan', '');
    lines.push(`Plan ID: ${assessment.remediationPlan.planId}`);
    lines.push(`Target: ${assessment.remediationPlan.autofixPipelineTarget}`);
    lines.push(`Retry: ${assessment.remediationPlan.retryAttempt}/${assessment.remediationPlan.maxRetries}`);
    lines.push('');
    for (const issue of assessment.remediationPlan.issues) {
      lines.push(
        `- [${issue.severity}] ${issue.summary} (${issue.evidenceSource}) — autofix eligible: ${issue.autofixEligible ? 'yes' : 'no'}`,
      );
    }
    lines.push('');
  }

  lines.push('## User Surface', '');
  lines.push(`User sees: ${assessment.userLabel}`);
  lines.push('');
  lines.push(`Expected pass token when launch-ready: \`${AUTONOMOUS_FOUNDER_LAUNCH_AUTHORITY_V1_PASS_TOKEN}\``);

  return lines.join('\n');
}
