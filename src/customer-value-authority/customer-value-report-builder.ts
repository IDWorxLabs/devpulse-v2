/**
 * Customer Value Authority Report Builder.
 */

import { CUSTOMER_VALUE_REPORT_TITLE } from './customer-value-bounds.js';
import type { CustomerValueAssessment, CustomerValueScenarioCategory } from './customer-value-types.js';

const CATEGORY_LABELS: Record<CustomerValueScenarioCategory, string> = {
  PROBLEM_VALUE: 'Problem Value',
  OUTCOME_VALUE: 'Outcome Value',
  TIME_VALUE: 'Time Value',
  TRUST_VALUE: 'Trust Value',
  REPEAT_USAGE_VALUE: 'Repeat Usage Value',
  DIFFERENTIATION_VALUE: 'Differentiation Value',
};

function sectionForCategory(assessment: CustomerValueAssessment, category: CustomerValueScenarioCategory): string {
  const scenario = assessment.scenarioResults.find((entry) => entry.category === category);
  if (!scenario) return 'None evaluated.\n';
  return (
    `Score: **${scenario.score}/100** · Passed: **${scenario.passed ? 'Yes' : 'No'}**\n` +
    `${scenario.findings.map((finding) => `- ${finding}`).join('\n') || '- None recorded.'}\n` +
    `Value signals: ${scenario.valueSignals.join('; ') || 'None'}\n` +
    `Value risks: ${scenario.valueRisks.join('; ') || 'None'}`
  );
}

export function buildCustomerValueReportMarkdown(assessment: CustomerValueAssessment, generatedAt: number): string {
  const date = new Date(generatedAt).toISOString();
  const criticalFailures = assessment.scenarioResults.filter(
    (scenario) => !scenario.passed && scenario.score < 60,
  );
  const verdict =
    assessment.readinessState === 'HIGH_VALUE'
      ? 'Customer value appears strong enough to support continued usage — this is not GO / NO GO.'
      : assessment.readinessState === 'MODERATE_VALUE'
        ? 'Moderate customer value exists but retention value should improve before broad adoption.'
        : assessment.readinessState === 'LOW_VALUE'
          ? 'Low customer value would likely limit retention even if onboarding succeeds.'
          : 'Critical value failures block safe launch understanding for long-term customer value.';

  return `# ${CUSTOMER_VALUE_REPORT_TITLE}

Generated: ${date}
Customer value evaluation — evidence-backed only

## Customer Value Summary

Customer value score: **${assessment.customerValueScore}/100**

Retention value score: **${assessment.retentionValueScore}/100**

Value risk score: **${assessment.valueRiskScore}/100**

Critical value failures: **${assessment.criticalValueFailures}**

Readiness state: **${assessment.readinessState}**

Blocks launch readiness: **${assessment.blocksLaunchReadiness ? 'Yes' : 'No'}**

Core question: **Would a customer continue using this product because it delivers value?**

## Problem Value

${sectionForCategory(assessment, 'PROBLEM_VALUE')}

## Outcome Value

${sectionForCategory(assessment, 'OUTCOME_VALUE')}

## Time Value

${sectionForCategory(assessment, 'TIME_VALUE')}

## Trust Value

${sectionForCategory(assessment, 'TRUST_VALUE')}

## Repeat Usage Value

${sectionForCategory(assessment, 'REPEAT_USAGE_VALUE')}

## Differentiation Value

${sectionForCategory(assessment, 'DIFFERENTIATION_VALUE')}

## Critical Value Failures

${criticalFailures.length ? criticalFailures.map((scenario) => `- **${CATEGORY_LABELS[scenario.category]}** (${scenario.score}/100): ${scenario.valueRisks[0] ?? scenario.findings[0] ?? 'Critical value failure'}`).join('\n') : '- None recorded.'}

## Value Risks

${assessment.valueRisks.length ? assessment.valueRisks.map((risk) => `- ${risk}`).join('\n') : '- None recorded.'}

## Recommendations

${assessment.recommendations.length ? assessment.recommendations.map((item, index) => `${index + 1}. ${item}`).join('\n') : '1. A product only succeeds long-term if it creates meaningful value that users want to return for.'}

## Customer Value Verdict

${verdict}
`;
}
