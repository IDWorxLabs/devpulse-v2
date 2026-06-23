/**
 * Universal App Blueprint Visual Validation Authority V1 — report formatting.
 */

import type { BlueprintVisualAssessment } from './universal-app-blueprint-visual-types.js';

export function formatBlueprintVisualReportMarkdown(assessment: Omit<BlueprintVisualAssessment, 'reportMarkdown'>): string {
  const lines: string[] = [
    '# Universal App Blueprint Visual Validation Report',
    '',
    `Generated: ${assessment.generatedAt}`,
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
    `- Visual Structure Score: ${assessment.scores.visualStructureScore}/100`,
    `- Navigation Score: ${assessment.scores.navigationScore}/100`,
    `- Responsiveness Score: ${assessment.scores.responsivenessScore}/100`,
    `- Accessibility Score: ${assessment.scores.accessibilityScore}/100`,
    `- User Experience Score: ${assessment.scores.userExperienceScore}/100`,
    `- Overall Blueprint Score: ${assessment.scores.overallBlueprintScore}/100`,
    '',
    '## Viewport Evidence',
  );
  for (const item of assessment.viewportEvidence) {
    lines.push(`- ${item}`);
  }
  lines.push('', '## Checks');
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
