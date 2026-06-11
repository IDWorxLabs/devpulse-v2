/**
 * UI Reviewer Authority — markdown report builder.
 */

import { UI_REVIEWER_REPORT_TITLE } from './ui-reviewer-bounds.js';
import type { UIReviewerAssessment, UIReviewerScenarioResult } from './ui-reviewer-types.js';

function scenarioSection(title: string, result: UIReviewerScenarioResult | undefined): string {
  if (!result) return `## ${title}\n\nNot evaluated.`;
  return `## ${title}

Score: **${result.score}/100**

Passed: **${result.passed ? 'Yes' : 'No'}**

Critical failure: **${result.criticalFailure ? 'Yes' : 'No'}**

${result.findings.map((finding) => `- ${finding}`).join('\n') || '- None recorded.'}
`;
}

export function buildUIReviewerReportMarkdown(assessment: UIReviewerAssessment): string {
  const byId = (id: string) => assessment.scenarioResults.find((result) => result.id === id);

  return `# ${UI_REVIEWER_REPORT_TITLE}

## UI Summary

UI Review Score: **${assessment.uiReviewScore}/100**

Usability Score: **${assessment.usabilityScore}/100**

Navigation Score: **${assessment.navigationScore}/100**

Discoverability Score: **${assessment.discoverabilityScore}/100**

Clarity Score: **${assessment.clarityScore}/100**

Hierarchy Score: **${assessment.hierarchyScore}/100**

First-Time User Score: **${assessment.firstTimeUserScore}/100**

Readiness State: **${assessment.readinessState}**

Blocks launch readiness: **${assessment.blocksLaunchReadiness ? 'Yes' : 'No'}**

Critical UI Failures: **${assessment.criticalUiFailures}**

Can users find major features? Does the navigation make sense?

${scenarioSection('Navigation Review', byId('navigation-review'))}

${scenarioSection('Discoverability Review', byId('feature-discoverability'))}

${scenarioSection('Layout Hierarchy Review', byId('layout-hierarchy'))}

${scenarioSection('Workflow Review', byId('workflow-review'))}

${scenarioSection('First-Time User Review', byId('first-time-user-perspective'))}

${scenarioSection('Missing Screens', byId('missing-screen-review'))}

## Critical UI Failures

${assessment.criticalUiFailures > 0 ? assessment.scenarioResults.filter((result) => result.criticalFailure).map((result) => `- ${result.id}: ${result.findings[0] ?? 'Critical UI failure'}`).join('\n') : 'None recorded.'}

## UI Risks

${assessment.uiRisks.length ? assessment.uiRisks.map((risk) => `- ${risk}`).join('\n') : '- None recorded.'}

## Recommendations

${assessment.uiRecommendations.map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. A feature users cannot find is functionally equivalent to a feature that does not exist.'}
`;
}
