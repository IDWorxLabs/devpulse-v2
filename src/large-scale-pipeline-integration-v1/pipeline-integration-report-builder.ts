/**
 * Large-Scale Pipeline Integration V1 — markdown report builder.
 */

import {
  LARGE_SCALE_PIPELINE_INTEGRATION_V1_PASS_TOKEN,
  LARGE_SCALE_PIPELINE_INTEGRATION_V1_REPORT_TITLE,
} from './large-scale-pipeline-integration-v1-bounds.js';
import type { LargeScalePipelineIntegrationAssessment } from './large-scale-pipeline-integration-v1-types.js';

export function buildLargeScalePipelineIntegrationV1ReportMarkdown(
  assessment: LargeScalePipelineIntegrationAssessment,
): string {
  const m = assessment.metrics;
  const lines = [
    `# ${LARGE_SCALE_PIPELINE_INTEGRATION_V1_REPORT_TITLE.replace('.md', '')}`,
    '',
    `Generated: ${assessment.generatedAt}`,
    '',
    '## Executive Summary',
    '',
    assessment.auditImpact.auditShouldReport,
    '',
    `**Large-Scale Pipeline Score:** ${assessment.pipelineScore.score}/100 (${assessment.pipelineScore.status})`,
    '',
    '## Authoritative Pipeline Metrics',
    '',
    '| Metric | Rate | Count |',
    '| --- | --- | --- |',
    `| Build Success Rate | ${m.buildSuccessRate}% | ${m.buildProvenCategories} build-proven |`,
    `| Preview Success Rate | ${m.previewSuccessRate}% | — |`,
    `| Verification Success Rate | ${m.verificationSuccessRate}% | ${m.verificationProvenCategories} verified |`,
    `| Product Readiness Rate | ${m.productReadinessRate}% | — |`,
    `| Launch Readiness Rate | ${m.launchReadinessRate}% | — |`,
    `| Production Readiness Rate | ${m.productionReadinessRate}% | ${m.productionProvenCategories} production-proven |`,
    `| Cloud Simulated Success Rate | ${m.cloudSimulatedSuccessRate}% | ${m.cloudProvenCategories} cloud-proven |`,
    `| Mobile Runtime Success Rate | ${m.mobileRuntimeSuccessRate}% | ${m.mobileProvenCategories} mobile-proven |`,
    `| General-Purpose Generation Success Rate | ${m.generalPurposeGenerationSuccessRate}% | ${m.gpProvenCategories} GP-proven |`,
    '',
    `**Legacy large-scale harness buildSuccessRate:** ${m.legacyLargeScaleBuildSuccessRate}% (AFLA dry-run — superseded by RBEP evidence)`,
    '',
    '## Suite Coverage',
    '',
    `- Broad categories tested: ${m.broadCategoriesTested}`,
    `- Build-proven categories: ${m.buildProvenCategories}`,
    `- Verification-proven categories: ${m.verificationProvenCategories}`,
    `- Production-proven categories: ${m.productionProvenCategories}`,
    `- Cloud-proven categories: ${m.cloudProvenCategories}`,
    `- Mobile-proven categories: ${m.mobileProvenCategories}`,
    '',
    '## Pipeline Score Breakdown',
    '',
    `- Breadth: ${assessment.pipelineScore.breakdown.breadth}`,
    `- Build proof: ${assessment.pipelineScore.breakdown.buildProof}`,
    `- Verification proof: ${assessment.pipelineScore.breakdown.verificationProof}`,
    `- General-purpose proof: ${assessment.pipelineScore.breakdown.generalPurposeProof}`,
    `- Production proof: ${assessment.pipelineScore.breakdown.productionProof}`,
    `- Cloud proof: ${assessment.pipelineScore.breakdown.cloudProof}`,
    `- Consistency: ${assessment.pipelineScore.breakdown.consistency}`,
    '',
    '## Remaining Gaps',
    '',
    ...assessment.remainingGaps.map((g) => `- ${g}`),
    '',
    '## Evidence Sources',
    '',
    ...assessment.evidenceSources.map(
      (s) =>
        `- **${s.system}** (${s.artifactDir}) — ${s.evidenceAvailable ? 'available' : 'missing'} — pass: ${s.passToken ?? 'none'}`,
    ),
    '',
    '## Pass Token',
    '',
    assessment.passToken === LARGE_SCALE_PIPELINE_INTEGRATION_V1_PASS_TOKEN
      ? `Pass token: \`${LARGE_SCALE_PIPELINE_INTEGRATION_V1_PASS_TOKEN}\``
      : `Status: \`${assessment.passToken}\``,
    '',
  ];

  return lines.join('\n');
}
