/**
 * Skeptical Founder Simulator Report Builder.
 */

import { SKEPTICAL_FOUNDER_REPORT_TITLE } from './skeptical-founder-bounds.js';
import type { SkepticalFounderAssessment, SkepticalFounderScenarioCategory } from './skeptical-founder-types.js';

const CATEGORY_LABELS: Record<SkepticalFounderScenarioCategory, string> = {
  TRUST_CHALLENGE: 'Trust Challenges',
  INTELLIGENCE_CHALLENGE: 'Intelligence Challenges',
  PURPOSE_CHALLENGE: 'Purpose Challenges',
  LAUNCH_CHALLENGE: 'Launch Challenges',
  COMPETITIVE_CHALLENGE: 'Competitive Challenges',
  HONESTY_CHALLENGE: 'Honesty Challenges',
};

function sectionForCategory(
  assessment: SkepticalFounderAssessment,
  category: SkepticalFounderScenarioCategory,
): string {
  const scenarios = assessment.scenarioResults.filter((scenario) => scenario.category === category);
  if (!scenarios.length) return 'None evaluated.\n';
  return scenarios
    .map(
      (scenario) =>
        `- **${scenario.question}** — score ${scenario.score}/100 | passed ${scenario.passed ? 'Yes' : 'No'}\n` +
        `  Findings: ${scenario.findings.join('; ') || 'None'}\n` +
        `  Objections: ${scenario.objections.join('; ') || 'None'}`,
    )
    .join('\n');
}

export function buildSkepticalFounderReportMarkdown(
  assessment: SkepticalFounderAssessment,
  generatedAt: number,
): string {
  const date = new Date(generatedAt).toISOString();
  const verdict =
    assessment.readinessState === 'TRUSTED'
      ? 'A skeptical founder sees enough proof to reduce launch doubt, but this is not a GO / NO GO decision.'
      : assessment.readinessState === 'CAUTION'
        ? 'A skeptical founder would hesitate — evidence gaps remain before launch trust is earned.'
        : assessment.readinessState === 'HIGH_RISK'
          ? 'A skeptical founder would strongly challenge launch readiness today.'
          : 'A skeptical founder would block launch trust — critical proof or honesty gaps remain.';

  return `# ${SKEPTICAL_FOUNDER_REPORT_TITLE}

Generated: ${date}
Read-only adversarial evaluation — no external AI

## Skeptical Founder Summary

Skeptical founder score: **${assessment.skepticalFounderScore}/100**

Launch risk score: **${assessment.launchRiskScore}/100**

Readiness state: **${assessment.readinessState}**

Blocks launch readiness: **${assessment.blocksLaunchReadiness ? 'Yes' : 'No'}**

Objection count: **${assessment.objectionCount}**

Core question: **What would stop someone from trusting this product enough to launch it?**

## Trust Challenges

${sectionForCategory(assessment, 'TRUST_CHALLENGE')}

## Intelligence Challenges

${sectionForCategory(assessment, 'INTELLIGENCE_CHALLENGE')}

## Purpose Challenges

${sectionForCategory(assessment, 'PURPOSE_CHALLENGE')}

## Launch Challenges

${sectionForCategory(assessment, 'LAUNCH_CHALLENGE')}

## Competitive Challenges

${sectionForCategory(assessment, 'COMPETITIVE_CHALLENGE')}

## Honesty Challenges

${sectionForCategory(assessment, 'HONESTY_CHALLENGE')}

## Launch Objections

${assessment.objections.length ? assessment.objections.map((objection) => `- ${objection}`).join('\n') : '- None recorded.'}

## Recommendations

${assessment.recommendations.length ? assessment.recommendations.map((item, index) => `${index + 1}. ${item}`).join('\n') : '1. Maintain visible proof for every launch claim.'}

## Skeptical Founder Verdict

${verdict}
`;
}
