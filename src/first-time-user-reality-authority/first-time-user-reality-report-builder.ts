/**
 * First-Time User Reality Authority Report Builder.
 */

import { FIRST_TIME_USER_REALITY_REPORT_TITLE } from './first-time-user-reality-bounds.js';
import type {
  FirstTimeUserRealityAssessment,
  FirstTimeUserScenarioCategory,
} from './first-time-user-reality-types.js';

const CATEGORY_LABELS: Record<FirstTimeUserScenarioCategory, string> = {
  PRODUCT_UNDERSTANDING: 'Product Understanding',
  CAPABILITY_UNDERSTANDING: 'Capability Understanding',
  WORKFLOW_UNDERSTANDING: 'Workflow Understanding',
  CONFIDENCE_UNDERSTANDING: 'Confidence Understanding',
  SUCCESS_UNDERSTANDING: 'Success Understanding',
  LAUNCH_IMPRESSION: 'Launch Impression',
};

function sectionForCategory(assessment: FirstTimeUserRealityAssessment, category: FirstTimeUserScenarioCategory): string {
  const scenario = assessment.scenarioResults.find((entry) => entry.category === category);
  if (!scenario) return 'None evaluated.\n';
  return (
    `Score: **${scenario.score}/100** · Passed: **${scenario.passed ? 'Yes' : 'No'}**\n` +
    `${scenario.findings.map((finding) => `- ${finding}`).join('\n') || '- None recorded.'}\n` +
    `Confusion: ${scenario.confusionPoints.join('; ') || 'None'}\n` +
    `Blockers: ${scenario.blockers.join('; ') || 'None'}`
  );
}

export function buildFirstTimeUserRealityReportMarkdown(
  assessment: FirstTimeUserRealityAssessment,
  generatedAt: number,
): string {
  const date = new Date(generatedAt).toISOString();
  const verdict =
    assessment.readinessState === 'CLEAR_AND_USABLE'
      ? 'First-time user understanding appears sufficient for bounded adoption review — this is not GO / NO GO.'
      : assessment.readinessState === 'MINOR_CONFUSION'
        ? 'Minor first-time confusion remains and should be reduced before broad onboarding.'
        : assessment.readinessState === 'HIGH_CONFUSION'
          ? 'High first-time confusion would likely stop onboarding and adoption.'
          : 'Critical first-time confusion blocks safe launch understanding for new users.';

  return `# ${FIRST_TIME_USER_REALITY_REPORT_TITLE}

Generated: ${date}
First-time user evaluation — evidence-backed only

## First-Time User Summary

First-time user score: **${assessment.firstTimeUserScore}/100**

Confusion score: **${assessment.confusionScore}/100**

Critical confusion: **${assessment.criticalConfusionCount}**

User blockers: **${assessment.blockerCount}**

Readiness state: **${assessment.readinessState}**

Blocks launch readiness: **${assessment.blocksLaunchReadiness ? 'Yes' : 'No'}**

Core question: **Can a first-time user understand and use this product successfully?**

## Product Understanding

${sectionForCategory(assessment, 'PRODUCT_UNDERSTANDING')}

## Capability Understanding

${sectionForCategory(assessment, 'CAPABILITY_UNDERSTANDING')}

## Workflow Understanding

${sectionForCategory(assessment, 'WORKFLOW_UNDERSTANDING')}

## Confidence Understanding

${sectionForCategory(assessment, 'CONFIDENCE_UNDERSTANDING')}

## Success Understanding

${sectionForCategory(assessment, 'SUCCESS_UNDERSTANDING')}

## Launch Impression

${sectionForCategory(assessment, 'LAUNCH_IMPRESSION')}

## Critical Confusion Points

${assessment.confusionPoints.length ? assessment.confusionPoints.map((point) => `- ${point}`).join('\n') : '- None recorded.'}

## User Blockers

${assessment.blockers.length ? assessment.blockers.map((blocker) => `- ${blocker}`).join('\n') : '- None recorded.'}

## Recommendations

${assessment.recommendations.length ? assessment.recommendations.map((item, index) => `${index + 1}. ${item}`).join('\n') : '1. If a first-time user cannot understand the product, the product is not ready for widespread adoption.'}

## First-Time User Verdict

${verdict}
`;
}
