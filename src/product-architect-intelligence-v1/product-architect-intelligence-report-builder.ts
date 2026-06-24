/**
 * Product Architect Intelligence V1 — report builder.
 */

import type { ProductArchitectureAssessment } from './product-architect-intelligence-types.js';

export function buildProductArchitectIntelligenceReportMarkdown(
  assessment: ProductArchitectureAssessment,
): string {
  const lines = [
    '# Product Architect Intelligence Report',
    '',
    `**Generated:** ${assessment.generatedAt}`,
    `**Product:** ${assessment.productName}`,
    `**Domain:** ${assessment.productDomain}`,
    `**Profile:** ${assessment.profile}`,
    '',
    '## Product Readiness Score',
    '',
    `- **Product Readiness Score:** ${assessment.scores.productReadinessScore}/100 (${assessment.scores.readinessLabel})`,
    `- **Architecture Score:** ${assessment.scores.architectureScore}/100`,
    `- **Product Completeness Score:** ${assessment.scores.productCompletenessScore}/100`,
    `- **Workflow Completeness Score:** ${assessment.scores.workflowCompletenessScore}/100`,
    `- **Screen Coverage Score:** ${assessment.scores.screenCoverageScore}/100`,
    `- **User Journey Score:** ${assessment.scores.userJourneyScore}/100`,
    '',
    '## Critical Product Gaps',
    '',
    ...(assessment.gapReport.gaps.filter((gap) => gap.severity === 'CRITICAL').length > 0
      ? assessment.gapReport.gaps
          .filter((gap) => gap.severity === 'CRITICAL')
          .map((gap) => `- **${gap.category}:** ${gap.summary} — ${gap.detail}`)
      : ['- None detected']),
    '',
    '## Missing Screens',
    '',
    ...(assessment.missingScreens.length > 0
      ? assessment.missingScreens.map(
          (screen) => `- ${screen.screen} (${screen.flag}, ${screen.severity})`,
        )
      : ['- None detected']),
    '',
    '## Workflow Analysis',
    '',
    ...assessment.workflowAnalysis.map(
      (workflow) =>
        `- **${workflow.workflow}:** ${workflow.complete ? 'Complete' : 'Incomplete'}${
          workflow.missingSteps.length > 0 ? ` — missing ${workflow.missingSteps.join(', ')}` : ''
        }`,
    ),
    '',
    '## Journey Analysis',
    '',
    ...assessment.journeyAnalysis.map(
      (journey) =>
        `- **${journey.journeyType}:** ${journey.complete ? 'Complete' : journey.broken ? 'Broken' : 'Incomplete'}${
          journey.missingActions.length > 0 ? ` — missing ${journey.missingActions.join(', ')}` : ''
        }`,
    ),
    '',
    '## CQI Root Cause',
    '',
    assessment.cqiContext
      ? `- **Root Cause:** ${assessment.cqiContext.rootCause}\n- ${assessment.cqiContext.rootCauseDetail}\n- Requirement confidence: ${assessment.cqiContext.requirementConfidenceScore}/100`
      : '- CQI context unavailable',
    '',
    '## Recommendations',
    '',
    ...assessment.recommendations.map((item) => `- ${item}`),
    '',
  ];

  return lines.join('\n');
}
