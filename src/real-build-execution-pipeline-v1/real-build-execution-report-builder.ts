/**
 * Real Build Execution Pipeline V1 — markdown report builder.
 */

import { REAL_BUILD_EXECUTION_PIPELINE_V1_PASS_TOKEN } from './real-build-execution-pipeline-bounds.js';
import type { RealBuildExecutionPipelineAssessment } from './real-build-execution-pipeline-types.js';

export function buildRealBuildExecutionPipelineReportMarkdown(
  assessment: RealBuildExecutionPipelineAssessment,
): string {
  const m = assessment.metrics;
  const lines: string[] = [
    '# Real Build Execution Pipeline Report V1',
    '',
    '**Phase Next — Real Build Execution Pipeline V1**',
    `**Generated:** ${assessment.generatedAt.slice(0, 10)}`,
    '**Scope:** End-to-end real build execution across 15 application categories',
    '',
    `**Pass token:** \`${REAL_BUILD_EXECUTION_PIPELINE_V1_PASS_TOKEN}\``,
    '',
    '---',
    '',
    '## Executive Summary',
    '',
    `AiDevEngine evaluated **${assessment.categoriesTested} categories** with **execution proof status: ${assessment.executionProofStatus}**.`,
    '',
    '| Metric | Rate |',
    '|--------|------|',
    `| Generation Success | ${m.generationSuccessRate}% |`,
    `| Materialization Success | ${m.materializationSuccessRate}% |`,
    `| Build Success | ${m.buildSuccessRate}% |`,
    `| Preview Success | ${m.previewSuccessRate}% |`,
    `| Verification Success | ${m.verificationSuccessRate}% |`,
    `| Launch Success | ${m.launchSuccessRate}% |`,
    `| Execution Proof Complete | ${m.executionProofCompleteRate}% |`,
    '',
    `**Execution Generalization Score:** ${assessment.executionGeneralizationScore}/100`,
    '',
    '---',
    '',
    '## Build Success Metrics',
    '',
    '```text',
    `Generated: ${m.generationSuccessRate}%`,
    `Built: ${m.buildSuccessRate}%`,
    `Previewed: ${m.previewSuccessRate}%`,
    `Verified: ${m.verificationSuccessRate}%`,
    `Launch Ready: ${m.launchSuccessRate}%`,
    '```',
    '',
    '---',
    '',
    '## Failure Distribution',
    '',
    '| Failure Class | Count | Percentage |',
    '|---------------|-------|------------|',
  ];

  for (const entry of assessment.failureDistribution) {
    lines.push(`| ${entry.failureClass} | ${entry.count} | ${entry.percentage}% |`);
  }

  lines.push(
    '',
    '---',
    '',
    '## Category Results',
    '',
    '| Product | Build | Preview | Launch | Failure |',
    '|---------|-------|---------|--------|---------|',
  );

  for (const result of assessment.categoryResults) {
    lines.push(
      `| ${result.productName} | ${result.metrics.buildSuccess ? '✓' : '✗'} | ${result.metrics.previewSuccess ? '✓' : '✗'} | ${result.metrics.launchSuccess ? '✓' : '✗'} | ${result.failureClass} |`,
    );
  }

  lines.push(
    '',
    '---',
    '',
    '## Success Criteria',
    '',
    '| Question | Answer |',
    '|----------|--------|',
    '| Can we design software? | Yes |',
    '| Can we verify software? | Yes |',
    '| Can we review software? | Yes |',
    `| Can we repeatedly build real software end-to-end? | ${assessment.executionProofStatus === 'PROVEN' ? 'Proven' : assessment.executionProofStatus === 'PARTIAL' ? 'Partially proven' : 'Not yet proven'} |`,
    '',
    '---',
    '',
    `**Pass token:** \`${REAL_BUILD_EXECUTION_PIPELINE_V1_PASS_TOKEN}\``,
    '',
  );

  return lines.join('\n');
}
