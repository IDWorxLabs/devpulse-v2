/**
 * Universal Feature Contract Intelligence V1 — report formatter.
 */

import type { UniversalFeatureContractAssessment } from './universal-feature-contract-types.js';

export function formatUniversalFeatureContractReportMarkdown(
  assessment: UniversalFeatureContractAssessment,
): string {
  const lines: string[] = [
    '# Universal Feature Contract Validation Report',
    '',
    `Generated: ${assessment.generatedAt}`,
    `Contract ID: ${assessment.contractId}`,
    `Product: ${assessment.contract.productName} (${assessment.contract.productProfile})`,
    `Preview URL: ${assessment.previewUrl}`,
    `Verdict: **${assessment.verdict}**`,
    `Pass token: ${assessment.passToken}`,
    `Launch readiness blocked: ${assessment.blocksLaunchReadiness ? 'Yes' : 'No'}`,
    '',
    '## Contract Intelligence',
    `- Entities: ${assessment.contract.entities.map((entity) => entity.label).join(', ')}`,
    `- Actions: ${assessment.contract.actions.filter((action) => action.required).map((action) => action.label).join(', ')}`,
    `- Rules: ${assessment.contract.rules.map((rule) => rule.label).join(', ') || 'none'}`,
    `- Workflows: ${assessment.contract.workflows.map((workflow) => workflow.label).join(', ') || 'none'}`,
    `- Outcomes: ${assessment.contract.outcomes.map((outcome) => outcome.label).join(', ')}`,
    '',
    '## Scores',
    `- Contract Completeness Score: ${assessment.scores.contractCompletenessScore}/100`,
    `- Feature Coverage Score: ${assessment.scores.featureCoverageScore}/100`,
    `- Execution Score: ${assessment.scores.executionScore}/100`,
    `- Workflow Score: ${assessment.scores.workflowScore}/100`,
    `- Persistence Score: ${assessment.scores.persistenceScore}/100`,
    `- Overall Feature Reality Score: ${assessment.scores.overallFeatureRealityScore}/100`,
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
