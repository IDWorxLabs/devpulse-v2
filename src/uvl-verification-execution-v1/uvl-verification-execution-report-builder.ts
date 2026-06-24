/**
 * UVL Verification Execution V1 — markdown report builder.
 */

import type { UvlVerificationExecutionV1Assessment } from './uvl-verification-execution-v1-types.js';
import { UVL_VERIFICATION_EXECUTION_V1_PASS_TOKEN } from './uvl-verification-execution-v1-bounds.js';
import { formatVerificationMatrixText } from './verification-matrix-builder.js';

export function buildUvlVerificationExecutionV1ReportMarkdown(
  assessment: UvlVerificationExecutionV1Assessment,
): string {
  const lines = [
    '# UVL Verification Execution V1 Report',
    '',
    `**Generated:** ${assessment.generatedAt.slice(0, 19)}Z`,
    `**Canonical Owner:** ${assessment.canonicalOwner}`,
    '',
    `**Pass token:** \`${UVL_VERIFICATION_EXECUTION_V1_PASS_TOKEN}\``,
    '',
    '---',
    '',
    '## Executive Summary',
    '',
    `UVL Verification Execution V1 closes the Capability Audit V3 verification gap by proving **${assessment.categoriesVerified}/${assessment.categoriesTested}** categories verified against **live preview runtime** evidence.`,
    '',
    '| Metric | Value |',
    '|--------|-------|',
    `| Verification Coverage | ${assessment.verificationCoveragePercent}% |`,
    `| Verified Categories | ${assessment.verificationCoverage.verifiedCount} |`,
    `| Failed Categories | ${assessment.verificationCoverage.failedCount} |`,
    `| Skipped Categories | ${assessment.verificationCoverage.skippedCount} |`,
    `| Verification Confidence | ${assessment.verificationConfidence.verificationConfidenceScore}/100 |`,
    `| Verification Proof Status | ${assessment.verificationProofStatus} |`,
    '',
    '---',
    '',
    '## Verification Coverage',
    '',
    `**Built:** ${assessment.verificationCoverage.builtCount}/${assessment.categoriesTested}`,
    `**Previewed:** ${assessment.verificationCoverage.previewedCount}/${assessment.categoriesTested}`,
    `**Verified:** ${assessment.verificationCoverage.verifiedCount}/${assessment.categoriesTested}`,
    '',
    '---',
    '',
    '## Verification Matrix',
    '',
    '```',
    formatVerificationMatrixText(assessment.verificationMatrix),
    '```',
    '',
    '---',
    '',
    '## Failure Distribution',
    '',
    '| Failure Class | Count | % |',
    '|---------------|-------|---|',
  ];

  for (const entry of assessment.failureDistribution) {
    lines.push(`| ${entry.failureClass} | ${entry.count} | ${entry.percentage}% |`);
  }

  if (assessment.failureIntelligence.length > 0) {
    lines.push('', '### Failure Intelligence', '');
    for (const failure of assessment.failureIntelligence.slice(0, 10)) {
      lines.push(`- **${failure.productName}** (${failure.failureClass}): ${failure.rootCause}`);
    }
  }

  lines.push(
    '',
    '---',
    '',
    '## Verification Confidence Model',
    '',
    `| Component | Weight |`,
    `|-----------|--------|`,
    `| Coverage | ${assessment.verificationConfidence.coverageWeight} |`,
    `| Runtime Evidence | ${assessment.verificationConfidence.runtimeEvidenceWeight} |`,
    `| Consistency | ${assessment.verificationConfidence.consistencyWeight} |`,
    `| Failure Penalty | ${assessment.verificationConfidence.failureDistributionPenalty} |`,
  );

  lines.push(
    '',
    '---',
    '',
    `**Pass token:** \`${UVL_VERIFICATION_EXECUTION_V1_PASS_TOKEN}\``,
    '',
  );

  return lines.join('\n');
}
