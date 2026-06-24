/**
 * Large-Scale Multi-App Validation V1 — markdown report builder.
 */

import { LARGE_SCALE_MULTI_APP_VALIDATION_V1_PASS_TOKEN } from './large-scale-multi-app-validation-bounds.js';
import type { LargeScaleMultiAppValidationAssessment } from './large-scale-multi-app-validation-types.js';

export function buildLargeScaleValidationReportMarkdown(
  assessment: LargeScaleMultiAppValidationAssessment,
): string {
  const lines: string[] = [
    '# Large-Scale Multi-App Validation Report',
    '',
    `Generated: ${assessment.generatedAt}`,
    '',
    `**Pass token:** ${LARGE_SCALE_MULTI_APP_VALIDATION_V1_PASS_TOKEN}`,
    '',
    '## Executive Summary',
    '',
    `- Categories tested: ${assessment.categoriesTested}`,
    `- Categories passed: ${assessment.categoriesPassed}`,
    `- Overall pass rate: ${assessment.passRates.overallPassRate}%`,
    `- **AiDevEngine Generalization Score: ${assessment.generalizationScore}/100**`,
    '',
    '## Pass Rates',
    '',
    `| Metric | Rate |`,
    `|--------|------|`,
    `| Generation Success | ${assessment.passRates.generationSuccessRate}% |`,
    `| Build Success | ${assessment.passRates.buildSuccessRate}% |`,
    `| Blueprint Success | ${assessment.passRates.blueprintSuccessRate}% |`,
    `| Feature Reality Success | ${assessment.passRates.featureRealitySuccessRate}% |`,
    `| Engineering Success | ${assessment.passRates.engineeringSuccessRate}% |`,
    `| AFLA Success | ${assessment.passRates.aflaSuccessRate}% |`,
    '',
    '## Cross-App Consistency',
    '',
    `- Navigation consistency: ${assessment.crossAppConsistency.navigationConsistency}%`,
    `- Blueprint consistency: ${assessment.crossAppConsistency.blueprintConsistency}%`,
    `- Verification consistency: ${assessment.crossAppConsistency.verificationConsistency}%`,
    `- Launch decision consistency: ${assessment.crossAppConsistency.launchDecisionConsistency}%`,
    `- Overall consistency: ${assessment.crossAppConsistency.overallConsistency}%`,
    '',
    '## Failure Distribution',
    '',
  ];

  for (const entry of assessment.failureDistribution) {
    lines.push(`- ${entry.failureClass}: ${entry.count} (${entry.percentage}%)`);
  }

  lines.push('', '## Category Leaderboard (Top)', '');
  for (const entry of assessment.categoryLeaderboard.slice(0, 15)) {
    lines.push(
      `- ${entry.productName} (${entry.categoryGroup}): ${entry.score}/100 — ${entry.passed ? 'PASS' : 'FAIL'}`,
    );
  }

  lines.push('', '## Weakest Categories', '');
  for (const name of assessment.weakestCategories) {
    lines.push(`- ${name}`);
  }

  lines.push('', '## Strongest Categories', '');
  for (const name of assessment.strongestCategories) {
    lines.push(`- ${name}`);
  }

  lines.push('', '---', '', LARGE_SCALE_MULTI_APP_VALIDATION_V1_PASS_TOKEN);

  return lines.join('\n');
}
