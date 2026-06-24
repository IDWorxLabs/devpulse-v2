/**
 * Real Build Execution Pipeline V1.1 — markdown report builder.
 */

import { REAL_BUILD_EXECUTION_PIPELINE_V1_1_PASS_TOKEN } from './real-build-execution-pipeline-v11-bounds.js';
import type { RealBuildExecutionPipelineV11Assessment } from './real-build-execution-pipeline-v11-types.js';
import { formatExecutionMatrixText } from './execution-matrix-builder.js';

export function buildRealBuildExecutionPipelineV11ReportMarkdown(
  assessment: RealBuildExecutionPipelineV11Assessment,
): string {
  const m = assessment.metrics;
  const matrixText = formatExecutionMatrixText(assessment.executionMatrix);

  return [
    '# Real Build Execution Pipeline Report V1.1',
    '',
    '**Phase Next — Full 15/15 Execution Proof**',
    `**Generated:** ${assessment.generatedAt.slice(0, 10)}`,
    '',
    `**Pass token:** \`${REAL_BUILD_EXECUTION_PIPELINE_V1_1_PASS_TOKEN}\``,
    '',
    '---',
    '',
    '## Executive Summary',
    '',
    `**Proof Coverage:** ${assessment.proofCoveragePercent}% (${assessment.categoriesWithFullProof}/${assessment.categoriesTested})`,
    `**Execution Generalization Score V2:** ${assessment.executionGeneralizationScoreV2}/100`,
    `**Execution Proof Status:** ${assessment.executionProofStatus}`,
    '',
    '| Metric | Rate |',
    '|--------|------|',
    `| Generation | ${m.generationSuccessRate}% |`,
    `| Materialization | ${m.materializationSuccessRate}% |`,
    `| Build | ${m.buildSuccessRate}% |`,
    `| Preview | ${m.previewSuccessRate}% |`,
    `| Verification | ${m.verificationSuccessRate}% |`,
    `| Launch | ${m.launchSuccessRate}% |`,
    '',
    '---',
    '',
    '## Execution Matrix',
    '',
    '```text',
    matrixText,
    '```',
    '',
    '---',
    '',
    '## Proof Coverage',
    '',
    `| Measure | Count |`,
    '|---------|-------|',
    `| Categories Required | ${assessment.proofCoverage.categoriesRequired} |`,
    `| Full Proof Chains | ${assessment.proofCoverage.categoriesWithFullProof} |`,
    `| Built | ${assessment.proofCoverage.builtCount} |`,
    `| Previewed | ${assessment.proofCoverage.previewedCount} |`,
    `| Verified | ${assessment.proofCoverage.verifiedCount} |`,
    `| Product Architect Reviewed | ${assessment.proofCoverage.reviewedCount} |`,
    `| AFLA Verdicts | ${assessment.proofCoverage.aflaVerdictCount} |`,
    '',
    '---',
    '',
    '## Failure Intelligence',
    '',
    assessment.failureIntelligence.length === 0
      ? 'No failures — all categories completed full proof chains.'
      : assessment.failureIntelligence
          .map(
            (entry) =>
              `- **${entry.productName}** (${entry.stage}): ${entry.rootCause}`,
          )
          .join('\n'),
    '',
    '---',
    '',
    `**Pass token:** \`${REAL_BUILD_EXECUTION_PIPELINE_V1_1_PASS_TOKEN}\``,
    '',
  ].join('\n');
}
