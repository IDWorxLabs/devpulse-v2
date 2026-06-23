/**
 * Engineering Reality Authority V1 — report formatter.
 */

import type { EngineeringRealityAssessment } from './engineering-reality-types.js';

export function formatEngineeringRealityReportMarkdown(assessment: EngineeringRealityAssessment): string {
  const lines: string[] = [
    '# Engineering Reality Validation Report',
    '',
    `Generated: ${assessment.generatedAt}`,
    `Contract ID: ${assessment.contractId}`,
    `Product: ${assessment.productName}`,
    `Preview URL: ${assessment.previewUrl}`,
    `Verdict: **${assessment.verdict}**`,
    `Pass token: ${assessment.passToken}`,
    `Launch readiness blocked: ${assessment.blocksLaunchReadiness ? 'Yes' : 'No'}`,
    '',
    '## Combined Engineering Scores',
    `- Security Score: ${assessment.scores.securityScore}/100 (${assessment.security.verdict})`,
    `- Performance Score: ${assessment.scores.performanceScore}/100 (${assessment.performance.verdict})`,
    `- Accessibility Score: ${assessment.scores.accessibilityScore}/100 (${assessment.accessibility.verdict})`,
    `- Overall Engineering Score: ${assessment.scores.overallEngineeringScore}/100`,
    '',
    '## Security Reality',
    `- Critical findings: ${assessment.security.criticalFindings.length === 0 ? 'none' : assessment.security.criticalFindings.join('; ')}`,
    `- Warnings: ${assessment.security.warnings.length === 0 ? 'none' : assessment.security.warnings.join('; ')}`,
    `- Recommendations: ${assessment.security.recommendations.join(' ')}`,
    '',
    '## Performance Reality',
    `- Load time analysis: ${assessment.performance.loadTimeAnalysis.detail}`,
    `- Interaction analysis: ${assessment.performance.interactionAnalysis}`,
    `- Runtime health: ${assessment.performance.runtimeHealth.detail}`,
    `- Build analysis: ${assessment.buildAnalysis.detail}`,
    '',
    '## Accessibility Reality',
    `- Findings: ${assessment.accessibility.findings.length === 0 ? 'none' : assessment.accessibility.findings.join('; ')}`,
    `- Recommendations: ${assessment.accessibility.recommendations.join(' ')}`,
    '',
    '## Runtime Checks',
  ];

  for (const check of assessment.checks) {
    lines.push(
      `- [${check.passed ? 'x' : ' '}] **${check.label}** (${check.category}): ${check.detail}`,
    );
  }

  if (assessment.failedChecks.length > 0) {
    lines.push('', '## Failed Checks');
    for (const check of assessment.failedChecks) {
      lines.push(`- ${check.label}: ${check.detail}`);
    }
  }

  return `${lines.join('\n')}\n`;
}
