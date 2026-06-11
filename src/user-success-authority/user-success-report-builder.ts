/**
 * User Success Authority Report Builder.
 */

import { USER_SUCCESS_REPORT_TITLE } from './user-success-bounds.js';
import type { UserSuccessAssessment, UserSuccessGoalCategory } from './user-success-types.js';

const CATEGORY_LABELS: Record<UserSuccessGoalCategory, string> = {
  UNDERSTANDING_GOAL: 'Understanding Goal',
  PLANNING_GOAL: 'Planning Goal',
  PROBLEM_SOLVING_GOAL: 'Problem Solving Goal',
  BUILD_GOAL: 'Build Goal',
  LAUNCH_GOAL: 'Launch Goal',
  CONFIDENCE_GOAL: 'Confidence Goal',
};

function sectionForCategory(assessment: UserSuccessAssessment, category: UserSuccessGoalCategory): string {
  const scenarios = assessment.scenarioResults.filter((scenario) => scenario.category === category);
  if (!scenarios.length) return 'None evaluated.\n';
  return scenarios
    .map(
      (scenario) =>
        `- **${scenario.userGoal}** — score ${scenario.score}/100 | passed ${scenario.passed ? 'Yes' : 'No'}\n` +
        `  Findings: ${scenario.findings.join('; ') || 'None'}\n` +
        `  Blockers: ${scenario.blockers.join('; ') || 'None'}`,
    )
    .join('\n');
}

export function buildUserSuccessReportMarkdown(assessment: UserSuccessAssessment, generatedAt: number): string {
  const date = new Date(generatedAt).toISOString();
  const verdict =
    assessment.readinessState === 'USERS_SUCCEED'
      ? 'Real users can meaningfully progress toward their intended outcomes — this is not GO / NO GO.'
      : assessment.readinessState === 'PARTIAL_SUCCESS'
        ? 'Users can achieve some outcomes, but important goal paths remain fragile or incomplete.'
        : assessment.readinessState === 'HIGH_FAILURE_RISK'
          ? 'Users are at high risk of failing to achieve key outcomes despite feature availability.'
          : 'Critical user success failures block meaningful outcome achievement today.';

  return `# ${USER_SUCCESS_REPORT_TITLE}

Generated: ${date}
Outcome achievement evaluation — workflow completion alone is not user success

## User Success Summary

User success score: **${assessment.userSuccessScore}/100**

Outcome achievement score: **${assessment.outcomeAchievementScore}/100**

Failed goals: **${assessment.failedGoalCount}**

Critical success failures: **${assessment.criticalSuccessFailures}**

Readiness state: **${assessment.readinessState}**

Blocks launch readiness: **${assessment.blocksLaunchReadiness ? 'Yes' : 'No'}**

Core question: **Can a real user achieve the outcome they came for?**

## Understanding Goal

${sectionForCategory(assessment, 'UNDERSTANDING_GOAL')}

## Planning Goal

${sectionForCategory(assessment, 'PLANNING_GOAL')}

## Problem Solving Goal

${sectionForCategory(assessment, 'PROBLEM_SOLVING_GOAL')}

## Build Goal

${sectionForCategory(assessment, 'BUILD_GOAL')}

## Launch Goal

${sectionForCategory(assessment, 'LAUNCH_GOAL')}

## Confidence Goal

${sectionForCategory(assessment, 'CONFIDENCE_GOAL')}

## Critical Success Failures

${assessment.criticalSuccessFailureDetails.length ? assessment.criticalSuccessFailureDetails.map((item) => `- ${item}`).join('\n') : '- None recorded.'}

## User Blockers

${assessment.blockers.length ? assessment.blockers.map((item) => `- ${item}`).join('\n') : '- None recorded.'}

## Recommendations

${assessment.recommendations.length ? assessment.recommendations.map((item, index) => `${index + 1}. ${item}`).join('\n') : '1. The product succeeds only when users succeed.'}

## User Success Verdict

${verdict}
`;
}
