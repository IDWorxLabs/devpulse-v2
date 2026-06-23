/**
 * Feature Reality Validation Authority V1 — report formatting.
 */

import type { FeatureRealityAssessment } from './feature-reality-validation-types.js';

export function formatFeatureRealityReportMarkdown(
  assessment: Omit<FeatureRealityAssessment, 'reportMarkdown'>,
): string {
  const lines: string[] = [
    '# Feature Reality Validation Report',
    '',
    `Generated: ${assessment.generatedAt}`,
    `Contract ID: ${assessment.contractId}`,
    `Preview URL: ${assessment.previewUrl}`,
    `Verdict: **${assessment.verdict}**`,
    `Pass token: ${assessment.passToken}`,
    `Launch readiness blocked: ${assessment.blocksLaunchReadiness ? 'Yes' : 'No'}`,
  ];
  if (assessment.blocksLaunchReadinessReason) {
    lines.push(`Block reason: ${assessment.blocksLaunchReadinessReason}`);
  }
  lines.push(
    '',
    '## Scores',
    `- Feature Coverage Score: ${assessment.scores.featureCoverageScore}/100`,
    `- Feature Execution Score: ${assessment.scores.featureExecutionScore}/100`,
    `- Persistence Score: ${assessment.scores.persistenceScore}/100`,
    `- Recovery Score: ${assessment.scores.recoveryScore}/100`,
    `- Feature UX Score: ${assessment.scores.featureUxScore}/100`,
    `- Overall Feature Score: ${assessment.scores.overallFeatureScore}/100`,
    '',
    '## Runtime Checks',
  );
  for (const check of assessment.checks) {
    lines.push(`- [${check.passed ? 'x' : ' '}] **${check.label}** (${check.category}): ${check.detail}`);
  }
  if (assessment.failedChecks.length > 0) {
    lines.push('', '## Failed Checks');
    for (const check of assessment.failedChecks) {
      lines.push(`- **${check.label}**: ${check.detail}`);
    }
  }
  return lines.join('\n');
}
