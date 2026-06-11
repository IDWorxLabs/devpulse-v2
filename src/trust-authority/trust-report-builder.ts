/**
 * Trust Authority Report Builder.
 */

import { TRUST_AUTHORITY_REPORT_TITLE } from './trust-authority-bounds.js';
import type { TrustAssessment, TrustScenarioCategory } from './trust-authority-types.js';

const CATEGORY_LABELS: Record<TrustScenarioCategory, string> = {
  EVIDENCE_TRUST: 'Evidence Trust',
  HONESTY_TRUST: 'Honesty Trust',
  READINESS_TRUST: 'Readiness Trust',
  INTELLIGENCE_TRUST: 'Intelligence Trust',
  TRANSPARENCY_TRUST: 'Transparency Trust',
};

function sectionForCategory(assessment: TrustAssessment, category: TrustScenarioCategory): string {
  const scenarios = assessment.scenarioResults.filter((scenario) => scenario.category === category);
  if (!scenarios.length) return 'None evaluated.\n';
  return scenarios
    .map(
      (scenario) =>
        `- Score ${scenario.score}/100 | passed ${scenario.passed ? 'Yes' : 'No'}\n` +
        `  Findings: ${scenario.findings.join('; ') || 'None'}\n` +
        `  Trust risks: ${scenario.trustRisks.join('; ') || 'None'}`,
    )
    .join('\n');
}

export function buildTrustAuthorityReportMarkdown(assessment: TrustAssessment, generatedAt: number): string {
  const date = new Date(generatedAt).toISOString();
  const verdict =
    assessment.readinessState === 'TRUSTED'
      ? 'Users can rely on system communications with reduced trust risk — this is not a GO / NO GO decision.'
      : assessment.readinessState === 'CAUTION'
        ? 'Users should treat some claims cautiously until evidence and uncertainty are clearer.'
        : assessment.readinessState === 'HIGH_RISK'
          ? 'Users should not safely rely on several system claims or readiness assessments today.'
          : 'Trust-critical failures block safe reliance on system claims and readiness messaging.';

  return `# ${TRUST_AUTHORITY_REPORT_TITLE}

Generated: ${date}
Read-only trust evaluation — evidence from Launch Council authorities only

## Trust Summary

Trust score: **${assessment.trustScore}/100**

Trust risk score: **${assessment.trustRiskScore}/100**

Critical trust failures: **${assessment.criticalTrustFailures}**

Readiness state: **${assessment.readinessState}**

Blocks launch readiness: **${assessment.blocksLaunchReadiness ? 'Yes' : 'No'}**

Core question: **Should a user trust this answer, claim, recommendation, or readiness assessment?**

## Evidence Trust

${sectionForCategory(assessment, 'EVIDENCE_TRUST')}

## Honesty Trust

${sectionForCategory(assessment, 'HONESTY_TRUST')}

## Readiness Trust

${sectionForCategory(assessment, 'READINESS_TRUST')}

## Intelligence Trust

${sectionForCategory(assessment, 'INTELLIGENCE_TRUST')}

## Transparency Trust

${sectionForCategory(assessment, 'TRANSPARENCY_TRUST')}

## Critical Trust Failures

${assessment.criticalTrustFailureDetails.length ? assessment.criticalTrustFailureDetails.map((item) => `- ${item}`).join('\n') : '- None recorded.'}

## Trust Risks

${assessment.trustRisks.length ? assessment.trustRisks.map((item) => `- ${item}`).join('\n') : '- None recorded.'}

## Recommendations

${assessment.recommendations.length ? assessment.recommendations.map((item, index) => `${index + 1}. ${item}`).join('\n') : '1. If users cannot trust the evidence behind a claim, the claim should not be trusted.'}

## Trust Verdict

${verdict}
`;
}
